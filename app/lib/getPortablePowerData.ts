import * as fs from 'fs';
import * as path from 'path';
import { ProcessedData, RankingItem } from '@/app/types/portable-power';

const PP_KEYWORDS = [
  'ポータブル電源', '蓄電', 'Wh', 'EcoFlow', 'Jackery',
  'BLUETTI', 'Anker', 'VTOMAN', 'BougeRV', 'EENOUR', 'LACITA',
  'ポータブルバッテリー', 'Solar Generator',
];

/** 商品名の販促テキストを除去してクリーンなタイトルを返す */
export function cleanItemName(name: string): string {
  return name
    .replace(/【[^】]*?円[^】]*?】/g, '')   // 【クーポン利用で○○円...】
    .replace(/【[^】]*?%OFF[^】]*?】/gi, '') // 【40%OFF...】
    .replace(/＜[^＞]*?＞/g, '')            // ＜高評価★...＞
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** ポータブル電源関連商品のみフィルタリング */
function isPortablePower(item: RankingItem): boolean {
  return PP_KEYWORDS.some(kw => item.itemName.includes(kw));
}

export function getProcessedData(): ProcessedData {
  const dir = path.join(process.cwd(), 'data', 'portable-power', 'processed');
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('-processed.json'))
    .sort()
    .reverse();

  if (files.length === 0) throw new Error('No processed data found');

  const raw = fs.readFileSync(path.join(dir, files[0]), 'utf-8');
  const data = JSON.parse(raw) as ProcessedData;

  // ポータブル電源以外の混入商品を除外し、上位10件を返す
  data.ranking = data.ranking
    .filter(isPortablePower)
    .slice(0, 10)
    .map((item, i) => ({ ...item, rank: i + 1 }));

  return data;
}
