import * as fs from 'fs';
import * as path from 'path';
import { ClothesDryerProcessedData, ClothesDryerRankingItem } from '@/app/types/clothes-dryer';

const MACHINE_KEYWORDS = [
  '衣類乾燥機', '乾燥機', 'ヒートポンプ乾燥', 'ドラム乾燥',
  'ES-H', 'NH-D', 'DVR-', 'RWD-', 'AWD-',
];

const ACCESSORY_EXCLUDE = [
  '洗濯槽クリーナー', '乾燥剤', '洗剤', 'シート', 'ネット',
  '防振', 'スタンド', 'ラック', 'トレー', 'ホース',
];

export function cleanItemName(name: string): string {
  return name
    .replace(/【[^】]*?円[^】]*?】/g, '')
    .replace(/【[^】]*?%OFF[^】]*?】/gi, '')
    .replace(/＜[^＞]*?＞/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function isClothresDryer(item: ClothesDryerRankingItem): boolean {
  const name = item.itemName;
  const hasKeyword  = MACHINE_KEYWORDS.some(kw => name.includes(kw));
  const isAccessory = ACCESSORY_EXCLUDE.some(kw => name.includes(kw));
  // ドラム式洗濯乾燥機（洗濯機兼用）は除外し、専用乾燥機のみ対象
  const isCombo = name.includes('洗濯乾燥機') && !name.includes('乾燥専用');
  return item.itemPrice >= 40000 && hasKeyword && !isAccessory && !isCombo;
}

export function getClothesDryerData(): ClothesDryerProcessedData {
  const dir = path.join(process.cwd(), 'data', 'clothes-dryer', 'processed');
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('-processed.json'))
    .sort()
    .reverse();

  if (files.length === 0) throw new Error('No clothes-dryer processed data found');

  const raw  = fs.readFileSync(path.join(dir, files[0]), 'utf-8');
  const data = JSON.parse(raw) as ClothesDryerProcessedData;

  data.ranking = data.ranking
    .filter(isClothresDryer)
    .slice(0, 10)
    .map((item, i) => ({ ...item, rank: i + 1 }));

  return data;
}
