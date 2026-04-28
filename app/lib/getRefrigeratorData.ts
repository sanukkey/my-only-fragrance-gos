import * as fs from 'fs';
import * as path from 'path';
import { RefrigeratorProcessedData, RefrigeratorRankingItem } from '@/app/types/refrigerator';

/** 冷蔵庫本体キーワード */
const MACHINE_KEYWORDS = [
  '冷蔵庫', 'フレンチドア', '観音開き冷蔵',
  'NR-F', 'R-HW', 'MR-W', 'MR-B', 'GR-W', 'SJ-',
];

/** アクセサリー除外キーワード */
const ACCESSORY_EXCLUDE = [
  '製氷皿', '脱臭剤', '脱臭', '収納', 'ラック', 'トレー',
  'マット', 'シート', 'カバー', 'ケース', 'ポケット',
  '洗剤', 'クリーナー', '保存容器', 'パック',
];

export function cleanItemName(name: string): string {
  return name
    .replace(/【[^】]*?円[^】]*?】/g, '')
    .replace(/【[^】]*?%OFF[^】]*?】/gi, '')
    .replace(/＜[^＞]*?＞/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function isRefrigerator(item: RefrigeratorRankingItem): boolean {
  const name = item.itemName;
  const hasKeyword  = MACHINE_KEYWORDS.some(kw => name.includes(kw));
  const isAccessory = ACCESSORY_EXCLUDE.some(kw => name.includes(kw));
  return item.itemPrice >= 50000 && hasKeyword && !isAccessory;
}

export function getRefrigeratorData(): RefrigeratorProcessedData {
  const dir = path.join(process.cwd(), 'data', 'refrigerator', 'processed');
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('-processed.json'))
    .sort()
    .reverse();

  if (files.length === 0) throw new Error('No refrigerator processed data found');

  const raw  = fs.readFileSync(path.join(dir, files[0]), 'utf-8');
  const data = JSON.parse(raw) as RefrigeratorProcessedData;

  data.ranking = data.ranking
    .filter(isRefrigerator)
    .slice(0, 10)
    .map((item, i) => ({ ...item, rank: i + 1 }));

  return data;
}
