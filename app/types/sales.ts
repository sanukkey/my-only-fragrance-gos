/**
 * MY ONLY FRAGRANCE G-OS — 目標管理型定義
 * 店舗別月次目標・全社年間目標・達成率計算を一元管理。
 */

/** 店舗の月次売上目標 */
export type StoreMonthlyTarget = {
  storeId: string;
  /** 月次売上目標（万円） */
  monthlySalesTarget: number;
};

/** 全社年間目標 */
export type AnnualCorporateTarget = {
  /** 年間売上目標（万円） */
  annualSalesTarget: number;
  /** 年間利益目標（万円）— Real Net Profit ベース */
  annualProfitTarget: number;
};

/** 目標セット（期単位） */
export type TargetSet = {
  storeTargets: StoreMonthlyTarget[];
  annualTarget: AnnualCorporateTarget;
};

/** 達成率計算結果 */
export type AchievementResult = {
  actual: number;
  target: number;
  /** 達成率（%）。小数第1位まで */
  achievementRate: number;
  /** 100% 以上で true */
  isOnTrack: boolean;
};

/** 達成率を計算する純粋関数 */
export function calcAchievementRate(actual: number, target: number): AchievementResult {
  const achievementRate =
    target > 0 ? Math.round((actual / target) * 1000) / 10 : 0;
  return { actual, target, achievementRate, isOnTrack: achievementRate >= 100 };
}

/** 達成率に応じたカラークラス（Tailwind） */
export function achievementBarClass(rate: number): string {
  if (rate >= 100) return "bg-emerald-500";
  if (rate >= 80) return "bg-amber-400";
  return "bg-rose-400";
}

export function achievementTextClass(rate: number): string {
  if (rate >= 100) return "text-emerald-600";
  if (rate >= 80) return "text-amber-600";
  return "text-rose-600";
}
