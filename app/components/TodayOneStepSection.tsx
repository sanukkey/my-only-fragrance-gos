"use client";

/**
 * TodayOneStepSection — 今日の一歩
 *
 * 数字はスタッフを縛るための鎖ではない。
 * 現場のプロが「今日、あとこれだけ頑張れば届く」と
 * ポジティブに確信できる「光」として機能させる。
 *
 * 核心の翻訳:
 *   「今月196万不足」→「今日あと9名ご案内で挽回できます」
 */

import { Clock, Sparkles, TrendingUp, Users } from "lucide-react";
import {
  useTodayGoal,
  type StoreTodayGoal,
  type TodayGoalMode,
  type UrgencyLevel,
} from "../hooks/useTodayGoal";
import type { TargetSet } from "../types/sales";

type StoreInput = {
  id: string;
  name: string;
  sales: number;
  avgOrder: number;
  fillRate: number;
  salesWoW: number;
};

type Props = {
  stores: StoreInput[];
  targets: TargetSet;
};

// ── カードの見た目をモード×緊急度で決定 ─────────────────────────

function cardStyle(mode: TodayGoalMode, urgencyLevel: UrgencyLevel): string {
  if (mode === "excellent") {
    return "bg-gradient-to-br from-champagne/30 to-cream border-champagne/60";
  }
  if (mode === "avg_order_up") {
    return "bg-gradient-to-br from-sky-50/90 to-cream border-sky-200/70";
  }
  // customers_today: urgency に応じてトーンを変える
  switch (urgencyLevel) {
    case "smooth":
    case "normal":
      return "bg-cream/95 border-champagneLight/60";
    case "tight":
      return "bg-amber-50/80 border-amber-200/60";
    case "stretch":
      return "bg-rose-50/70 border-rose-200/60";
  }
}

function badgeConfig(mode: TodayGoalMode, urgencyLevel: UrgencyLevel) {
  if (mode === "excellent") {
    return {
      label: "✦ ペース通り",
      className: "bg-champagne/30 text-champagne border border-champagne/50",
    };
  }
  if (mode === "avg_order_up") {
    return {
      label: "◆ 満枠",
      className: "bg-sky-100 text-sky-800",
    };
  }
  switch (urgencyLevel) {
    case "smooth":
    case "normal":
      return {
        label: "● 今日の一歩",
        className: "bg-warmInk/10 text-warmInk",
      };
    case "tight":
      return {
        label: "⚡ 取り戻そう",
        className: "bg-amber-100 text-amber-800",
      };
    case "stretch":
      return {
        label: "🔥 今日が勝負",
        className: "bg-rose-100 text-rose-800",
      };
  }
}

function progressBarColor(mode: TodayGoalMode, urgencyLevel: UrgencyLevel): string {
  if (mode === "excellent") return "bg-champagne";
  if (mode === "avg_order_up") return "bg-sky-400";
  switch (urgencyLevel) {
    case "smooth":
    case "normal":
      return "bg-champagne";
    case "tight":
      return "bg-amber-400";
    case "stretch":
      return "bg-rose-400";
  }
}

/**
 * 各モード×urgencyLevel に応じた「光のメッセージ」を返す。
 * 数字の後に続くサブテキスト——ここが「魂」。
 */
function subMessage(goal: StoreTodayGoal): string {
  if (goal.mode === "excellent") {
    if (goal.urgencyLevel === "smooth") {
      return "のペース。余裕を持って今日の理想に届きます";
    }
    return "ご案内で、このペースなら自然に今日の目標に届きます";
  }
  if (goal.mode === "avg_order_up") {
    return `上げることで今日の目標に届きます。満枠の力を収益に変えましょう`;
  }
  // customers_today
  switch (goal.urgencyLevel) {
    case "smooth":
      return "名ご案内でペース回復。余裕があります";
    case "normal":
      return "名ご案内でペースに追いつけます！";
    case "tight":
      return "名ご案内で今日を取り戻せます。後半に集中を";
    case "stretch":
      return "名、チームの力で今日を逆転しましょう";
  }
}

// ── 個別店舗カード ────────────────────────────────────────────

function StoreGoalCard({ goal }: { goal: StoreTodayGoal }) {
  const badge = badgeConfig(goal.mode, goal.urgencyLevel);
  const barColor = progressBarColor(goal.mode, goal.urgencyLevel);
  const card = cardStyle(goal.mode, goal.urgencyLevel);

  return (
    <div
      className={`rounded-2xl p-5 border card-shadow transition-silent flex flex-col ${card}`}
    >
      {/* ── 店舗名 + バッジ ── */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-sans text-sm font-semibold text-warmInk leading-snug">
          {goal.storeName}
        </h3>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      {/* ── メインコンテンツ（モード別） ── */}
      <div className="flex-1 flex flex-col justify-center">

        {/* ━ customers_today ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {goal.mode === "customers_today" && (
          <div className="text-center py-2">
            <p className="font-sans text-[11px] text-warmMuted mb-0.5">あと</p>
            <p className="font-sans font-bold text-warmInk tabular-nums leading-none"
               style={{ fontSize: "clamp(2.5rem, 6vw, 3.75rem)" }}>
              {goal.customersNeededToday}
            </p>
            <p className="font-sans text-sm text-warmMuted mt-1.5 leading-snug px-1">
              {subMessage(goal)}
            </p>
          </div>
        )}

        {/* ━ excellent ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {goal.mode === "excellent" && (
          <div className="text-center py-2">
            <p className="font-sans text-[11px] text-warmMuted mb-0.5">あと</p>
            <p className="font-sans font-bold text-champagne tabular-nums leading-none"
               style={{ fontSize: "clamp(2.5rem, 6vw, 3.75rem)" }}>
              {goal.customersNeededToday}
            </p>
            <p className="font-sans text-sm text-warmMuted mt-1.5 leading-snug px-1">
              {subMessage(goal)}
            </p>
          </div>
        )}

        {/* ━ avg_order_up ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {goal.mode === "avg_order_up" && (
          <div className="text-center py-2">
            <p className="font-sans text-[11px] text-warmMuted mb-0.5">客単価をあと</p>
            <p className="font-sans font-bold text-sky-700 tabular-nums leading-none"
               style={{ fontSize: "clamp(1.75rem, 5vw, 2.5rem)" }}>
              +¥{goal.avgOrderGapYen.toLocaleString("ja-JP")}
            </p>
            <p className="font-sans text-sm text-warmMuted mt-1.5 leading-snug px-1">
              {subMessage(goal)}
            </p>
            <p className="font-sans text-[10px] text-warmMuted/80 mt-2">
              現在 {goal.currentAvgOrder.toLocaleString("ja-JP")}円 →{" "}
              目標 {goal.targetAvgOrder.toLocaleString("ja-JP")}円
            </p>
          </div>
        )}

      </div>

      {/* ── 今日の進捗バー ── */}
      <div className="mt-3 space-y-1">
        <div className="flex justify-between items-center font-sans text-[10px] text-warmMuted">
          <span>達成済み {goal.customersServedToday}名</span>
          <span>目標 {goal.dailyTargetCustomers}名/日</span>
        </div>
        <div className="h-1.5 bg-champagneLight/40 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${goal.todayProgressPct}%` }}
          />
        </div>
      </div>

      {/* ── フッター: 残り時間 + 今週のコンテキスト ── */}
      <div className="mt-2.5 space-y-0.5">
        <p className="font-sans text-[9px] text-warmMuted/70 flex items-center gap-1">
          <Clock size={9} className="flex-shrink-0" />
          残り {goal.remainingHours}時間 · 推定受入可能 約{goal.estimatedRemainingCapacity}名
        </p>
        {goal.mode !== "excellent" && goal.weeklyCustomersNeeded > 0 && (
          <p className="font-sans text-[9px] text-warmMuted/70">
            今週あと{goal.weeklyCustomersNeeded}名で週ペース回復
            {goal.isWeeklyRecoveryFeasible ? "（今週中に十分取り戻せます）" : ""}
          </p>
        )}
        {goal.mode === "excellent" && (
          <p className="font-sans text-[9px] text-champagne/80">
            今週ペース 順調 — この調子を維持しましょう
          </p>
        )}
      </div>
    </div>
  );
}

// ── セクション全体 ────────────────────────────────────────────

export default function TodayOneStepSection({ stores, targets }: Props) {
  const todayGoals = useTodayGoal(stores, targets);

  // 全社サマリー集計
  const excellentCount = todayGoals.filter((g) => g.mode === "excellent").length;
  const needsAttentionCount = todayGoals.filter(
    (g) => g.mode === "customers_today" || g.mode === "avg_order_up"
  ).length;
  const totalNeededToday = todayGoals.reduce(
    (a, g) => a + g.customersNeededToday,
    0
  );
  const totalServedToday = todayGoals.reduce(
    (a, g) => a + g.customersServedToday,
    0
  );
  const totalDailyTarget = todayGoals.reduce(
    (a, g) => a + g.dailyTargetCustomers,
    0
  );
  const companyProgressPct = Math.round((totalServedToday / Math.max(1, totalDailyTarget)) * 100);

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className="bg-warmInk rounded-2xl border border-champagne/20 card-shadow overflow-hidden">

        {/* ── ヘッダー ─────────────────────────────────────────── */}
        <div className="p-6 md:p-8 border-b border-champagne/15">
          <div className="flex flex-wrap items-start justify-between gap-6">

            {/* 左: タイトル + 詩 */}
            <div>
              <h2 className="font-sans text-xl font-semibold text-champagneLight flex items-center gap-2">
                <Sparkles size={20} className="text-champagne" />
                今日の一歩
              </h2>
              <p className="font-sans text-sm text-cream/60 mt-1">
                2026年3月12日（木）· 現在 14:00 · 閉店まで6時間
              </p>
              <p className="font-sans text-base text-cream/90 mt-3 italic font-light leading-relaxed">
                今日、あと何人ご案内すれば、<br className="hidden sm:block" />
                私たちの理想に届くか。
              </p>
            </div>

            {/* 右: 全社今日のサマリー */}
            <div className="flex items-end gap-6 font-sans">
              <div className="text-right">
                <p
                  className="text-3xl font-bold tabular-nums"
                  style={{ color: "#C9A962" }}
                >
                  {excellentCount}
                </p>
                <p className="text-xs text-cream/50 mt-0.5">店舗 ペース通り</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold tabular-nums text-amber-400">
                  {needsAttentionCount}
                </p>
                <p className="text-xs text-cream/50 mt-0.5">店舗 加速が必要</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold tabular-nums text-cream">
                  {totalNeededToday}
                </p>
                <p className="text-xs text-cream/50 mt-0.5">名 全社残り</p>
              </div>
            </div>
          </div>

          {/* 全社今日の進捗バー */}
          <div className="mt-5">
            <div className="flex justify-between font-sans text-xs text-cream/50 mb-1.5">
              <span>全社 今日の来客 {totalServedToday}名 / 目標 {totalDailyTarget}名</span>
              <span className="text-champagne font-medium">{companyProgressPct}%</span>
            </div>
            <div className="h-2 bg-cream/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-champagne transition-all duration-700"
                style={{ width: `${companyProgressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── 14店舗カードグリッド ─────────────────────────────── */}
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {todayGoals.map((goal) => (
              <StoreGoalCard key={goal.storeId} goal={goal} />
            ))}
          </div>
        </div>

        {/* ── フッターノート ────────────────────────────────────── */}
        <div className="px-6 pb-5 border-t border-champagne/10 pt-4">
          <p className="font-sans text-[10px] text-cream/35 leading-relaxed">
            ※ 来店人数の推計は「月次目標（万円）÷ 客単価 ÷ 31日 × 経過時間比率（40%）× 前週比（salesWoW）」で算出。
            推定受入可能枠は「日次総枠 × 残り時間比率（60%）」。閉店20:00で統一計算。
            実際の数値はPOS・予約システムとの連携データに置き換えることで精度が向上します。
          </p>
        </div>

      </div>
    </div>
  );
}
