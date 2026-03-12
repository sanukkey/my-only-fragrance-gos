"use client";

/**
 * useTodayGoal — 今日の一歩
 *
 * 「目標達成まであといくら」という無機質な表示ではなく、
 * 店長が見た瞬間に「今日、あとこれだけ頑張れば届く」と
 * ポジティブに確信できる数字を計算する。
 *
 * 核心の翻訳:  万円の不足  →  今日あと何人
 */

import { useMemo } from "react";
import type { TargetSet } from "../types/sales";

// ── 2026年3月12日（木）のシミュレーション定数 ───────────────
const STORE_OPEN_HOUR = 10;   // 開店 10:00
const STORE_CLOSE_HOUR = 20;  // 閉店 20:00（全店統一）
const TOTAL_OPERATING_HOURS = STORE_CLOSE_HOUR - STORE_OPEN_HOUR; // 10h

/** ダッシュボード確認時刻: 午後2時（1日の40%経過） */
const CURRENT_HOUR = 14;
const ELAPSED_RATIO = (CURRENT_HOUR - STORE_OPEN_HOUR) / TOTAL_OPERATING_HOURS; // 0.40
const REMAINING_HOURS = STORE_CLOSE_HOUR - CURRENT_HOUR;                        // 6h
const REMAINING_RATIO = REMAINING_HOURS / TOTAL_OPERATING_HOURS;                // 0.60

const MONTH_DAYS = 31; // 3月

// 今週の状況: 木曜日 = 月〜水（3日）+ 本日午後2時時点（0.4日）= 3.4日経過
const WEEK_ELAPSED_DAYS = 3 + ELAPSED_RATIO; // 3.4
const WEEK_REMAINING_DAYS = 7 - WEEK_ELAPSED_DAYS; // 3.6

/** 充足率97%以上で「満枠」と判定 */
const FULLY_BOOKED_THRESHOLD = 97;

// ── 型定義 ────────────────────────────────────────────────────

export type TodayGoalMode =
  /** ペース通り。このペースで自然に目標に届く（salesWoW ≥ 1.0） */
  | "excellent"
  /** ペースが遅れている。今日の後半で取り戻せる（最多ケース） */
  | "customers_today"
  /** 満枠で物理的に客数を増やせない。客単価アップが唯一のレバー */
  | "avg_order_up";

/** urgencyLevel: 残り必要人数 ÷ 残り受入可能枠の比率から算出 */
export type UrgencyLevel =
  | "smooth"   // ≤ 0.75: 余裕あり
  | "normal"   // 0.75〜0.90: 通常ペース
  | "tight"    // 0.90〜1.05: ギリギリ
  | "stretch"; // > 1.05: 少し頑張りが必要

export type StoreTodayGoal = {
  storeId: string;
  storeName: string;
  mode: TodayGoalMode;
  urgencyLevel: UrgencyLevel;
  // ── 今日の客数 ───────────────────────────────────────────
  /** 今日の目標来客数（月次目標 ÷ 客単価 ÷ 31日） */
  dailyTargetCustomers: number;
  /** 午後2時時点での来店済み客数（推定） */
  customersServedToday: number;
  /** 今日の閉店までに必要な残り客数 */
  customersNeededToday: number;
  /** 今日の進捗率（%）。100超 = 目標超過ペース */
  todayProgressPct: number;
  /** 残り時間帯の推定受入可能枠数 */
  estimatedRemainingCapacity: number;
  // ── 客単価アップモード ───────────────────────────────────
  /** 目標達成に必要な客単価アップ額（円） */
  avgOrderGapYen: number;
  /** 目標客単価（円） */
  targetAvgOrder: number;
  currentAvgOrder: number;
  // ── 今週のコンテキスト（サブテキストに使用） ──────────────
  /** 今週の残り必要来客数（週全体のペース回復に必要な人数） */
  weeklyCustomersNeeded: number;
  /** 週ペースの回復が今週中に可能かどうか */
  isWeeklyRecoveryFeasible: boolean;
  // ── メタ ────────────────────────────────────────────────
  isFullyBooked: boolean;
  remainingHours: number;
  /** 残り必要客数 ÷ 残り受入可能枠 */
  urgencyRatio: number;
};

// ── 入力型 ────────────────────────────────────────────────────
type StoreInput = {
  id: string;
  name: string;
  sales: number;
  avgOrder: number;
  fillRate: number;
  salesWoW: number;
};

// ── フック本体 ─────────────────────────────────────────────────
export function useTodayGoal(
  stores: StoreInput[],
  targets: TargetSet
): StoreTodayGoal[] {
  return useMemo(() => {
    return stores.map((store) => {
      const salesTargetMan =
        targets.storeTargets.find((t) => t.storeId === store.id)
          ?.monthlySalesTarget ?? store.sales;

      // ── 1日あたりの目標来客数 ──
      const dailySalesYen = (salesTargetMan * 10000) / MONTH_DAYS;
      const dailyTargetCustomers = Math.ceil(dailySalesYen / store.avgOrder);

      // ── 今日の午後2時時点での来店済み（salesWoW = 現在ペース係数） ──
      const customersServedToday = Math.round(
        dailyTargetCustomers * ELAPSED_RATIO * store.salesWoW
      );

      // ── 閉店までに必要な残り客数 ──
      const customersNeededToday = Math.max(
        0,
        dailyTargetCustomers - customersServedToday
      );

      // ── 今日の進捗率 ──
      const todayProgressPct = Math.min(
        100,
        (customersServedToday / Math.max(1, dailyTargetCustomers)) * 100
      );

      // ── 残り受入可能枠（充足率から逆算した日次総枠 × 残り時間比率） ──
      const totalDailyCapacity = Math.round(
        dailyTargetCustomers / Math.max(0.5, store.fillRate / 100)
      );
      const estimatedRemainingCapacity = Math.max(
        1,
        Math.round(totalDailyCapacity * REMAINING_RATIO)
      );

      // ── 満枠判定 ──
      const isFullyBooked = store.fillRate >= FULLY_BOOKED_THRESHOLD;

      // ── urgencyRatio: 今日の「タイト感」を0〜1+で表す ──
      const urgencyRatio = customersNeededToday / estimatedRemainingCapacity;
      const urgencyLevel: UrgencyLevel =
        urgencyRatio <= 0.75 ? "smooth"
        : urgencyRatio <= 0.90 ? "normal"
        : urgencyRatio <= 1.05 ? "tight"
        : "stretch";

      // ── 今週のコンテキスト ──
      const weeklyTarget = dailyTargetCustomers * 7;
      const weeklyServedSoFar = Math.round(
        dailyTargetCustomers * WEEK_ELAPSED_DAYS * store.salesWoW
      );
      const weeklyCustomersNeeded = Math.max(0, weeklyTarget - weeklyServedSoFar);
      // 今週残り3.6日で取り戻せるか（1日あたり許容増加は+20%まで）
      const isWeeklyRecoveryFeasible =
        weeklyCustomersNeeded <= dailyTargetCustomers * WEEK_REMAINING_DAYS * 1.2;

      // ── 客単価アップ額の計算（avg_order_up モード用） ──
      const alreadySalesYen = customersServedToday * store.avgOrder;
      const remainingSalesNeededYen = Math.max(0, dailySalesYen - alreadySalesYen);
      const targetAvgOrder =
        estimatedRemainingCapacity > 0
          ? Math.ceil(remainingSalesNeededYen / estimatedRemainingCapacity)
          : store.avgOrder;
      const avgOrderGapYen = Math.max(0, targetAvgOrder - store.avgOrder);

      // ── モード判定 ──
      // 「excellent」= salesWoW ≥ 1.0 かつ今日の目標が残り枠内で自然に達成できる
      // 「avg_order_up」= 満枠（97%+）かつ客数を増やせない状況
      // 「customers_today」= ペース遅れ、今日の後半で取り戻す
      let mode: TodayGoalMode;
      if (store.salesWoW >= 1.0 && urgencyRatio <= 1.1) {
        mode = "excellent";
      } else if (isFullyBooked && urgencyRatio > 1.1) {
        mode = "avg_order_up";
      } else {
        mode = "customers_today";
      }

      return {
        storeId: store.id,
        storeName: store.name,
        mode,
        urgencyLevel,
        dailyTargetCustomers,
        customersServedToday,
        customersNeededToday,
        todayProgressPct,
        estimatedRemainingCapacity,
        avgOrderGapYen,
        targetAvgOrder,
        currentAvgOrder: store.avgOrder,
        weeklyCustomersNeeded,
        isWeeklyRecoveryFeasible,
        isFullyBooked,
        remainingHours: REMAINING_HOURS,
        urgencyRatio,
      };
    });
  }, [stores, targets]);
}
