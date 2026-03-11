"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

const TOP_OPTIONS = ["ベルガモット", "ラベンダー", "オレンジ", "ペパーミント", "ローズマリー", "レモン"];
const MIDDLE_OPTIONS = ["ジャスミン", "イランイラン", "ローズ", "ネロリ", "フレンジパニ", "ゼラニウム"];
const BASE_OPTIONS = ["サンダルウッド", "バニラ", "ムスク", "パチュリ", "シダーウッド", "トンカビーン"];

const MOCK_ADVICE = [
  "この配合なら、最後に**サンダルウッド**を一滴足すと深みが増します。",
  "トップの華やかさを活かすため、ミドルは控えめに。ベースでふんわりまとめるのがおすすめです。",
  "お客様の「落ち着いた甘さ」のご要望には、ベースに**トンカビーン**を0.5滴追加すると響きやすいです。",
];

export default function AIAlchemist() {
  const [top, setTop] = useState("");
  const [middle, setMiddle] = useState("");
  const [base, setBase] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ratio: string; advice: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!top || !middle || !base) return;
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      const ratio = `${2 + (top.length % 2)}:${3 + (middle.length % 2)}:${2 + (base.length % 2)}`;
      const advice = MOCK_ADVICE[Math.floor(Math.random() * MOCK_ADVICE.length)];
      setResult({ ratio, advice });
      setLoading(false);
    }, 120);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-warmInk tracking-tight">
          AI-Alchemist
        </h1>
        <p className="font-sans text-warmMuted mt-2">
          新人教育・調香アシスタント — 数万の成功データから黄金比率を算出
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="font-sans text-sm font-medium text-warmInk block mb-2">Top（トップノート）</label>
            <select
              value={top}
              onChange={(e) => setTop(e.target.value)}
              className="w-full rounded-xl border border-champagneLight bg-cream px-4 py-3 font-sans text-warmInk focus:outline-none focus:ring-2 focus:ring-champagne/30"
            >
              <option value="">選択</option>
              {TOP_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-sans text-sm font-medium text-warmInk block mb-2">Middle（ミドルノート）</label>
            <select
              value={middle}
              onChange={(e) => setMiddle(e.target.value)}
              className="w-full rounded-xl border border-champagneLight bg-cream px-4 py-3 font-sans text-warmInk focus:outline-none focus:ring-2 focus:ring-champagne/30"
            >
              <option value="">選択</option>
              {MIDDLE_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-sans text-sm font-medium text-warmInk block mb-2">Base（ベースノート）</label>
            <select
              value={base}
              onChange={(e) => setBase(e.target.value)}
              className="w-full rounded-xl border border-champagneLight bg-cream px-4 py-3 font-sans text-warmInk focus:outline-none focus:ring-2 focus:ring-champagne/30"
            >
              <option value="">選択</option>
              {BASE_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={!top || !middle || !base || loading}
          className="flex items-center gap-2 px-6 py-3 bg-champagne text-cream rounded-xl font-sans font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-silent hover:opacity-90"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              算出中...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              黄金比率を算出（0.1秒）
            </>
          )}
        </button>
      </form>

      {result && (
        <div className="bg-cream rounded-2xl p-6 card-shadow border border-champagneLight/50 space-y-4 transition-silent">
          <h2 className="font-sans text-lg font-semibold text-warmInk">AI提案</h2>
          <div className="flex items-baseline gap-2">
            <span className="font-sans text-sm text-warmMuted">推奨比率（Top : Middle : Base）</span>
            <span className="font-sans text-2xl font-semibold text-champagne">{result.ratio}</span>
          </div>
          <p className="font-sans text-warmInk leading-relaxed">
            {result.advice.split("**").map((part, i) =>
              i % 2 === 1 ? <strong key={i} className="font-semibold text-warmInk">{part}</strong> : part
            )}
          </p>
          <p className="font-sans text-xs text-warmMuted">
            数万件の成功配合データに基づくベテラン調香師の知見を再現した提案です。
          </p>
        </div>
      )}
    </div>
  );
}
