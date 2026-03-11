"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";

type PhaseId = "acquisition" | "store" | "ltv";

type LedgerRow = {
  id: string;
  phaseId: PhaseId;
  phaseLabel: string;
  metric: string;
  purpose: string;
  current: number;
  target: number;
  unit: string;
  lowerIsBetter?: boolean;
  aiActions: string[];
};

const LEDGER_ROWS: LedgerRow[] = [
  {
    id: "reservation-reach",
    phaseId: "acquisition",
    phaseLabel: "集客フェーズ",
    metric: "予約サイト到達数",
    purpose: "LINE登録の先の「来店意思」を管理する",
    current: 42800,
    target: 50000,
    unit: "セッション",
    aiActions: [
      "広島・仙台は予約LPへの流入が他店の約6割です。今週中に、Instagramストーリーズの1本目を「予約はこちら」に固定するよう店長へ指示を出してください。MY ONLY FRAGRANCEの世界観は「静寂とパーソナル」— その入口を一歩でも近づけます。",
      "金沢・札幌は検索流入はあるがCVRが伸びていません。LPのファーストビューに「所要時間」「料金」を明記し、「来店の一歩」を後押しする。明日の営業開始までに反映を。",
    ],
  },
  {
    id: "cvr",
    phaseId: "acquisition",
    phaseLabel: "集客フェーズ",
    metric: "予約完了率（CVR）",
    purpose: "LINE登録の先の「来店意思」を管理する",
    current: 78,
    target: 85,
    unit: "%",
    aiActions: [
      "表参道・銀座はCVR 92%超。この2店の「キャプション・画像・流れ」をベストプラクティスとして取りまとめ、今週金曜までに全店へ共有してください。同じ体験の入り口を、全店で。",
      "CVR 75%未満の4店舗には、予約ボタンまでのスクロールを短くした専用LPをA/Bテストで投入。担当者に「今月の最優先」として伝え、毎週進捗を確認する。",
    ],
  },
  {
    id: "cancellation",
    phaseId: "acquisition",
    phaseLabel: "集客フェーズ",
    metric: "キャンセル率",
    purpose: "LINE登録の先の「来店意思」を管理する",
    current: 8.2,
    target: 5,
    unit: "%",
    lowerIsBetter: true,
    aiActions: [
      "キャンセル率が高い店舗では、予約確定から24時間以内のリマインドを必須にしてください。文言に「当日お持ちいただくもの」を入れ、来店イメージを具体化する。来店の約束を、私たちが丁寧に支えます。",
      "前日リマインドに「変更・キャンセルはこちら」を小さく添え、意思が固まっていないお客様の早期の意思表明を促す。当日キャンセルを減らし、本当に来たい方の枠を守る。",
    ],
  },
  {
    id: "avg-order",
    phaseId: "store",
    phaseLabel: "店舗フェーズ",
    metric: "平均客単価",
    purpose: "現場の「体験価値」を利益に変換する",
    current: 18400,
    target: 20000,
    unit: "円",
    aiActions: [
      "目標未達の店舗では、調香後の「ギフト用にもう1本」提案をスクリプト化し、来月から全スタッフに必須実施としてください。MY ONLY FRAGRANCEの体験は「唯一無二」— その価値を、もう一つの形で届ける。",
      "銀座・表参道の高単価接客を15分のロールプレイ動画に編集し、他店の朝礼で週1回視聴。『体験を言葉と振る舞いで伝える』を全店の共通言語にする。",
    ],
  },
  {
    id: "option-rate",
    phaseId: "store",
    phaseLabel: "店舗フェーズ",
    metric: "オプション選択率（ギフト等）",
    purpose: "現場の「体験価値」を利益に変換する",
    current: 62,
    target: 75,
    unit: "%",
    aiActions: [
      "「プレゼント用ラッピング」「ギフトボックス」をタブレット注文画面の最初に表示するようUI変更を依頼し、今月リリースを確定させてください。選ぶ喜びを、手の届く場所に。",
      "オプション選択率が低い時間帯は接客時間が短い傾向にあります。1客あたりの最低接客時間を店舗目標に組み込み、体験を言語化してからオプションを提示する流れを徹底する。",
    ],
  },
  {
    id: "service-efficiency",
    phaseId: "store",
    phaseLabel: "店舗フェーズ",
    metric: "接客時間効率",
    purpose: "現場の「体験価値」を利益に変換する",
    current: 88,
    target: 95,
    unit: "%",
    aiActions: [
      "空き枠の多い店舗では、1枠の長さを15分延長した「ゆったりコース」を設け、予約枠あたりの実接客完了率を上げてください。急がせない体験が、効率と満足の両立につながります。",
      "混雑店では事前アンケートで香りの方向性を把握し、当日のヒアリング時間を適正化。効率と満足度の両方を数値で追い、来月の振り返りで共有する。",
    ],
  },
  {
    id: "recipe-registration",
    phaseId: "ltv",
    phaseLabel: "LTVフェーズ",
    metric: "レシピ登録完了数",
    purpose: "ストックビジネス（100億への土台）の進捗を追う",
    current: 1240,
    target: 1500,
    unit: "件/月",
    aiActions: [
      "来店客のレシピ登録を「接客の最終ステップ」としてマニュアルに明記し、登録完了まで席を立たない運用を全店で徹底してください。MY ONLY FRAGRANCEの資産は、お客様のレシピ。その一件一件を、逃さない。",
      "登録時のメリット（「次回来店でレシピを呼び出し」「ルームスプレー注文で使える」）をPOPとスタッフの一言で統一。今週中に文言を確定し、来月1日から全店適用。",
    ],
  },
  {
    id: "ec-click-rate",
    phaseId: "ltv",
    phaseLabel: "LTVフェーズ",
    metric: "EC誘導クリック率",
    purpose: "ストックビジネス（100億への土台）の進捗を追う",
    current: 22,
    target: 35,
    unit: "%",
    aiActions: [
      "帰宅後メールの件名を「〇〇様のレシピが届きました」に統一し、本文1行目にECリンクを配置。クリック率の前月比を店舗別に共有し、来月の目標を「+5%」と明示する。",
      "接客終了時の「ご自宅でも同じ香りを」の一言とQRコード提示を必須化。クリック率が高い店舗のトーク例を全店に展開し、体験の「続き」を確実に届ける。",
    ],
  },
  {
    id: "repeat-cycle",
    phaseId: "ltv",
    phaseLabel: "LTVフェーズ",
    metric: "再来店サイクル",
    purpose: "ストックビジネス（100億への土台）の進捗を追う",
    current: 186,
    target: 150,
    unit: "日",
    lowerIsBetter: true,
    aiActions: [
      "再来店サイクルが180日超のお客様には、150日目に「レシピの熟成が進んでいます」メッセージとルームスプレー・詰め替えの案内を送信。静寂の先にある、もう一つの体験を届ける。",
      "90日・150日・210日の3タッチで「香りの変化」「ギフト」「自分用リピート」を切り分けて案内。担当店舗で送信文を最適化し、再来店の「蛇口」を一つずつ開く。",
    ],
  },
  {
    id: "recruitment-surplus",
    phaseId: "store",
    phaseLabel: "店舗フェーズ",
    metric: "採用戦略による創出利益の配分（キャッシュ・アロケーション）",
    purpose: "創出利益（85万円/月）を本部の戦略的人材投資の原資・賞与・次店舗に配分。資金配分の最適化報告",
    current: 100,
    target: 100,
    unit: "%",
    aiActions: [
      "<strong>ロジック（ROI）</strong>: 採用戦略による創出利益は月 85万円（エージェント費削減・内製化成果）。この 85万円/月 を「利益」で止めず、本部の高度採用費（BizReach 350万円）の原資として充当している。350万円 ÷ 85万円/月 ≒ 4ヶ月 で、創出利益が本部採用費を相殺していく構造。残りは賞与・次店舗投資に配分。単なるコスト削減ではなく、<strong>キャッシュ・アロケーションの最適化報告</strong>として共有してください。ダッシュボードの「採用戦略による創出利益の配分」で数字を確認できます。",
      "自社で採用できるブランド力があるからこそ、本部に投資できる原資が生まれている。現場の採用コスト 0円 を維持することで年間 1,000万円 以上の創出利益を生み、その一部を本部 350万円 に充当し、残りを賞与・出店に回す。この資金配分の最適化を、数字とテキストで示してください。",
    ],
  },
  {
    id: "expansion-15-30",
    phaseId: "store",
    phaseLabel: "成長フェーズ",
    metric: "15→30店舗 拡大投資配分",
    purpose: "利益余力（Real Net Profit）から次なる出店への投資配分を可視化する",
    current: 45,
    target: 50,
    unit: "%",
    aiActions: [
      "この利益余力（月間の Real Net Profit）から、15店舗→30店舗への拡大投資をどう配分するか。推奨: 最終純利益の45%を「次の出店に回せる予算」に充当し、25%を広告投資、30%を予備・リスク対応に。Full Spectrum Financial Ledger の「事業投資シミュレーター」で月次の具体額を確認してください。",
      "30店舗達成時には月次売上規模が約2倍になります。同じ粗利率・本部人件費構造を維持すれば、代表報酬を守りながらさらにキャッシュが積み上がる成長シナリオです。出店候補地の優先順位を「既存店の稼働率」「エリア重複」「立地単価」で評価し、今期の配分比率を決めてください。",
    ],
  },
  {
    id: "director-recruitment-roi",
    phaseId: "store",
    phaseLabel: "成長フェーズ",
    metric: "事業部長採用 投資回収（ROI）",
    purpose: "戦略的採用コスト（BizReach 350万円）の回収目安を可視化する",
    current: 2.5,
    target: 2.5,
    unit: "ヶ月で回収",
    aiActions: [
      "今月は本部の採用投資により一時的に利益が圧縮されているが、これは100億への『組織基盤』を作るための計画的投資です。<strong>ROIロジック</strong>: 採用戦略による創出利益 85万円/月 が、本部採用費 350万円 の原資。85万円 × 約4ヶ月 ≒ 350万円 で相殺される構造。創出利益で本部採用費を補填しているため、経営判断のノイズがなく一貫した数字で可視化されています。",
      "このOSによる経費削減とアップセル施策により、約 2.5ヶ月 で人材が生み出す付加価値で回収（ROI 100%）可能。350万円は創出利益（85万円/月）を原資とした投資先として隠さず表示し、「私はこの350万円以上の価値を組織に生み出す人材だ」という覚悟を候補者とエージェントに伝えてください。Full Spectrum Financial Ledger で原資・相殺のストーリーを確認できます。",
    ],
  },
];

/** 逆算型KPI: 目標に対する進捗（0–100）。lowerIsBetter の場合は「低いほど緑」になるよう逆算。 */
function progressPercent(row: LedgerRow): number {
  if (row.lowerIsBetter) {
    if (row.current <= 0) return 100;
    return Math.min(100, (row.target / row.current) * 100);
  }
  return Math.min(100, (row.current / row.target) * 100);
}

/** Higher = 緑 / 中間 = 黄 / Lower = 赤。lowerIsBetter 指標も「進捗が高い＝良い」で同じ色ロジック。 */
function progressColor(pct: number): string {
  if (pct >= 100) return "bg-emerald-400";
  if (pct >= 80) return "bg-amber-400";
  return "bg-rose-400";
}

function formatValue(row: LedgerRow): string {
  const n = row.current;
  if (row.unit === "%") return `${n.toFixed(1)} %`;
  if (row.unit === "円") return `${n.toLocaleString("ja-JP")} 円`;
  if (row.unit === "日") return `${n.toLocaleString("ja-JP")} 日`;
  return `${n.toLocaleString("ja-JP")} ${row.unit}`;
}

function formatTarget(row: LedgerRow): string {
  const n = row.target;
  if (row.unit === "%") return `${n} %`;
  if (row.unit === "円") return `${n.toLocaleString("ja-JP")} 円`;
  if (row.unit === "日") return `${n.toLocaleString("ja-JP")} 日`;
  return `${n.toLocaleString("ja-JP")} ${row.unit}`;
}

export default function StrategicManagementLedger() {
  const [modalRow, setModalRow] = useState<LedgerRow | null>(null);

  return (
    <section className="font-sans">
      <div className="rounded-2xl bg-warmInk overflow-hidden border border-champagne/20 card-shadow">
        <div className="p-5 md:p-6 border-b border-white/10">
          <h2 className="font-sans text-lg font-semibold text-white tracking-tight">
            Strategic Management Ledger（戦略管理表）
          </h2>
          <p className="font-sans text-sm text-white/70 mt-1">
            MY ONLY FRAGRANCE の100億戦略に直結する逆算型KPI。どの蛇口を締めれば利益につながるか、進捗バーで即判断できます。
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full font-sans text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left py-3 px-4 font-semibold text-white/90 w-32">フェーズ</th>
                <th className="text-left py-3 px-4 font-semibold text-white/90">指標</th>
                <th className="text-left py-3 px-4 font-semibold text-white/90 w-44">目的</th>
                <th className="text-right py-3 px-4 font-semibold text-white/90 w-24">実績</th>
                <th className="text-right py-3 px-4 font-semibold text-white/90 w-24">目標</th>
                <th className="py-3 px-4 font-semibold text-white/90 min-w-[200px]">進捗</th>
                <th className="text-center py-3 px-4 font-semibold text-white/90 w-28">AI Action</th>
              </tr>
            </thead>
            <tbody>
              {LEDGER_ROWS.map((row) => {
                const pct = progressPercent(row);
                const color = progressColor(pct);
                return (
                  <tr
                    key={row.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-silent"
                  >
                    <td className="py-3 px-4 text-white/70 font-medium">{row.phaseLabel}</td>
                    <td className="py-3 px-4 font-medium text-white">{row.metric}</td>
                    <td className="py-3 px-4 text-white/60 text-xs leading-relaxed">{row.purpose}</td>
                    <td className="py-3 px-4 text-right font-medium text-white tabular-nums">
                      {formatValue(row)}
                    </td>
                    <td className="py-3 px-4 text-right text-white/60 tabular-nums">
                      {formatTarget(row)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-white/15 rounded-full overflow-hidden min-w-[120px]">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${color}`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                        <span className="font-sans text-xs text-white/60 whitespace-nowrap tabular-nums w-12">
                          {pct >= 100 ? "達成" : `${pct.toFixed(0)} %`}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setModalRow(row)}
                        className="inline-flex items-center gap-1.5 font-sans font-medium text-warmInk bg-cream hover:bg-white border border-champagneLight rounded-lg px-3 py-1.5 text-xs transition-silent"
                      >
                        <Sparkles size={14} className="text-warmInk" />
                        AI Action
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalRow && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-warmInk/70 backdrop-blur-sm"
          onClick={() => setModalRow(null)}
        >
          <div
            className="bg-warmInk border border-champagne/30 rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="font-sans font-semibold text-white">
                {modalRow.metric} — 現場への指示出し案
              </h3>
              <button
                type="button"
                onClick={() => setModalRow(null)}
                className="p-1.5 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-silent"
                aria-label="閉じる"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4">
              <p className="font-sans text-xs text-white/60">
                MY ONLY FRAGRANCE の実績に基づく改善案。そのまま店舗・本部へ共有し、現場を動かす指示として使えます。
              </p>
              <ul className="space-y-3">
                {modalRow.aiActions.map((action, i) => (
                  <li key={i} className="flex gap-3 font-sans text-sm text-white/90 leading-relaxed">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-medium">
                      {i + 1}
                    </span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
