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

/** 達成率に応じたカラークラス（Tailwind）
 *  ≥100% → シャンパンゴールド（達成）
 *  80-99% → エメラルドグリーン（通常）
 *  <80%  → ローズレッド（要注意）
 */
export function achievementBarClass(rate: number): string {
  if (rate >= 100) return "bg-champagne";
  if (rate >= 80)  return "bg-emerald-500";
  return "bg-rose-500";
}

export function achievementTextClass(rate: number): string {
  if (rate >= 100) return "text-[#B8942A]";  // champagne-dark
  if (rate >= 80)  return "text-emerald-600";
  return "text-rose-600";
}

/** 店舗別4KPI月次目標（客単価・予約充足率・リピート意向率） */
export type StoreKpiTargets = {
  storeId: string;
  /** 客単価目標（円） */
  avgOrderTarget: number;
  /** 予約充足率目標（%） */
  fillRateTarget: number;
  /** リピート意向率目標（%） */
  repeatRateTarget: number;
};

/** 達成ステータスラベル */
export type GoalStatus = "excellent" | "on_track" | "growth_opportunity";

/** 達成率からステータスを返す */
export function getGoalStatus(rate: number): GoalStatus {
  if (rate >= 100) return "excellent";
  if (rate >= 90) return "on_track";
  return "growth_opportunity";
}

/** ステータスのラベル文字列 */
export function getGoalStatusLabel(status: GoalStatus): string {
  switch (status) {
    case "excellent": return "Excellent System Implementation";
    case "on_track": return "On Track";
    case "growth_opportunity": return "Growth Opportunity";
  }
}

/** ステータスのTailwindバッジクラス */
export function getGoalStatusBadgeClass(status: GoalStatus): string {
  switch (status) {
    case "excellent":          return "bg-[#FDF6E3] text-[#B8942A] border border-[#C9A962]/60";  // gold
    case "on_track":           return "bg-emerald-50 text-emerald-800 border border-emerald-300"; // green
    case "growth_opportunity": return "bg-rose-50 text-rose-800 border border-rose-300";          // red
  }
}

/** 月中着地予想 */
export type MonthProjection = {
  /** 月末着地予想（万円） */
  projected: number;
  /** 不足金額（万円）。正 = 不足、負 = 超過 */
  shortfall: number;
};

/** 月中着地予想を計算する純粋関数 */
export function calcMonthProjection(
  accumulated: number,
  target: number,
  elapsedDays: number,
  totalDays: number
): MonthProjection {
  const daily = elapsedDays > 0 ? accumulated / elapsedDays : 0;
  const projected = Math.round(daily * totalDays);
  return { projected, shortfall: target - projected };
}
