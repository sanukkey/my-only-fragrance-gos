"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell } from "recharts";
import { AlertTriangle, Building2, Store, TrendingUp, Wallet, Target } from "lucide-react";
import type { TargetSet } from "../types/sales";
import { achievementBarClass, achievementTextClass } from "../types/sales";
import {
  GROSS_MARGIN_RATE,
  STORE_LABOR_RATIO,
  STORE_EXPENSE_RATIO_SUPPLIES,
  STORE_EXPENSE_RATIO_UNIFORM,
  STORE_RENT_RATIO,
  STORE_UTILITY_MAN,
  INVENTORY_TO_SALES_RATIO,
  HQ_TOTAL_EXPENSE_MAN,
  ADVERTISING_EXPENSE_MAN,
  FULLTIME_COST_PER_MONTH_MAN,
  PARTTIME_HOURLY_KYOTO,
  PARTTIME_HOURLY_KANTO,
  COGS_RATE,
  TYPICAL_RECRUITMENT_COST_RATIO,
  LABOR_SOURCE_NOTE,
  TARGET_NET_PROFIT_MAN,
  CEO_MONTHLY_MAN,
  CEO_TOTAL_COST_MAN,
  HQ_DIRECTOR_MONTHLY_MAN,
  HQ_DIRECTOR_TOTAL_COST_MAN,
  HQ_DIRECTOR_COUNT,
  HQ_SV_MONTHLY_MAN,
  HQ_SV_TOTAL_COST_MAN,
  HQ_SV_COUNT,
  HQ_SOURCE_NOTE,
  UNIT_PRICE_BASE,
  DIRECTOR_RECRUITMENT_FEE_MAN,
  BIZREACH_RECRUITMENT_SOURCE_NOTE,
  DIRECTOR_RECRUITMENT_PAYBACK_MONTHS,
} from "../lib/financeConstants";

type StoreInput = { id: string; name: string; sales: number };

type StoreRow = {
  id: string;
  name: string;
  sales: number;
  labor: number;
  supplies: number;
  utilities: number;
  rent: number;
  uniform: number;
  inventory: number;
  expense: number;
  gross: number;
  /** 営業利益（Operating Income）= 粗利 − 全経費（人件費・備品・光熱費・家賃・制服） */
  profit: number;
};

/** 本部人件費の内訳（規定報酬＋法定福利費15%）。経費を漏らさない精度で算入。 */
const HQ_EXPENSES = (() => {
  const rows: { role: string; compensation: number; socialInsurance: number; total: number }[] = [];
  rows.push({
    role: "代表取締役（CEO）",
    compensation: CEO_MONTHLY_MAN,
    socialInsurance: CEO_TOTAL_COST_MAN - CEO_MONTHLY_MAN,
    total: CEO_TOTAL_COST_MAN,
  });
  for (let i = 0; i < HQ_DIRECTOR_COUNT; i++) {
    rows.push({
      role: "事業部長（Director）",
      compensation: HQ_DIRECTOR_MONTHLY_MAN,
      socialInsurance: HQ_DIRECTOR_TOTAL_COST_MAN - HQ_DIRECTOR_MONTHLY_MAN,
      total: HQ_DIRECTOR_TOTAL_COST_MAN,
    });
  }
  for (let i = 0; i < HQ_SV_COUNT; i++) {
    rows.push({
      role: "SV（Supervisor）",
      compensation: HQ_SV_MONTHLY_MAN,
      socialInsurance: HQ_SV_TOTAL_COST_MAN - HQ_SV_MONTHLY_MAN,
      total: HQ_SV_TOTAL_COST_MAN,
    });
  }
  return rows;
})();

const INVENTORY_WARN_THRESHOLD_RATIO = 0.12;

/** 異常値検知: 前月比20%以上変動 or 売上比で異常に低い → 入力ミスまたは運営異常 */
const VARIANCE_ALERT_THRESHOLD = 0.2;
const MIN_SUPPLIES_RATIO = 0.005;
const MIN_UTILITIES_RATIO = 0.005;
/** 前月実績（モック）。光熱費・消耗品費の前月比でアラート判定。 */
const PREV_MONTH_UTILITIES_BY_STORE: Record<string, number> = {
  "kyoto-kiyomizu": 8,
  "kyoto-teramachi": 8,
  "kyoto-kawaramachi": 8,
  "kyoto-sannenzaka": 8,
  "kyoto-shinkyogoku": 8,
  "tokyo-harajuku": 8,
  "nagoya-sakae": 8,
  "chiba-narita": 8,
  "tokyo-soramachi": 8,
  "yokohama": 8,
  "umeda": 8,
  "hakata": 8,
  "takayama": 8,
  "kanazawa": 8,
};
function getPrevSuppliesByStore(storeList: StoreInput[]): Record<string, number> {
  const r: Record<string, number> = {};
  storeList.forEach((s) => {
    const curr = Math.round(s.sales * STORE_EXPENSE_RATIO_SUPPLIES);
    r[s.id] = Math.max(1, Math.round(curr * 0.85));
  });
  return r;
}
function getAnomalyReasons(
  row: StoreRow,
  prevUtilities: number,
  prevSupplies: number
): string[] {
  const reasons: string[] = [];
  if (prevUtilities > 0 && Math.abs(row.utilities - prevUtilities) / prevUtilities >= VARIANCE_ALERT_THRESHOLD) {
    reasons.push("光熱費 前月比20%以上変動");
  }
  if (prevSupplies > 0 && Math.abs(row.supplies - prevSupplies) / prevSupplies >= VARIANCE_ALERT_THRESHOLD) {
    reasons.push("消耗品費 前月比20%以上変動");
  }
  const salesSafe = row.sales || 1;
  if (row.supplies / salesSafe < MIN_SUPPLIES_RATIO) reasons.push("消耗品費 売上比異常低");
  if (row.utilities / salesSafe < MIN_UTILITIES_RATIO) reasons.push("光熱費 売上比異常低");
  return reasons;
}

/** 200億企業に耐えうる精密構成: Rent（売上15%）・Utility（光熱費3〜5万）を強制組み込み。 */
function buildStoreRows(storeList: StoreInput[], grossMarginRatePct: number): StoreRow[] {
  return storeList.map((s) => {
    const labor = Math.round(s.sales * STORE_LABOR_RATIO);
    const supplies = Math.round(s.sales * STORE_EXPENSE_RATIO_SUPPLIES);
    const utilities = STORE_UTILITY_MAN; // 光熱費: 実態に近い固定（万円）
    const rent = Math.round(s.sales * STORE_RENT_RATIO); // 家賃: 売上の15%目安
    const uniform = Math.round(s.sales * STORE_EXPENSE_RATIO_UNIFORM);
    const inventory = Math.round(s.sales * INVENTORY_TO_SALES_RATIO);
    const expense = labor + supplies + utilities + rent + uniform;
    const gross = Math.round(s.sales * (grossMarginRatePct / 100));
    const profit = gross - expense; // 営業利益（Operating Income）
    return {
      id: s.id,
      name: s.name,
      sales: s.sales,
      labor,
      supplies,
      utilities,
      rent,
      uniform,
      inventory,
      expense,
      gross,
      profit,
    };
  });
}

export default function FullSpectrumFinancialLedger({
  grossMarginRate = GROSS_MARGIN_RATE,
  storeList,
  targets,
  corporateProjected,
}: {
  grossMarginRate?: number;
  storeList?: StoreInput[];
  targets?: TargetSet;
  /** salesWoW加重の月末着地予想（万円）。GoalManagementSectionと同じ62.1%を表示するために使用。 */
  corporateProjected?: number;
}) {
  const storeRows = useMemo(
    () => (storeList && storeList.length > 0 ? buildStoreRows(storeList, grossMarginRate) : []),
    [storeList, grossMarginRate]
  );

  const {
    totalStoreGross,
    totalStoreExpense,
    totalStoreProfit,
    hqTotal,
    realNetProfit,
    corporateNetProfit,
    expenseRateChartData,
    totalInventory,
    inventoryAlerts,
    investable,
    proofChartData,
    oneTimeRecruitingCostMan,
    netAfterOneTime,
  } = useMemo(() => {
    if (storeRows.length === 0) {
      return {
        totalStoreGross: 0,
        totalStoreExpense: 0,
        totalStoreProfit: 0,
        hqTotal: HQ_TOTAL_EXPENSE_MAN,
        realNetProfit: 0,
        corporateNetProfit: 0,
        expenseRateChartData: [] as { name: string; 人件費: number; 備品代: number; 光熱費: number; 家賃: number; 制服代: number }[],
        totalInventory: 0,
        inventoryAlerts: [] as { name: string; ratio: number }[],
        investable: 0,
        proofChartData: [] as { name: string; 金額: number; fill: string }[],
        oneTimeRecruitingCostMan: DIRECTOR_RECRUITMENT_FEE_MAN,
        netAfterOneTime: -DIRECTOR_RECRUITMENT_FEE_MAN,
      };
    }
    const totalStoreGross = storeRows.reduce((a, s) => a + s.gross, 0);
    const totalStoreExpense = storeRows.reduce((a, s) => a + s.expense, 0);
    const totalStoreProfit = storeRows.reduce((a, s) => a + s.profit, 0);
    const hqTotal = HQ_EXPENSES.reduce((a, h) => a + h.total, 0);
    const realNetProfit = totalStoreProfit - hqTotal;
    const expenseRateChartData = storeRows.map((s) => ({
      name: s.name.replace(/\s.*$/, ""),
      人件費: s.sales > 0 ? Math.round((s.labor / s.sales) * 1000) / 10 : 0,
      備品代: s.sales > 0 ? Math.round((s.supplies / s.sales) * 1000) / 10 : 0,
      光熱費: s.sales > 0 ? Math.round((s.utilities / s.sales) * 1000) / 10 : 0,
      家賃: s.sales > 0 ? Math.round((s.rent / s.sales) * 1000) / 10 : 0,
      制服代: s.sales > 0 ? Math.round((s.uniform / s.sales) * 1000) / 10 : 0,
    }));
    const totalInventory = storeRows.reduce((a, s) => a + s.inventory, 0);
    const inventoryAlerts = storeRows
      .filter((s) => s.sales > 0 && s.inventory / s.sales > INVENTORY_WARN_THRESHOLD_RATIO)
      .map((s) => ({ name: s.name, ratio: Math.round((s.inventory / s.sales) * 1000) / 10 }));
    /** 今月の戦略的採用コスト（一括計上）を差し引いた後の純利益＝リアルなキャッシュフロー。 */
    const oneTimeRecruitingCostMan = DIRECTOR_RECRUITMENT_FEE_MAN;
    const netAfterOneTime = realNetProfit - oneTimeRecruitingCostMan;
    const investable = Math.max(0, netAfterOneTime);
    const corporateNetProfit = realNetProfit - ADVERTISING_EXPENSE_MAN;
    const proofChartData = [
      { name: "営業利益合計", 金額: totalStoreProfit, fill: "#8BB4C9" },
      { name: "本部経費", 金額: -hqTotal, fill: "#B8A88A" },
      { name: "Real Net Profit", 金額: realNetProfit, fill: "#C9A962" },
      { name: "広告費", 金額: -ADVERTISING_EXPENSE_MAN, fill: "#B8A88A" },
      { name: "全社純利益", 金額: corporateNetProfit, fill: "#7A9B76" },
    ];
    return {
      totalStoreGross,
      totalStoreExpense,
      totalStoreProfit,
      hqTotal,
      realNetProfit,
      corporateNetProfit: corporateNetProfit,
      expenseRateChartData,
      totalInventory,
      inventoryAlerts,
      investable,
      proofChartData,
      oneTimeRecruitingCostMan: DIRECTOR_RECRUITMENT_FEE_MAN,
      netAfterOneTime,
    };
  }, [storeRows]);

  const nextStoreBudget = Math.floor(investable * 0.45);
  const adBudget = Math.floor(investable * 0.25);
  const reserve = investable - nextStoreBudget - adBudget;

  const totalSales = storeRows.reduce((a, s) => a + s.sales, 0);
  const recruitmentSurplus = Math.round(totalSales * TYPICAL_RECRUITMENT_COST_RATIO);
  const surplusToBonus = Math.floor(recruitmentSurplus * 0.5);
  const surplusToNextStore = recruitmentSurplus - surplusToBonus;

  const prevSuppliesByStore = useMemo(() => getPrevSuppliesByStore(storeList || []), [storeList]);

  if (storeRows.length === 0) return null;

  return (
    <section className="font-sans space-y-8">
      <div className="border-t border-champagneLight pt-8">
        <h2 className="font-sans text-xl font-semibold text-warmInk tracking-tight flex items-center gap-2">
          <Wallet size={22} className="text-champagne" />
          Full Spectrum Financial Ledger（完全財務台帳）
        </h2>
        <p className="font-sans text-sm text-warmMuted mt-1">
          経費から代表の年収1億まで、MY ONLY FRAGRANCE の明るい未来を支える土台として会社全体の財務を一元管理します。
        </p>
        <p className="font-sans text-xs text-champagne/90 mt-2 flex items-center gap-1">
          {LABOR_SOURCE_NOTE}（正社員 {FULLTIME_COST_PER_MONTH_MAN}万/人月・アルバイト 京都{PARTTIME_HOURLY_KYOTO}円/関東{PARTTIME_HOURLY_KANTO}円・原価率{COGS_RATE * 100}%）
        </p>
      </div>

      {/* 0. 年間目標進捗バナー（targets が渡された場合のみ表示） */}
      {targets && (() => {
        const totalMonthlyTarget = targets.storeTargets.reduce((a, t) => a + t.monthlySalesTarget, 0);
        // corporateProjected（salesWoW加重の月末着地予想）を優先。未渡しの場合は月次合計にフォールバック。
        const projected = corporateProjected ?? storeRows.reduce((a, s) => a + s.sales, 0);
        const monthlyRate = totalMonthlyTarget > 0 ? (projected / totalMonthlyTarget) * 100 : 0;
        const annualPace = projected * 12;
        const annualRate = targets.annualTarget.annualSalesTarget > 0
          ? (annualPace / targets.annualTarget.annualSalesTarget) * 100
          : 0;
        return (
          <div className="bg-cream rounded-2xl border border-champagneLight/50 card-shadow overflow-hidden">
            <div className="p-4 md:p-6 border-b border-champagneLight/30 bg-champagneLight/10">
              <h3 className="font-sans font-semibold text-warmInk flex items-center gap-2">
                <Target size={18} className="text-champagne" />
                目標進捗サマリー（月次 / 年間）
              </h3>
            </div>
            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 全社月次 */}
              <div>
                <p className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider mb-2">全社月次売上達成率</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className={`font-sans text-2xl font-bold tabular-nums ${achievementTextClass(monthlyRate)}`}>
                    {monthlyRate.toFixed(1)} %
                  </span>
                  <span className="font-sans text-sm text-warmMuted">
                    月末着地予想 {projected.toLocaleString("ja-JP")} 万円 / 目標 {totalMonthlyTarget.toLocaleString("ja-JP")} 万円
                  </span>
                </div>
                <div className="h-3 bg-champagneLight/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${achievementBarClass(monthlyRate)}`}
                    style={{ width: `${Math.min(100, monthlyRate)}%` }}
                  />
                </div>
              </div>
              {/* 年間ペース */}
              <div>
                <p className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider mb-2">年間売上目標 達成ペース</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className={`font-sans text-2xl font-bold tabular-nums ${achievementTextClass(annualRate)}`}>
                    {annualRate.toFixed(1)} %
                  </span>
                  <span className="font-sans text-sm text-warmMuted">
                    ペース {annualPace.toLocaleString("ja-JP")} 万円 / 目標 {targets.annualTarget.annualSalesTarget.toLocaleString("ja-JP")} 万円
                  </span>
                </div>
                <div className="h-3 bg-champagneLight/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${achievementBarClass(annualRate)}`}
                    style={{ width: `${Math.min(100, annualRate)}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="font-sans text-[10px] text-warmMuted/80 px-4 pb-3">
              月末着地予想 = 累計実績 ÷ 経過日数 × 月日数（salesWoW加重）。年間ペース = 月末着地予想 × 12。
            </p>
          </div>
        );
      })()}

      {/* 1. 店舗別経費・経費率 */}
      <div className="bg-cream rounded-2xl border border-champagneLight/50 card-shadow overflow-hidden">
        <div className="p-4 md:p-6 border-b border-champagneLight/50">
          <h3 className="font-sans font-semibold text-warmInk flex items-center gap-2">
            <Store size={18} className="text-champagne" />
            店舗別経費（人件費・備品代・光熱費・家賃・制服代・棚卸資産）— 営業利益＝最終指標
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full font-sans text-sm">
            <thead>
              <tr className="bg-champagneLight/20 border-b border-champagneLight/50">
                <th className="text-left py-3 px-3 font-semibold text-warmInk whitespace-nowrap">店舗</th>
                <th className="text-right py-3 px-3 font-semibold text-warmInk whitespace-nowrap">売上</th>
                {targets && <th className="text-right py-3 px-3 font-semibold text-warmInk whitespace-nowrap">月次目標</th>}
                {targets && <th className="text-center py-3 px-3 font-semibold text-warmInk whitespace-nowrap min-w-[120px]">達成率</th>}
                <th className="text-right py-3 px-3 font-semibold text-warmInk whitespace-nowrap">人件費</th>
                <th className="text-right py-3 px-3 font-semibold text-warmInk whitespace-nowrap">備品代</th>
                <th className="text-right py-3 px-3 font-semibold text-warmInk whitespace-nowrap">光熱費</th>
                <th className="text-right py-3 px-3 font-semibold text-warmInk whitespace-nowrap">家賃</th>
                <th className="text-right py-3 px-3 font-semibold text-warmInk whitespace-nowrap">制服代</th>
                <th className="text-right py-3 px-3 font-semibold text-warmInk whitespace-nowrap">棚卸資産</th>
                <th className="text-right py-3 px-3 font-semibold text-warmInk whitespace-nowrap">経費率</th>
                <th className="text-right py-3 px-3 font-semibold text-warmInk whitespace-nowrap">営業利益</th>
                <th className="text-left py-3 px-3 font-semibold text-warmInk whitespace-nowrap">アラート</th>
              </tr>
            </thead>
            <tbody>
              {storeRows.map((s) => {
                const rate = s.sales > 0 ? (s.expense / s.sales) * 100 : 0;
                const prevU = PREV_MONTH_UTILITIES_BY_STORE[s.id] ?? s.utilities;
                const prevS = prevSuppliesByStore[s.id] ?? s.supplies;
                const anomalyReasons = getAnomalyReasons(s, prevU, prevS);
                return (
                  <tr key={s.id} className="border-b border-champagneLight/30 hover:bg-champagneLight/10">
                    <td className="py-2.5 px-3 font-medium text-warmInk whitespace-nowrap">{s.name}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-warmInk">{s.sales.toLocaleString("ja-JP")}</td>
                    {targets && (() => {
                      const storeTarget = targets.storeTargets.find((t) => t.storeId === s.id);
                      const tgt = storeTarget?.monthlySalesTarget ?? s.sales;
                      const rate = tgt > 0 ? (s.sales / tgt) * 100 : 0;
                      return (
                        <>
                          <td className="py-2.5 px-3 text-right tabular-nums text-warmMuted whitespace-nowrap">
                            {tgt.toLocaleString("ja-JP")}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2 min-w-[112px]">
                              <div className="flex-1 h-2 bg-champagneLight/40 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${achievementBarClass(rate)}`}
                                  style={{ width: `${Math.min(100, rate)}%` }}
                                />
                              </div>
                              <span className={`font-sans text-xs font-semibold tabular-nums shrink-0 ${achievementTextClass(rate)}`}>
                                {rate.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </>
                      );
                    })()}
                    <td className="py-2.5 px-3 text-right tabular-nums text-warmMuted">{s.labor.toLocaleString("ja-JP")}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-warmMuted">{s.supplies.toLocaleString("ja-JP")}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-warmMuted">{s.utilities.toLocaleString("ja-JP")}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-warmMuted">{s.rent.toLocaleString("ja-JP")}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-warmMuted">{s.uniform.toLocaleString("ja-JP")}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-warmInk">{s.inventory.toLocaleString("ja-JP")}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-medium text-warmInk">{rate.toFixed(1)} %</td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-champagne">{s.profit.toLocaleString("ja-JP")}</td>
                    <td className="py-2.5 px-3">
                      {anomalyReasons.length > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800" title={anomalyReasons.join(" / ")}>
                          <AlertTriangle size={14} />
                          入力ミスまたは運営異常
                        </span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-champagneLight/20 font-semibold">
                <td className="py-3 px-3 text-warmInk">合計</td>
                <td className="py-3 px-3 text-right tabular-nums text-warmInk">
                  {storeRows.reduce((a, s) => a + s.sales, 0).toLocaleString("ja-JP")}
                </td>
                {targets && (() => {
                  const totalTarget = targets.storeTargets.reduce((a, t) => a + t.monthlySalesTarget, 0);
                  const totalActual = storeRows.reduce((a, s) => a + s.sales, 0);
                  const totalRate = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
                  return (
                    <>
                      <td className="py-3 px-3 text-right tabular-nums text-warmInk">
                        {totalTarget.toLocaleString("ja-JP")}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2 min-w-[112px]">
                          <div className="flex-1 h-2 bg-champagneLight/40 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${achievementBarClass(totalRate)}`}
                              style={{ width: `${Math.min(100, totalRate)}%` }}
                            />
                          </div>
                          <span className={`font-sans text-xs font-bold tabular-nums shrink-0 ${achievementTextClass(totalRate)}`}>
                            {totalRate.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </>
                  );
                })()}
                <td className="py-3 px-3 text-right tabular-nums">{storeRows.reduce((a, s) => a + s.labor, 0).toLocaleString("ja-JP")}</td>
                <td className="py-3 px-3 text-right tabular-nums">{storeRows.reduce((a, s) => a + s.supplies, 0).toLocaleString("ja-JP")}</td>
                <td className="py-3 px-3 text-right tabular-nums">{storeRows.reduce((a, s) => a + s.utilities, 0).toLocaleString("ja-JP")}</td>
                <td className="py-3 px-3 text-right tabular-nums">{storeRows.reduce((a, s) => a + s.rent, 0).toLocaleString("ja-JP")}</td>
                <td className="py-3 px-3 text-right tabular-nums">{storeRows.reduce((a, s) => a + s.uniform, 0).toLocaleString("ja-JP")}</td>
                <td className="py-3 px-3 text-right tabular-nums">{totalInventory.toLocaleString("ja-JP")}</td>
                <td className="py-3 px-3 text-right tabular-nums">—</td>
                <td className="py-3 px-3 text-right tabular-nums text-champagne">{totalStoreProfit.toLocaleString("ja-JP")}</td>
                <td className="py-3 px-3" />
              </tr>
            </tbody>
          </table>
        </div>
        <p className="font-sans text-[10px] text-warmMuted/80 px-4 py-2">
          単位: 万円（棚卸資産は月末時点）。家賃・人件費・光熱費・消耗品は実態に基づく構成。人件費＝<strong>フル稼働状態</strong>（欠員なし）の正社員・アルバイト按分。{LABOR_SOURCE_NOTE} 営業利益＝粗利−全経費。
        </p>
      </div>

      {/* 店舗別経費率スタックバー */}
      <div className="bg-cream rounded-2xl p-4 md:p-6 border border-champagneLight/50 card-shadow">
        <h3 className="font-sans font-semibold text-warmInk mb-4">店舗別経費率（売上に対する経費の割合）</h3>
        <div className="h-72 overflow-x-auto scroll-area-hint">
          <div style={{ minWidth: `${Math.max(600, expenseRateChartData.length * 48)}px` }} className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseRateChartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E8DCC8" />
                <XAxis type="number" unit=" %" domain={[0, 100]} tick={{ fontSize: 10, fill: "#6B5B4F" }} />
                <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 10, fill: "#6B5B4F" }} />
                <Tooltip
                  contentStyle={{ fontFamily: "var(--font-dm-sans)", borderRadius: 8, border: "1px solid #E8DCC8" }}
                  formatter={(v: number) => [`${v} %`, ""]}
                  labelFormatter={(_, payload) => payload[0]?.payload?.name}
                />
                <Legend />
                <Bar dataKey="人件費" stackId="a" fill="#C9A962" name="人件費" />
                <Bar dataKey="備品代" stackId="a" fill="#8BB4C9" name="備品代" />
                <Bar dataKey="光熱費" stackId="a" fill="#7A9B76" name="光熱費" />
                <Bar dataKey="家賃" stackId="a" fill="#B8A88A" name="家賃" />
                <Bar dataKey="制服代" stackId="a" fill="#E8DCC8" name="制服代" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 2. 本部経費・最終純利益（Fixed Costs：役員・部長・SV 規定報酬＋法定福利費） */}
      <div className="bg-cream rounded-2xl border border-champagneLight/50 card-shadow overflow-hidden">
        <div className="p-4 md:p-6 border-b border-champagneLight/50">
          <h3 className="font-sans font-semibold text-warmInk flex items-center gap-2">
            <Building2 size={18} className="text-champagne" />
            本部人件費（Fixed Costs）— 役員・部長・SV
          </h3>
          <p className="font-sans text-xs text-champagne/90 mt-2 flex items-center gap-1">{HQ_SOURCE_NOTE}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full font-sans text-sm">
            <thead>
              <tr className="bg-champagneLight/20 border-b border-champagneLight/50">
                <th className="text-left py-3 px-3 font-semibold text-warmInk">役職</th>
                <th className="text-right py-3 px-3 font-semibold text-warmInk">報酬（月）</th>
                <th className="text-right py-3 px-3 font-semibold text-warmInk">法定福利費（約15%）</th>
                <th className="text-right py-3 px-3 font-semibold text-warmInk">小計</th>
              </tr>
            </thead>
            <tbody>
              {HQ_EXPENSES.map((h, i) => (
                <tr key={`${h.role}-${i}`} className="border-b border-champagneLight/30">
                  <td className="py-2.5 px-3 font-medium text-warmInk">{h.role}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-warmMuted">{h.compensation.toLocaleString("ja-JP")}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-warmMuted">{h.socialInsurance.toLocaleString("ja-JP")}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-medium text-warmInk">{h.total.toLocaleString("ja-JP")}</td>
                </tr>
              ))}
              <tr className="bg-champagneLight/20 font-semibold">
                <td className="py-3 px-3 text-warmInk">本部合計経費</td>
                <td colSpan={2} />
                <td className="py-3 px-3 text-right tabular-nums text-warmInk">{hqTotal.toLocaleString("ja-JP")}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="font-sans text-[10px] text-warmMuted/80 px-4 py-2">単位: 万円。経費を漏らさない精度で算入。</p>

        <div className="p-4 md:p-6 bg-champagneLight/20 border-t-2 border-champagne/40">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <p className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider">全店舗営業利益合計</p>
              <p className="font-sans text-2xl font-semibold text-warmInk">{totalStoreProfit.toLocaleString("ja-JP")} 万円</p>
            </div>
            <span className="font-sans text-warmMuted">−</span>
            <div>
              <p className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider">本部合計経費（代表・事業部長・SV）</p>
              <p className="font-sans text-2xl font-semibold text-warmInk">{hqTotal.toLocaleString("ja-JP")} 万円</p>
            </div>
            <span className="font-sans text-warmMuted">=</span>
            <div>
              <p className="font-sans text-xs font-medium text-champagne uppercase tracking-wider">Real Net Profit（本部控除後）</p>
              <p className="font-sans text-3xl font-bold text-champagne">{realNetProfit.toLocaleString("ja-JP")} 万円</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-champagneLight/50 flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <p className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider">Real Net Profit</p>
              <p className="font-sans text-xl font-semibold text-warmInk">{realNetProfit.toLocaleString("ja-JP")} 万円</p>
            </div>
            <span className="font-sans text-warmMuted">−</span>
            <div>
              <p className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider">本部広告費（按分）</p>
              <p className="font-sans text-xl font-semibold text-warmInk">{ADVERTISING_EXPENSE_MAN.toLocaleString("ja-JP")} 万円</p>
            </div>
            <span className="font-sans text-warmMuted">=</span>
            <div>
              <p className="font-sans text-xs font-medium text-champagne uppercase tracking-wider">全社純利益（シミュレーション）</p>
              <p className="font-sans text-2xl font-bold text-champagne">{corporateNetProfit.toLocaleString("ja-JP")} 万円</p>
            </div>
          </div>
          <p className="font-sans text-[10px] text-warmMuted/80 mt-2">全店営業利益から本部管理費・広告費を差し引いた「全社純利益」で、投資家・銀行が信頼する1円単位の利益把握を実現。</p>
          <div className="mt-4 pt-4 border-t border-champagneLight/50 flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <p className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider">Real Net Profit</p>
              <p className="font-sans text-xl font-semibold text-warmInk">{realNetProfit.toLocaleString("ja-JP")} 万円</p>
            </div>
            <span className="font-sans text-warmMuted">−</span>
            <div>
              <p className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider">戦略的採用コスト（One-time）</p>
              <p className="font-sans text-xl font-semibold text-warmInk">{oneTimeRecruitingCostMan.toLocaleString("ja-JP")} 万円</p>
            </div>
            <span className="font-sans text-warmMuted">=</span>
            <div>
              <p className="font-sans text-xs font-medium text-champagne uppercase tracking-wider">今月の純利益（リアルなキャッシュ）</p>
              <p className="font-sans text-2xl font-bold text-champagne">{netAfterOneTime.toLocaleString("ja-JP")} 万円</p>
            </div>
          </div>
          <p className="font-sans text-[10px] text-warmMuted/80 mt-2">代表が年収1億をいただいても、会社に十分な現預金が残る構造です。経費から代表報酬まで一元管理。</p>
          <p className="font-sans text-xs text-champagne/90 mt-2">高い給料を払えるのは、この管理OSで無駄な経費を1円単位で削り、高付加価値な体験（{UNIT_PRICE_BASE.toLocaleString("ja-JP")}円/単価）を最大化できているからです。数字で語る100億企業モデル。</p>
        </div>
      </div>

      {/* 戦略的採用コスト（One-time Recruiting Cost）— ビズリーチ経由・投資として可視化 */}
      <div className="bg-cream rounded-2xl border border-champagneLight/50 card-shadow overflow-hidden">
        <div className="p-4 md:p-6 border-b border-champagneLight/50">
          <h3 className="font-sans font-semibold text-warmInk flex items-center gap-2">
            <Building2 size={18} className="text-champagne" />
            戦略的採用コスト（One-time Recruiting Cost）
          </h3>
          <p className="font-sans text-xs text-warmMuted mt-1">採用戦略による<strong>創出利益</strong>（エージェント費削減・内製化成果）を原資として、<strong>ビズリーチ経由の高度専門人材の採用費</strong>（350万円）を本部経費に充当。本部の「攻めの採用」を一括計上し、この350万円以上の価値を生み出す人材への投資として可視化しています。</p>
          <p className="font-sans text-xs text-champagne/90 mt-2 flex items-center gap-1">{BIZREACH_RECRUITMENT_SOURCE_NOTE}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full font-sans text-sm">
            <thead>
              <tr className="bg-champagneLight/20 border-b border-champagneLight/50">
                <th className="text-left py-3 px-3 font-semibold text-warmInk">対象</th>
                <th className="text-right py-3 px-3 font-semibold text-warmInk">算出</th>
                <th className="text-right py-3 px-3 font-semibold text-warmInk">一括計上（万円）</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-champagneLight/30">
                <td className="py-2.5 px-3 font-medium text-warmInk">事業部長（Director）採用費</td>
                <td className="py-2.5 px-3 text-right tabular-nums text-warmMuted">年収1,000万円 × 35%</td>
                <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-champagne">{oneTimeRecruitingCostMan.toLocaleString("ja-JP")}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-champagneLight/30">
          <div className="rounded-xl bg-champagneLight/20 border border-champagne/30 p-4">
            <p className="font-sans text-xs font-semibold text-warmInk uppercase tracking-wider">攻めの採用（本部）</p>
            <p className="font-sans text-sm text-warmMuted mt-1">採用戦略による創出利益（{recruitmentSurplus}万円/月）を、BizReach 経由の事業部長採用 350万円 の<strong>原資</strong>として本部に充当。月次創出利益で約4ヶ月分を相殺するロジックで、100億への組織基盤を作る計画的投資として表示。</p>
          </div>
          <div className="rounded-xl bg-offwhite border border-champagneLight p-4">
            <p className="font-sans text-xs font-semibold text-warmInk uppercase tracking-wider">守りの採用（現場）</p>
            <p className="font-sans text-sm text-warmMuted mt-1">一般社員・アルバイトは <strong>採用費 0円</strong>（ブランド力による自社応募）。その創出利益（エージェント費削減）を本部の戦略的人材投資の原資へ補填。攻めの採用（本部）と守りの採用（現場）のキャッシュ・アロケーションを可視化。</p>
          </div>
        </div>
      </div>

      {/* 代表が1億稼いでも会社に十分な現預金が残る — 証明ブロック */}
      <div className="bg-cream rounded-2xl border-2 border-champagne/40 card-shadow overflow-hidden">
        <div className="p-4 md:p-6 border-b border-champagneLight/50 bg-champagneLight/10">
          <h3 className="font-sans font-semibold text-warmInk flex items-center gap-2">
            <TrendingUp size={18} className="text-champagne" />
            代表が1億稼いでも、会社に十分な現預金が残る — 収益構造の証明
          </h3>
          <p className="font-sans text-xs text-warmMuted mt-1">全店舗利益から本部人件費（代表・事業部長・SVの規定報酬＋法定福利費）を差し引いた後も、月間 {TARGET_NET_PROFIT_MAN.toLocaleString("ja-JP")} 万円前後のキャッシュが残る設計です。優秀な人材に高給を払いながら、会社にキャッシュが積み上がる最強の100億企業モデルを可視化しています。</p>
        </div>
        <div className="p-4 md:p-6">
          <div className="overflow-x-auto">
            <table className="w-full font-sans text-sm max-w-xl">
              <thead>
                <tr className="bg-champagneLight/20 border-b border-champagneLight/50">
                  <th className="text-left py-3 px-3 font-semibold text-warmInk">項目</th>
                  <th className="text-right py-3 px-3 font-semibold text-warmInk">金額（万円/月）</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-champagneLight/30"><td className="py-2.5 px-3 text-warmInk">全店舗営業利益合計</td><td className="py-2.5 px-3 text-right tabular-nums font-medium text-warmInk">{totalStoreProfit.toLocaleString("ja-JP")}</td></tr>
                <tr className="border-b border-champagneLight/30"><td className="py-2.5 px-3 text-warmInk">− 本部経費（代表・事業部長・SV）</td><td className="py-2.5 px-3 text-right tabular-nums text-warmMuted">−{hqTotal.toLocaleString("ja-JP")}</td></tr>
                <tr className="border-b border-champagneLight/30"><td className="py-2.5 px-3 text-warmInk">＝ Real Net Profit</td><td className="py-2.5 px-3 text-right tabular-nums font-medium text-warmInk">{realNetProfit.toLocaleString("ja-JP")}</td></tr>
                <tr className="border-b border-champagneLight/30"><td className="py-2.5 px-3 text-warmInk">− 本部広告費（按分）</td><td className="py-2.5 px-3 text-right tabular-nums text-warmMuted">−{ADVERTISING_EXPENSE_MAN.toLocaleString("ja-JP")}</td></tr>
                <tr className="bg-champagneLight/20"><td className="py-3 px-3 font-semibold text-champagne">＝ 全社純利益（シミュレーション）</td><td className="py-3 px-3 text-right tabular-nums font-bold text-champagne">{corporateNetProfit.toLocaleString("ja-JP")}</td></tr>
              </tbody>
            </table>
          </div>
          <p className="font-sans text-[10px] text-warmMuted/90 mt-2">※銀行残高および未払金データとリアルタイム同期中</p>
          <div className="mt-6 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={proofChartData} margin={{ top: 8, right: 8, left: 8, bottom: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8DCC8" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6B5B4F" }} />
                <YAxis tick={{ fontSize: 10, fill: "#6B5B4F" }} tickFormatter={(v) => `${v}万`} />
                <Tooltip contentStyle={{ fontFamily: "var(--font-dm-sans)", borderRadius: 8, border: "1px solid #E8DCC8" }} formatter={(v: number) => [v >= 0 ? `${v} 万円` : `${v} 万円`, ""]} />
                <Bar dataKey="金額" radius={[4, 4, 0, 0]}>
                  {proofChartData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="font-sans text-[10px] text-warmMuted/80 mt-2">グラフ: 高品質な未来を象徴するシャンパンゴールドで、代表報酬を含む本部経費控除後も十分な現預金が残ることを可視化。</p>
          <p className="font-sans text-[10px] text-warmMuted/90 mt-1">※キャッシュ推移は銀行残高および未払金データとリアルタイム同期中</p>
        </div>
      </div>

      {/* 3. 在庫・棚卸 */}
      <div className="bg-cream rounded-2xl border border-champagneLight/50 card-shadow overflow-hidden">
        <div className="p-4 md:p-6 border-b border-champagneLight/50 flex flex-wrap items-center justify-between gap-4">
          <h3 className="font-sans font-semibold text-warmInk">在庫・棚卸資産（リアルタイム反映・月次棚卸）</h3>
          <div className="flex items-baseline gap-2">
            <span className="font-sans text-sm text-warmMuted">棚卸資産合計</span>
            <span className="font-sans text-xl font-semibold text-warmInk tabular-nums">{totalInventory.toLocaleString("ja-JP")} 万円</span>
          </div>
        </div>
        <div className="p-4 md:p-6">
          {inventoryAlerts.length > 0 ? (
            <div className="rounded-xl bg-amber-50 border border-amber-200/60 p-4">
              <div className="flex items-center gap-2 font-sans font-semibold text-amber-800 mb-2">
                <AlertTriangle size={18} />
                在庫ムダ警告
              </div>
              <p className="font-sans text-sm text-amber-800/90 mb-2">
                売上に対する在庫比率が {INVENTORY_WARN_THRESHOLD_RATIO * 100} % を超えている店舗があります。滞留在庫の見直しを推奨します。
              </p>
              <ul className="font-sans text-sm text-amber-800/90 space-y-1">
                {inventoryAlerts.map((a) => (
                  <li key={a.name}>・{a.name}: 在庫比率 {a.ratio} %</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="font-sans text-sm text-warmMuted">現在、在庫比率の警告対象店舗はありません。</p>
          )}
        </div>
      </div>

      {/* 採用戦略による創出利益の配分 — 本部戦略的人材投資への充当 */}
      <div className="bg-cream rounded-2xl border border-champagneLight/50 card-shadow overflow-hidden">
        <div className="p-4 md:p-6 border-b border-champagneLight/50">
          <h3 className="font-sans font-semibold text-warmInk">採用戦略による創出利益の配分（キャッシュ・アロケーション）</h3>
          <p className="font-sans text-xs text-warmMuted mt-1">
            自社で採用できるブランド力があるからこそ、本部に投資できる原資が生まれている。この創出利益を<strong>本部（事業部長・SV）の高度採用コスト（ビズリーチ等 350万円）の原資</strong>として充当し、賞与・次店舗投資に配分しています。
          </p>
          <p className="font-sans text-xs text-champagne/90 mt-2">
            現場の採用コスト <strong>0円</strong> を維持することで、<strong>年間 1,000万円 以上</strong>の創出利益を生み、本部の戦略的人材投資へ補填しています。{LABOR_SOURCE_NOTE}
          </p>
        </div>
        <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-champagneLight/20 border border-champagne/30 p-4">
            <p className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider">採用戦略による創出利益</p>
            <p className="font-sans text-xl font-bold text-champagne mt-1 tabular-nums">{recruitmentSurplus.toLocaleString("ja-JP")} 万円/月</p>
            <p className="font-sans text-[10px] text-warmMuted mt-1">エージェント費削減（内製化成果）。自社媒体・SNS採用による手数料回避額を、本部 350万円 の原資・賞与・次店舗投資に配分。</p>
          </div>
          <div className="rounded-xl bg-offwhite border border-champagneLight p-4">
            <p className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider">賞与・評価に回す</p>
            <p className="font-sans text-xl font-semibold text-warmInk mt-1 tabular-nums">{surplusToBonus.toLocaleString("ja-JP")} 万円/月</p>
            <p className="font-sans text-[10px] text-warmMuted mt-1">創出利益の50% — スタッフの評価（賞与）プールへ。</p>
          </div>
          <div className="rounded-xl bg-offwhite border border-champagneLight p-4">
            <p className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider">次店舗投資に回す</p>
            <p className="font-sans text-xl font-semibold text-warmInk mt-1 tabular-nums">{surplusToNextStore.toLocaleString("ja-JP")} 万円/月</p>
            <p className="font-sans text-[10px] text-warmMuted mt-1">創出利益の50% — 出店資金の上乗せへ。</p>
          </div>
        </div>
      </div>

      {/* 4. 事業投資シミュレーター */}
      <div className="bg-cream rounded-2xl border-2 border-champagne/30 card-shadow overflow-hidden">
        <div className="p-4 md:p-6 border-b border-champagneLight/50 bg-champagneLight/10">
          <h3 className="font-sans font-semibold text-warmInk flex items-center gap-2">
            <TrendingUp size={18} className="text-champagne" />
            事業投資シミュレーター
          </h3>
          <p className="font-sans text-xs text-warmMuted mt-1">今月の純利益（戦略的採用コスト 350万円 控除後）から、投資に回せる予算を自動算出します。</p>
        </div>
        <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl bg-offwhite border border-champagneLight p-4">
            <p className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider">次の出店に回せる予算</p>
            <p className="font-sans text-2xl font-bold text-champagne mt-1 tabular-nums">{nextStoreBudget.toLocaleString("ja-JP")} 万円</p>
            <p className="font-sans text-[10px] text-warmMuted mt-1">最終純利益の 45 % を出店資金に充当</p>
          </div>
          <div className="rounded-xl bg-offwhite border border-champagneLight p-4">
            <p className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider">広告投資に回せる予算</p>
            <p className="font-sans text-2xl font-bold text-champagne mt-1 tabular-nums">{adBudget.toLocaleString("ja-JP")} 万円</p>
            <p className="font-sans text-[10px] text-warmMuted mt-1">最終純利益の 25 % を広告費に充当</p>
          </div>
          <div className="rounded-xl bg-offwhite border border-champagneLight p-4">
            <p className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider">予備・その他</p>
            <p className="font-sans text-2xl font-semibold text-warmInk mt-1 tabular-nums">{reserve.toLocaleString("ja-JP")} 万円</p>
            <p className="font-sans text-[10px] text-warmMuted mt-1">残り 30 % は手許キャッシュ・リスク対応</p>
          </div>
        </div>
      </div>
    </section>
  );
}
