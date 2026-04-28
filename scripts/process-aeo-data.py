"""
process-aeo-data.py
Generic AEO data processor for multiple product categories.

Usage:
  python3 scripts/process-aeo-data.py                               # portable-power (default)
  python3 scripts/process-aeo-data.py --slug drum-washing-machine
"""

import argparse
import json
import math
import os
import re
from datetime import datetime, timezone
from pathlib import Path

# ── CLI ─────────────────────────────────────────────────────────────
parser = argparse.ArgumentParser()
parser.add_argument("--slug", default="portable-power")
args = parser.parse_args()
SLUG = args.slug

SITE_URL = os.environ.get("NEXT_PUBLIC_SITE_URL", "https://my-only-fragrance-gos.vercel.app")
today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

# ── AEOスコア ────────────────────────────────────────────────────────
def aeo_score(item, price_factor_fn):
    rating = float(item.get("reviewAverage", 0))
    count  = int(item.get("reviewCount", 0))
    price  = int(item.get("itemPrice", 0))
    return rating * math.log(count + 1) * price_factor_fn(price)

# ── 共通 JSON-LD ─────────────────────────────────────────────────────
def build_product_jsonld(item):
    jsonld = {
        "@context": "https://schema.org",
        "@type":    "Product",
        "name":     item["itemName"],
        "description": item.get("itemCaption", "")[:300],
        "image":    item.get("imageUrl", ""),
        "url":      item.get("itemUrl", ""),
        "offers": {
            "@type":           "Offer",
            "url":             item.get("affiliateUrl") or item.get("itemUrl", ""),
            "priceCurrency":   "JPY",
            "price":           item.get("itemPrice", 0),
            "availability":    "https://schema.org/InStock",
            "priceValidUntil": f"{today}T23:59:59+09:00",
            "seller": {"@type": "Organization", "name": item.get("shopName", "")},
        },
    }
    if item.get("brand"):
        jsonld["brand"] = {"@type": "Brand", "name": item["brand"]}
    if item.get("reviewCount", 0) > 0:
        jsonld["aggregateRating"] = {
            "@type":       "AggregateRating",
            "ratingValue": item.get("reviewAverage", 0),
            "reviewCount": item.get("reviewCount", 0),
            "bestRating":  5,
            "worstRating": 1,
        }
    return jsonld

def build_faqpage_jsonld(faqs):
    return {
        "@context": "https://schema.org",
        "@type":    "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": f["question"],
             "acceptedAnswer": {"@type": "Answer", "text": f["answer"]}}
            for f in faqs
        ],
    }

def build_breadcrumb_jsonld(slug, breadcrumb_name):
    return {
        "@context": "https://schema.org",
        "@type":    "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "ホーム",       "item": SITE_URL},
            {"@type": "ListItem", "position": 2, "name": breadcrumb_name, "item": f"{SITE_URL}/{slug}"},
        ],
    }


# ═══════════════════════════════════════════════════════════════════
# ── ポータブル電源 設定 ───────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════
def pp_price_factor(price):
    if 50000 <= price <= 150000: return 1.0
    if 20000 <= price < 50000:   return 0.85
    if price < 20000:            return 0.7
    return 0.8

def pp_extract_specs(item):
    text = item.get("itemName", "") + " " + item.get("itemCaption", "")
    m  = re.search(r"(\d{3,5})\s*Wh", text, re.IGNORECASE)
    m2 = re.search(r"(\d{3,4})\s*W(?:\s|出力|最大|$)", text)
    m3 = re.search(r"(\d+(?:\.\d+)?)\s*kg", text)
    return {
        "capacity_wh": int(m.group(1))   if m  else None,
        "output_w":    int(m2.group(1))  if m2 else None,
        "weight_kg":   float(m3.group(1)) if m3 else None,
    }

def pp_classify(item):
    wh = item.get("capacity_wh")
    if wh is None: return "不明"
    if wh < 300:   return "小容量（~300Wh）"
    if wh < 600:   return "中容量（300~600Wh）"
    if wh < 1200:  return "大容量（600~1200Wh）"
    if wh < 2000:  return "超大容量（1200~2000Wh）"
    return "産業・家庭用（2000Wh~）"

def pp_use_cases(item):
    tags  = []
    wh    = item.get("capacity_wh") or 0
    w_out = item.get("output_w")    or 0
    price = item.get("itemPrice")   or 0
    name  = item.get("itemName", "") + item.get("itemCaption", "")
    if wh >= 1000:  tags.append("防災・非常用電源")
    if wh <= 500:   tags.append("アウトドア・キャンプ")
    if w_out >= 1500: tags.append("家電製品対応")
    if price <= 30000: tags.append("コスパ重視")
    if price >= 100000: tags.append("プレミアム・長期投資")
    if "LFP" in name or "LiFePO4" in name: tags.append("長寿命LFPバッテリー")
    if "急速充電" in name or "X-Stream" in name: tags.append("急速充電対応")
    if "ソーラー" in name or "太陽光" in name:    tags.append("ソーラー充電対応")
    return tags if tags else ["汎用"]

def pp_faq(top_items):
    top      = top_items[0] if top_items else {}
    top_name = (top.get("itemName") or "ポータブル電源")[:30]
    return [
        {
            "question": "ポータブル電源のおすすめランキング1位はどれですか？",
            "answer":   f"レビュー数と評価を総合したランキング1位は「{top_name}」です。{top.get('reviewCount',0):,}件のレビューで平均{top.get('reviewAverage',0)}点の高評価を獲得しています。",
        },
        {
            "question": "ポータブル電源の容量はどれくらいが必要ですか？",
            "answer":   "キャンプ・日帰りなら300~500Wh、週末アウトドアなら500~1000Wh、防災・家庭用バックアップなら1000Wh以上が目安です。",
        },
        {
            "question": "ポータブル電源の使用時間はどのくらいですか？",
            "answer":   "使用時間は「容量(Wh) / 消費電力(W)」で計算できます。例: 1000Whのポータブル電源でノートPC(45W)なら約22時間使用可能です。",
        },
        {
            "question": "ポータブル電源はどのブランドが信頼できますか？",
            "answer":   "日本で人気のブランドはEcoFlow・Jackery・Anker・BLUETTIの4社です。いずれもPSEマーク取得済みで、日本語サポートが充実しています。",
        },
        {
            "question": "ポータブル電源は飛行機に持ち込めますか？",
            "answer":   "一般的に160Wh以下は機内持ち込み可能です。160Wh超は持ち込み不可の場合があります。ご利用の航空会社に事前確認をお勧めします。",
        },
        {
            "question": "ポータブル電源の充電時間はどのくらいかかりますか？",
            "answer":   "コンセント充電は機種により1~8時間程度です。急速充電対応機種（EcoFlowのX-Streamなど）は1~2時間でフル充電可能です。",
        },
        {
            "question": "ポータブル電源とモバイルバッテリーの違いは何ですか？",
            "answer":   "ポータブル電源はAC（家庭用コンセント）出力があり、家電製品を直接動かせます。モバイルバッテリーはUSB充電専用です。",
        },
    ]

PP_CONFIG = {
    "name_jp":      "ポータブル電源",
    "spec_keys":    ["capacity_wh", "output_w", "weight_kg"],
    "price_factor": pp_price_factor,
    "extract_specs": pp_extract_specs,
    "classify":     pp_classify,
    "use_cases":    pp_use_cases,
    "faq":          pp_faq,
    "page_meta": {
        "title":           "ポータブル電源おすすめ比較ランキング【2026年最新版】",
        "description":     "2026年最新のポータブル電源を徹底比較。容量・出力・価格・レビューから選ぶべき1台がわかります。EcoFlow・Jackery・Ankerなど人気ブランドを網羅。",
        "h1":              "ポータブル電源おすすめ比較ランキング2026年版",
        "breadcrumb_name": "ポータブル電源 比較ランキング",
    },
}


# ═══════════════════════════════════════════════════════════════════
# ── ドラム式洗濯機 設定 ──────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════
def dwm_price_factor(price):
    if 80000 <= price <= 250000: return 1.0
    if 50000 <= price < 80000:   return 0.85
    if price < 50000:            return 0.6
    return 0.85  # 250k超プレミアム

def dwm_extract_specs(item):
    text = item.get("itemName", "") + " " + item.get("itemCaption", "")
    # 洗濯xxkg / 乾燥xxkg パターン
    mw = re.search(r"洗濯[^\d]*(\d+(?:\.\d+)?)\s*kg", text)
    md = re.search(r"乾燥[^\d]*(\d+(?:\.\d+)?)\s*kg", text)
    wash_kg = float(mw.group(1)) if mw else None
    dry_kg  = float(md.group(1)) if md else None
    # "xxkg/xxkg" パターン
    if wash_kg is None:
        m2 = re.search(r"(\d+(?:\.\d+)?)\s*kg[/・](\d+(?:\.\d+)?)\s*kg", text)
        if m2:
            wash_kg = float(m2.group(1))
            dry_kg  = float(m2.group(2))
    # 単独 xxkg
    if wash_kg is None:
        m3 = re.search(r"(\d+(?:\.\d+)?)\s*kg", text)
        wash_kg = float(m3.group(1)) if m3 else None
    # 騒音
    mn = re.search(r"(\d{2})\s*dB", text, re.IGNORECASE)
    return {
        "wash_kg":  wash_kg,
        "dry_kg":   dry_kg,
        "noise_db": int(mn.group(1)) if mn else None,
    }

def dwm_classify(item):
    kg = item.get("wash_kg")
    if kg is None: return "不明"
    if kg < 8:     return "コンパクト（~8kg）"
    if kg < 12:    return "標準（8~12kg）"
    return "大容量（12kg~）"

def dwm_use_cases(item):
    tags  = []
    kg    = item.get("wash_kg") or 0
    price = item.get("itemPrice") or 0
    name  = item.get("itemName", "") + item.get("itemCaption", "")
    if kg >= 12: tags.append("大家族向け")
    elif kg >= 8: tags.append("2~4人家族向け")
    elif kg > 0: tags.append("1~2人向け")
    if price <= 100000: tags.append("コスパ重視")
    if price >= 200000: tags.append("ハイエンド")
    if "乾燥" in name:       tags.append("乾燥機能付き")
    if "ヒートポンプ" in name: tags.append("ヒートポンプ乾燥")
    if "スチーム" in name or "除菌" in name: tags.append("スチーム・除菌")
    return tags if tags else ["汎用"]

def dwm_faq(top_items):
    top      = top_items[0] if top_items else {}
    top_name = (top.get("itemName") or "ドラム式洗濯機")[:30]
    return [
        {
            "question": "ドラム式洗濯機のおすすめランキング1位はどれですか？",
            "answer":   f"レビュー数と評価を総合したランキング1位は「{top_name}」です。{top.get('reviewCount',0):,}件のレビューで平均{top.get('reviewAverage',0)}点の高評価を獲得しています。",
        },
        {
            "question": "ドラム式洗濯機と縦型洗濯機の違いは何ですか？",
            "answer":   "ドラム式は節水性が高く乾燥機能が優れています。縦型は洗浄力が高く価格が安い傾向があります。洗濯・乾燥をセットで使いたい方にはドラム式がおすすめです。",
        },
        {
            "question": "ドラム式洗濯機の洗濯容量はどれくらいが必要ですか？",
            "answer":   "一人暮らしなら6~8kg、夫婦2人なら8~10kg、4人家族なら10~12kg以上を目安にしてください。洗濯乾燥機の場合、乾燥容量は洗濯容量より少なめになります。",
        },
        {
            "question": "ヒートポンプ乾燥とヒーター乾燥の違いは？",
            "answer":   "ヒートポンプ乾燥は電気代が安く衣類へのダメージが少ないですが、初期費用が高めです。ヒーター乾燥は安価ですが電気代がかかります。長期間使うならヒートポンプがおすすめです。",
        },
        {
            "question": "ドラム式洗濯機の設置に必要なスペースは？",
            "answer":   "一般的なドラム式洗濯機は幅600mm×奥行き600mm程度です。前面扉が開くスペース（約60cm以上）も必要です。事前に搬入経路と設置場所を確認してください。",
        },
        {
            "question": "ドラム式洗濯機の電気代はどのくらいですか？",
            "answer":   "洗濯のみなら1回約10~20円程度です。乾燥まで行う場合はヒーター乾燥で1回約70~100円、ヒートポンプ乾燥で約20~40円程度です（電気代27円/kWhで計算）。",
        },
        {
            "question": "ドラム式洗濯機の人気メーカーはどこですか？",
            "answer":   "パナソニック、日立、シャープ、東芝、LGが人気です。パナソニックはNA-LXシリーズ、日立はビッグドラム、シャープはESシリーズが定番です。",
        },
    ]

DWM_CONFIG = {
    "name_jp":      "ドラム式洗濯機",
    "spec_keys":    ["wash_kg", "dry_kg", "noise_db"],
    "price_factor": dwm_price_factor,
    "extract_specs": dwm_extract_specs,
    "classify":     dwm_classify,
    "use_cases":    dwm_use_cases,
    "faq":          dwm_faq,
    "page_meta": {
        "title":           "ドラム式洗濯機おすすめ比較ランキング【2026年最新版】",
        "description":     "2026年最新のドラム式洗濯機を徹底比較。洗濯容量・乾燥方式・価格・レビューから選ぶべき1台がわかります。パナソニック・日立・シャープなど人気メーカーを網羅。",
        "h1":              "ドラム式洗濯機おすすめ比較ランキング2026年版",
        "breadcrumb_name": "ドラム式洗濯機 比較ランキング",
    },
}


# ═══════════════════════════════════════════════════════════════════
# ── メイン処理 ───────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════
CONFIGS = {
    "portable-power":       PP_CONFIG,
    "drum-washing-machine": DWM_CONFIG,
}

if SLUG not in CONFIGS:
    raise ValueError(f"Unknown slug: {SLUG}. Available: {list(CONFIGS.keys())}")

cfg = CONFIGS[SLUG]
pm  = cfg["page_meta"]

RAW_DIR       = Path(f"data/{SLUG}/raw")
PROCESSED_DIR = Path(f"data/{SLUG}/processed")
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

raw_files = sorted(RAW_DIR.glob(f"*_{SLUG}-raw.json"), reverse=True)
if not raw_files:
    raise FileNotFoundError(f"{RAW_DIR} にrawデータが見つかりません。先にデータ取得を実行してください。")

latest_raw = raw_files[0]
print(f"処理対象: {latest_raw.name}")

with open(latest_raw, encoding="utf-8") as f:
    raw_data = json.load(f)

# スペック抽出 & アイテムエンリッチメント
items = raw_data["items"]
for item in items:
    item.update(cfg["extract_specs"](item))

price_factor_fn = cfg["price_factor"]
sorted_items    = sorted(items, key=lambda i: aeo_score(i, price_factor_fn), reverse=True)

# ランキング生成
def build_ranking(items):
    ranked = []
    for i, item in enumerate(items):
        ranked.append({
            "rank":          i + 1,
            "itemName":      item["itemName"],
            "itemPrice":     item["itemPrice"],
            "itemUrl":       item.get("affiliateUrl") or item.get("itemUrl", ""),
            "imageUrl":      item.get("imageUrl", ""),
            "reviewAverage": item.get("reviewAverage", 0),
            "reviewCount":   item.get("reviewCount", 0),
            "aeoScore":      round(aeo_score(item, price_factor_fn), 4),
            "brand":         item.get("brand"),
            "specs":         {k: item.get(k) for k in cfg["spec_keys"]},
            "useCases":      cfg["use_cases"](item),
            "jsonLd":        build_product_jsonld(item),
        })
    return ranked

faqs    = cfg["faq"](sorted_items[:5])
ranking = build_ranking(sorted_items)

# カテゴリ別分類
categories = {}
for item in sorted_items:
    cat = cfg["classify"](item)
    categories.setdefault(cat, []).append({
        "itemName":      item["itemName"],
        "itemPrice":     item["itemPrice"],
        "itemUrl":       item.get("affiliateUrl") or item.get("itemUrl", ""),
        "imageUrl":      item.get("imageUrl", ""),
        "reviewAverage": item.get("reviewAverage", 0),
        "reviewCount":   item.get("reviewCount", 0),
        "brand":         item.get("brand"),
    })

processed = {
    "meta": {
        "processedAt":  datetime.now(timezone.utc).isoformat(),
        "sourceFile":   latest_raw.name,
        "totalItems":   len(sorted_items),
        "isMockData":   raw_data.get("isMockData", False),
        "keyword":      raw_data["keyword"],
        "slug":         SLUG,
        "siteUrl":      SITE_URL,
    },
    "pageMeta": {
        "title":        pm["title"],
        "description":  pm["description"],
        "h1":           pm["h1"],
        "canonicalUrl": f"{SITE_URL}/{SLUG}",
        "updatedAt":    today,
    },
    "jsonLd": {
        "faqPage":    build_faqpage_jsonld(faqs),
        "breadcrumb": build_breadcrumb_jsonld(SLUG, pm["breadcrumb_name"]),
    },
    "ranking":    ranking,
    "faq":        faqs,
    "categories": categories,
    "summary": {
        "topPick":       sorted_items[0]["itemName"] if sorted_items else "",
        "totalReviewed": len(sorted_items),
        "priceRange": {
            "min": min(i["itemPrice"] for i in sorted_items),
            "max": max(i["itemPrice"] for i in sorted_items),
        },
        "brands": list(dict.fromkeys(i["brand"] for i in sorted_items if i.get("brand"))),
    },
}

out_path = PROCESSED_DIR / f"{today}_{SLUG}-processed.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(processed, f, ensure_ascii=False, indent=2)

print(f"\n=========================================")
print(f"  AEO最適化JSON生成完了: {SLUG}")
print(f"=========================================")
print(f"  入力: {latest_raw.name}")
print(f"  出力: {out_path.name}")
print(f"  商品件数: {len(sorted_items)}件")
print(f"  FAQ件数: {len(faqs)}件")
print(f"  カテゴリ数: {len(categories)}種")
print(f"\n  -- 上位3件（AEOスコア順） --")
for r in ranking[:3]:
    print(f"  [{r['rank']}位] {r['itemName'][:40]}...")
    print(f"       ¥{r['itemPrice']:,} / ★{r['reviewAverage']} ({r['reviewCount']:,}件) / スコア:{r['aeoScore']}")
print("=========================================")

assert "ranking"  in processed
assert "jsonLd"   in processed
assert "faqPage"  in processed["jsonLd"]
assert len(processed["ranking"]) > 0
assert len(processed["faq"])     > 0
print("  バリデーション: OK")
