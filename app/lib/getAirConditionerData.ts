import * as fs from 'fs';
import * as path from 'path';
import { AirConditionerProcessedData, AirConditionerRankingItem } from '@/app/types/air-conditioner';

const MACHINE_KEYWORDS = [
  'エアコン', '冷暖房', 'ルームエアコン', '冷房暖房',
  'CS-', 'RAS-', 'MSZ-', 'SRK-', 'AY-', 'AN-',
  'ダイキン', 'パナソニック エアコン', '日立 エアコン',
];

const ACCESSORY_EXCLUDE = [
  'フィルター', 'クリーナー', 'カバー', 'リモコン',
  '洗浄', '防虫', 'シート', 'テープ', 'ドレン',
  '取り付け', '工事', '部品', 'パーツ',
];

export function cleanItemName(name: string): string {
  return name
    .replace(/【[^】]*?円[^】]*?】/g, '')
    .replace(/【[^】]*?%OFF[^】]*?】/gi, '')
    .replace(/＜[^＞]*?＞/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function isAirConditioner(item: AirConditionerRankingItem): boolean {
  const name = item.itemName;
  const hasKeyword  = MACHINE_KEYWORDS.some(kw => name.includes(kw));
  const isAccessory = ACCESSORY_EXCLUDE.some(kw => name.includes(kw));
  return item.itemPrice >= 50000 && hasKeyword && !isAccessory;
}

export function getAirConditionerData(): AirConditionerProcessedData {
  const dir = path.join(process.cwd(), 'data', 'air-conditioner', 'processed');
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('-processed.json'))
    .sort()
    .reverse();

  if (files.length === 0) throw new Error('No air-conditioner processed data found');

  const raw  = fs.readFileSync(path.join(dir, files[0]), 'utf-8');
  const data = JSON.parse(raw) as AirConditionerProcessedData;

  data.ranking = data.ranking
    .filter(isAirConditioner)
    .slice(0, 10)
    .map((item, i) => ({ ...item, rank: i + 1 }));

  return data;
}
