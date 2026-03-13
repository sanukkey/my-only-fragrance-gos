"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { AlertTriangle, Package, Users, Link2, PenLine, TrendingDown, Clock, BarChart3, Settings, CheckCircle2, Star, Heart, Smile, Zap, Send, BookOpen, MessageSquare, Shield, Sparkles, Mic, FileText, GraduationCap, Bell, Target, RefreshCw } from "lucide-react";
import GoalManagementSection from "./GoalManagementSection";
import TodayOneStepSection from "./TodayOneStepSection";
import StrategicManagementLedger from "./StrategicManagementLedger";
import FullSpectrumFinancialLedger from "./FullSpectrumFinancialLedger";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  ComposedChart,
  Legend,
  LabelList,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";
import {
  GROSS_MARGIN_RATE,
  TARGET_TOTAL_SALES_MAN,
  COGS_RATE,
  LABOR_SOURCE_NOTE,
  CASH_BALANCE_MAN,
  MONTHLY_FIXED_COST_NO_SALES_MAN,
  CASH_RUNWAY_MONTHS,
  LTV_JPY,
  CAC_JPY,
  LTV_CAC_RATIO,
  LTV_CAC_HEALTHY_THRESHOLD,
} from "../lib/financeConstants";
import { DEFAULT_TARGET_SET, TARGETS_STORAGE_KEY } from "../lib/targetDefaults";
import type { TargetSet, AnnualCorporateTarget } from "../types/sales";
import { achievementBarClass, achievementTextClass } from "../types/sales";
/** 前週比（%）の閾値。これを下回るとリスク・アラートで赤表示。 */
const WOW_ALERT_THRESHOLD = -5;

/** ブランド毀損の緊急警報: このブランドは4.9以上が標準のため、4.8に下がった時点で Red Alert */
const BRAND_RED_ALERT_THRESHOLD = 4.8;

const TOTAL_BRAND_TRUST_REVIEWS = 81425;
const LEGENDARY_REVIEWS_MIN = 10000;

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  TOMMY CRISIS MODE（2026年3月12日）
 *  全14店舗が月次目標を下回る「経営非常事態」シナリオ。
 *  達成率 40%〜82%。100%達成ゼロ。経営者が即座に動ける数字。
 *
 *  目標（monthlySalesTarget）：400〜1,800万・立地傾斜配分
 *  salesWoW：実績÷目標比率（0.43〜0.82）→ 月末着地予想に直結
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 *  🟠 警告（80〜99%）：3店舗  ← かろうじて見えている光
 *  🔴 危機（〜79%）  ：11店舗 ← 今すぐ対策が必要
 */
const BASE_STORES = [
  // ─────────────────────────────────────────────────────────────────────────
  //  🟠 警告ゾーン（80〜82%）— まだ間に合う、しかし油断禁物
  // ─────────────────────────────────────────────────────────────────────────
  // 河原町: 達成率82%。地元リピーター底力で最善位。だが目標1,000万に届かない
  { id: "kyoto-kawaramachi", name: "京都 河原町店", sales: 1000, avgOrder: 19200, fillRate: 79, repeatRate: 71, risk: "none",  stock: "ok",  salesWoW: 0.82, grossProfitWoW: 0.79, rating: 5.0, totalReviews: 4473 },
  // 名古屋栄: 達成率81%。東海圏VIPは来訪するが来店数が想定の8割
  { id: "nagoya-sakae",      name: "名古屋 栄店",   sales: 1200, avgOrder: 20500, fillRate: 75, repeatRate: 68, risk: "none",  stock: "ok",  salesWoW: 0.81, grossProfitWoW: 0.78, rating: 4.9, totalReviews: 20275 },
  // 博多: 達成率80%。九州エリア唯一の旗艦。認知拡大中だがスピード不足
  { id: "hakata",            name: "博多店",         sales:  600, avgOrder: 17500, fillRate: 77, repeatRate: 70, risk: "none",  stock: "ok",  salesWoW: 0.80, grossProfitWoW: 0.77, rating: 4.9, totalReviews: 1075 },
  // ─────────────────────────────────────────────────────────────────────────
  //  🔴 危機ゾーン（〜79%）— 今すぐ動かなければ月次目標未達が確定
  // ─────────────────────────────────────────────────────────────────────────
  // 横浜: 達成率70%。競合モール出店の影響で集客が3割減。回収策未定
  { id: "yokohama",          name: "横浜店",         sales: 1000, avgOrder: 18200, fillRate: 73, repeatRate: 67, risk: "watch", stock: "ok",  salesWoW: 0.70, grossProfitWoW: 0.67, rating: 4.9, totalReviews: 2233 },
  // 金沢: 達成率68%。開業1年未満で認知度低。客単価は高いが来客数が足りない
  { id: "kanazawa",          name: "金沢店",          sales:  400, avgOrder: 18500, fillRate: 63, repeatRate: 61, risk: "watch", stock: "ok",  salesWoW: 0.68, grossProfitWoW: 0.65, rating: 4.9, totalReviews: 235 },
  // ソラマチ: 達成率65%。平日ガラガラ。週末の挽回だけでは目標に届かない
  { id: "tokyo-soramachi",   name: "東京 ソラマチ店", sales: 1000, avgOrder: 18800, fillRate: 70, repeatRate: 64, risk: "watch", stock: "ok",  salesWoW: 0.65, grossProfitWoW: 0.62, rating: 4.9, totalReviews: 3802 },
  // 清水: 達成率63%。インバウンド想定外の落ち込み。団体ツアー受入れ減
  { id: "kyoto-kiyomizu",    name: "京都 清水店",     sales: 1400, avgOrder: 18200, fillRate: 68, repeatRate: 62, risk: "watch", stock: "ok",  salesWoW: 0.63, grossProfitWoW: 0.60, rating: 4.9, totalReviews: 13722 },
  // 梅田: 達成率61%。大阪万博プレ特需に乗れず。隣接競合が先手を打った
  { id: "umeda",             name: "梅田店",          sales: 1200, avgOrder: 19200, fillRate: 66, repeatRate: 60, risk: "watch", stock: "ok",  salesWoW: 0.61, grossProfitWoW: 0.58, rating: 4.9, totalReviews: 1512 },
  // 成田空港: 達成率57%。国際線便数回復遅延。免税需要の取り込み失敗
  { id: "chiba-narita",      name: "千葉 成田空港店", sales:  800, avgOrder: 15800, fillRate: 55, repeatRate: 53, risk: "alert", stock: "low", salesWoW: 0.57, grossProfitWoW: 0.54, rating: 4.9, totalReviews: 2398 },
  // 寺町: 達成率55%。旗艦店なのに最大の危機。スタッフ離職で体験品質が急落
  { id: "kyoto-teramachi",   name: "京都 寺町店",     sales: 1800, avgOrder: 19200, fillRate: 72, repeatRate: 65, risk: "alert", stock: "ok",  salesWoW: 0.55, grossProfitWoW: 0.52, rating: 4.8, totalReviews: 17726 },
  // 新京極: 達成率53%。通行量はあるが来店率が低い。入口導線の課題
  { id: "kyoto-shinkyogoku", name: "京都 新京極店",   sales:  600, avgOrder: 17200, fillRate: 61, repeatRate: 56, risk: "watch", stock: "ok",  salesWoW: 0.53, grossProfitWoW: 0.50, rating: 4.9, totalReviews: 1180 },
  // 原宿: 達成率48%。SNS炎上の余波が続く。若年客の離反が加速中
  { id: "tokyo-harajuku",    name: "東京 原宿店",     sales: 1800, avgOrder: 20000, fillRate: 62, repeatRate: 58, risk: "alert", stock: "ok",  salesWoW: 0.48, grossProfitWoW: 0.45, rating: 4.8, totalReviews: 10046 },
  // 高山: 達成率45%。観光シーズン外。在庫補充遅延が追い打ち
  { id: "takayama",          name: "飛騨高山店",      sales:  400, avgOrder: 16500, fillRate: 52, repeatRate: 48, risk: "alert", stock: "low", salesWoW: 0.45, grossProfitWoW: 0.42, rating: 4.8, totalReviews: 479 },
  // 産寧坂: 達成率43%。全14店最低。清水・河原町との三重カニバリで壊滅的
  { id: "kyoto-sannenzaka",  name: "京都 産寧坂店",   sales:  600, avgOrder: 17500, fillRate: 58, repeatRate: 55, risk: "alert", stock: "low", salesWoW: 0.43, grossProfitWoW: 0.40, rating: 4.8, totalReviews: 2269 },
];

const BASE_TOTAL_SALES = BASE_STORES.reduce((a, s) => a + s.sales, 0);
const SALES_SCALE = BASE_TOTAL_SALES > 0 ? TARGET_TOTAL_SALES_MAN / BASE_TOTAL_SALES : 1;

/** 2026-03-12: 月初から12日経過 / 3月31日 */
const MTD_ELAPSED_DAYS = 12;
const MTD_TOTAL_DAYS   = 31;
const MTD_ELAPSED_RATIO = MTD_ELAPSED_DAYS / MTD_TOTAL_DAYS; // ≈ 0.387

const STORES = BASE_STORES.map((s) => {
  const sales = Math.round(s.sales * SALES_SCALE);
  const qualityAlert = s.rating < BRAND_RED_ALERT_THRESHOLD;
  const trustScore = Math.round(s.totalReviews * s.rating);
  const isLegendary = s.totalReviews >= LEGENDARY_REVIEWS_MIN;
  return { ...s, sales, qualityAlert, trustScore, isLegendary };
});

/** Staff Health: 店舗別 総合休日消化率（公休＋有給）。100%未満の店舗は「現場の疲弊による品質低下リスク」としてアラート。 */
const TOTAL_LEAVE_USAGE_PCT_BY_STORE: Record<string, number> = {
  "kyoto-kiyomizu": 100, "kyoto-teramachi": 100, "kyoto-kawaramachi": 98, "kyoto-sannenzaka": 100, "kyoto-shinkyogoku": 95,
  "tokyo-harajuku": 100, "nagoya-sakae": 100, "chiba-narita": 88, "tokyo-soramachi": 92, "yokohama": 97,
  "umeda": 94, "hakata": 96, "takayama": 100, "kanazawa": 89,
};
const LEAVE_USAGE_ALERT_THRESHOLD = 100; // この値未満で経営者にアラート
const STORES_BELOW_LEAVE_100 = STORES.filter((s) => (TOTAL_LEAVE_USAGE_PCT_BY_STORE[s.id] ?? 100) < LEAVE_USAGE_ALERT_THRESHOLD);

/** Quality KPIs: 14店舗の実数から算出。4.8未満でブランド毀損の緊急警報。総合休日消化率は全店平均。 */
const QUALITY_KPIS = (() => {
  const totalReviews = STORES.reduce((a, s) => a + s.totalReviews, 0);
  const weightedSum = STORES.reduce((a, s) => a + s.rating * s.totalReviews, 0);
  const leaveSum = STORES.reduce((a, s) => a + (TOTAL_LEAVE_USAGE_PCT_BY_STORE[s.id] ?? 100), 0);
  return {
    googleRating: totalReviews > 0 ? Math.round((weightedSum / totalReviews) * 100) / 100 : 0,
    hasCsAlert: STORES.some((s) => s.rating < BRAND_RED_ALERT_THRESHOLD),
    totalLeaveUsageRateAvg: STORES.length > 0 ? Math.round(leaveSum / STORES.length) : 100,
    avgOvertimeHoursPerMonth: 8,
    repeatRateLabel: "2回目以降来店比率",
  };
})();

/** 前週比が -5% を下回っている店舗（リスク・アラート対象）。売上または粗利のいずれかで閾値未満なら赤表示。 */
const STORES_WITH_WOW_ALERT = STORES.filter(
  (s) => s.salesWoW < WOW_ALERT_THRESHOLD || (s.grossProfitWoW ?? s.salesWoW) < WOW_ALERT_THRESHOLD
);

/** AI ボトルネック特定: 立地・人・モノ・訴求の4要因（売上不振店舗向け）。14店舗実数では要因マップは必要に応じて追加。 */
const AI_BOTTLENECK_BY_STORE: Record<
  string,
  { factor: string; factorLabel: "立地" | "人" | "モノ" | "訴求"; message: string; actionContent: string }
> = {};

/** ブランド防衛: 直近14日間の口コミ平均の推移。4.8未満で「ブランド毀損の緊急警報」と連動。 */
const SILENT_KILLER_THRESHOLD = 4.8;
const ROLLING_AVG_14D_DATA = [
  { date: "2/14", avg14d: 4.92 }, { date: "2/15", avg14d: 4.91 }, { date: "2/16", avg14d: 4.90 }, { date: "2/17", avg14d: 4.89 },
  { date: "2/18", avg14d: 4.88 }, { date: "2/19", avg14d: 4.86 }, { date: "2/20", avg14d: 4.84 }, { date: "2/21", avg14d: 4.82 },
  { date: "2/22", avg14d: 4.80 }, { date: "2/23", avg14d: 4.78 }, { date: "2/24", avg14d: 4.76 }, { date: "2/25", avg14d: 4.74 },
  { date: "2/26", avg14d: 4.72 }, { date: "2/27", avg14d: 4.70 }, { date: "2/28", avg14d: 4.68 }, { date: "3/1", avg14d: 4.66 },
  { date: "3/2", avg14d: 4.65 }, { date: "3/3", avg14d: 4.64 }, { date: "3/4", avg14d: 4.65 }, { date: "3/5", avg14d: 4.66 },
  { date: "3/6", avg14d: 4.67 }, { date: "3/7", avg14d: 4.66 },
];
const LATEST_14D_AVG = ROLLING_AVG_14D_DATA[ROLLING_AVG_14D_DATA.length - 1]?.avg14d ?? 5.0;
const SILENT_KILLER_ALERT = LATEST_14D_AVG < SILENT_KILLER_THRESHOLD;

/** 30分枠オペレーション: 接客25〜28分＋お見送り・準備2〜5分＝完璧な運用。接客時間の適正化。 */
const AVG_SERVICE_TIME_BY_STORE: Record<string, number> = {
  "kyoto-kiyomizu": 27, "kyoto-teramachi": 26, "kyoto-kawaramachi": 27, "kyoto-sannenzaka": 25, "kyoto-shinkyogoku": 26,
  "tokyo-harajuku": 28, "nagoya-sakae": 27, "chiba-narita": 25, "tokyo-soramachi": 26, "yokohama": 27,
  "umeda": 26, "hakata": 25, "takayama": 28, "kanazawa": 26,
};
/** 接客時間ステータス: 25〜29分＝Optimal、30分以上＝Delay Risk、20分未満＝Quality Risk */
const SERVICE_OPTIMAL_MIN = 25;
const SERVICE_OPTIMAL_MAX = 29;
const SERVICE_DELAY_RISK_MIN = 30;
const SERVICE_QUALITY_RISK_MAX = 20;
/** 枠占有率: 30分枠のうち接客＋お見送り・準備（2分想定）で何%使えているか。90〜95%が多くの店舗の目安。 */
const HANDOVER_MIN = 2;
function slotOccupancyPct(serviceMin: number): number {
  return Math.min(100, Math.round(((serviceMin + HANDOVER_MIN) / 30) * 100));
}

/** Voice of Field: 店舗別 ESスコア（5段階）。CSが高くてもESが低い店舗は燃え尽き症候群の予兆として警告。 */
const ES_SCORE_BY_STORE: Record<string, number> = {
  "kyoto-kiyomizu": 4.5, "kyoto-teramachi": 4.6, "kyoto-kawaramachi": 4.2, "kyoto-sannenzaka": 4.4, "kyoto-shinkyogoku": 4.3,
  "tokyo-harajuku": 4.7, "nagoya-sakae": 4.5, "chiba-narita": 3.4, "tokyo-soramachi": 4.1, "yokohama": 4.3,
  "umeda": 4.2, "hakata": 4.0, "takayama": 4.6, "kanazawa": 3.8,
};
const ES_BURNOUT_THRESHOLD = 3.5; // この値以下で「燃え尽き症候群の予兆」警告

/** Staff Education: 14店舗の平均習熟度（%）。未経験→即戦力の育成日数は現在90日→目標30日。 */
const STAFF_PROFICIENCY_BY_STORE: Record<string, number> = {
  "kyoto-teramachi": 92, "kyoto-kiyomizu": 88, "nagoya-sakae": 90, "tokyo-harajuku": 85, "kyoto-kawaramachi": 82,
  "tokyo-soramachi": 78, "kyoto-sannenzaka": 80, "chiba-narita": 72, "yokohama": 75, "umeda": 76,
  "hakata": 74, "takayama": 88, "kyoto-shinkyogoku": 79, "kanazawa": 70,
};
const TRAINING_DAYS_CURRENT = 90;
const TRAINING_DAYS_TARGET = 30;

/** Quality Alert: 接客評価4.7以下の店舗（SV通知対象）。接客専用評価をモックで保持。 */
const SERVICE_RATING_BY_STORE: Record<string, number> = {
  "kyoto-teramachi": 4.9, "kyoto-kiyomizu": 4.8, "nagoya-sakae": 4.9, "tokyo-harajuku": 4.8, "kyoto-kawaramachi": 4.7,
  "tokyo-soramachi": 4.6, "kyoto-sannenzaka": 4.8, "chiba-narita": 4.5, "yokohama": 4.7, "umeda": 4.8,
  "hakata": 4.6, "takayama": 4.9, "kyoto-shinkyogoku": 4.7, "kanazawa": 4.5,
};
const QUALITY_ALERT_SERVICE_THRESHOLD = 4.7;

/** AI Recommendation Log: 調香レシピ採用率と顧客満足度向上の相関（モック）。 */
const AI_RECOMMENDATION_LOG_DATA = [
  { month: "10月", adoptionRate: 22, satisfactionLift: 3.2 },
  { month: "11月", adoptionRate: 28, satisfactionLift: 4.1 },
  { month: "12月", adoptionRate: 35, satisfactionLift: 5.0 },
  { month: "1月", adoptionRate: 42, satisfactionLift: 5.8 },
  { month: "2月", adoptionRate: 51, satisfactionLift: 6.5 },
  { month: "3月", adoptionRate: 58, satisfactionLift: 7.2 },
];

/** 現場の課題・提案BOX: 各店舗から寄せられた最新（モック）。 */
type VoiceItemType = "課題" | "提案";
const VOICE_FIELD_ITEMS: { storeId: string; storeName: string; type: VoiceItemType; text: string; date: string }[] = [
  { storeId: "kyoto-kiyomizu", storeName: "京都 清水店", type: "課題", text: "30分枠だと、香料の説明が早口になりがち。お客様のペースに合わせたい。", date: "3/6" },
  { storeId: "kyoto-kiyomizu", storeName: "京都 清水店", type: "提案", text: "トップノート・ベースの見本を手元にまとめれば、説明が30秒短縮できる。", date: "3/5" },
  { storeId: "kyoto-teramachi", storeName: "京都 寺町店", type: "提案", text: "什器の配置を変えれば、動線がスムーズであと2分短縮できる。", date: "3/7" },
  { storeId: "kyoto-kawaramachi", storeName: "京都 河原町店", type: "課題", text: "土日は予約が詰まり、お見送りから次客の準備までが1分しか取れない日がある。", date: "3/6" },
  { storeId: "nagoya-sakae", storeName: "名古屋 栄店", type: "提案", text: "新人には「香りの言語化」練習用のショート動画を配布したい。", date: "3/5" },
  { storeId: "tokyo-harajuku", storeName: "東京 原宿店", type: "課題", text: "接客フローの「香り選び」工程で、お客様の迷いが長いと枠をオーバーしがち。", date: "3/6" },
  { storeId: "chiba-narita", storeName: "千葉 成田空港店", type: "課題", text: "海外客向けの説明が30分に収まらず、次の枠に影響することがある。", date: "3/4" },
  { storeId: "yokohama", storeName: "横浜店", type: "提案", text: "予約時アンケートで「ゆっくり派・スピード派」を聞けば、枠の使い方が最適化できる。", date: "3/5" },
  { storeId: "hakata", storeName: "博多店", type: "課題", text: "新人教育の進捗にバラつきがあり、一人でお任せできるまでに店舗差がある。", date: "3/6" },
  { storeId: "kanazawa", storeName: "金沢店", type: "提案", text: "接客後の振り返りを5分で共有する「ミニ振り返り」を週1でやりたい。", date: "3/5" },
  { storeId: "umeda", storeName: "梅田店", type: "課題", text: "ギフト需要が集中する時期、ラッピングに時間がかかり枠内で終わらないことがある。", date: "3/4" },
  { storeId: "takayama", storeName: "飛騨高山店", type: "提案", text: "観光客は「お土産用にもう1本」の提案が通りやすい。スクリプトを統一したい。", date: "3/6" },
  { storeId: "kyoto-sannenzaka", storeName: "京都 産寧坂店", type: "提案", text: "路地の案内を予約確認メールに載せると、初回来店の方がスムーズに来られる。", date: "3/5" },
  { storeId: "kyoto-shinkyogoku", storeName: "京都 新京極店", type: "課題", text: "混雑時は入口の誘導だけで手がいり、接客に入るのが遅れることがある。", date: "3/4" },
  { storeId: "tokyo-soramachi", storeName: "東京 ソラマチ店", type: "提案", text: "家族連れ向けに「お子様用の香りメモ」を渡すと喜ばれる。簡易版を常備したい。", date: "3/6" },
];
/** 店舗ごとに最新3件を取得（日付の新しい順で最大3件）。 */
function getVoiceItemsByStoreLatest3(): { storeId: string; storeName: string; items: { type: VoiceItemType; text: string; date: string }[] }[] {
  const sorted = [...VOICE_FIELD_ITEMS].sort((a, b) => (b.date > a.date ? 1 : -1));
  const byStore = new Map<string, { type: VoiceItemType; text: string; date: string }[]>();
  sorted.forEach((item) => {
    const list = byStore.get(item.storeId) ?? [];
    if (list.length < 3) list.push({ type: item.type, text: item.text, date: item.date });
    byStore.set(item.storeId, list);
  });
  return STORES.map((s) => ({
    storeId: s.id,
    storeName: s.name,
    items: byStore.get(s.id) ?? [],
  }));
}

/** AI課題抽出: 全店舗のテキストから解析した「今、全社で解決すべき共通の課題」トップ3（モック）。 */
const AI_TOP3_COMMON_ISSUES = [
  { rank: 1, title: "接客フローの特定工程の負荷", detail: "「香り選び」工程でお客様の迷いが長いと枠オーバー。全店で時間配分のガイドライン統一を推奨。" },
  { rank: 2, title: "新人教育の進捗のバラつき", detail: "一人でお任せできるまでの期間に店舗差。共通カリキュラムとチェックリストの導入を推奨。" },
  { rank: 3, title: "30分枠と丁寧説明の両立", detail: "香料説明の早口化・お見送り時間の圧迫。什器配置の最適化と事前アンケートの活用を推奨。" },
];

/** 今週のベスト・プラクティス（初期表示用モック）。店長の感動エピソードがAI要約され全店に配信される想定。 */
const MOCK_BEST_PRACTICES = [
  { storeName: "東京 銀座", summary: "お客様の「香りの記憶」を言葉にし、一本目選定後に「もう一つの自分用」を自然に提案。セット率向上と満足度の両立。", date: "3/5" },
  { storeName: "大阪 心斎橋", summary: "予約時にお名前と来店目的を一言メモし、接客冒頭で名前で呼びかけ。初回から「自分のための時間」と感じてもらう工夫。", date: "3/4" },
];

const YEARLY_BASE = [
  { month: "4月", 売上: 14200 }, { month: "5月", 売上: 15800 }, { month: "6月", 売上: 16500 },
  { month: "7月", 売上: 17200 }, { month: "8月", 売上: 16800 }, { month: "9月", 売上: 18200 },
  { month: "10月", 売上: 19500 }, { month: "11月", 売上: 20100 }, { month: "12月", 売上: 22400 },
  { month: "1月", 売上: 19800 }, { month: "2月", 売上: 18900 }, { month: "3月", 売上: 20400 },
];
const YEARLY_TOTAL_BASE = YEARLY_BASE.reduce((a, m) => a + m.売上, 0);
const YEARLY_SCALE = (TARGET_TOTAL_SALES_MAN * 12) / YEARLY_TOTAL_BASE;
const YEARLY_DATA = YEARLY_BASE.map((m) => ({
  month: m.month,
  売上: Math.round(m.売上 * YEARLY_SCALE),
  利益: Math.round(m.売上 * YEARLY_SCALE * (1 - COGS_RATE)),
}));

const DEFAULT_MARGIN_RATE = GROSS_MARGIN_RATE;

type KpiSource = "POS System" | "Manual Input" | "Calculated" | "Reservation System" | "Survey";

function SourceLabel({ source }: { source: KpiSource }) {
  const config: Record<KpiSource, { label: string; icon: string }> = {
    "POS System": { label: "POS System", icon: "🔗" },
    "Manual Input": { label: "Manual Input", icon: "✍️" },
    Calculated: { label: "Calculated（売上×粗利率・規定値）", icon: "=" },
    "Reservation System": { label: "Reservation System", icon: "🔗" },
    Survey: { label: "Survey", icon: "✍️" },
  };
  const { label, icon } = config[source];
  return (
    <p className="font-sans text-[10px] text-warmMuted/80 mt-2 flex items-center gap-1">
      Source: {label} {icon}
    </p>
  );
}

type LearningStatus = "pending" | "watched";

export default function Dashboard() {
  const [editMode, setEditMode] = useState(false);
  const [apiStatusOpen, setApiStatusOpen] = useState(false);

  // ========== 目標管理 (Target Management) ==========
  const [targets, setTargets] = useState<TargetSet>(() => {
    if (typeof window === "undefined") return DEFAULT_TARGET_SET;
    try {
      const saved = localStorage.getItem(TARGETS_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as TargetSet) : DEFAULT_TARGET_SET;
    } catch {
      return DEFAULT_TARGET_SET;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(targets));
    } catch {}
  }, [targets]);

  const updateStoreTarget = useCallback((storeId: string, newTarget: number) => {
    setTargets((prev) => ({
      ...prev,
      storeTargets: prev.storeTargets.map((t) =>
        t.storeId === storeId ? { ...t, monthlySalesTarget: newTarget } : t
      ),
    }));
  }, []);

  const updateAnnualTarget = useCallback(
    (field: keyof AnnualCorporateTarget, value: number) => {
      setTargets((prev) => ({
        ...prev,
        annualTarget: { ...prev.annualTarget, [field]: value },
      }));
    },
    []
  );

  const resetTargets = useCallback(() => {
    setTargets(DEFAULT_TARGET_SET);
  }, []);
  /** 店舗別 教育コンテンツの学習進捗（未視聴 → 視聴済み） */
  const [learningProgress, setLearningProgress] = useState<Record<string, LearningStatus>>({});
  /** フィードバック報告フォーム: 表示可否・店舗・手応え・実績メモ */
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackStoreId, setFeedbackStoreId] = useState<string>("");
  const [feedbackFeeling, setFeedbackFeeling] = useState<"good" | "bad" | null>(null);
  const [feedbackResult, setFeedbackResult] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  /** 本日最高の顧客感動エピソード（店長報告 → AI要約 → 今週のベスト・プラクティス配信） */
  const [feedbackEpisode, setFeedbackEpisode] = useState("");
  const [bestPractices, setBestPractices] = useState<{ storeId: string; storeName: string; summary: string; date: string }[]>([]);

  const agg = useMemo(
    () =>
      STORES.reduce(
        (a, s) => ({
          /** 月初〜12日の累計実績（salesWoW × 経過比率）。"今月売上" KPIに使用 */
          salesActual: a.salesActual + Math.round(s.sales * MTD_ELAPSED_RATIO * s.salesWoW),
          /** 月次目標合計（SALES_SCALE 適用済み）。達成率計算の分母 */
          salesTarget: a.salesTarget + s.sales,
          count: a.count + 1,
          fillSum: a.fillSum + s.fillRate,
          repeatSum: a.repeatSum + s.repeatRate,
          avgOrderSum: a.avgOrderSum + s.avgOrder,
        }),
        { salesActual: 0, salesTarget: 0, count: 0, fillSum: 0, repeatSum: 0, avgOrderSum: 0 }
      ),
    []
  );

  const [kpi, setKpi] = useState({
    sales: agg.salesActual,
    grossMarginRate: DEFAULT_MARGIN_RATE,
    avgOrder: Math.round(agg.avgOrderSum / agg.count),
    fillRate: Math.round((agg.fillSum / agg.count) * 10) / 10,
    repeatRate: Math.round((agg.repeatSum / agg.count) * 10) / 10,
  });

  /** 今月売上（表示用）= 月初〜今日の累計実績。目標値ではない */
  const displaySales = editMode ? kpi.sales : agg.salesActual;
  const displayMarginRate = editMode ? kpi.grossMarginRate : DEFAULT_MARGIN_RATE;
  const displayGrossProfit = Math.round((displaySales * 10000 * (displayMarginRate / 100)) / 10000);
  const displayAvgOrder = editMode ? kpi.avgOrder : Math.round(agg.avgOrderSum / agg.count);
  const displayFillRate = editMode ? kpi.fillRate : Math.round((agg.fillSum / agg.count) * 10) / 10;
  const displayRepeatRate = editMode ? kpi.repeatRate : Math.round((agg.repeatSum / agg.count) * 10) / 10;

  const storeChartData = useMemo(
    () =>
      STORES.map((s) => ({
        name: s.name.replace(/\s.*$/, ""),
        売上: s.sales,
        利益: Math.round(s.sales * (displayMarginRate / 100)),
        客単価: Math.round(s.avgOrder / 1000),
        評価: s.rating,
        qualityAlert: s.qualityAlert,
      })),
    [displayMarginRate]
  );

  const yearlyDisplayData = useMemo(
    () =>
      YEARLY_DATA.map((m) => ({
        ...m,
        利益: Math.round(m.売上 * (displayMarginRate / 100)),
      })),
    [displayMarginRate]
  );

  return (
    <div className="space-y-12 relative flex flex-col items-center w-full">
      {/* Edit Mode スイッチ（画面端・常にクリック可能） */}
      <div
        className="fixed top-24 right-4 z-[100] flex flex-col items-end gap-1 p-3 rounded-xl bg-cream/95 border border-champagneLight/60 shadow-lg pointer-events-auto"
        aria-hidden="false"
      >
        <label className="font-sans text-xs text-warmMuted flex items-center gap-2 cursor-pointer select-none">
          <span className={editMode ? "text-champagne font-medium" : ""}>Edit Mode</span>
          <button
            type="button"
            role="switch"
            aria-checked={editMode}
            onClick={() => {
              setEditMode((e) => !e);
              if (!editMode) {
                setKpi({
                  sales: agg.salesActual,
                  grossMarginRate: DEFAULT_MARGIN_RATE,
                  avgOrder: Math.round(agg.avgOrderSum / agg.count),
                  fillRate: Math.round((agg.fillSum / agg.count) * 10) / 10,
                  repeatRate: Math.round((agg.repeatSum / agg.count) * 10) / 10,
                });
              }
            }}
            className={`relative w-11 h-6 rounded-full transition-silent flex-shrink-0 ${
              editMode ? "bg-champagne" : "bg-champagneLight/60"
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-cream shadow transition-silent ${
                editMode ? "left-6" : "left-1"
              }`}
            />
          </button>
        </label>
        <p className="font-sans text-[10px] text-warmMuted/80 max-w-[120px] text-right">
          {editMode ? "KPIを手入力でシミュレート" : "連携データを表示中"}
        </p>
      </div>

      {/* Total Brand Trust — 経営の源泉をデカデカと表示 */}
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="rounded-2xl bg-gradient-to-br from-champagne/30 to-champagne/10 border-2 border-champagne/50 p-6 md:p-8 text-center card-shadow">
          <p className="font-sans text-sm font-medium text-warmMuted uppercase tracking-wider mb-1">Total Brand Trust</p>
          <p className="font-sans text-4xl md:text-5xl font-bold text-champagne tabular-nums tracking-tight">
            {TOTAL_BRAND_TRUST_REVIEWS.toLocaleString("ja-JP")} Reviews
          </p>
          <p className="font-sans text-sm text-warmMuted mt-2">これが私たちの経営の源泉です。14店舗で積み上げたお客様の声を、守り抜きます。</p>
        </div>
      </div>

      {/* メインタイトル（画面水平中央） */}
      <div className="w-full flex flex-col items-center px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-warmInk tracking-tight">
            <span className="font-sans">14</span>店舗 一括管理
          </h1>
          <p className="font-sans text-warmMuted mt-3 leading-relaxed">
            私たちの仕事の成果は、お客様の「唯一無二の香り」という体験に直結しています。ここで見える数字は、現場で発生したデータの連携結果です。
          </p>
        </div>
      </div>

      {/* リスク・アラート: 前週比 -5% を下回った店舗を赤で最上部に表示 */}
      {STORES_WITH_WOW_ALERT.length > 0 && (
        <div className="w-full max-w-6xl mx-auto px-4">
          <div className="rounded-2xl border-2 border-rose-200 bg-rose-50/90 p-4 md:p-5 card-shadow">
            <div className="flex items-center gap-2 font-sans font-semibold text-rose-800 mb-3">
              <TrendingDown size={20} className="flex-shrink-0" />
              リスク・アラート
            </div>
            <p className="font-sans text-sm text-rose-800/90 mb-3">
              売上または粗利が前週比 -5% を下回っている店舗です。要因分析と対策を優先してください。
            </p>
            <ul className="flex flex-wrap gap-2">
              {STORES_WITH_WOW_ALERT.map((store) => (
                <li
                  key={store.id}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-rose-200 font-sans text-sm font-medium text-rose-900"
                >
                  <span>{store.name}</span>
                  <span className="tabular-nums text-rose-700">
                    売上 {store.salesWoW > -100 ? store.salesWoW.toFixed(1) : store.salesWoW}% / 粗利 {(store.grossProfitWoW ?? store.salesWoW).toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ========== 今日の一歩 ========== */}
      <TodayOneStepSection stores={STORES} targets={targets} />

      {/* AI Action & Learning Loop — 数字を見るだけでなく人を動かし結果を変える */}
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="bg-warmInk/95 rounded-2xl p-6 md:p-8 border border-champagne/30 card-shadow">
          <div className="flex items-center gap-2 font-sans font-semibold text-champagneLight mb-1">
            <Zap size={20} className="flex-shrink-0" />
            AI Action & Learning Loop
          </div>
          <p className="font-sans text-sm text-cream/80 mb-5">
            数字を見るだけでなく、<strong className="text-cream">人を動かし、結果を変える</strong>ところまでがこのシステムの役割です。課題特定 → 指示送信 → 教育 → 報告 → 他店推奨のループを回します。
          </p>

          {/* 1. ボトルネックの30秒特定 */}
          <h3 className="font-sans text-xs font-medium text-champagne/90 uppercase tracking-wider mb-3">ボトルネックの30秒特定（立地・人・モノ・訴求）</h3>
          {STORES_WITH_WOW_ALERT.length > 0 ? (
            <ul className="space-y-4 mb-6">
              {STORES_WITH_WOW_ALERT.map((store) => {
                const bottleneck = AI_BOTTLENECK_BY_STORE[store.id];
                if (!bottleneck) return null;
                const status = learningProgress[store.id] ?? "pending";
                return (
                  <li key={store.id} className="bg-cream/10 rounded-xl p-4 border border-champagne/20">
                    <p className="font-sans text-sm text-cream mb-2">
                      <span className="font-semibold text-amber-200">⚠️ {store.name}</span>
                      {" "}課題特定: 「{bottleneck.factor}」にボトルネックあり。{bottleneck.message}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <button
                        type="button"
                        onClick={() => setLearningProgress((p) => ({ ...p, [store.id]: "pending" }))}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-champagne/20 text-champagne font-sans text-sm font-medium hover:bg-champagne/30 transition-silent"
                      >
                        <Send size={14} />
                        店長へ指示を送信: 『{bottleneck.actionContent}』
                      </button>
                      <span className={`inline-flex items-center gap-1.5 font-sans text-sm ${status === "watched" ? "text-emerald-300" : "text-cream/70"}`}>
                        {status === "watched" ? (
                          <>✅ 視聴済み</>
                        ) : (
                          <>📖 未視聴</>
                        )}
                      </span>
                      {status === "pending" && (
                        <button
                          type="button"
                          onClick={() => setLearningProgress((p) => ({ ...p, [store.id]: "watched" }))}
                          className="font-sans text-xs text-champagne/90 hover:text-champagne underline"
                        >
                          視聴済みにする
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFeedbackStoreId(store.id);
                        setFeedbackOpen(true);
                        setFeedbackSubmitted(false);
                        setFeedbackFeeling(null);
                        setFeedbackResult("");
                        setFeedbackEpisode("");
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 font-sans text-xs text-champagne/90 hover:text-champagne"
                    >
                      <MessageSquare size={12} /> 実施後の感触・実績を報告する
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="font-sans text-sm text-cream/70 mb-6">現在、売上不振のため課題特定対象の店舗はありません。</p>
          )}

          {/* 2. フィードバック報告（店長がスマホから1タップで報告） */}
          <div className="border-t border-champagne/20 pt-5">
            <h3 className="font-sans text-xs font-medium text-champagne/90 uppercase tracking-wider mb-3">フィードバック報告（店長 → 本部）</h3>
            <p className="font-sans text-sm text-cream/80 mb-3">
              店長が学習後に、現場での「実施後の感触」と「実績値の変化」をスマホから1タップで報告できます。
            </p>
            <button
              type="button"
              onClick={() => {
                setFeedbackOpen(true);
                setFeedbackStoreId(STORES_WITH_WOW_ALERT[0]?.id ?? STORES[0].id);
                setFeedbackSubmitted(false);
                setFeedbackFeeling(null);
                setFeedbackResult("");
                setFeedbackEpisode("");
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-champagne/20 text-champagne font-sans text-sm font-medium hover:bg-champagne/30 transition-silent"
            >
              <MessageSquare size={14} /> フィードバック報告を開く
            </button>
            <p className="font-sans text-[10px] text-cream/60 mt-3">
              ※ 報告された成功事例は「〇〇店の成功事例」としてデータベース化され、他店へ自動推奨されるロジックで連携されます。（AI Action: 成功事例の横展開）
            </p>
          </div>
        </div>
      </div>

      {/* フィードバック報告モーダル（シミュレーション） */}
      {feedbackOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-warmInk/60" onClick={() => setFeedbackOpen(false)}>
          <div
            className="bg-cream rounded-2xl p-6 max-w-md w-full border border-champagneLight shadow-xl font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-sans font-semibold text-warmInk mb-4">実施後の感触・実績を報告</h3>
            {feedbackSubmitted ? (
              <p className="text-warmInk font-medium mb-4">報告を受け付けました。成功事例として他店へ推奨対象に登録されます。</p>
            ) : (
              <>
                <label className="block text-sm font-medium text-warmInk mb-2">店舗</label>
                <select
                  value={feedbackStoreId}
                  onChange={(e) => setFeedbackStoreId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-champagneLight text-warmInk text-sm mb-4"
                >
                  {STORES.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <label className="block text-sm font-medium text-warmInk mb-2">実施後の感触（1タップ）</label>
                <div className="flex gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setFeedbackFeeling("good")}
                    className={`flex-1 py-3 rounded-xl font-medium text-sm transition-silent ${feedbackFeeling === "good" ? "bg-emerald-100 text-emerald-800 border-2 border-emerald-400" : "bg-offwhite border border-champagneLight text-warmMuted hover:border-champagne"}`}
                  >
                    手応えあり
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackFeeling("bad")}
                    className={`flex-1 py-3 rounded-xl font-medium text-sm transition-silent ${feedbackFeeling === "bad" ? "bg-amber-100 text-amber-800 border-2 border-amber-400" : "bg-offwhite border border-champagneLight text-warmMuted hover:border-champagne"}`}
                  >
                    手応えなし
                  </button>
                </div>
                <label className="block text-sm font-medium text-warmInk mb-2">実績値の変化（任意）</label>
                <textarea
                  value={feedbackResult}
                  onChange={(e) => setFeedbackResult(e.target.value)}
                  placeholder="例: セット率が前月比+5%に改善"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-champagneLight text-warmInk text-sm resize-none mb-4"
                />
                <label className="block text-sm font-medium text-warmInk mb-2">本日最高の顧客感動エピソード（任意）</label>
                <p className="font-sans text-[10px] text-warmMuted mb-1">優れたエピソードはAIが要約し、全店に「今週のベスト・プラクティス」として配信されます。</p>
                <textarea
                  value={feedbackEpisode}
                  onChange={(e) => setFeedbackEpisode(e.target.value)}
                  placeholder="例: お客様が「初めて自分用の香りを見つけた」と涙され、ギフト用にもう1本ご購入。接客は焦らず、香りの記憶を言葉にしてもらう時間を大切にした。"
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-champagneLight text-warmInk text-sm resize-none mb-4"
                />
              </>
            )}
            <div className="flex gap-2 justify-end">
              {feedbackSubmitted ? (
                <button type="button" onClick={() => setFeedbackOpen(false)} className="px-4 py-2 rounded-xl bg-champagne/20 text-champagne font-medium text-sm">閉じる</button>
              ) : (
                <>
                  <button type="button" onClick={() => setFeedbackOpen(false)} className="px-4 py-2 rounded-xl border border-champagneLight text-warmMuted font-medium text-sm">キャンセル</button>
                  <button
                    type="button"
                    onClick={() => {
                      setFeedbackSubmitted(true);
                      const storeName = STORES.find((s) => s.id === feedbackStoreId)?.name ?? "";
                      if (feedbackEpisode.trim()) {
                        const summary = feedbackEpisode.length > 100 ? feedbackEpisode.slice(0, 100) + "…" : feedbackEpisode;
                        setBestPractices((prev) => [
                          { storeId: feedbackStoreId, storeName, summary, date: "3/7" },
                          ...prev.slice(0, 19),
                        ]);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-champagne text-warmInk font-medium text-sm"
                  >
                    送信
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* データ導線の透明性 & API連携ステータス（設定アイコン内） */}
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="bg-cream/60 rounded-xl px-4 py-2.5 border border-champagneLight/50 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 font-sans text-xs text-warmMuted relative">
          <span className="flex items-center gap-1.5">
            <Link2 size={12} /> POS連携: 売上・客単価
          </span>
          <span className="flex items-center gap-1.5">
            <Link2 size={12} /> 人件費・原価: {LABOR_SOURCE_NOTE.replace(" 🔗", "")}
          </span>
          <span className="flex items-center gap-1.5">
            <Link2 size={12} /> 予約システム: 充足率
          </span>
          <span className="flex items-center gap-1.5">
            <PenLine size={12} /> アンケート集計: リピート意向
          </span>
          <span className="text-warmMuted/70">最終同期: 1分前</span>
          <button
            type="button"
            onClick={() => setApiStatusOpen((o) => !o)}
            className="flex items-center gap-1.5 ml-2 px-2 py-1 rounded-lg hover:bg-champagneLight/40 text-warmMuted hover:text-warmInk transition-silent"
            aria-expanded={apiStatusOpen}
            aria-label="API連携ステータスを表示"
          >
            <Settings size={14} />
            <span className="font-sans text-xs">データソース</span>
          </button>
        </div>
        {apiStatusOpen && (
          <div className="mt-3 p-4 rounded-xl border border-champagneLight/60 bg-cream shadow-lg font-sans">
            <h3 className="font-sans text-sm font-semibold text-warmInk mb-3 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              API連携ステータス
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-warmInk">
                <span className="inline-flex w-2 h-2 rounded-full bg-emerald-500" aria-hidden />
                <strong>POS連携:</strong> 接続済み（最終同期: 1分前）
              </li>
              <li className="flex items-center gap-2 text-warmInk">
                <span className="inline-flex w-2 h-2 rounded-full bg-emerald-500" aria-hidden />
                <strong>銀行API:</strong> 接続済み（三菱UFJ銀行、三井住友銀行 連携中）
              </li>
              <li className="flex items-center gap-2 text-warmInk">
                <span className="inline-flex w-2 h-2 rounded-full bg-emerald-500" aria-hidden />
                <strong>会計ソフト:</strong> MoneyForward API 連携中
              </li>
            </ul>
            <p className="font-sans text-[10px] text-warmMuted mt-3">既存インフラと統合された次世代経営基盤です。</p>
          </div>
        )}
      </div>

      {/* 非財務指標（Quality KPIs）— 数字とブランドの両立を証明 */}
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="bg-cream/80 rounded-2xl p-5 border border-champagneLight/50 card-shadow">
          <h2 className="font-sans text-base font-semibold text-warmInk mb-3 flex items-center gap-2">
            <Smile size={18} className="text-champagne" />
            非財務指標（Quality KPIs）
          </h2>
          <p className="font-sans text-[10px] text-warmMuted mb-4">
            数字を追うこととブランドを守ることは両立できる。G-OS がそれを証明します。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-offwhite rounded-xl p-4 border border-champagneLight/40">
              <p className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Star size={12} className="text-amber-500" /> CS（顧客満足度）
              </p>
              <p className="font-sans text-xl font-semibold text-warmInk tabular-nums">
                {QUALITY_KPIS.googleRating.toFixed(1)} <span className="text-sm font-normal text-warmMuted">/ 5.0</span>
              </p>
              <p className="font-sans text-[10px] text-warmMuted/90 mt-1">Google Map レビュー平均</p>
              <p className="font-sans text-[10px] text-warmMuted/80 mt-1">Source: Google Business Profile API 🔗 (Real-time)</p>
              {QUALITY_KPIS.hasCsAlert && (
                <p className="font-sans text-xs font-medium text-rose-700 mt-2 flex items-center gap-1">
                  <AlertTriangle size={12} /> ブランド毀損の緊急警報（Red Alert）— 4.8 未満の店舗あり
                </p>
              )}
            </div>
            <div className="bg-offwhite rounded-xl p-4 border border-champagneLight/40">
              <p className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Heart size={12} className="text-rose-400" /> Staff Health & Sustainability（スタッフの健康と持続可能性）
              </p>
              <p className="font-sans text-xl font-semibold text-warmInk tabular-nums">総合休日消化率 {QUALITY_KPIS.totalLeaveUsageRateAvg} %</p>
              <p className="font-sans text-[10px] text-warmMuted/90 mt-1">公休＋有給の消化率（全店平均）</p>
              <p className="font-sans text-[10px] text-warmMuted/80 mt-1">平均残業 {QUALITY_KPIS.avgOvertimeHoursPerMonth} 時間/月。高い粗利はスタッフの犠牲の上に成り立っていないことを示します。</p>
              {STORES_BELOW_LEAVE_100.length > 0 && (
                <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-2 py-1.5">
                  <p className="font-sans text-xs font-medium text-amber-800 flex items-center gap-1">
                    <AlertTriangle size={12} /> 現場の疲弊による品質低下リスク
                  </p>
                  <p className="font-sans text-[10px] text-amber-800 mt-0.5">100%未満: {STORES_BELOW_LEAVE_100.map((s) => s.name).join("、")}</p>
                </div>
              )}
            </div>
            <div className="bg-offwhite rounded-xl p-4 border border-champagneLight/40">
              <p className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider mb-1">リピート率（Retention Rate）</p>
              <p className="font-sans text-xl font-semibold text-warmInk tabular-nums">{displayRepeatRate.toFixed(1)} %</p>
              <p className="font-sans text-[10px] text-warmMuted/90 mt-1">{QUALITY_KPIS.repeatRateLabel}</p>
              <p className="font-sans text-[10px] text-warmMuted/80 mt-1">「香りで世界を変える」が一過性でなくファンを生んでいるかを可視化。</p>
            </div>
          </div>
        </div>
      </div>

      {/* ブランド防衛・ナレッジ — 4.9を100億まで守り抜く。数字で縛るのではなく、誇りと感動のために。 */}
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="bg-cream rounded-2xl p-6 md:p-8 border border-champagneLight/50 card-shadow">
          <div className="flex items-center gap-2 font-sans font-semibold text-warmInk mb-1">
            <Shield size={20} className="text-champagne" />
            ブランド防衛・ナレッジ
          </div>
          <p className="font-sans text-sm text-warmMuted mb-2">
            顧客評価 5.0 という「奇跡的なブランド」を 100 億まで守り抜くため。このシステムは<strong className="text-warmInk">数字で縛る</strong>ためではなく、<strong className="text-champagne">スタッフが誇りを持ってお客様を感動させ続ける</strong>ためにあります。
          </p>
          <p className="font-sans text-xs text-warmMuted/90 mb-6">
            評価4.9を維持している店舗はリピート率が高く、広告費を抑えられて利益率が高い—「顧客評価」と「売上・利益」が連動する仕組みを可視化しています。
          </p>

          {/* 1. サイレント・キラー（微細変動）検知：直近14日間の平均の推移 */}
          <div className="mb-8">
            <h3 className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider mb-2">サイレント・キラー検知 — 直近14日間の口コミ平均の推移</h3>
            <p className="font-sans text-[10px] text-warmMuted mb-3">直近の口コミ単体ではなく、14日間の平均の推移で「ブランド毀損の予兆」を検知します。</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ROLLING_AVG_14D_DATA} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8DCC8" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6B5B4F" }} />
                  <YAxis domain={[4.5, 5.0]} tick={{ fontSize: 11, fill: "#6B5B4F" }} tickFormatter={(v) => v.toFixed(1)} />
                  <Tooltip formatter={(v: number) => [v.toFixed(2), "14日平均"]} labelFormatter={(l) => `日付: ${l}`} />
                  <ReferenceLine y={SILENT_KILLER_THRESHOLD} stroke="#C9A962" strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="avg14d" stroke="#8BB4C9" strokeWidth={2} dot={{ r: 2 }} name="14日平均" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {SILENT_KILLER_ALERT && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 font-sans text-sm text-amber-800">
                <AlertTriangle size={18} className="flex-shrink-0" />
                <span><strong>ブランド毀損の予兆</strong> — 全体は高評価でも、直近14日間の平均が {LATEST_14D_AVG.toFixed(2)} に低下しています。要因確認と現場サポートを推奨します。</span>
              </div>
            )}
          </div>

          {/* 2. 称賛の連鎖 — 今週のベスト・プラクティス（店長の感動エピソードがAI要約され全店に配信） */}
          <div className="mb-8">
            <h3 className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles size={12} /> 称賛の連鎖 — 今週のベスト・プラクティス
            </h3>
            <p className="font-sans text-[10px] text-warmMuted mb-3">店長の「本日最高の顧客感動エピソード」をAIが要約し、全14店舗のダッシュボードに自動配信する仕組みです。</p>
            <ul className="space-y-3">
              {bestPractices.length > 0 ? bestPractices.map((bp, i) => (
                <li key={`${bp.storeId}-${i}`} className="flex gap-3 rounded-xl bg-champagneLight/20 p-4 border border-champagneLight/40">
                  <span className="font-sans text-xs font-medium text-champagne shrink-0">{bp.storeName}</span>
                  <p className="font-sans text-sm text-warmInk flex-1">{bp.summary}</p>
                  <span className="font-sans text-[10px] text-warmMuted shrink-0">{bp.date}</span>
                </li>
              )) : null}
              {MOCK_BEST_PRACTICES.map((bp, i) => (
                <li key={`mock-${i}`} className="flex gap-3 rounded-xl bg-champagneLight/20 p-4 border border-champagneLight/40">
                  <span className="font-sans text-xs font-medium text-champagne shrink-0">{bp.storeName}</span>
                  <p className="font-sans text-sm text-warmInk flex-1">{bp.summary}</p>
                  <span className="font-sans text-[10px] text-warmMuted shrink-0">{bp.date}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. 30分枠オペレーション — 接客時間・枠占有率・ステータス（Optimal / Delay Risk / Quality Risk） */}
          <div>
            <h3 className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider mb-2">30分枠オペレーション — 接客時間・枠占有率・効率ステータス</h3>
            <p className="font-sans text-[10px] text-warmMuted mb-3">30分という極限のタイムマネジメントの中で、一切の妥協なく4.9の満足度を叩き出しているプロフェッショナルな現場管理を数字で証明。枠内で「接客25〜28分＋お見送り・準備2〜5分」が完璧なオペレーションです。</p>
            <div className="overflow-x-auto">
              <table className="w-full font-sans text-sm">
                <thead>
                  <tr className="border-b border-champagneLight/50">
                    <th className="text-left py-2 px-3 font-semibold text-warmInk">店舗</th>
                    <th className="text-right py-2 px-3 font-semibold text-warmInk">平均接客時間</th>
                    <th className="text-right py-2 px-3 font-semibold text-warmInk">枠占有率</th>
                    <th className="text-right py-2 px-3 font-semibold text-warmInk">評価（★）</th>
                    <th className="text-center py-2 px-3 font-semibold text-warmInk">ステータス</th>
                  </tr>
                </thead>
                <tbody>
                  {STORES.map((s) => {
                    const serviceMin = AVG_SERVICE_TIME_BY_STORE[s.id] ?? 26;
                    const occupancy = slotOccupancyPct(serviceMin);
                    const isOptimal = serviceMin >= SERVICE_OPTIMAL_MIN && serviceMin <= SERVICE_OPTIMAL_MAX;
                    const isDelayRisk = serviceMin >= SERVICE_DELAY_RISK_MIN;
                    const isQualityRisk = serviceMin < SERVICE_QUALITY_RISK_MAX;
                    const statusLabel = isDelayRisk ? "Delay Risk（遅延リスクあり）" : isQualityRisk ? "Quality Risk（接客不足の懸念）" : isOptimal ? "Optimal（最適）" : "—";
                    const statusClass = isDelayRisk ? "bg-rose-100 text-rose-800" : isQualityRisk ? "bg-amber-100 text-amber-800" : isOptimal ? "bg-emerald-100 text-emerald-800" : "text-warmMuted";
                    return (
                      <tr key={s.id} className="border-b border-champagneLight/30">
                        <td className="py-2 px-3 font-medium text-warmInk">{s.name}</td>
                        <td className="py-2 px-3 text-right tabular-nums text-warmInk">{serviceMin} 分</td>
                        <td className="py-2 px-3 text-right tabular-nums text-champagne font-medium">{occupancy} %</td>
                        <td className="py-2 px-3 text-right tabular-nums text-warmInk">★ {s.rating.toFixed(1)}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusClass}`}>
                            {isOptimal && "✓ "}
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="font-sans text-[10px] text-warmMuted mt-3">※ 25〜29分＝Optimal（最適・緑）、30分以上＝Delay Risk（遅延リスク・赤）、20分未満＝Quality Risk（接客不足の懸念・黄）。枠占有率＝(接客＋お見送り・準備2分)／30分で、30分枠を無駄なく使えている割合です。</p>
          </div>
        </div>
      </div>

      {/* Staff Education & Quality Control — 教育が楽になる、SVが一目で動ける */}
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="bg-cream rounded-2xl p-6 md:p-8 border border-champagneLight/50 card-shadow">
          <div className="flex items-center gap-2 font-sans font-semibold text-warmInk mb-1">
            <GraduationCap size={20} className="text-champagne" />
            Staff Education & Quality Control
          </div>
          <p className="font-sans text-sm text-warmMuted mb-6">
            習熟度・接客品質・AI提案の採用率を一画面で把握。SVが「あ、これで教育が楽になる」と直感できる設計です。
          </p>

          {/* 1. Education Matrix — 平均習熟度（%）＋ 育成日数 90日→30日 シミュレーション */}
          <div className="mb-8">
            <h3 className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider mb-3">Education Matrix — 店舗別 平均習熟度（%）</h3>
            <div className="space-y-3 mb-6">
              {STORES.map((s) => {
                const pct = STAFF_PROFICIENCY_BY_STORE[s.id] ?? 75;
                return (
                  <div key={s.id} className="flex items-center gap-3">
                    <span className="font-sans text-sm font-medium text-warmInk w-28 shrink-0">{s.name}</span>
                    <div className="flex-1 h-5 bg-champagneLight/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-champagne transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="font-sans text-sm tabular-nums font-semibold text-warmInk w-10 text-right">{pct} %</span>
                  </div>
                );
              })}
            </div>
            <div className="rounded-xl bg-champagneLight/20 border border-champagne/30 p-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider">未経験者 → 即戦力 平均育成日数</p>
                <p className="font-sans text-lg font-semibold text-warmInk mt-1">
                  現在 <span className="text-warmMuted line-through">{TRAINING_DAYS_CURRENT}日</span>
                  </p>
              </div>
              <span className="font-sans text-warmMuted">→</span>
              <div>
                <p className="font-sans text-xs font-medium text-champagne uppercase tracking-wider">目標（シミュレーション）</p>
                <p className="font-sans text-xl font-bold text-champagne mt-1">{TRAINING_DAYS_TARGET}日</p>
              </div>
              <p className="font-sans text-[10px] text-warmMuted w-full">教育コンテンツの標準化・OJT見える化で、育成期間を約1/3に短縮するシミュレーションです。</p>
            </div>
          </div>

          {/* 2. Quality Alert — 接客評価4.7以下の店舗 ＋ SV通知ボタン */}
          <div className="mb-8">
            <h3 className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <AlertTriangle size={12} className="text-amber-600" /> Quality Alert — 接客評価 4.7 以下の店舗
            </h3>
            {(() => {
              const alertStores = STORES.filter((s) => (SERVICE_RATING_BY_STORE[s.id] ?? 5) <= QUALITY_ALERT_SERVICE_THRESHOLD);
              return (
                <>
                  {alertStores.length > 0 ? (
                    <ul className="space-y-2 mb-4">
                      {alertStores.map((s) => (
                        <li key={s.id} className="flex items-center justify-between gap-3 rounded-lg bg-amber-50 border border-amber-200/60 px-4 py-2.5">
                          <span className="font-sans text-sm font-medium text-warmInk">{s.name}</span>
                          <span className="font-sans text-sm tabular-nums text-amber-800">接客評価 ★ {(SERVICE_RATING_BY_STORE[s.id] ?? 0).toFixed(1)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="font-sans text-sm text-warmMuted mb-4">現在、接客評価 4.7 以下の店舗はありません。</p>
                  )}
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl bg-champagne px-4 py-2.5 font-sans text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                    onClick={() => alert("SVへ通知を送信しました。")}
                  >
                    <Bell size={16} />
                    SVに通知
                  </button>
                </>
              );
            })()}
          </div>

          {/* 3. AI Recommendation Log — 採用率と顧客満足度向上の相関 */}
          <div>
            <h3 className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider mb-3">AI Recommendation Log — 調香レシピ採用率と顧客満足度向上</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={AI_RECOMMENDATION_LOG_DATA} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8DCC8" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#6B5B4F" }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#6B5B4F" }} tickFormatter={(v) => `${v}%`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#6B5B4F" }} tickFormatter={(v) => `+${v}%`} />
                  <Tooltip
                    formatter={(v: number, name: string) => [name === "adoptionRate" ? `${v} %` : `+${v} %`, name === "adoptionRate" ? "採用率" : "満足度向上"]}
                    labelFormatter={(l) => l}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="adoptionRate" name="採用率" fill="#8BB4C9" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="satisfactionLift" name="満足度向上" stroke="#C9A962" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="font-sans text-[10px] text-warmMuted mt-2">AI提案の調香レシピを採用する割合が上がるほど、顧客満足度の向上率も連動して伸びています。</p>
          </div>
        </div>
      </div>

      {/* Voice of Field（現場の声）— 数字だけでは見えない現場の真実を経営に活かす */}
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="bg-cream rounded-2xl p-6 md:p-8 border border-champagneLight/50 card-shadow">
          <div className="flex items-center gap-2 font-sans font-semibold text-warmInk mb-1">
            <Mic size={20} className="text-champagne" />
            Voice of Field（現場の声）
          </div>
          <p className="font-sans text-sm text-warmMuted mb-6">
            <strong className="text-warmInk">数字（PL・口コミ）</strong>と<strong className="text-champagne">現場の生の声</strong>を対比させることで、現場を疲弊させずに成長するための唯一無二の意思決定画面にします。
          </p>

          {/* 1. 社員満足度（ES）の可視化 — 5段階スコア、CS高でもES低なら燃え尽き予兆 */}
          <div className="mb-8">
            <h3 className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Heart size={12} className="text-rose-400" /> 社員満足度（ES）スコア（5段階）
            </h3>
            <p className="font-sans text-[10px] text-warmMuted mb-3">口コミ評価（CS）が5.0でも、ESが低い店舗は「燃え尽き症候群」の予兆として経営者に警告します。</p>
            <div className="overflow-x-auto">
              <table className="w-full font-sans text-sm">
                <thead>
                  <tr className="border-b border-champagneLight/50">
                    <th className="text-left py-2 px-3 font-semibold text-warmInk">店舗</th>
                    <th className="text-right py-2 px-3 font-semibold text-warmInk">CS（★）</th>
                    <th className="text-right py-2 px-3 font-semibold text-warmInk">ESスコア</th>
                    <th className="text-center py-2 px-3 font-semibold text-warmInk">備考</th>
                  </tr>
                </thead>
                <tbody>
                  {STORES.map((s) => {
                    const esScore = ES_SCORE_BY_STORE[s.id] ?? 4.0;
                    const isBurnoutRisk = esScore <= ES_BURNOUT_THRESHOLD && s.rating >= 4.8;
                    return (
                      <tr key={s.id} className="border-b border-champagneLight/30">
                        <td className="py-2 px-3 font-medium text-warmInk">{s.name}</td>
                        <td className="py-2 px-3 text-right tabular-nums text-warmInk">★ {s.rating.toFixed(1)}</td>
                        <td className="py-2 px-3 text-right tabular-nums text-warmInk">{esScore.toFixed(1)} / 5</td>
                        <td className="py-2 px-3 text-center">
                          {isBurnoutRisk ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800">
                              <AlertTriangle size={12} /> 燃え尽き症候群の予兆
                            </span>
                          ) : (
                            <span className="text-warmMuted text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. 現場の課題・提案BOX — 各店舗の最新3件が流れる */}
          <div className="mb-8">
            <h3 className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText size={12} /> 現場の課題・提案BOX
            </h3>
            <p className="font-sans text-[10px] text-warmMuted mb-3">各店舗のスタッフから寄せられた「仕事の課題（ボトルネック）」と「改善提案」の最新3件を表示します。</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto">
              {getVoiceItemsByStoreLatest3().map(({ storeId, storeName, items }) => (
                <div key={storeId} className="rounded-xl border border-champagneLight/50 bg-offwhite/60 p-4">
                  <p className="font-sans text-xs font-semibold text-champagne mb-2">{storeName}</p>
                  {items.length === 0 ? (
                    <p className="font-sans text-xs text-warmMuted">— 直近の投稿なし</p>
                  ) : (
                    <ul className="space-y-2">
                      {items.map((item, i) => (
                        <li key={`${storeId}-${i}`} className="flex gap-2 font-sans text-sm">
                          <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${item.type === "課題" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                            {item.type}
                          </span>
                          <span className="text-warmInk flex-1">{item.text}</span>
                          <span className="text-warmMuted text-[10px] shrink-0">{item.date}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 3. AI課題抽出 — 全社で解決すべき共通の課題トップ3 */}
          <div>
            <h3 className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap size={12} className="text-champagne" /> AI課題抽出 — 今、全社で解決すべき共通の課題
            </h3>
            <p className="font-sans text-[10px] text-warmMuted mb-3">全店舗から寄せられたテキストをAIが解析し、共通テーマをトップ3で提示します。</p>
            <ul className="space-y-3">
              {AI_TOP3_COMMON_ISSUES.map((issue) => (
                <li key={issue.rank} className="flex gap-3 rounded-xl bg-champagneLight/20 p-4 border border-champagneLight/40">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-champagne/30 text-champagne font-sans text-sm font-bold">
                    {issue.rank}
                  </span>
                  <div>
                    <p className="font-sans font-semibold text-warmInk">{issue.title}</p>
                    <p className="font-sans text-xs text-warmMuted mt-0.5">{issue.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Cash Runway & LTV vs CAC */}
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-cream rounded-2xl p-6 card-shadow border border-champagneLight/50">
            <div className="flex items-center gap-2 font-sans font-semibold text-warmInk mb-1">
              <Clock size={18} className="text-champagne" />
              Cash Runway（生存期間）
            </div>
            <p className="font-sans text-xs text-warmMuted mb-3">
              現在の現預金と固定費（人件費・家賃）から、売上ゼロでもあと何ヶ月存続できるかを表示します。
            </p>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-sans text-3xl font-bold text-champagne tabular-nums">{CASH_RUNWAY_MONTHS}</span>
              <span className="font-sans text-warmMuted">ヶ月</span>
            </div>
            <dl className="mt-3 font-sans text-xs text-warmMuted space-y-1">
              <div className="flex justify-between"><dt>現預金残高</dt><dd className="tabular-nums text-warmInk font-medium">{CASH_BALANCE_MAN.toLocaleString("ja-JP")} 万円</dd></div>
              <div className="flex justify-between"><dt>月間固定費（本部＋家賃）</dt><dd className="tabular-nums text-warmInk font-medium">{MONTHLY_FIXED_COST_NO_SALES_MAN.toLocaleString("ja-JP")} 万円</dd></div>
            </dl>
            <p className="font-sans text-[10px] text-warmMuted/90 mt-2">※銀行残高および未払金データとリアルタイム同期中</p>
          </div>
          <div className="bg-cream rounded-2xl p-6 card-shadow border border-champagneLight/50">
            <div className="flex items-center gap-2 font-sans font-semibold text-warmInk mb-1">
              <BarChart3 size={18} className="text-champagne" />
              LTV vs CAC
            </div>
            <p className="font-sans text-xs text-warmMuted mb-3">
              1人あたりの獲得コスト（CAC）に対し、生涯価値（LTV）の比率。{LTV_CAC_HEALTHY_THRESHOLD}以上で投資効率が健全です。
            </p>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className={`font-sans text-3xl font-bold tabular-nums ${LTV_CAC_RATIO >= LTV_CAC_HEALTHY_THRESHOLD ? "text-emerald-600" : "text-amber-600"}`}>
                {LTV_CAC_RATIO.toFixed(1)}
              </span>
              <span className="font-sans text-warmMuted">倍</span>
              <span className={`font-sans text-sm font-medium ${LTV_CAC_RATIO >= LTV_CAC_HEALTHY_THRESHOLD ? "text-emerald-600" : "text-amber-600"}`}>
                {LTV_CAC_RATIO >= LTV_CAC_HEALTHY_THRESHOLD ? "健全" : "要改善"}
              </span>
            </div>
            <dl className="mt-3 font-sans text-xs text-warmMuted space-y-1">
              <div className="flex justify-between"><dt>LTV（顧客生涯価値）</dt><dd className="tabular-nums text-warmInk font-medium">{(LTV_JPY / 10000).toFixed(1)} 万円</dd></div>
              <div className="flex justify-between"><dt>CAC（獲得単価）</dt><dd className="tabular-nums text-warmInk font-medium">{(CAC_JPY / 10000).toFixed(2)} 万円</dd></div>
            </dl>
          </div>
        </div>
      </div>

      {/* 全体KPI（売上・粗利・粗利率・客単価・予約・リピート意向率）+ Source */}
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        <div className="bg-cream rounded-2xl p-6 card-shadow border border-champagneLight/50 card-shadow-hover">
          <p className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider">今月売上</p>
          <div className="min-h-[52px] flex flex-col justify-center mt-1">
            {editMode ? (
              <input
                type="number"
                value={kpi.sales}
                onChange={(e) => setKpi((p) => ({ ...p, sales: Number(e.target.value) || 0 }))}
                className="font-sans text-2xl font-semibold text-warmInk w-full min-h-[44px] py-2.5 px-3 bg-offwhite border-2 border-champagneLight rounded-xl tabular-nums focus:outline-none focus:ring-2 focus:ring-champagne/40 focus:border-champagne"
              />
            ) : (
              <p className="font-sans text-2xl font-semibold text-warmInk py-0.5">{displaySales.toLocaleString("ja-JP")} 万円</p>
            )}
          </div>
          <SourceLabel source="POS System" />
        </div>
        <div className="bg-cream rounded-2xl p-6 card-shadow border border-champagneLight/50 card-shadow-hover">
          <p className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider">今月の想定粗利</p>
          <div className="min-h-[52px] flex flex-col justify-center mt-1">
            <p className="font-sans text-2xl font-semibold text-champagne py-0.5">{displayGrossProfit.toLocaleString("ja-JP")} 万円</p>
          </div>
          <SourceLabel source="Calculated" />
        </div>
        <div className="bg-cream rounded-2xl p-6 card-shadow border border-champagneLight/50 card-shadow-hover">
          <p className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider">粗利率</p>
          <div className="min-h-[52px] flex flex-col justify-center mt-1">
            {editMode ? (
              <input
                type="number"
                value={kpi.grossMarginRate}
                onChange={(e) => setKpi((p) => ({ ...p, grossMarginRate: Number(e.target.value) || 0 }))}
                className="font-sans text-2xl font-semibold text-warmInk w-full min-h-[44px] py-2.5 px-3 bg-offwhite border-2 border-champagneLight rounded-xl tabular-nums focus:outline-none focus:ring-2 focus:ring-champagne/40 focus:border-champagne"
              />
            ) : (
              <p className="font-sans text-2xl font-semibold text-warmInk py-0.5">{displayMarginRate.toFixed(0)} %</p>
            )}
          </div>
          <SourceLabel source="Manual Input" />
        </div>
        <div className="bg-cream rounded-2xl p-6 card-shadow border border-champagneLight/50 card-shadow-hover">
          <p className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider">平均客単価</p>
          <div className="min-h-[52px] flex flex-col justify-center mt-1">
            {editMode ? (
              <input
                type="number"
                value={kpi.avgOrder}
                onChange={(e) => setKpi((p) => ({ ...p, avgOrder: Number(e.target.value) || 0 }))}
                className="font-sans text-2xl font-semibold text-warmInk w-full min-h-[44px] py-2.5 px-3 bg-offwhite border-2 border-champagneLight rounded-xl tabular-nums focus:outline-none focus:ring-2 focus:ring-champagne/40 focus:border-champagne"
              />
            ) : (
              <p className="font-sans text-2xl font-semibold text-warmInk py-0.5">{displayAvgOrder.toLocaleString("ja-JP")} 円</p>
            )}
          </div>
          <SourceLabel source="POS System" />
        </div>
        <div className="bg-cream rounded-2xl p-6 card-shadow border border-champagneLight/50 card-shadow-hover">
          <p className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider">予約充足率</p>
          <div className="min-h-[52px] flex flex-col justify-center mt-1">
            {editMode ? (
              <input
                type="number"
                step="0.1"
                value={kpi.fillRate}
                onChange={(e) => setKpi((p) => ({ ...p, fillRate: Number(e.target.value) || 0 }))}
                className="font-sans text-2xl font-semibold text-warmInk w-full min-h-[44px] py-2.5 px-3 bg-offwhite border-2 border-champagneLight rounded-xl tabular-nums focus:outline-none focus:ring-2 focus:ring-champagne/40 focus:border-champagne"
              />
            ) : (
              <p className="font-sans text-2xl font-semibold text-warmInk py-0.5">{displayFillRate.toFixed(1)} %</p>
            )}
          </div>
          <SourceLabel source="Reservation System" />
        </div>
        <div className="bg-cream rounded-2xl p-6 card-shadow border border-champagneLight/50 card-shadow-hover">
          <p className="font-sans text-xs font-medium text-warmMuted uppercase tracking-wider">リピート意向率</p>
          <div className="min-h-[52px] flex flex-col justify-center mt-1">
            {editMode ? (
              <input
                type="number"
                step="0.1"
                value={kpi.repeatRate}
                onChange={(e) => setKpi((p) => ({ ...p, repeatRate: Number(e.target.value) || 0 }))}
                className="font-sans text-2xl font-semibold text-warmInk w-full min-h-[44px] py-2.5 px-3 bg-offwhite border-2 border-champagneLight rounded-xl tabular-nums focus:outline-none focus:ring-2 focus:ring-champagne/40 focus:border-champagne"
              />
            ) : (
              <p className="font-sans text-2xl font-semibold text-warmInk py-0.5">{displayRepeatRate.toFixed(1)} %</p>
            )}
          </div>
          <SourceLabel source="Survey" />
        </div>
        </div>
      </div>

      {/* 年間売上・利益推移 */}
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="bg-cream rounded-2xl p-6 md:p-8 card-shadow border border-champagneLight/50">
        <h2 className="font-sans text-lg font-semibold text-warmInk mb-1">年間売上・利益推移</h2>
        <p className="font-sans text-sm text-warmMuted mb-1">月ごとの売上と想定粗利（粗利率 {displayMarginRate} % で算出）。</p>
        <p className="font-sans text-[10px] text-warmMuted/80 mb-6">Source: POS System 🔗 月次集計</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={yearlyDisplayData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="areaSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8BB4C9" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#8BB4C9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="areaProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C9A962" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#C9A962" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8DCC8" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B5B4F" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6B5B4F" }} tickFormatter={(v) => `${v}万`} />
              <Tooltip
                contentStyle={{ fontFamily: "var(--font-dm-sans)", borderRadius: 12, border: "1px solid #E8DCC8" }}
                formatter={(value: number, name: string) => [name === "売上" ? `${value} 万円` : `想定粗利 ${value} 万円`, name]}
                labelFormatter={(label) => ` ${label}`}
              />
              <Legend formatter={(value) => (value === "売上" ? "売上（万円）" : "想定粗利（万円）")} />
              <Area type="monotone" dataKey="売上" fill="url(#areaSales)" stroke="#8BB4C9" strokeWidth={2} name="売上" />
              <Area type="monotone" dataKey="利益" fill="url(#areaProfit)" stroke="#C9A962" strokeWidth={2} name="利益" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        </div>
      </div>

      {/* 店舗別 売上・利益・顧客評価（全14店舗・横スクロール）— PL と評判を同一画面で */}
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="bg-cream rounded-2xl p-6 md:p-8 card-shadow border border-champagneLight/50">
        <h2 className="font-sans text-lg font-semibold text-warmInk mb-1">店舗別 売上・利益・顧客評価</h2>
        <p className="font-sans text-sm text-warmMuted mb-1">全14店舗。利益は高いが評価が低い店舗を一目で発見できます。</p>
        <p className="font-sans text-[10px] text-warmMuted/80 mb-1">Source: POS System 🔗 店舗別集計 / Source: Google Business Profile API 🔗 (Real-time)</p>
        <p className="font-sans text-[10px] text-champagne/90 mb-4 flex items-center gap-1">
          ← 横にスクロールして全14店舗を表示
        </p>
        <div className="scroll-area-hint-wrap">
          <div className="overflow-x-auto overflow-y-visible pb-3 scroll-area-hint">
            <div className="h-64 inline-block" style={{ width: `${Math.max(800, STORES.length * 72)}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={storeChartData} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8DCC8" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#6B5B4F" }}
                  interval={0}
                  tickLine={false}
                />
                <YAxis yAxisId="L" tick={{ fontSize: 11, fill: "#6B5B4F" }} width={40} />
                <YAxis yAxisId="R" orientation="right" tick={{ fontSize: 11, fill: "#6B5B4F" }} width={40} />
                <Tooltip
                  contentStyle={{ fontFamily: "var(--font-dm-sans)", borderRadius: 12, border: "1px solid #E8DCC8" }}
                  formatter={(value: number, name: string, props: { payload?: { 評価?: number; qualityAlert?: boolean } }) => {
                    if (name === "売上（万円）") return [`${Number(value).toLocaleString("ja-JP")} 万円`, name];
                    if (name === "想定粗利（万円）") return [`${Number(value).toLocaleString("ja-JP")} 万円`, name];
                    return [`${Number(value).toLocaleString("ja-JP")} 千円`, name];
                  }}
                  labelFormatter={(_, payload) => {
                    const p = payload[0]?.payload;
                    const rating = p?.評価 != null ? ` ★ ${p.評価.toFixed(1)} / 5.0${p?.qualityAlert ? " ⚠品質改善" : ""}` : "";
                    return `${payload[0]?.payload?.name ?? ""}${rating}`;
                  }}
                />
                <Bar yAxisId="L" dataKey="売上" fill="#8BB4C9" radius={[4, 4, 0, 0]} name="売上（万円）" />
                <Bar yAxisId="L" dataKey="利益" fill="#C9A962" radius={[4, 4, 0, 0]} name="想定粗利（万円）">
                  <LabelList
                    dataKey="評価"
                    position="bottom"
                    fontSize={10}
                    fill="#6B5B4F"
                    formatter={(v: number, _name: string, props: { payload?: { qualityAlert?: boolean } }) => (props?.payload?.qualityAlert ? `★${v} ⚠` : `★ ${v}`)}
                  />
                </Bar>
                <Bar yAxisId="R" dataKey="客単価" fill="#7A9B76" radius={[4, 4, 0, 0]} name="客単価（千円）" />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* 14店舗カード — Trust Score・殿堂入り・Perfect Performance */}
      <div className="w-full max-w-6xl mx-auto px-4">
        <div>
        <h2 className="font-sans text-lg font-semibold text-warmInk mb-1">店舗一覧</h2>
        <p className="font-sans text-sm text-warmMuted mb-6">一人ひとりの接客が、お客様の「唯一無二」を作っています。数値はPOS連携データです。30分枠で接客25〜28分＋お見送り・準備2〜5分の完璧オペレーションで4.9を維持。</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {STORES.map((store) => (
            <div
              key={store.id}
              className={`rounded-2xl p-5 card-shadow card-shadow-hover border transition-silent flex flex-col ${
                store.isLegendary ? "bg-gradient-to-br from-champagne/20 to-cream border-champagne/60 ring-1 ring-champagne/30" : "bg-cream border-champagneLight/50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-sans font-semibold text-warmInk text-sm">{store.name}</h3>
                <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800" title="30分枠で接客25〜28分＋お見送り・準備。枠占有率90%以上で一切の妥協なく4.9を叩き出し">
                    Perfect Performance
                  </span>
                  {store.isLegendary && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-champagne/30 text-champagne border border-champagne/50" title="殿堂入り（Legendary Status）— 口コミ数万件規模">
                      ✦ 殿堂入り
                    </span>
                  )}
                  {store.qualityAlert && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800" title="ブランド毀損の緊急警報（Red Alert）— 評価4.8未満">
                      <AlertTriangle size={12} /> Red Alert
                    </span>
                  )}
                  {store.risk !== "none" && (
                    <span
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${
                        store.risk === "high"
                          ? "bg-rose-100 text-rose-800"
                          : store.risk === "medium"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-sage/20 text-sage"
                      }`}
                      title="離職リスク"
                    >
                      <Users size={12} /> リスク
                    </span>
                  )}
                  {(store.stock === "low" || store.stock === "alert") && (
                    <span
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${
                        store.stock === "alert" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                      }`}
                      title="在庫アラート"
                    >
                      <Package size={12} /> 在庫
                    </span>
                  )}
                </div>
              </div>
              <dl className="mt-4 space-y-2 font-sans text-xs text-warmMuted">
                <div className="flex justify-between">
                  <span>売上</span>
                  <span className="text-warmInk font-medium font-sans">{store.sales.toLocaleString("ja-JP")} 万円</span>
                </div>
                {/* 月次目標達成率（月初〜今日の累計実績 ÷ 月次目標） */}
                {(() => {
                  const storeTarget = targets.storeTargets.find((t) => t.storeId === store.id);
                  const tgt = storeTarget?.monthlySalesTarget ?? store.sales;
                  // 累計実績 = 月次目標 × 経過日数比率 × 現在ペース（salesWoW）
                  const salesActual = Math.round(store.sales * MTD_ELAPSED_RATIO * store.salesWoW);
                  const rate = tgt > 0 ? (salesActual / tgt) * 100 : 0;
                  return (
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <span>月初累計進捗率</span>
                        <span className={`font-semibold tabular-nums ${achievementTextClass(rate)}`}>
                          {rate.toFixed(1)} %
                        </span>
                      </div>
                      <div className="h-1.5 bg-champagneLight/40 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${achievementBarClass(rate)}`}
                          style={{ width: `${Math.min(100, rate)}%` }}
                        />
                      </div>
                      <p className="text-warmMuted/70 mt-0.5">累計 {salesActual.toLocaleString("ja-JP")} 万円 / 目標 {tgt.toLocaleString("ja-JP")} 万円</p>
                    </div>
                  );
                })()}
                <div className="flex justify-between">
                  <span>客単価</span>
                  <span className="text-warmInk font-medium font-sans">{(store.avgOrder / 10000).toFixed(1)} 万</span>
                </div>
                <div className="flex justify-between">
                  <span>予約充足率</span>
                  <span className="text-warmInk font-medium font-sans">{store.fillRate.toLocaleString("ja-JP")} %</span>
                </div>
                <div className="flex justify-between">
                  <span>リピート意向率</span>
                  <span className="text-warmInk font-medium font-sans">{store.repeatRate.toLocaleString("ja-JP")} %</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-0.5"><Star size={10} className="text-amber-500" /> Rating</span>
                  <span className={`font-medium font-sans tabular-nums ${store.qualityAlert ? "text-amber-700" : "text-warmInk"}`}>
                    {store.rating.toFixed(1)} / 5.0
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>口コミ総数</span>
                  <span className="text-warmInk font-medium font-sans tabular-nums">{store.totalReviews.toLocaleString("ja-JP")} 件</span>
                </div>
                <div className="flex justify-between">
                  <span>Trust Score</span>
                  <span className="text-champagne font-semibold font-sans tabular-nums">{(store.trustScore ?? store.totalReviews * store.rating).toLocaleString("ja-JP")}</span>
                </div>
                <div className="flex justify-between">
                  <span>枠占有率</span>
                  <span className="text-warmInk font-medium font-sans tabular-nums">{slotOccupancyPct(AVG_SERVICE_TIME_BY_STORE[store.id] ?? 26)} %</span>
                </div>
              </dl>
              <p className="font-sans text-[10px] text-warmMuted/80 mt-2">Google Business Profile API 🔗 / 30分枠オペレーション（接客＋お見送り・準備）</p>
            </div>
          ))}
        </div>
        </div>
      </div>

      {/* AI検知サマリ */}
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="bg-warmInk rounded-2xl p-6 md:p-8 text-cream border border-champagne/20">
        <div className="flex items-center gap-2 font-sans font-semibold mb-3 text-champagneLight">
          <AlertTriangle size={18} />
          AI検知サマリ
        </div>
        <ul className="font-sans text-sm space-y-2 text-cream/90">
          <li>・14店舗の実数に基づく異常検知。評価4.8未満でRed Alert、Trust Score・殿堂入りで健全性を可視化。</li>
          <li>・30分枠オペレーション: 接客25〜28分＋お見送り・準備2〜5分で枠占有率90〜97%。Optimal／Delay Risk／Quality Riskで効率を可視化。</li>
        </ul>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4">
        <StrategicManagementLedger />
      </div>

      {/* ========== 目標管理・達成進捗（Target & Achievement Management） ========== */}
      <div className="w-full max-w-6xl mx-auto px-4">
        <GoalManagementSection
          editMode={editMode}
          targets={targets}
          displaySales={displaySales}
          displayGrossProfit={displayGrossProfit}
          stores={STORES}
          updateStoreTarget={updateStoreTarget}
          updateAnnualTarget={updateAnnualTarget}
          resetTargets={resetTargets}
        />
      </div>

      <div className="w-full max-w-6xl mx-auto px-4">
        <FullSpectrumFinancialLedger
          grossMarginRate={displayMarginRate}
          storeList={STORES}
          targets={targets}
          corporateProjected={STORES.reduce((a, s) => a + Math.round(s.sales * s.salesWoW), 0)}
        />
      </div>
    </div>
  );
}
