/**
 * MY ONLY FRAGRANCE G-OS — 目標デフォルト値
 * Dashboard の BASE_STORES と同じ構成比でスケールした初期目標値。
 * 管理者が Edit Mode で上書き可能。localStorage に永続化される。
 */

import {
  TARGET_TOTAL_SALES_MAN,
  TARGET_NET_PROFIT_MAN,
  HQ_TOTAL_EXPENSE_MAN,
  ADVERTISING_EXPENSE_MAN,
} from "./financeConstants";
import type { TargetSet } from "../types/sales";

/**
 * 月次売上目標（立地・商圏規模による傾斜配分）
 * 400〜1,800万・200万刻み。合計 13,600万 → SCALE≈0.9926 で ≈13,500万に正規化。
 */
const BASE_STORE_PROPORTIONS: { storeId: string; baseSales: number }[] = [
  { storeId: "kyoto-teramachi",    baseSales: 1800 }, // 旗艦・京都中心部
  { storeId: "tokyo-harajuku",     baseSales: 1800 }, // 東京プレミアム
  { storeId: "kyoto-kiyomizu",     baseSales: 1400 }, // インバウンド観光地
  { storeId: "nagoya-sakae",       baseSales: 1200 }, // 東海圏主要商圏
  { storeId: "umeda",              baseSales: 1200 }, // 大阪・阪急沿線
  { storeId: "tokyo-soramachi",    baseSales: 1000 }, // 東京東部・スカイツリー
  { storeId: "yokohama",           baseSales: 1000 }, // 横浜・みなとみらい
  { storeId: "kyoto-kawaramachi",  baseSales: 1000 }, // 京都繁華街
  { storeId: "chiba-narita",       baseSales:  800 }, // 空港免税特需
  { storeId: "hakata",             baseSales:  600 }, // 九州旗艦・成長途上
  { storeId: "kyoto-sannenzaka",   baseSales:  600 }, // 京都観光路地
  { storeId: "kyoto-shinkyogoku",  baseSales:  600 }, // 京都繁華街・小型
  { storeId: "takayama",           baseSales:  400 }, // 地方観光・季節変動大
  { storeId: "kanazawa",           baseSales:  400 }, // 地方・開業1年未満
];

const BASE_TOTAL = BASE_STORE_PROPORTIONS.reduce((a, s) => a + s.baseSales, 0);
const SCALE = TARGET_TOTAL_SALES_MAN / BASE_TOTAL;

/**
 * デフォルト全社月次利益目標（万円）
 * = 店舗営業利益目標 ≈ Real Net Profit目標 + 本部経費 + 広告費
 */
const MONTHLY_PROFIT_TARGET_MAN =
  TARGET_NET_PROFIT_MAN + HQ_TOTAL_EXPENSE_MAN + ADVERTISING_EXPENSE_MAN;

/** G-OS のデフォルト目標セット */
export const DEFAULT_TARGET_SET: TargetSet = {
  storeTargets: BASE_STORE_PROPORTIONS.map((s) => ({
    storeId: s.storeId,
    monthlySalesTarget: Math.round(s.baseSales * SCALE),
  })),
  annualTarget: {
    /** 年間売上目標 = 月次目標 × 12 */
    annualSalesTarget: TARGET_TOTAL_SALES_MAN * 12,
    /** 年間利益目標 = 月次利益目標 × 12 */
    annualProfitTarget: MONTHLY_PROFIT_TARGET_MAN * 12,
  },
};

/** localStorage のキー */
export const TARGETS_STORAGE_KEY = "gos-targets-v1";
