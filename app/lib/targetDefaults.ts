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

/** BASE_STORES と同じ店舗・構成比でスケール */
const BASE_STORE_PROPORTIONS: { storeId: string; baseSales: number }[] = [
  { storeId: "kyoto-teramachi",    baseSales: 2000 },
  { storeId: "kyoto-kiyomizu",     baseSales: 1500 },
  { storeId: "nagoya-sakae",       baseSales: 1000 },
  { storeId: "tokyo-harajuku",     baseSales:  950 },
  { storeId: "kyoto-kawaramachi",  baseSales:  950 },
  { storeId: "tokyo-soramachi",    baseSales:  900 },
  { storeId: "kyoto-sannenzaka",   baseSales:  900 },
  { storeId: "chiba-narita",       baseSales:  850 },
  { storeId: "yokohama",           baseSales:  800 },
  { storeId: "umeda",              baseSales:  800 },
  { storeId: "hakata",             baseSales:  800 },
  { storeId: "takayama",           baseSales:  750 },
  { storeId: "kyoto-shinkyogoku",  baseSales:  700 },
  { storeId: "kanazawa",           baseSales:  650 },
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
