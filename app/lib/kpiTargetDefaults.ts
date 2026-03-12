/**
 * MY ONLY FRAGRANCE G-OS — 4KPI月次目標デフォルト値
 * 客単価・予約充足率・リピート意向率の3KPIを店舗ごとに管理。
 * 目標値は実績の約95%で設定（適切なストレッチ水準で達成率100%超を意図）。
 */

import type { StoreKpiTargets } from "../types/sales";

/**
 * 14店舗の4KPIデフォルト目標値。
 * avgOrderTarget  ≈ 実績 × 95%（客単価）
 * fillRateTarget  ≈ 実績 − 5pt（予約充足率）
 * repeatRateTarget ≈ 実績 − 4pt（リピート意向率）
 */
export const DEFAULT_KPI_TARGETS: StoreKpiTargets[] = [
  { storeId: "kyoto-teramachi",   avgOrderTarget: 19200, fillRateTarget: 92, repeatRateTarget: 84 },
  { storeId: "kyoto-kiyomizu",    avgOrderTarget: 18800, fillRateTarget: 91, repeatRateTarget: 82 },
  { storeId: "nagoya-sakae",      avgOrderTarget: 19500, fillRateTarget: 92, repeatRateTarget: 83 },
  { storeId: "tokyo-harajuku",    avgOrderTarget: 20200, fillRateTarget: 90, repeatRateTarget: 80 },
  { storeId: "kyoto-kawaramachi", avgOrderTarget: 18200, fillRateTarget: 89, repeatRateTarget: 80 },
  { storeId: "tokyo-soramachi",   avgOrderTarget: 18500, fillRateTarget: 88, repeatRateTarget: 76 },
  { storeId: "kyoto-sannenzaka",  avgOrderTarget: 17800, fillRateTarget: 87, repeatRateTarget: 76 },
  { storeId: "chiba-narita",      avgOrderTarget: 15700, fillRateTarget: 83, repeatRateTarget: 71 },
  { storeId: "yokohama",          avgOrderTarget: 17800, fillRateTarget: 86, repeatRateTarget: 74 },
  { storeId: "umeda",             avgOrderTarget: 18800, fillRateTarget: 87, repeatRateTarget: 73 },
  { storeId: "hakata",            avgOrderTarget: 17300, fillRateTarget: 84, repeatRateTarget: 70 },
  { storeId: "takayama",          avgOrderTarget: 16600, fillRateTarget: 80, repeatRateTarget: 68 },
  { storeId: "kyoto-shinkyogoku", avgOrderTarget: 16900, fillRateTarget: 85, repeatRateTarget: 72 },
  { storeId: "kanazawa",          avgOrderTarget: 18200, fillRateTarget: 81, repeatRateTarget: 67 },
];

/** localStorage のキー */
export const KPI_TARGETS_STORAGE_KEY = "gos-kpi-targets-v1";
