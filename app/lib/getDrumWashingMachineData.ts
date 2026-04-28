import * as fs from 'fs';
import * as path from 'path';
import { DWMProcessedData, DWMRankingItem } from '@/app/types/drum-washing-machine';

/** 本体キーワード（洗濯機本体を示す語句） */
const MACHINE_KEYWORDS = [
  'ドラム式洗濯機', 'ドラム式洗濯乾燥機', '洗濯乾燥機',
  'ドラム洗濯', '洗濯機 ドラム',
];

/** アクセサリー除外キーワード */
const ACCESSORY_EXCLUDE = [
  'クリーナー', 'フィルター', 'ブラシ', 'かさ上げ', 'スライド台',
  'ラック', 'バスケット', '洗濯槽', 'スタンド', '防振ゴム', '収納',
];

export function cleanItemName(name: string): string {
  return name
    .replace(/【[^】]*?円[^】]*?】/g, '')
    .replace(/【[^】]*?%OFF[^】]*?】/gi, '')
    .replace(/＜[^＞]*?＞/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function isDrumWashingMachine(item: DWMRankingItem): boolean {
  const name = item.itemName;
  const hasKeyword = MACHINE_KEYWORDS.some(kw => name.includes(kw));
  const isAccessory = ACCESSORY_EXCLUDE.some(kw => name.includes(kw));
  // 30,000円以上かつ本体キーワードあり、かつアクセサリーキーワードなし
  return item.itemPrice >= 30000 && hasKeyword && !isAccessory;
}

export function getDrumWashingMachineData(): DWMProcessedData {
  const dir = path.join(process.cwd(), 'data', 'drum-washing-machine', 'processed');
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('-processed.json'))
    .sort()
    .reverse();

  if (files.length === 0) throw new Error('No drum-washing-machine processed data found');

  const raw  = fs.readFileSync(path.join(dir, files[0]), 'utf-8');
  const data = JSON.parse(raw) as DWMProcessedData;

  data.ranking = data.ranking
    .filter(isDrumWashingMachine)
    .slice(0, 10)
    .map((item, i) => ({ ...item, rank: i + 1 }));

  return data;
}
