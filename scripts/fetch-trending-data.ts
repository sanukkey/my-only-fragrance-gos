/**
 * fetch-trending-data.ts
 * 楽天商品検索APIからポータブル電源の売れ筋データを取得し、
 * data/portable-power/raw/ にJSON保存するスクリプト。
 */

import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

config({ path: path.resolve(process.cwd(), '.env.local') });

const APP_ID     = process.env.RAKUTEN_APP_ID;
const ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY;
const AFFILIATE_ID = process.env.RAKUTEN_AFFILIATE_ID ?? '';

if (!APP_ID)     { console.error('❌ RAKUTEN_APP_ID が未設定');     process.exit(1); }
if (!ACCESS_KEY) { console.error('❌ RAKUTEN_ACCESS_KEY が未設定'); process.exit(1); }

// ---- 型定義 ----
export interface RakutenRawItem {
  source: 'rakuten';
  itemName: string;
  itemPrice: number;
  itemUrl: string;
  affiliateUrl: string;
  imageUrl: string;
  smallImageUrl: string;
  reviewAverage: number;
  reviewCount: number;
  itemCaption: string;
  shopName: string;
  shopCode: string;
  genreId: string;
  tagIds: number[];
  pointRate: number;
  postageFlag: number;
  rank: number;
}

export interface RawFetchResult {
  fetchedAt: string;
  keyword: string;
  totalCount: number;
  pages: number;
  isMockData: false;
  items: RakutenRawItem[];
}

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchRakutenPage(
  keyword: string,
  page: number,
  retryCount = 0
): Promise<{ items: RakutenRawItem[]; hasMore: boolean }> {
  const params = new URLSearchParams({
    applicationId: APP_ID!,
    accessKey:     ACCESS_KEY!,
    affiliateId:   AFFILIATE_ID,
    keyword,
    hits:          '30',
    page:          String(page),
    sort:          '-reviewCount',
    formatVersion: '2',
    imageFlag:     '1',
    field:         '0',
  });

  const url = `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260401?${params}`;

  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  } catch (e) {
    if (retryCount < 2) {
      console.warn(`  ⚠️  接続エラー (page ${page})、3秒後リトライ...`);
      await wait(3000);
      return fetchRakutenPage(keyword, page, retryCount + 1);
    }
    throw new Error(`楽天API接続失敗 (page ${page}): ${e}`);
  }

  if (res.status === 429) {
    console.warn(`  ⚠️  レートリミット (page ${page})、5秒後リトライ...`);
    await wait(5000);
    return fetchRakutenPage(keyword, page, retryCount + 1);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`楽天API エラー ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json() as Record<string, unknown>;
  if (!data.Items || (data.Items as unknown[]).length === 0) {
    return { items: [], hasMore: false };
  }

  const rawItems = data.Items as Record<string, unknown>[];
  const baseRank = (page - 1) * 30;

  const items: RakutenRawItem[] = rawItems.map((item, i) => {
    const mediumImages = item.mediumImageUrls as Array<{ imageUrl: string }> | undefined;
    const smallImages  = item.smallImageUrls  as Array<{ imageUrl: string }> | undefined;
    return {
      source:        'rakuten' as const,
      itemName:      String(item.itemName ?? ''),
      itemPrice:     Number(item.itemPrice ?? 0),
      itemUrl:       String(item.itemUrl ?? ''),
      affiliateUrl:  String(item.affiliateUrl ?? item.itemUrl ?? ''),
      imageUrl:      mediumImages?.[0]?.imageUrl ?? '',
      smallImageUrl: smallImages?.[0]?.imageUrl  ?? '',
      reviewAverage: Number(item.reviewAverage ?? 0),
      reviewCount:   Number(item.reviewCount   ?? 0),
      itemCaption:   String(item.itemCaption   ?? '').slice(0, 1000),
      shopName:      String(item.shopName      ?? ''),
      shopCode:      String(item.shopCode      ?? ''),
      genreId:       String(item.genreId       ?? ''),
      tagIds:        (item.tagIds as number[]) ?? [],
      pointRate:     Number(item.pointRate     ?? 1),
      postageFlag:   Number(item.postageFlag   ?? 0),
      rank:          baseRank + i + 1,
    };
  });

  const pageCount = Number((data as Record<string, unknown>).pageCount ?? 1);
  return { items, hasMore: page < pageCount && page < 3 };
}

async function main() {
  const keyword  = 'ポータブル電源';
  const allItems: RakutenRawItem[] = [];
  let page = 1;

  console.log('=========================================');
  console.log('  楽天 本番データ取得');
  console.log(`  キーワード: ${keyword}`);
  console.log('=========================================');

  while (true) {
    console.log(`\n  [page ${page}/3] 取得中...`);
    const { items, hasMore } = await fetchRakutenPage(keyword, page);
    if (items.length === 0) { console.log('  → 結果なし。終了。'); break; }
    allItems.push(...items);
    console.log(`  → ${items.length}件取得 (累計: ${allItems.length}件)`);
    if (!hasMore) break;
    page++;
    console.log('  (1.2秒待機中...)');
    await wait(1200);
  }

  const seen  = new Set<string>();
  const unique = allItems.filter(item => {
    if (seen.has(item.itemUrl)) return false;
    seen.add(item.itemUrl);
    return true;
  });

  const result: RawFetchResult = {
    fetchedAt:  new Date().toISOString(),
    keyword,
    totalCount: unique.length,
    pages:      page,
    isMockData: false,
    items:      unique,
  };

  const today      = new Date().toISOString().split('T')[0];
  const outputPath = path.join(process.cwd(), 'data', 'portable-power', 'raw', `${today}_portable-power-raw.json`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');

  // レビュー数最多商品
  const topReview = [...unique].sort((a, b) => b.reviewCount - a.reviewCount)[0];

  console.log('\n=========================================');
  console.log(`✅ 保存完了: ${outputPath}`);
  console.log(`   取得件数: ${unique.length}件`);
  console.log(`   isMockData: false`);
  console.log(`\n  ─ レビュー数最多 ─`);
  console.log(`  タイトル: ${topReview.itemName}`);
  console.log(`  価格: ¥${topReview.itemPrice.toLocaleString()}`);
  console.log(`  レビュー数: ${topReview.reviewCount.toLocaleString()}件 ★${topReview.reviewAverage}`);
  console.log('=========================================');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
