"use client";

/**
 * ProgressRing — SVGベースの円形プログレスインジケーター
 * 達成率に応じてシャンパンゴールド（達成中）/ エメラルド（達成）/ ローズ（要注意）で表示。
 */

type ProgressRingProps = {
  /** 達成率（%）。100超も正しく表示。 */
  rate: number;
  /** リングの直径（px）。デフォルト 72。 */
  size?: number;
  /** リングの下に表示するKPIラベル */
  label: string;
  /** リングの下に表示する実績値 */
  value: string;
};

const RADIUS = 28;
const STROKE_WIDTH = 7;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 175.9

function ringStrokeColor(rate: number): string {
  if (rate >= 100) return "#C9A962";  // champagne gold  — 達成（超過）
  if (rate >= 80)  return "#f59e0b";  // amber-400       — 警告（80〜99%）
  if (rate >= 60)  return "#f43f5e";  // rose-500        — 危機（60〜79%）
  return "#be123c";                   // rose-700        — 深刻（〜59%）
}

function ringTextColor(rate: number): string {
  if (rate >= 100) return "#B8942A";  // champagne-dark gold
  if (rate >= 80)  return "#d97706";  // amber-600
  if (rate >= 60)  return "#e11d48";  // rose-600
  return "#9f1239";                   // rose-800
}

export default function ProgressRing({
  rate,
  size = 72,
  label,
  value,
}: ProgressRingProps) {
  const clampedRate = Math.min(100, Math.max(0, rate));
  const dashOffset = CIRCUMFERENCE * (1 - clampedRate / 100);
  const center = size / 2;
  const strokeColor = ringStrokeColor(rate);
  const textColor = ringTextColor(rate);

  return (
    <div className="flex flex-col items-center gap-1">
      {/* SVGリング */}
      <div style={{ width: size, height: size }} className="relative flex-shrink-0">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* 背景トラック */}
          <circle
            cx={center}
            cy={center}
            r={RADIUS}
            fill="none"
            stroke="#E8DCC8"
            strokeWidth={STROKE_WIDTH}
          />
          {/* 進捗アーク */}
          <circle
            cx={center}
            cy={center}
            r={RADIUS}
            fill="none"
            stroke={strokeColor}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.7s ease, stroke 0.4s ease" }}
          />
        </svg>
        {/* 中央テキスト（回転を戻す） */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-sans text-[11px] font-bold tabular-nums leading-none"
            style={{ color: textColor }}
          >
            {Math.round(rate)}%
          </span>
        </div>
      </div>
      {/* ラベル & 実績値 */}
      <p className="font-sans text-[9px] text-warmMuted text-center leading-tight">{label}</p>
      <p className="font-sans text-[10px] font-semibold text-warmInk text-center tabular-nums leading-tight">{value}</p>
    </div>
  );
}
