"use client";

/**
 * GoalManagementSection — 目標管理 & 月中着地予想セクション
 * 店舗別4KPI（売上・客単価・予約充足率・リピート意向率）の進捗を
 * Progress Ring で可視化。着地予想・不足金額・達成ステータスを自動表示。
 */

import { Target, PenLine, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import ProgressRing from "./ProgressRing";
import { useGoalManagement } from "../hooks/useGoalManagement";
import {
  achievementBarClass,
  achievementTextClass,
  getGoalStatusLabel,
  getGoalStatusBadgeClass,
} from "../types/sales";
import type { TargetSet, AnnualCorporateTarget } from "../types/sales";

type StoreInput = {
  id: string;
  name: string;
  sales: number;
  avgOrder: number;
  fillRate: number;
  repeatRate: number;
  salesWoW: number;
};

type Props = {
  editMode: boolean;
  targets: TargetSet;
  displaySales: number;
  displayGrossProfit: number;
  stores: StoreInput[];
  updateStoreTarget: (storeId: string, value: number) => void;
  updateAnnualTarget: (field: keyof AnnualCorporateTarget, value: number) => void;
  resetTargets: () => void;
};

export default function GoalManagementSection({
  editMode,
  targets,
  displaySales,
  displayGrossProfit,
  stores,
  updateStoreTarget,
  updateAnnualTarget,
  resetTargets,
}: Props) {
  const {
    storeGoalMetrics,
    updateKpiTarget,
    resetKpiTargets,
    elapsedDays,
    totalDays,
  } = useGoalManagement(stores, targets);

  const totalMonthlyTarget = targets.storeTargets.reduce(
    (a, t) => a + t.monthlySalesTarget,
    0
  );

  // 全社着地予想 = 14店舗の「salesWoW反映済み月末着地予想」の合算
  const corporateProjected = storeGoalMetrics.reduce(
    (a, m) => a + m.salesProjection.projected,
    0
  );
  const corporateShortfall = totalMonthlyTarget - corporateProjected;

  // 達成率 = 着地予想 ÷ 月次目標（displaySalesは月次目標と同値のため使わない）
  const monthlyRate =
    totalMonthlyTarget > 0 ? (corporateProjected / totalMonthlyTarget) * 100 : 0;

  // 年間ペース = 着地予想 × 12ヶ月
  const corporateAnnualPace = corporateProjected * 12;
  const annualSalesRate =
    targets.annualTarget.annualSalesTarget > 0
      ? (corporateAnnualPace / targets.annualTarget.annualSalesTarget) * 100
      : 0;

  // 年間利益ペース:
  // displayGrossProfit はグロス粗利（売上の77%）で、利益目標はネット純利益（約1,500万/月）。
  // 直接比較すると 300%+ になるため、「利益はセールスペースに比例する」前提で
  // 純利益目標÷月次売上目標 の比率（純利益率）で着地予想売上からスケール。
  const netMarginRatio =
    totalMonthlyTarget > 0
      ? (targets.annualTarget.annualProfitTarget / 12) / totalMonthlyTarget
      : 0;
  const corporateProjectedProfit = Math.round(corporateProjected * netMarginRatio);
  const annualProfitRate =
    targets.annualTarget.annualProfitTarget > 0
      ? ((corporateProjectedProfit * 12) / targets.annualTarget.annualProfitTarget) * 100
      : 0;

  const elapsedPct = Math.round((elapsedDays / totalDays) * 100);

  return (
    <div className="bg-cream rounded-2xl border border-champagneLight/50 card-shadow overflow-hidden">

      {/* ── ヘッダー ──────────────────────────────────────────── */}
      <div className="p-4 md:p-6 border-b border-champagneLight/50 bg-champagneLight/10">
        <h2 className="font-sans text-xl font-semibold text-warmInk flex items-center gap-2">
          <Target size={22} className="text-champagne" />
          目標管理 & 月中着地予想
        </h2>
        <p className="font-sans text-sm text-warmMuted mt-1">
          2026年3月 — {elapsedDays}日経過 / {totalDays}日（月中進捗{" "}
          <span className="font-medium text-warmInk">{elapsedPct}%</span>）
        </p>
        <p className="font-sans text-xs text-warmMuted/80 mt-0.5">
          売上・客単価・予約充足率・リピート意向率の4KPIをセットで管理。Progress Ringで一目でわかります。
        </p>
        {editMode && (
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-champagne bg-champagneLight/40 px-3 py-1.5 rounded-lg border border-champagne/30">
              <PenLine size={12} />
              目標値を直接入力して更新できます
            </span>
            <button
              type="button"
              onClick={() => {
                resetTargets();
                resetKpiTargets();
              }}
              className="inline-flex items-center gap-1.5 font-sans text-xs text-warmMuted hover:text-warmInk border border-champagneLight/60 px-3 py-1.5 rounded-lg hover:bg-champagneLight/30 transition-silent"
            >
              <RefreshCw size={12} />
              デフォルトに戻す
            </button>
          </div>
        )}
      </div>

      {/* ── 全社月次 着地予想サマリー ──────────────────────────── */}
      <div className="p-4 md:p-6 border-b border-champagneLight/30 bg-champagneLight/5">
        <h3 className="font-sans text-sm font-semibold text-warmMuted uppercase tracking-wider mb-4">
          全社月次 着地予想サマリー
        </h3>
        <div className="flex flex-wrap items-end gap-5 mb-3">
          <div>
            <p className="font-sans text-xs text-warmMuted">月次目標（全店合計）</p>
            <p className="font-sans text-2xl font-bold text-warmInk tabular-nums mt-0.5">
              {totalMonthlyTarget.toLocaleString("ja-JP")} 万円
            </p>
          </div>
          <span className="font-sans text-warmMuted text-lg mb-1">vs</span>
          <div>
            <p className="font-sans text-xs text-warmMuted">月末着地予想</p>
            <p
              className={`font-sans text-2xl font-bold tabular-nums mt-0.5 ${
                corporateProjected >= totalMonthlyTarget
                  ? "text-emerald-600"
                  : "text-rose-600"
              }`}
            >
              {corporateProjected.toLocaleString("ja-JP")} 万円
            </p>
          </div>
          <div>
            <p className="font-sans text-xs text-warmMuted">
              {corporateShortfall > 0 ? "不足金額" : "超過金額"}
            </p>
            <p
              className={`font-sans text-xl font-semibold tabular-nums mt-0.5 flex items-center gap-1 ${
                corporateShortfall <= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {corporateShortfall > 0 ? (
                <>
                  <TrendingDown size={18} /> ▼{" "}
                  {corporateShortfall.toLocaleString("ja-JP")} 万円
                </>
              ) : (
                <>
                  <TrendingUp size={18} /> +
                  {Math.abs(corporateShortfall).toLocaleString("ja-JP")} 万円
                </>
              )}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="font-sans text-xs text-warmMuted">着地予想達成率</p>
            <p
              className={`font-sans text-3xl font-bold tabular-nums mt-0.5 ${achievementTextClass(
                monthlyRate
              )}`}
            >
              {monthlyRate.toFixed(1)} %
            </p>
          </div>
        </div>
        <div className="h-3 bg-champagneLight/40 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${achievementBarClass(
              monthlyRate
            )}`}
            style={{ width: `${Math.min(100, monthlyRate)}%` }}
          />
        </div>
        <p className="font-sans text-[10px] text-warmMuted/80 mt-2">
          {monthlyRate >= 100
            ? "✓ 全社月次目標を達成しています。"
            : monthlyRate >= 90
            ? "⚡ 目標の90%以上。達成まであと一歩。"
            : "⚠ 目標達成まで要注力。店舗別内訳を確認してください。"}
        </p>
      </div>

      {/* ── 全社年間目標 ──────────────────────────────────────── */}
      <div className="p-4 md:p-6 border-b border-champagneLight/30">
        <h3 className="font-sans text-sm font-semibold text-warmMuted uppercase tracking-wider mb-4">
          全社年間目標
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 年間売上目標 */}
          <div className="rounded-xl bg-offwhite border border-champagneLight/50 p-4">
            <p className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider">
              年間売上目標
            </p>
            {editMode ? (
              <input
                type="number"
                value={targets.annualTarget.annualSalesTarget}
                onChange={(e) =>
                  updateAnnualTarget("annualSalesTarget", Number(e.target.value) || 0)
                }
                className="font-sans text-xl font-semibold text-warmInk w-full mt-2 py-2.5 px-3 bg-cream border-2 border-champagneLight rounded-xl tabular-nums focus:outline-none focus:ring-2 focus:ring-champagne/40 focus:border-champagne"
              />
            ) : (
              <p className="font-sans text-2xl font-bold text-warmInk mt-1 tabular-nums">
                {targets.annualTarget.annualSalesTarget.toLocaleString("ja-JP")} 万円
              </p>
            )}
            <div className="mt-3">
              <div className="flex justify-between items-center font-sans text-xs mb-1.5">
                <span className="text-warmMuted">
                  年間ペース（着地予想×12）:{" "}
                  {corporateAnnualPace.toLocaleString("ja-JP")} 万円
                </span>
                <span
                  className={`font-semibold tabular-nums ${achievementTextClass(
                    annualSalesRate
                  )}`}
                >
                  {annualSalesRate.toFixed(1)} %
                </span>
              </div>
              <div className="h-2 bg-champagneLight/40 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${achievementBarClass(
                    annualSalesRate
                  )}`}
                  style={{ width: `${Math.min(100, annualSalesRate)}%` }}
                />
              </div>
            </div>
          </div>

          {/* 年間利益目標 */}
          <div className="rounded-xl bg-offwhite border border-champagneLight/50 p-4">
            <p className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider">
              年間利益目標（Real Net Profit）
            </p>
            {editMode ? (
              <input
                type="number"
                value={targets.annualTarget.annualProfitTarget}
                onChange={(e) =>
                  updateAnnualTarget("annualProfitTarget", Number(e.target.value) || 0)
                }
                className="font-sans text-xl font-semibold text-warmInk w-full mt-2 py-2.5 px-3 bg-cream border-2 border-champagneLight rounded-xl tabular-nums focus:outline-none focus:ring-2 focus:ring-champagne/40 focus:border-champagne"
              />
            ) : (
              <p className="font-sans text-2xl font-bold text-warmInk mt-1 tabular-nums">
                {targets.annualTarget.annualProfitTarget.toLocaleString("ja-JP")} 万円
              </p>
            )}
            <div className="mt-3">
              <div className="flex justify-between items-center font-sans text-xs mb-1.5">
                <span className="text-warmMuted">
                  純利益ペース（着地予想×12）:{" "}
                  {(corporateProjectedProfit * 12).toLocaleString("ja-JP")} 万円
                </span>
                <span
                  className={`font-semibold tabular-nums ${achievementTextClass(
                    annualProfitRate
                  )}`}
                >
                  {annualProfitRate.toFixed(1)} %
                </span>
              </div>
              <div className="h-2 bg-champagneLight/40 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${achievementBarClass(
                    annualProfitRate
                  )}`}
                  style={{ width: `${Math.min(100, annualProfitRate)}%` }}
                />
              </div>
              <p className="font-sans text-[10px] text-warmMuted/80 mt-1">
                ※ 粗利（Gross Profit）ベースで試算。Real Net Profit は財務台帳で確認。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 店舗別4KPI Progress Ring ─────────────────────────── */}
      <div className="p-4 md:p-6">
        <h3 className="font-sans text-sm font-semibold text-warmMuted uppercase tracking-wider mb-1 flex items-center gap-2">
          店舗別4KPI目標進捗 — 着地予想 & 不足金額
          {editMode && (
            <span className="font-sans text-xs font-normal text-champagne bg-champagneLight/40 px-2 py-0.5 rounded">
              目標値を直接入力
            </span>
          )}
        </h3>
        <p className="font-sans text-[10px] text-warmMuted mb-5">
          ✦ Excellent System Implementation（≥100%）/ On Track（90〜99%）/ Growth Opportunity（&lt;90%）
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {storeGoalMetrics.map((m) => (
            <div
              key={m.storeId}
              className={`rounded-xl border p-4 transition-silent ${
                m.status === "excellent"
                  ? "bg-gradient-to-br from-[#FDF6E3] to-cream border-[#C9A962]/40"
                  : m.status === "growth_opportunity"
                  ? "bg-rose-50/60 border-rose-200/70"
                  : "bg-offwhite border-champagneLight/50"
              }`}
            >
              {/* 店舗ヘッダー & ステータスバッジ */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <h4 className="font-sans text-sm font-semibold text-warmInk truncate">
                  {m.storeName}
                </h4>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium flex-shrink-0 ${getGoalStatusBadgeClass(
                    m.status
                  )}`}
                >
                  {m.status === "excellent" && "✦ "}
                  {getGoalStatusLabel(m.status)}
                </span>
              </div>

              {/* 4 Progress Rings */}
              <div className="grid grid-cols-4 gap-1 mb-4">
                <ProgressRing
                  rate={m.salesRate}
                  label="売上"
                  value={`${m.salesAccumulated.toLocaleString("ja-JP")}万`}
                />
                <ProgressRing
                  rate={m.avgOrderRate}
                  label="客単価"
                  value={`${(m.avgOrderActual / 10000).toFixed(1)}万`}
                />
                <ProgressRing
                  rate={m.fillRateRate}
                  label="充足率"
                  value={`${m.fillRateActual}%`}
                />
                <ProgressRing
                  rate={m.repeatRateRate}
                  label="リピート"
                  value={`${m.repeatRateActual}%`}
                />
              </div>

              {/* 着地予想 & 不足金額 */}
              <div className="rounded-lg bg-cream/80 border border-champagneLight/40 p-3 mb-3">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 font-sans text-xs">
                  <div>
                    <p className="text-warmMuted">月末着地予想</p>
                    <p
                      className={`font-semibold tabular-nums mt-0.5 ${
                        m.salesProjection.projected >= m.salesTarget
                          ? "text-emerald-700"
                          : "text-rose-700"
                      }`}
                    >
                      {m.salesProjection.projected.toLocaleString("ja-JP")} 万円
                    </p>
                  </div>
                  <div>
                    <p className="text-warmMuted">
                      {m.salesProjection.shortfall > 0 ? "不足金額" : "超過金額"}
                    </p>
                    <p
                      className={`font-semibold tabular-nums mt-0.5 ${
                        m.salesProjection.shortfall <= 0
                          ? "text-emerald-700"
                          : "text-rose-700"
                      }`}
                    >
                      {m.salesProjection.shortfall > 0 ? "▼ " : "▲ "}
                      {Math.abs(m.salesProjection.shortfall).toLocaleString("ja-JP")} 万円
                    </p>
                  </div>
                  <div>
                    <p className="text-warmMuted">月次目標</p>
                    <p className="text-warmInk font-medium tabular-nums mt-0.5">
                      {m.salesTarget.toLocaleString("ja-JP")} 万円
                    </p>
                  </div>
                  <div>
                    <p className="text-warmMuted">今日までの累計</p>
                    <p className="text-warmInk font-medium tabular-nums mt-0.5">
                      {m.salesAccumulated.toLocaleString("ja-JP")} 万円
                    </p>
                  </div>
                </div>
              </div>

              {/* 総合達成率バー */}
              <div className="mb-1">
                <div className="flex justify-between items-center font-sans text-[11px] mb-1">
                  <span className="text-warmMuted">総合達成率（4KPI加重平均）</span>
                  <span
                    className={`font-bold tabular-nums ${achievementTextClass(
                      m.overallRate
                    )}`}
                  >
                    {m.overallRate.toFixed(1)} %
                  </span>
                </div>
                <div className="h-1.5 bg-champagneLight/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      m.status === "excellent"
                        ? "bg-champagne"
                        : m.status === "on_track"
                        ? "bg-emerald-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.min(100, m.overallRate)}%` }}
                  />
                </div>
              </div>

              {/* Edit Mode: 4KPI目標値入力 */}
              {editMode && (
                <div className="space-y-2 border-t border-champagneLight/40 pt-3 mt-3">
                  <p className="font-sans text-[10px] text-warmMuted uppercase tracking-wider font-medium">
                    目標値を設定
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-sans text-[10px] text-warmMuted block mb-1">
                        売上目標（万円）
                      </label>
                      <input
                        type="number"
                        value={m.salesTarget}
                        onChange={(e) =>
                          updateStoreTarget(m.storeId, Number(e.target.value) || 0)
                        }
                        className="font-sans text-sm text-warmInk w-full py-1.5 px-2 bg-offwhite border-2 border-champagneLight rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-champagne/40 focus:border-champagne"
                      />
                    </div>
                    <div>
                      <label className="font-sans text-[10px] text-warmMuted block mb-1">
                        客単価目標（円）
                      </label>
                      <input
                        type="number"
                        value={m.avgOrderTarget}
                        onChange={(e) =>
                          updateKpiTarget(
                            m.storeId,
                            "avgOrderTarget",
                            Number(e.target.value) || 0
                          )
                        }
                        className="font-sans text-sm text-warmInk w-full py-1.5 px-2 bg-offwhite border-2 border-champagneLight rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-champagne/40 focus:border-champagne"
                      />
                    </div>
                    <div>
                      <label className="font-sans text-[10px] text-warmMuted block mb-1">
                        充足率目標（%）
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={m.fillRateTarget}
                        onChange={(e) =>
                          updateKpiTarget(
                            m.storeId,
                            "fillRateTarget",
                            Number(e.target.value) || 0
                          )
                        }
                        className="font-sans text-sm text-warmInk w-full py-1.5 px-2 bg-offwhite border-2 border-champagneLight rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-champagne/40 focus:border-champagne"
                      />
                    </div>
                    <div>
                      <label className="font-sans text-[10px] text-warmMuted block mb-1">
                        リピート目標（%）
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={m.repeatRateTarget}
                        onChange={(e) =>
                          updateKpiTarget(
                            m.storeId,
                            "repeatRateTarget",
                            Number(e.target.value) || 0
                          )
                        }
                        className="font-sans text-sm text-warmInk w-full py-1.5 px-2 bg-offwhite border-2 border-champagneLight rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-champagne/40 focus:border-champagne"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="font-sans text-[10px] text-warmMuted/80 mt-6">
          緑 = Excellent System Implementation（100%以上）/ 青 = On Track（90〜99%）/ 黄 = Growth Opportunity（90%未満）。
          着地予想は「月初〜今日の累計 ÷ 経過日数 × 月の日数」で算出。目標は Edit Mode でいつでも更新・localStorage に自動保存されます。
        </p>
      </div>
    </div>
  );
}
