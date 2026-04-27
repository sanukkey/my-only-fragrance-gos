"""
generate-mock-data.py
楽天APIが利用可能になるまでのパイプライン検証用モックデータ生成スクリプト。
実際の楽天API応答と同じスキーマで data/portable-power/raw/ に保存する。
"""

import json
import os
from datetime import datetime, timezone

MOCK_ITEMS = [
    {"itemName": "EcoFlow DELTA 2 ポータブル電源 1024Wh 急速充電 純正弦波 AC最大1800W", "itemPrice": 89800, "reviewAverage": 4.73, "reviewCount": 2847, "shopName": "EcoFlow公式ショップ", "capacity_wh": 1024, "output_w": 1800, "weight_kg": 12.0, "brand": "EcoFlow"},
    {"itemName": "Jackery ポータブル電源 1000 Pro 1002Wh 超急速充電 AC最大1000W アウトドア", "itemPrice": 79800, "reviewAverage": 4.68, "reviewCount": 3124, "shopName": "Jackery Japan", "capacity_wh": 1002, "output_w": 1000, "weight_kg": 11.5, "brand": "Jackery"},
    {"itemName": "Anker PowerHouse 767 ポータブル電源 2048Wh LFPバッテリー 2400W", "itemPrice": 169800, "reviewAverage": 4.61, "reviewCount": 1523, "shopName": "Anker公式ストア", "capacity_wh": 2048, "output_w": 2400, "weight_kg": 26.0, "brand": "Anker"},
    {"itemName": "BLUETTI AC180 ポータブル電源 1152Wh 1800W 急速充電 LiFePO4", "itemPrice": 99800, "reviewAverage": 4.59, "reviewCount": 987, "shopName": "BLUETTI公式", "capacity_wh": 1152, "output_w": 1800, "weight_kg": 16.0, "brand": "BLUETTI"},
    {"itemName": "EcoFlow RIVER 2 Pro ポータブル電源 768Wh 800W X-Stream急速充電", "itemPrice": 59800, "reviewAverage": 4.71, "reviewCount": 1832, "shopName": "EcoFlow公式ショップ", "capacity_wh": 768, "output_w": 800, "weight_kg": 7.8, "brand": "EcoFlow"},
    {"itemName": "Jackery ポータブル電源 300 Plus 288Wh AC最大300W 軽量コンパクト キャンプ", "itemPrice": 29800, "reviewAverage": 4.65, "reviewCount": 4210, "shopName": "Jackery Japan", "capacity_wh": 288, "output_w": 300, "weight_kg": 3.75, "brand": "Jackery"},
    {"itemName": "BLUETTI EB70S ポータブル電源 716Wh 800W AC出力 太陽光充電対応", "itemPrice": 49800, "reviewAverage": 4.55, "reviewCount": 765, "shopName": "BLUETTI公式", "capacity_wh": 716, "output_w": 800, "weight_kg": 10.1, "brand": "BLUETTI"},
    {"itemName": "EcoFlow DELTA Pro ポータブル電源 3600Wh 3600W 家庭用蓄電池 防災", "itemPrice": 249800, "reviewAverage": 4.69, "reviewCount": 632, "shopName": "EcoFlow公式ショップ", "capacity_wh": 3600, "output_w": 3600, "weight_kg": 45.0, "brand": "EcoFlow"},
    {"itemName": "VTOMAN FlashSpeed 1500 ポータブル電源 1548Wh 2000W LFP 急速充電", "itemPrice": 74800, "reviewAverage": 4.48, "reviewCount": 421, "shopName": "VTOMAN公式", "capacity_wh": 1548, "output_w": 2000, "weight_kg": 15.5, "brand": "VTOMAN"},
    {"itemName": "Anker PowerHouse 521 ポータブル電源 256Wh 200W コンパクト アウトドア", "itemPrice": 19800, "reviewAverage": 4.52, "reviewCount": 3891, "shopName": "Anker公式ストア", "capacity_wh": 256, "output_w": 200, "weight_kg": 3.3, "brand": "Anker"},
    {"itemName": "Jackery ポータブル電源 2000 Plus 2042Wh AC最大3000W LFPバッテリー", "itemPrice": 198000, "reviewAverage": 4.77, "reviewCount": 312, "shopName": "Jackery Japan", "capacity_wh": 2042, "output_w": 3000, "weight_kg": 27.0, "brand": "Jackery"},
    {"itemName": "EcoFlow RIVER 2 ポータブル電源 256Wh 600W 軽量 キャンプ 緊急時", "itemPrice": 24800, "reviewAverage": 4.64, "reviewCount": 2156, "shopName": "EcoFlow公式ショップ", "capacity_wh": 256, "output_w": 600, "weight_kg": 3.5, "brand": "EcoFlow"},
    {"itemName": "BLUETTI AC200P ポータブル電源 2000Wh 2000W LFP 長寿命 非常用電源", "itemPrice": 159800, "reviewAverage": 4.58, "reviewCount": 891, "shopName": "BLUETTI公式", "capacity_wh": 2000, "output_w": 2000, "weight_kg": 27.5, "brand": "BLUETTI"},
    {"itemName": "Jackery ポータブル電源 500 518Wh AC最大500W 軽量 ソーラー充電対応", "itemPrice": 44800, "reviewAverage": 4.62, "reviewCount": 2987, "shopName": "Jackery Japan", "capacity_wh": 518, "output_w": 500, "weight_kg": 6.4, "brand": "Jackery"},
    {"itemName": "EcoFlow DELTA 2 Max ポータブル電源 2048Wh 2400W 超急速充電 LFP", "itemPrice": 149800, "reviewAverage": 4.74, "reviewCount": 543, "shopName": "EcoFlow公式ショップ", "capacity_wh": 2048, "output_w": 2400, "weight_kg": 23.0, "brand": "EcoFlow"},
]

def generate_item(i: int, data: dict) -> dict:
    item_code = f"MOCK{str(i+1).zfill(4)}"
    return {
        "source": "rakuten",
        "itemName": data["itemName"],
        "itemPrice": data["itemPrice"],
        "itemUrl": f"https://item.rakuten.co.jp/mock-shop/{item_code}/",
        "affiliateUrl": f"https://hb.afl.rakuten.co.jp/hgc/mock/{item_code}/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fmock-shop%2F{item_code}%2F",
        "imageUrl": f"https://thumbnail.image.rakuten.co.jp/@0_mall/mock-shop/cabinet/{item_code}.jpg",
        "smallImageUrl": f"https://thumbnail.image.rakuten.co.jp/@0_mall/mock-shop/cabinet/{item_code}_s.jpg",
        "reviewAverage": data["reviewAverage"],
        "reviewCount": data["reviewCount"],
        "itemCaption": f"{data['itemName']}。{data.get('capacity_wh', 0)}Whの大容量で、最大{data.get('output_w', 0)}Wの出力に対応。重量{data.get('weight_kg', 0)}kgの持ち運びやすいデザイン。アウトドアや防災に最適。",
        "shopName": data["shopName"],
        "shopCode": f"mock-{data['brand'].lower()}",
        "genreId": "215783",  # ポータブル電源カテゴリ
        "tagIds": [],
        "pointRate": 1,
        "postageFlag": 1,
        "rank": i + 1,
        # スペック情報
        "capacity_wh": data.get("capacity_wh"),
        "output_w": data.get("output_w"),
        "weight_kg": data.get("weight_kg"),
        "brand": data.get("brand"),
    }

def main():
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    items = [generate_item(i, d) for i, d in enumerate(MOCK_ITEMS)]

    result = {
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "keyword": "ポータブル電源",
        "totalCount": len(items),
        "pages": 1,
        "isMockData": True,  # 本番APIに切り替え後はこのフィールドは消える
        "items": items,
    }

    out_dir = os.path.join("data", "portable-power", "raw")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"{today}_portable-power-raw.json")

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"✅ モックデータ保存完了: {out_path}")
    print(f"   件数: {len(items)}件")
    print(f"   ブランド: {list(set(d['brand'] for d in MOCK_ITEMS))}")

if __name__ == "__main__":
    main()
