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
# ═══════════════════════════════════════════════════════════════════
# ── 大型冷蔵庫 設定 ─────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════
def ref_price_factor(price):
    if 100000 <= price <= 350000: return 1.0
    if  50000 <= price < 100000:  return 0.85
    if price < 50000:             return 0.5   # 小型・アクセサリー
    return 0.85                                # 350k超プレミアム

def ref_extract_specs(item):
    text = item.get("itemName", "") + " " + item.get("itemCaption", "")
    # 定格内容積: "365L" / "365リットル" / "定格内容積365L"
    ml = re.search(r"(\d{3,4})\s*(?:L|リットル)(?!\s*[/・]?\s*\d)", text)
    capacity_l = int(ml.group(1)) if ml else None
    # 省エネ達成率: "省エネ達成率100%" / "省エネ基準達成率100%"
    me = re.search(r"省エネ(?:基準)?達成率\s*(\d+)\s*%", text)
    energy_saving_rate = int(me.group(1)) if me else None
    # 年間消費電力量: "年間消費電力量XXXkWh"
    mk = re.search(r"年間消費電力量\s*(\d+)\s*kWh", text, re.IGNORECASE)
    annual_kwh = int(mk.group(1)) if mk else None
    return {
        "capacity_l":          capacity_l,
        "energy_saving_rate":  energy_saving_rate,
        "annual_kwh":          annual_kwh,
    }

def ref_classify(item):
    l = item.get("capacity_l")
    if l is None: return "不明"
    if l < 300:   return "小容量（~300L）2人以下向け"
    if l < 450:   return "中容量（300~450L）3~4人家族向け"
    return "大容量（450L~）5人以上向け"

def ref_use_cases(item):
    tags  = []
    l     = item.get("capacity_l")    or 0
    price = item.get("itemPrice")     or 0
    name  = item.get("itemName", "") + item.get("itemCaption", "")
    if l >= 450: tags.append("大家族・5人以上向け")
    elif l >= 300: tags.append("3~4人家族向け")
    elif l > 0:  tags.append("1~2人向け")
    if price <= 100000: tags.append("コスパ重視")
    if price >= 250000: tags.append("ハイエンド")
    if "フレンチドア" in name or "観音開き" in name: tags.append("フレンチドア")
    if "省エネ" in name:   tags.append("省エネ性能重視")
    if "自動製氷" in name: tags.append("自動製氷機能付き")
    if "冷凍" in name:     tags.append("大容量冷凍室")
    return tags if tags else ["汎用"]

def ref_faq(top_items):
    top      = top_items[0] if top_items else {}
    top_name = (top.get("itemName") or "大型冷蔵庫")[:30]
    return [
        {
            "question": "大型冷蔵庫のおすすめランキング1位はどれですか？",
            "answer":   f"レビュー数と評価を総合したランキング1位は「{top_name}」です。{top.get('reviewCount',0):,}件のレビューで平均{top.get('reviewAverage',0)}点の高評価を獲得しています。",
        },
        {
            "question": "冷蔵庫の容量はどれくらいが必要ですか？",
            "answer":   "一般的な目安は「70L×家族人数+常備品分170L」です。2人家族なら310L前後、4人家族なら450L前後、5人以上なら500L以上が快適に使える容量です。",
        },
        {
            "question": "冷蔵庫の省エネ性能はどう比較すればいいですか？",
            "answer":   "「年間消費電力量（kWh/年）」と「省エネ達成率（%）」を確認してください。年間消費電力量が少ないほど電気代が安く、省エネ達成率100%以上が省エネ優良機種の目安です。",
        },
        {
            "question": "冷蔵庫の人気メーカーはどこですか？",
            "answer":   "パナソニック・日立・三菱電機・シャープ・東芝の5社が人気です。パナソニックはNR-Fシリーズ、日立はR-HWSシリーズ、三菱はMR-WXシリーズが代表的な大型モデルです。",
        },
        {
            "question": "冷蔵庫の設置スペースの目安は？",
            "answer":   "設置には放熱スペースとして左右各5mm以上・上部10cm以上が必要です。ドアの開閉スペースも確保してください。フレンチドア（観音開き）は開口部が狭い場所でも設置しやすいです。",
        },
        {
            "question": "冷蔵庫の寿命はどのくらいですか？",
            "answer":   "一般的な冷蔵庫の寿命は10~15年程度です。コンプレッサーの交換部品確保期限は製造終了から約9年のメーカーが多く、10年を超えたら買い替えを検討するのが一般的です。",
        },
        {
            "question": "冷蔵庫の搬入・設置で注意することは？",
            "answer":   "搬入経路（玄関・廊下・エレベーター）の寸法確認が重要です。冷蔵庫は横倒しにできないため、搬入経路の高さと幅が本体サイズ+10cm以上あることを事前に確認してください。",
        },
    ]

REF_CONFIG = {
    "name_jp":      "大型冷蔵庫",
    "spec_keys":    ["capacity_l", "energy_saving_rate", "annual_kwh"],
    "price_factor": ref_price_factor,
    "extract_specs": ref_extract_specs,
    "classify":     ref_classify,
    "use_cases":    ref_use_cases,
    "faq":          ref_faq,
    "page_meta": {
        "title":           "大型冷蔵庫おすすめ比較ランキング【2026年最新版】",
        "description":     "2026年最新の大型冷蔵庫を徹底比較。容量・省エネ性能・価格・レビューから選ぶべき1台がわかります。パナソニック・日立・三菱・シャープなど人気メーカーを網羅。",
        "h1":              "大型冷蔵庫おすすめ比較ランキング2026年版",
        "breadcrumb_name": "大型冷蔵庫 比較ランキング",
    },
}


# ═══════════════════════════════════════════════════════════════════
# ── ロボット掃除機 設定 ──────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════
def rc_price_factor(price):
    if 50000 <= price <= 150000: return 1.0
    if 30000 <= price < 50000:   return 0.85
    if price < 30000:            return 0.5
    return 0.85  # 150k超ハイエンド

def rc_extract_specs(item):
    text = item.get("itemName", "") + " " + item.get("itemCaption", "")
    # 吸引力: "XXXXX Pa" / "吸引力XXXXX Pa"
    mp = re.search(r"(\d{3,6})\s*Pa", text, re.IGNORECASE)
    suction_pa = int(mp.group(1)) if mp else None
    # 稼働面積: "XXX㎡" / "XXX平米" / "最大XXX㎡"
    ms = re.search(r"(\d{2,4})\s*(?:㎡|平米|m²)", text)
    coverage_sqm = int(ms.group(1)) if ms else None
    # 自動ゴミ収集: キーワードで判定
    auto_dust_kw = ["自動ゴミ収集", "自動集塵", "クリーンベース", "ゴミ自動収集", "自動ダスト"]
    auto_dust = True if any(kw in text for kw in auto_dust_kw) else None
    return {
        "suction_pa":   suction_pa,
        "coverage_sqm": coverage_sqm,
        "auto_dust":    auto_dust,
    }

def rc_classify(item):
    price = item.get("itemPrice") or 0
    if price >= 100000: return "ハイエンド（10万円~）"
    if price >= 60000:  return "ミドルレンジ（6~10万円）"
    return "エントリー（~6万円）"

def rc_use_cases(item):
    tags  = []
    pa    = item.get("suction_pa") or 0
    price = item.get("itemPrice") or 0
    name  = item.get("itemName", "") + item.get("itemCaption", "")
    if item.get("auto_dust"):    tags.append("自動ゴミ収集対応")
    if pa >= 5000:               tags.append("強力吸引")
    if "マッピング" in name or "LiDAR" in name: tags.append("マッピング機能付き")
    if "水拭き" in name or "モップ" in name:    tags.append("水拭き対応")
    if "ペット" in name:         tags.append("ペット毛対応")
    if price <= 50000:           tags.append("コスパ重視")
    if price >= 120000:          tags.append("フラッグシップ")
    return tags if tags else ["汎用"]

def rc_faq(top_items):
    top      = top_items[0] if top_items else {}
    top_name = (top.get("itemName") or "ロボット掃除機")[:30]
    return [
        {
            "question": "ロボット掃除機のおすすめランキング1位はどれですか？",
            "answer":   f"レビュー数と評価を総合したランキング1位は「{top_name}」です。{top.get('reviewCount',0):,}件のレビューで平均{top.get('reviewAverage',0)}点の高評価を獲得しています。",
        },
        {
            "question": "ロボット掃除機の吸引力はどれくらいあれば十分ですか？",
            "answer":   "フローリングのみなら2000Pa前後、カーペットがある場合は3000Pa以上、ペットの毛が多い家庭では5000Pa以上を目安にしてください。",
        },
        {
            "question": "自動ゴミ収集機能付きとそうでないものの違いは？",
            "answer":   "自動ゴミ収集機能付きは掃除後に自動でゴミを収集ステーションへ移送するため、毎回ダストボックスを空にする手間がありません。2~3週間に1回の処理で済む製品が多いです。",
        },
        {
            "question": "ロボット掃除機のマッピング機能は必要ですか？",
            "answer":   "マッピング機能（LiDARやカメラ）があると間取りを学習して効率的に清掃します。家具の多い部屋や複数の部屋を掃除する場合は特に有効です。",
        },
        {
            "question": "ロボット掃除機は何畳まで対応できますか？",
            "answer":   "多くのモデルは1回の充電で100〜200㎡（約60〜120畳）に対応します。広い家では自動充電・再開機能がある機種を選ぶことをお勧めします。",
        },
        {
            "question": "ロボット掃除機の人気ブランドはどこですか？",
            "answer":   "Roborock（ロボロック）・iRobot（ルンバ）・Eufy（ユーフィ）・Ecovacs（エコバックス）が人気です。Roborockは吸引力とマッピング精度、iRobotは信頼性と日本語サポートが強みです。",
        },
        {
            "question": "ロボット掃除機は段差や障害物に対応できますか？",
            "answer":   "一般的なロボット掃除機は2cm以下の段差を乗り越えられます。障害物検知センサーで家具や壁を回避しますが、細いコードや靴下などは事前に片付けることを推奨します。",
        },
    ]

RC_CONFIG = {
    "name_jp":       "ロボット掃除機",
    "spec_keys":     ["suction_pa", "coverage_sqm", "auto_dust"],
    "price_factor":  rc_price_factor,
    "extract_specs": rc_extract_specs,
    "classify":      rc_classify,
    "use_cases":     rc_use_cases,
    "faq":           rc_faq,
    "page_meta": {
        "title":           "ロボット掃除機おすすめ比較ランキング【2026年最新版】",
        "description":     "2026年最新のロボット掃除機を徹底比較。吸引力・マッピング・自動ゴミ収集・価格・レビューから選ぶべき1台がわかります。Roborock・iRobot・Eufyなど人気ブランドを網羅。",
        "h1":              "ロボット掃除機おすすめ比較ランキング2026年版",
        "breadcrumb_name": "ロボット掃除機 比較ランキング",
    },
}


# ═══════════════════════════════════════════════════════════════════
# ── 衣類乾燥機 設定 ──────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════
def cd_price_factor(price):
    if 80000 <= price <= 200000: return 1.0
    if 40000 <= price < 80000:   return 0.85
    if price < 40000:            return 0.5
    return 0.85  # 200k超ハイエンド

def cd_extract_specs(item):
    text = item.get("itemName", "") + " " + item.get("itemCaption", "")
    # 乾燥容量: "乾燥XXkg" / "XXkg乾燥"
    md = re.search(r"乾燥[^\d]*(\d+(?:\.\d+)?)\s*kg", text)
    if not md:
        md = re.search(r"(\d+(?:\.\d+)?)\s*kg[^\d]", text)
    dry_kg = float(md.group(1)) if md else None
    # 方式: ヒートポンプ > ヒーター > ガス
    if "ヒートポンプ" in text:
        method = "ヒートポンプ"
    elif "ガス" in text:
        method = "ガス式"
    elif "ヒーター" in text or "電気" in text:
        method = "ヒーター"
    else:
        method = None
    # 消費電力
    mw = re.search(r"消費電力[^\d]*(\d{3,4})\s*W", text)
    if not mw:
        mw = re.search(r"(\d{3,4})\s*W", text)
    power_w = int(mw.group(1)) if mw else None
    return {
        "dry_kg":  dry_kg,
        "method":  method,
        "power_w": power_w,
    }

def cd_classify(item):
    kg = item.get("dry_kg")
    if kg is None: return "不明"
    if kg < 5:     return "コンパクト（~5kg）"
    if kg < 8:     return "標準（5~8kg）"
    return "大容量（8kg~）"

def cd_use_cases(item):
    tags  = []
    kg    = item.get("dry_kg") or 0
    price = item.get("itemPrice") or 0
    name  = item.get("itemName", "") + item.get("itemCaption", "")
    if item.get("method") == "ヒートポンプ": tags.append("省エネ・節電重視")
    if item.get("method") == "ガス式":       tags.append("ガス乾燥機")
    if kg >= 8:         tags.append("大家族向け")
    elif kg >= 5:       tags.append("2~4人家族向け")
    elif kg > 0:        tags.append("1~2人向け")
    if price <= 80000:  tags.append("コスパ重視")
    if price >= 150000: tags.append("ハイエンド")
    if "除菌" in name or "抗菌" in name: tags.append("除菌・抗菌機能")
    return tags if tags else ["汎用"]

def cd_faq(top_items):
    top      = top_items[0] if top_items else {}
    top_name = (top.get("itemName") or "衣類乾燥機")[:30]
    return [
        {
            "question": "衣類乾燥機のおすすめランキング1位はどれですか？",
            "answer":   f"レビュー数と評価を総合したランキング1位は「{top_name}」です。{top.get('reviewCount',0):,}件のレビューで平均{top.get('reviewAverage',0)}点の高評価を獲得しています。",
        },
        {
            "question": "ヒートポンプ式とヒーター式の乾燥機、どちらがおすすめですか？",
            "answer":   "電気代を重視するならヒートポンプ式がおすすめ。ヒーター式の約1/3の電力で乾燥でき、衣類へのダメージも少ないです。初期費用は高めですが、長期的なコストパフォーマンスに優れます。",
        },
        {
            "question": "衣類乾燥機の容量はどれくらいが必要ですか？",
            "answer":   "一人暮らしなら3~5kg、夫婦2人なら5~6kg、4人家族なら6~8kg以上が目安です。乾燥機に入れる量は洗濯機の容量より少なくなるため、少し大きめを選ぶと便利です。",
        },
        {
            "question": "乾燥機を使うと衣類が縮みませんか？",
            "answer":   "綿100%のニットや縮みやすい素材は注意が必要です。ヒートポンプ式は低温乾燥のため縮みにくく、化繊・タオル・シーツなどは問題なく使えます。洗濯表示で乾燥機使用可否を確認してください。",
        },
        {
            "question": "衣類乾燥機の設置場所・スペースはどれくらい必要ですか？",
            "answer":   "乾燥機専用のドラム式は幅60cm×奥行き60cm程度が一般的です。排湿のための換気または排水が必要です。コンデンス式は換気不要で設置場所を選びません。",
        },
        {
            "question": "衣類乾燥機の電気代はどのくらいですか？",
            "answer":   "ヒートポンプ式で1回約30~60円、ヒーター式で約100~150円程度（電気代27円/kWhで計算）。毎日使うなら年間でヒートポンプ式の方が3~5万円節約できる計算になります。",
        },
        {
            "question": "衣類乾燥機の人気メーカーはどこですか？",
            "answer":   "パナソニック・日立・シャープ・東芝・リンナイ（ガス式）が人気です。パナソニックのNH-Dシリーズ、日立のDE-Nシリーズが定番のヒートポンプ式として支持されています。",
        },
    ]

CD_CONFIG = {
    "name_jp":       "衣類乾燥機",
    "spec_keys":     ["dry_kg", "method", "power_w"],
    "price_factor":  cd_price_factor,
    "extract_specs": cd_extract_specs,
    "classify":      cd_classify,
    "use_cases":     cd_use_cases,
    "faq":           cd_faq,
    "page_meta": {
        "title":           "衣類乾燥機おすすめ比較ランキング【2026年最新版】",
        "description":     "2026年最新の衣類乾燥機を徹底比較。ヒートポンプ・ヒーター・ガス式の違いや乾燥容量・電気代・レビューから選ぶべき1台がわかります。パナソニック・日立・シャープなど人気メーカーを網羅。",
        "h1":              "衣類乾燥機おすすめ比較ランキング2026年版",
        "breadcrumb_name": "衣類乾燥機 比較ランキング",
    },
}


# ═══════════════════════════════════════════════════════════════════
# ── エアコン 設定 ────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════
def ac_price_factor(price):
    if 100000 <= price <= 300000: return 1.0
    if  50000 <= price < 100000:  return 0.85
    if price < 50000:             return 0.5
    return 0.85  # 300k超ハイエンド

def ac_extract_specs(item):
    text = item.get("itemName", "") + " " + item.get("itemCaption", "")
    # 対応畳数: "XX畳" パターン
    mt = re.search(r"(\d{1,2}(?:\.\d)?)\s*畳", text)
    tatami = float(mt.group(1)) if mt else None
    # 省エネ達成率
    me = re.search(r"省エネ(?:基準)?達成率\s*(\d+)\s*%", text)
    energy_saving_pct = int(me.group(1)) if me else None
    # APF（通年エネルギー消費効率）
    ma = re.search(r"APF\s*(\d+(?:\.\d+)?)", text, re.IGNORECASE)
    apf = float(ma.group(1)) if ma else None
    return {
        "tatami":            tatami,
        "energy_saving_pct": energy_saving_pct,
        "apf":               apf,
    }

def ac_classify(item):
    t = item.get("tatami")
    if t is None: return "不明"
    if t <= 8:    return "小型（~8畳）ワンルーム向け"
    if t <= 14:   return "中型（9~14畳）LDK向け"
    return "大型（15畳~）リビング・大部屋向け"

def ac_use_cases(item):
    tags  = []
    t     = item.get("tatami") or 0
    apf   = item.get("apf") or 0
    price = item.get("itemPrice") or 0
    name  = item.get("itemName", "") + item.get("itemCaption", "")
    if t <= 8:    tags.append("ワンルーム・寝室向け")
    elif t <= 14: tags.append("LDK・ダイニング向け")
    else:         tags.append("大型リビング向け")
    if apf >= 7:              tags.append("超省エネ（APF7以上）")
    elif apf >= 6:            tags.append("省エネ優良（APF6以上）")
    if price <= 100000:       tags.append("コスパ重視")
    if price >= 250000:       tags.append("フラッグシップ")
    if "空気清浄" in name:    tags.append("空気清浄機能付き")
    if "加湿" in name:        tags.append("加湿機能付き")
    if "自動掃除" in name or "フィルター自動" in name: tags.append("フィルター自動掃除")
    return tags if tags else ["汎用"]

def ac_faq(top_items):
    top      = top_items[0] if top_items else {}
    top_name = (top.get("itemName") or "エアコン")[:30]
    return [
        {
            "question": "エアコンのおすすめランキング1位はどれですか？",
            "answer":   f"レビュー数と評価を総合したランキング1位は「{top_name}」です。{top.get('reviewCount',0):,}件のレビューで平均{top.get('reviewAverage',0)}点の高評価を獲得しています。",
        },
        {
            "question": "エアコンの対応畳数はどう選べばいいですか？",
            "answer":   "部屋の畳数に対応した機種を選ぶのが基本です。ただし断熱性の低い古い建物や日当たりの良い部屋は1~2段階大きい機種を選ぶと快適です。新築・高断熱住宅は適合畳数でOKです。",
        },
        {
            "question": "APFとは何ですか？数値が高いほど良いですか？",
            "answer":   "APF（通年エネルギー消費効率）は年間を通じたエネルギー効率の指標です。数値が高いほど電気代が安く、省エネ性能が高いことを意味します。最新の高効率機種はAPF6~8程度です。",
        },
        {
            "question": "エアコンの工事費の目安はいくらですか？",
            "answer":   "標準工事費は15,000〜25,000円程度です。配管延長・穴あけ・電気工事が必要な場合は追加費用が発生します。購入時に工事費込みのセット販売を利用すると費用を抑えられます。",
        },
        {
            "question": "省エネ基準達成率100%以上とはどういう意味ですか？",
            "answer":   "国が定めた省エネ基準値を100%として、それを上回る効率を示しています。100%超えなら国の基準より省エネで、数値が高いほど電気代が安くなります。省エネラベルの星の数も参考にしてください。",
        },
        {
            "question": "エアコンの寿命はどのくらいですか？",
            "answer":   "一般的なエアコンの寿命は10〜15年程度です。メーカーの補修用部品の保有期間は製造終了後10年が目安で、10年を超えたら故障時に買い替えを検討するのが一般的です。",
        },
        {
            "question": "エアコンの人気メーカーはどこですか？",
            "answer":   "ダイキン・パナソニック・日立・三菱電機・富士通ゼネラルが人気上位です。ダイキンは信頼性と省エネ性能、パナソニックはナノイー搭載の空気清浄機能、三菱電機はムーブアイセンサーが強みです。",
        },
    ]

AC_CONFIG = {
    "name_jp":       "エアコン",
    "spec_keys":     ["tatami", "energy_saving_pct", "apf"],
    "price_factor":  ac_price_factor,
    "extract_specs": ac_extract_specs,
    "classify":      ac_classify,
    "use_cases":     ac_use_cases,
    "faq":           ac_faq,
    "page_meta": {
        "title":           "エアコンおすすめ比較ランキング【2026年最新版】",
        "description":     "2026年最新のエアコンを徹底比較。畳数・省エネ・APF・価格・レビューから選ぶべき1台がわかります。ダイキン・パナソニック・日立・三菱電機など人気メーカーを網羅。",
        "h1":              "エアコンおすすめ比較ランキング2026年版",
        "breadcrumb_name": "エアコン 比較ランキング",
    },
}


CONFIGS = {
    "portable-power":       PP_CONFIG,
    "drum-washing-machine": DWM_CONFIG,
    "refrigerator":         REF_CONFIG,
    "robot-cleaner":        RC_CONFIG,
    "clothes-dryer":        CD_CONFIG,
    "air-conditioner":      AC_CONFIG,
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
