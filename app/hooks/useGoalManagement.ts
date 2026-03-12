"use client";

/**
 * MY ONLY FRAGRANCE G-OS — useGoalManagement フック
 * 店舗別4KPI（売上・客単価・予約充足率・リピート意向率）の目標管理・
 * 月中着地予想・不足金額・達成ステータスをリアルタイム計算。
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import type {
  TargetSet,
  StoreKpiTargets,
  GoalStatus,
  MonthProjection,
} from "../types/sales";
import {
  calcAchievementRate,
  calcMonthProjection,
  getGoalStatus,
} from "../types/sales";
import { DEFAULT_KPI_TARGETS, KPI_TARGETS_STORAGE_KEY } from "../lib/kpiTargetDefaults";

// 現在日時: 2026年3月12日（ダッシュボードのデータ基準日）
const CURRENT_YEAR = 2026;
const CURRENT_MONTH = 3; // March
const CURRENT_DAY = 12;
/** 月の日数（3月 = 31日） */
const MONTH_TOTAL_DAYS = new Date(CURRENT_YEAR, CURRENT_MONTH, 0).getDate();

/** 店舗ごとの4KPI目標進捗メトリクス */
export type StoreGoalMetrics = {
  storeId: string;
  storeName: string;
  // ── 売上 KPI ──────────────────────────────
  /** 月初〜今日の累計売上（万円）。salesWoWペースで日割り計算。 */
  salesAccumulated: number;
  salesTarget: number;
  /** 着地予想ベースの達成率（%） */
  salesRate: number;
  salesProjection: MonthProjection;
  // ── 客単価 KPI ───────────────────────────
  avgOrderActual: number;
  avgOrderTarget: number;
  avgOrderRate: number;
  // ── 予約充足率 KPI ───────────────────────
  fillRateActual: number;
  fillRateTarget: number;
  fillRateRate: number;
  // ── リピート意向率 KPI ───────────────────
  repeatRateActual: number;
  repeatRateTarget: number;
  repeatRateRate: number;
  // ── 総合 ─────────────────────────────────
  /** 加重平均達成率（売上50%・客単価20%・充足率15%・リピート15%） */
  overallRate: number;
  status: GoalStatus;
};

type StoreInput = {
  id: string;
  name: string;
  sales: number;
  avgOrder: number;
  fillRate: number;
  repeatRate: number;
  salesWoW: number;
};

export type UseGoalManagementReturn = {
  storeGoalMetrics: StoreGoalMetrics[];
  kpiTargets: StoreKpiTargets[];
  updateKpiTarget: (
    storeId: string,
    field: keyof Omit<StoreKpiTargets, "storeId">,
    value: number
  ) => void;
  resetKpiTargets: () => void;
  elapsedDays: number;
  totalDays: number;
  elapsedRatio: number;
};

export function useGoalManagement(
  stores: StoreInput[],
  targets: TargetSet
): UseGoalManagementReturn {
  const [kpiTargets, setKpiTargets] = useState<StoreKpiTargets[]>(() => {
    if (typeof window === "undefined") return DEFAULT_KPI_TARGETS;
    try {
      const saved = localStorage.getItem(KPI_TARGETS_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as StoreKpiTargets[]) : DEFAULT_KPI_TARGETS;
    } catch {
      return DEFAULT_KPI_TARGETS;
    }
  });

  // localStorage への自動保存
  useEffect(() => {
    try {
      localStorage.setItem(KPI_TARGETS_STORAGE_KEY, JSON.stringify(kpiTargets));
    } catch {}
  }, [kpiTargets]);

  const elapsedDays = CURRENT_DAY;
  const totalDays = MONTH_TOTAL_DAYS;
  const elapsedRatio = elapsedDays / totalDays;

  const storeGoalMetrics = useMemo<StoreGoalMetrics[]>(() => {
    return stores.map((store) => {
      // 売上目標（TargetSetから）
      const salesTarget =
        targets.storeTargets.find((t) => t.storeId === store.id)
          ?.monthlySalesTarget ?? store.sales;

      // 4KPI拡張目標（kpiTargetsから）
      const kpt = kpiTargets.find((t) => t.storeId === store.id);
      const avgOrderTarget = kpt?.avgOrderTarget ?? Math.round(store.avgOrder * 0.95);
      const fillRateTarget = kpt?.fillRateTarget ?? Math.max(80, store.fillRate - 5);
      const repeatRateTarget = kpt?.repeatRateTarget ?? Math.max(65, store.repeatRate - 4);

      // 月中累計売上 = 月間売上 × 経過日数比率 × 現在ペース（salesWoW）
      const salesAccumulated = Math.round(store.sales * elapsedRatio * store.salesWoW);

      // 着地予想計算
      const salesProjection = calcMonthProjection(
        salesAccumulated,
        salesTarget,
        elapsedDays,
        totalDays
      );

      // 着地予想ベースの達成率
      const salesRate =
        salesTarget > 0 ? (salesProjection.projected / salesTarget) * 100 : 0;

      // 他3KPIの達成率（現時点の実績 vs 目標）
      const avgOrderRate = calcAchievementRate(store.avgOrder, avgOrderTarget).achievementRate;
      const fillRateRate = calcAchievementRate(store.fillRate, fillRateTarget).achievementRate;
      const repeatRateRate = calcAchievementRate(store.repeatRate, repeatRateTarget).achievementRate;

      // 総合達成率（加重平均: 売上50%・客単価20%・充足率15%・リピート15%）
      const overallRate =
        salesRate * 0.5 +
        avgOrderRate * 0.2 +
        fillRateRate * 0.15 +
        repeatRateRate * 0.15;

      return {
        storeId: store.id,
        storeName: store.name,
        salesAccumulated,
        salesTarget,
        salesRate,
        salesProjection,
        avgOrderActual: store.avgOrder,
        avgOrderTarget,
        avgOrderRate,
        fillRateActual: store.fillRate,
        fillRateTarget,
        fillRateRate,
        repeatRateActual: store.repeatRate,
        repeatRateTarget,
        repeatRateRate,
        overallRate,
        status: getGoalStatus(overallRate),
      };
    });
  }, [stores, targets, kpiTargets, elapsedDays, totalDays, elapsedRatio]);

  const updateKpiTarget = useCallback(
    (
      storeId: string,
      field: keyof Omit<StoreKpiTargets, "storeId">,
      value: number
    ) => {
      setKpiTargets((prev) =>
        prev.map((t) => (t.storeId === storeId ? { ...t, [field]: value } : t))
      );
    },
    []
  );

  const resetKpiTargets = useCallback(() => {
    setKpiTargets(DEFAULT_KPI_TARGETS);
  }, []);

  return {
    storeGoalMetrics,
    kpiTargets,
    updateKpiTarget,
    resetKpiTargets,
    elapsedDays,
    totalDays,
    elapsedRatio,
  };
}
