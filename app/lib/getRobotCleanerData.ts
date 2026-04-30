import * as fs from 'fs';
import * as path from 'path';
import { RobotCleanerProcessedData, RobotCleanerRankingItem } from '@/app/types/robot-cleaner';

const MACHINE_KEYWORDS = [
  'ロボット掃除機', 'お掃除ロボット', 'ロボットクリーナー',
  'Roomba', 'iRobot', 'Roborock', 'Eufy', 'Ecovacs', 'DEEBOT',
  'ブラーバ', 'SwitchBot', 'Anker Eufy',
];

const ACCESSORY_EXCLUDE = [
  'バッテリー', 'フィルター', 'ブラシ', '部品', 'パーツ',
  'アクセサリー', '充電器', 'ドック', '交換用', 'スペア',
  '消耗品', 'クリーナー液',
];

export function cleanItemName(name: string): string {
  return name
    .replace(/【[^】]*?円[^】]*?】/g, '')
    .replace(/【[^】]*?%OFF[^】]*?】/gi, '')
    .replace(/＜[^＞]*?＞/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function isRobotCleaner(item: RobotCleanerRankingItem): boolean {
  const name = item.itemName;
  const hasKeyword  = MACHINE_KEYWORDS.some(kw => name.includes(kw));
  const isAccessory = ACCESSORY_EXCLUDE.some(kw => name.includes(kw));
  return item.itemPrice >= 30000 && hasKeyword && !isAccessory;
}

export function getRobotCleanerData(): RobotCleanerProcessedData {
  const dir = path.join(process.cwd(), 'data', 'robot-cleaner', 'processed');
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('-processed.json'))
    .sort()
    .reverse();

  if (files.length === 0) throw new Error('No robot-cleaner processed data found');

  const raw  = fs.readFileSync(path.join(dir, files[0]), 'utf-8');
  const data = JSON.parse(raw) as RobotCleanerProcessedData;

  data.ranking = data.ranking
    .filter(isRobotCleaner)
    .slice(0, 10)
    .map((item, i) => ({ ...item, rank: i + 1 }));

  return data;
}
