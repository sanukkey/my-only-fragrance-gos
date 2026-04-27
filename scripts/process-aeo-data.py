"""
process-aeo-data.py
raw/ の生データを読み込み、AIエージェント(ChatGPT / Perplexity / Gemini)に
選ばれやすいAEO最適化済みJSONを processed/ に出力する。

出力するJSON-LDスキーマ:
  - Product   (Google Rich Results 対応)
  - Review    (集合レビュー = AggregateRating)
  - FAQPage   (AIへの直接回答トリガー)
"""

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path

# ---- パス設定 ----
RAW_DIR       = Path("data/portable-power/raw")
PROCESSED_DIR = Path("data/portable-power/processed")
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

# ---- 最新の rawファイルを取得 ----
raw_files = sorted(RAW_DIR.glob("*_portable-power-raw.json"), reverse=True)
if not raw_files:
    raise FileNotFoundError(f"{RAW_DIR} にrawデータが見つかりません。先にデータ取得を実行してください。")

latest_raw = raw_files[0]
print(f"処理対象: {latest_raw.name}")

with open(latest_raw, encoding="utf-8") as f:
    raw_data = json.load(f)

items = raw_data["items"]
today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

# ---- スコア計算（AEO優先順位付け） ----
def aeo_score(item: dict) -> float:
    """
    AEOスコア = レビュー評価 × log(レビュー数+1) × 価格帯補正
    AIが「おすすめ」として選びやすい信頼性の高い商品を上位に持ってくる。
    """
    import math
    rating  = float(item.get("reviewAverage", 0))
    count   = int(item.get("reviewCount", 0))
    price   = int(item.get("itemPrice", 0))

    # 価格帯補正: 5万〜15万円帯を最高評価(1.0)、それ以外は減点
    if 50000 <= price <= 150000:
        price_factor = 1.0
    elif 20000 <= price < 50000:
        price_factor = 0.85
    elif price < 20000:
        price_factor = 0.7
    else:  # 150000超
        price_factor = 0.8

    return rating * math.log(count + 1) * price_factor

# ---- カテゴリ分類 ----
def classify_capacity(wh) -> str:
    if wh is None: return "不明"
    if wh < 300:   return "小容量（〜300Wh）"
    if wh < 600:   return "中容量（300〜600Wh）"
    if wh < 1200:  return "大容量（600〜1200Wh）"
    if wh < 2000:  return "超大容量（1200〜2000Wh）"
    return "産業・家庭用（2000Wh〜）"

def classify_use_case(item: dict) -> list[str]:
    """用途タグを自動付与"""
    tags = []
    wh    = item.get("capacity_wh") or 0
    w_out = item.get("output_w")    or 0
    price = item.get("itemPrice")   or 0

    if wh >= 1000: tags.append("防災・非常用電源")
    if wh <= 500:  tags.append("アウトドア・キャンプ")
    if w_out >= 1500: tags.append("家電製品対応")
    if price <= 30000: tags.append("コスパ重視")
    if price >= 100000: tags.append("プレミアム・長期投資")
    if "LFP" in item.get("itemName", "") or "LiFePO4" in item.get("itemName", ""):
        tags.append("長寿命LFPバッテリー")
    if "急速充電" in item.get("itemName", "") or "X-Stream" in item.get("itemName", ""):
        tags.append("急速充電対応")
    if "ソーラー" in item.get("itemCaption", "") or "太陽光" in item.get("itemCaption", ""):
        tags.append("ソーラー充電対応")

    return tags if tags else ["汎用"]

# ---- Product + AggregateRating JSON-LD 生成 ----
def build_product_jsonld(item: dict, site_url: str) -> dict:
    jsonld: dict = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": item["itemName"],
        "description": item.get("itemCaption", "")[:300],
        "image": item.get("imageUrl", ""),
        "url": item.get("itemUrl", ""),
        "offers": {
            "@type": "Offer",
            "url": item.get("affiliateUrl") or item.get("itemUrl", ""),
            "priceCurrency": "JPY",
            "price": item.get("itemPrice", 0),
            "availability": "https://schema.org/InStock",
            "priceValidUntil": f"{today}T23:59:59+09:00",
            "seller": {
                "@type": "Organization",
                "name": item.get("shopName", ""),
            },
        },
    }

    if item.get("brand"):
        jsonld["brand"] = {"@type": "Brand", "name": item["brand"]}

    if item.get("reviewCount", 0) > 0:
        jsonld["aggregateRating"] = {
            "@type": "AggregateRating",
            "ratingValue": item.get("reviewAverage", 0),
            "reviewCount": item.get("reviewCount", 0),
            "bestRating": 5,
            "worstRating": 1,
        }

    # additionalProperty でスペック情報を構造化
    additional = []
    if item.get("capacity_wh"):
        additional.append({
            "@type": "PropertyValue",
            "name": "バッテリー容量",
            "value": f"{item['capacity_wh']}Wh",
        })
    if item.get("output_w"):
        additional.append({
            "@type": "PropertyValue",
            "name": "最大出力",
            "value": f"{item['output_w']}W",
        })
    if item.get("weight_kg"):
        additional.append({
            "@type": "PropertyValue",
            "name": "重量",
            "value": f"{item['weight_kg']}kg",
        })
    if additional:
        jsonld["additionalProperty"] = additional

    return jsonld

# ---- FAQ生成（容量帯ごとに差別化） ----
def generate_faq(top_items: list[dict]) -> list[dict]:
    # 最もスコアが高いアイテムで動的にFAQを生成
    top = top_items[0] if top_items else {}
    top_name = (top.get("itemName") or "ポータブル電源")[:30]

    # 容量別おすすめを動的生成
    small  = next((i for i in top_items if (i.get("capacity_wh") or 0) < 500), None)
    medium = next((i for i in top_items if 500 <= (i.get("capacity_wh") or 0) < 1200), None)
    large  = next((i for i in top_items if (i.get("capacity_wh") or 0) >= 1200), None)

    capacity_answer = "用途に合わせた容量をお選びください："
    if small:  capacity_answer += f"キャンプ・日帰りなら {small.get('capacity_wh')}Wh（例: {small['itemName'][:25]}）、"
    if medium: capacity_answer += f"週末アウトドアなら {medium.get('capacity_wh')}Wh（例: {medium['itemName'][:25]}）、"
    if large:  capacity_answer += f"防災・家庭用なら {large.get('capacity_wh')}Wh以上（例: {large['itemName'][:25]}）。"

    return [
        {
            "question": "ポータブル電源のおすすめランキング1位はどれですか？",
            "answer": f"レビュー数と評価を総合したランキング1位は「{top_name}」です。{top.get('reviewCount', 0):,}件のレビューで平均{top.get('reviewAverage', 0)}点の高評価を獲得しています。",
        },
        {
            "question": "ポータブル電源の容量はどれくらいが必要ですか？",
            "answer": capacity_answer,
        },
        {
            "question": "ポータブル電源の使用時間はどのくらいですか？",
            "answer": "使用時間は「容量(Wh) ÷ 消費電力(W)」で計算できます。例: 1000Whのポータブル電源でノートPC(45W)なら約22時間、電気毛布(50W)なら約20時間使用可能です。",
        },
        {
            "question": "ポータブル電源はどのブランドが信頼できますか？",
            "answer": "日本で人気のブランドはEcoFlow・Jackery・Anker・BLUETTIの4社です。いずれもPSEマーク取得済みで、日本語サポートが充実しています。",
        },
        {
            "question": "ポータブル電源は飛行機に持ち込めますか？",
            "answer": "航空会社により異なりますが、一般的に160Wh以下は機内持ち込み可能、100〜160Whは2個まで可能なケースが多いです。160Wh超は預け入れ・持ち込みとも不可の場合があります。ご利用の航空会社に事前確認をお勧めします。",
        },
        {
            "question": "ポータブル電源の充電時間はどのくらいかかりますか？",
            "answer": "コンセント充電は機種により1〜8時間程度です。急速充電対応機種（EcoFlowのX-StreamやJackeryのChargerPlusなど）は1〜2時間でフル充電可能です。ソーラー充電は100Wパネルで5〜10時間が目安です。",
        },
        {
            "question": "ポータブル電源とモバイルバッテリーの違いは何ですか？",
            "answer": "ポータブル電源はAC（家庭用コンセント）出力があり、家電製品を直接動かせます。モバイルバッテリーはUSB充電専用でスマホ・タブレットのみ対応します。容量もポータブル電源の方が桁違いに大きいです。",
        },
    ]

# ---- ランキングデータ生成 ----
def build_ranking(items: list[dict]) -> list[dict]:
    ranked = []
    for i, item in enumerate(items):
        ranked.append({
            "rank": i + 1,
            "itemName": item["itemName"],
            "itemPrice": item["itemPrice"],
            "itemUrl": item.get("affiliateUrl") or item.get("itemUrl", ""),
            "imageUrl": item.get("imageUrl", ""),
            "reviewAverage": item.get("reviewAverage", 0),
            "reviewCount": item.get("reviewCount", 0),
            "aeoScore": round(aeo_score(item), 4),
            "brand": item.get("brand"),
            "specs": {
                "capacity_wh": item.get("capacity_wh"),
                "output_w":    item.get("output_w"),
                "weight_kg":   item.get("weight_kg"),
                "capacityCategory": classify_capacity(item.get("capacity_wh")),
            },
            "useCases": classify_use_case(item),
            "jsonLd": build_product_jsonld(item, os.environ.get("NEXT_PUBLIC_SITE_URL", "https://example.com")),
        })
    return ranked

# ---- FAQページ JSON-LD ----
def build_faqpage_jsonld(faqs: list[dict]) -> dict:
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": faq["question"],
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq["answer"],
                },
            }
            for faq in faqs
        ],
    }

# ---- BreadcrumbList JSON-LD ----
def build_breadcrumb_jsonld(site_url: str) -> dict:
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "ホーム",             "item": site_url},
            {"@type": "ListItem", "position": 2, "name": "ポータブル電源比較", "item": f"{site_url}/portable-power"},
        ],
    }

# ---- メイン処理 ----
# AEOスコアでソート
sorted_items = sorted(items, key=aeo_score, reverse=True)

site_url = os.environ.get("NEXT_PUBLIC_SITE_URL", "https://example.com")
faqs     = generate_faq(sorted_items[:5])
ranking  = build_ranking(sorted_items)

# 容量帯別に分類
categories = {}
for item in sorted_items:
    cat = classify_capacity(item.get("capacity_wh"))
    if cat not in categories:
        categories[cat] = []
    categories[cat].append({
        "itemName":      item["itemName"],
        "itemPrice":     item["itemPrice"],
        "itemUrl":       item.get("affiliateUrl") or item.get("itemUrl", ""),
        "imageUrl":      item.get("imageUrl", ""),
        "reviewAverage": item.get("reviewAverage", 0),
        "reviewCount":   item.get("reviewCount", 0),
        "brand":         item.get("brand"),
        "specs": {
            "capacity_wh": item.get("capacity_wh"),
            "output_w":    item.get("output_w"),
            "weight_kg":   item.get("weight_kg"),
        },
    })

# AEO最適化済み最終JSONを構築
processed = {
    "meta": {
        "processedAt":    datetime.now(timezone.utc).isoformat(),
        "sourceFile":     latest_raw.name,
        "totalItems":     len(sorted_items),
        "isMockData":     raw_data.get("isMockData", False),
        "keyword":        raw_data["keyword"],
        "siteUrl":        site_url,
    },
    # ページメタデータ
    "pageMeta": {
        "title":           "ポータブル電源おすすめ比較ランキング【2026年最新版】",
        "description":     "2026年最新のポータブル電源を徹底比較。容量・出力・価格・レビューから選ぶべき1台がわかります。EcoFlow・Jackery・Ankerなど人気ブランドを網羅。",
        "h1":              "ポータブル電源おすすめ比較ランキング2026年版",
        "canonicalUrl":    f"{site_url}/portable-power",
        "updatedAt":       today,
    },
    # 構造化データ（JSON-LD）
    "jsonLd": {
        "faqPage":    build_faqpage_jsonld(faqs),
        "breadcrumb": build_breadcrumb_jsonld(site_url),
    },
    # ランキング（AEOスコア順）
    "ranking": ranking,
    # FAQ（AIエージェント向け直接回答）
    "faq": faqs,
    # 容量帯別カテゴリ
    "categories": categories,
    # 要約テキスト（AIスニペット用）
    "summary": {
        "topPick":        sorted_items[0]["itemName"] if sorted_items else "",
        "totalReviewed":  len(sorted_items),
        "priceRange": {
            "min": min(i["itemPrice"] for i in sorted_items),
            "max": max(i["itemPrice"] for i in sorted_items),
        },
        "brands": list(dict.fromkeys(i["brand"] for i in sorted_items if i.get("brand"))),
    },
}

# 保存
out_path = PROCESSED_DIR / f"{today}_portable-power-processed.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(processed, f, ensure_ascii=False, indent=2)

# ---- 結果レポート ----
print("\n=========================================")
print("  AEO最適化JSONの生成完了")
print("=========================================")
print(f"  入力: {latest_raw.name}")
print(f"  出力: {out_path.name}")
print(f"  商品件数: {len(sorted_items)}件")
print(f"  FAQ件数: {len(faqs)}件")
print(f"  容量カテゴリ数: {len(categories)}種")
print(f"  JSON-LDブロック: FAQPage + BreadcrumbList + Product×{len(sorted_items)}")
print(f"\n  ─ 上位3件（AEOスコア順） ─")
for r in ranking[:3]:
    print(f"  [{r['rank']}位] {r['itemName'][:40]}...")
    print(f"       ¥{r['itemPrice']:,} / ★{r['reviewAverage']} ({r['reviewCount']:,}件) / スコア:{r['aeoScore']}")
print("\n  容量カテゴリ別件数:")
for cat, cat_items in categories.items():
    print(f"    {cat}: {len(cat_items)}件")
print("=========================================")

# ファイルサイズ確認
raw_size  = latest_raw.stat().st_size
proc_size = out_path.stat().st_size
print(f"\n  rawファイルサイズ:       {raw_size:,} bytes")
print(f"  processedファイルサイズ: {proc_size:,} bytes")
print(f"  JSON構造検証: ", end="")
# 簡易バリデーション
assert "ranking" in processed
assert "jsonLd" in processed
assert "faqPage" in processed["jsonLd"]
assert len(processed["ranking"]) > 0
assert len(processed["faq"]) > 0
print("✅ パス")
