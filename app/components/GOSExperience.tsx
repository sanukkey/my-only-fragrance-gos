"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Easing ──────────────────────────────────────────────────────────────────
const easeSmoothOut = [0.33, 1, 0.68, 1] as const;
const easeGentle    = [0.22, 1, 0.36, 1] as const;
const easeWatercolor = [0.4, 0, 0.2, 1] as const;
const easeDropFall   = [0.25, 0.46, 0.45, 0.94] as const;

// ── Types ────────────────────────────────────────────────────────────────────
type Phase = "perfume" | "finished" | "titling" | "complete";
type Note  = "top" | "middle" | "base";
export type CategoryId = "floral" | "citrus" | "woody" | "spicy" | "herbal" | "ocean";

interface CategoryDef {
  id: CategoryId;
  label: string;
  note: Note;
  rgb: [number, number, number];
  layerRgba: string;
}

// ── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES: CategoryDef[] = [
  { id: "floral", label: "Floral", note: "middle", rgb: [255, 209, 220], layerRgba: "rgba(255,209,220,0.4)" },
  { id: "citrus", label: "Citrus", note: "top",    rgb: [255, 244,  79], layerRgba: "rgba(255,244,79,0.45)" },
  { id: "woody",  label: "Woody",  note: "base",   rgb: [193, 154, 107], layerRgba: "rgba(193,154,107,0.38)" },
  { id: "spicy",  label: "Spicy",  note: "middle", rgb: [255, 127,  80], layerRgba: "rgba(255,127,80,0.4)" },
  { id: "herbal", label: "Herbal", note: "middle", rgb: [172, 225, 175], layerRgba: "rgba(172,225,175,0.4)" },
  { id: "ocean",  label: "Ocean",  note: "top",    rgb: [125, 249, 255], layerRgba: "rgba(125,249,255,0.45)" },
];

// ── Amber / golden liquid color (from image_2 hand-bottle reference) ─────────
// 明るい黄金色アンバー: rgb(230,185,45) 系
const AMBER_DEEP      = "rgba(190, 142, 28, 0.90)";
const AMBER_MID       = "rgba(222, 182, 50, 0.84)";
const AMBER_BRIGHT    = "rgba(242, 202, 68, 0.74)";
const AMBER_DROP_TOP  = "rgba(245, 208, 72, 0.96)";
const AMBER_DROP_BOT  = "rgba(188, 140, 26, 0.88)";

// ── Helpers ───────────────────────────────────────────────────────────────────
function getRippleDuration(note: Note): number {
  switch (note) {
    case "top":    return 1.2;
    case "middle": return 1.8;
    case "base":   return 2.6;
  }
}

// ── Record types ──────────────────────────────────────────────────────────────
interface DropRecord      { id: number; categoryId: CategoryId; }
interface RippleRecord    { id: number; categoryId: CategoryId; duration: number; }
interface AccumulatedLayer { id: number; categoryId: CategoryId; }
interface ResonanceBurst  { id: number; }

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function GOSExperience() {
  const [phase, setPhase]                       = useState<Phase>("perfume");
  const [drops, setDrops]                       = useState<DropRecord[]>([]);
  const [ripples, setRipples]                   = useState<RippleRecord[]>([]);
  const [accumulatedLayers, setAccumulatedLayers] = useState<AccumulatedLayer[]>([]);
  const [resonanceBursts, setResonanceBursts]   = useState<ResonanceBurst[]>([]);
  const [isNamingActive, setIsNamingActive]     = useState(false);
  const [nameInput, setNameInput]               = useState("");
  const [engravedName, setEngravedName]         = useState<string | null>(null);
  const [isNameFinalized, setIsNameFinalized]   = useState(false);

  const handleCategoryClick = useCallback((categoryId: CategoryId) => {
    setDrops((prev) => [...prev, { id: Date.now(), categoryId }]);
  }, []);

  const handleDropLand = useCallback(
    (dropId: number, categoryId: CategoryId) => {
      const cat = CATEGORIES.find((c) => c.id === categoryId);
      if (!cat) return;
      const rid = Date.now();
      setDrops((prev) => prev.filter((d) => d.id !== dropId));
      setRipples((prev) => [...prev, { id: rid, categoryId, duration: getRippleDuration(cat.note) }]);
      setAccumulatedLayers((prev) => {
        const next = [...prev, { id: rid, categoryId }];
        if (next.length * 15 >= 90 && !isNamingActive && !isNameFinalized) {
          setPhase("finished");
          setIsNamingActive(true);
        }
        return next;
      });
      setResonanceBursts((prev) => [...prev, { id: rid }]);
      setTimeout(() => setResonanceBursts((prev) => prev.filter((b) => b.id !== rid)), 1400);
    },
    [isNamingActive, isNameFinalized]
  );

  const handleFinish = useCallback(() => {
    setPhase("finished");
    if (!isNamingActive && !isNameFinalized) setIsNamingActive(true);
  }, [isNamingActive, isNameFinalized]);

  const handleConfirmName = useCallback(() => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setEngravedName(trimmed);
    setIsNameFinalized(true);
    setIsNamingActive(false);
    setPhase("titling");
    setTimeout(() => setPhase("complete"), 4000);
  }, [nameInput]);

  const dropCount          = accumulatedLayers.length;
  // 1滴 = 15% 一気に上昇、最大 90%
  const liquidHeightPercent = Math.min(dropCount * 15, 90);

  return (
    <div
      className="fixed inset-0 w-full min-h-[100dvh] h-[100dvh] overflow-hidden touch-none select-none"
      style={{
        // image_2.png = 店舗コンクリート壁（背景）
        backgroundImage: 'url("/image_2.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#1a1208",
      }}
    >
      {/* 背景ダークオーバーレイ */}
      <div className="absolute inset-0 z-0 bg-black/40" aria-hidden />

      {/* フィナーレ: ブライトグラデーション */}
      <AnimatePresence mode="wait">
        {phase !== "perfume" && (
          <motion.div
            key="finale-bg"
            className="absolute inset-0 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, ease: easeSmoothOut }}
            style={{
              background:
                phase === "complete" || phase === "titling"
                  ? "linear-gradient(180deg, #FFF9F0 0%, #FFF5E8 30%, #FFFFFF 60%, #F0F8FF 100%)"
                  : buildFinaleGradient(accumulatedLayers),
            }}
          />
        )}
      </AnimatePresence>

      {/* スパークルパーティクル */}
      <AnimatePresence>
        {(phase === "finished" || phase === "titling" || phase === "complete") && (
          <SparkleParticles />
        )}
      </AnimatePresence>

      {/* ─── 中央レイアウト: ボトル + 雫 + 波紋 ─── */}
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <div className="relative flex items-center justify-center">

          {/* 波紋: アンバー色 */}
          {ripples.map((r) => (
            <motion.div
              key={`ripple-${r.id}`}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: "50%", top: "50%",
                transform: "translate(-50%, -50%)",
                background: "radial-gradient(circle, rgba(222,182,50,0.38) 0%, transparent 65%)",
              }}
              initial={{ width: 50, height: 50, opacity: 0.9 }}
              animate={{ width: 700, height: 700, opacity: 0 }}
              transition={{ duration: r.duration, ease: easeWatercolor }}
            />
          ))}

          {/* 雫: アンバー色 */}
          {drops.map((d) => (
            <AmberDrop
              key={d.id}
              onLand={() => handleDropLand(d.id, d.categoryId)}
            />
          ))}

          {/* ボトル本体 */}
          <ImageBottle
            phase={phase}
            liquidHeightPercent={liquidHeightPercent}
            resonanceBursts={resonanceBursts}
            engravedName={engravedName}
            isNameFinalized={isNameFinalized}
          />
        </div>
      </div>

      {/* ─── 命名オーバーレイ ─── */}
      <AnimatePresence>
        {isNamingActive && (
          <motion.div
            key="naming-overlay"
            className="absolute inset-0 z-40 flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: easeGentle }}
          >
            <div className="absolute inset-0 bg-black/55" />
            <div className="relative z-10 max-w-lg w-full border border-white/20 bg-black/75 rounded-2xl px-6 py-6 md:px-8 md:py-8">
              <p
                className="text-lg md:text-2xl text-white mb-5"
                style={{ fontFamily: "var(--font-shippori), serif" }}
              >
                この香りに、名前を授けてください。
              </p>
              <div className="flex flex-col md:flex-row gap-3 items-stretch">
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value.slice(0, 32))}
                  placeholder="例）Éternité, Dawn of You, No.13 Takao"
                  className="flex-1 rounded-lg px-4 py-3 text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/50"
                  style={{
                    fontFamily: "var(--font-shippori), serif",
                    background: "rgba(0,0,0,0.75)",
                    border: "1px solid rgba(255,255,255,0.35)",
                    color: "#FFFFFF",
                  }}
                  autoFocus
                />
                <button
                  onClick={handleConfirmName}
                  disabled={!nameInput.trim()}
                  className="px-5 py-3 rounded-lg font-sans text-xs tracking-[0.22em] uppercase transition-colors"
                  style={{
                    border: nameInput.trim() ? "1px solid rgba(255,255,255,0.55)" : "1px solid rgba(255,255,255,0.15)",
                    background: nameInput.trim() ? "rgba(255,255,255,0.15)" : "transparent",
                    color: nameInput.trim() ? "#FFFFFF" : "rgba(255,255,255,0.3)",
                    cursor: nameInput.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  刻印する
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 6カテゴリーボタン ─── */}
      <AnimatePresence>
        {phase === "perfume" && (
          <motion.div
            key="perfume-controls"
            className="absolute bottom-0 left-0 right-0 z-50 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex flex-col items-center gap-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.7, ease: easeGentle }}
          >
            <div className="flex flex-wrap justify-center gap-2 max-w-lg px-4">
              {CATEGORIES.map((cat) => (
                <motion.button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className="px-4 py-2.5 rounded-full font-sans text-xs tracking-widest uppercase border bg-white/80 backdrop-blur-sm shadow-sm"
                  style={{
                    borderColor: `rgba(${cat.rgb[0]},${cat.rgb[1]},${cat.rgb[2]},0.55)`,
                    color: `rgb(${Math.round(cat.rgb[0] * 0.45)},${Math.round(cat.rgb[1] * 0.45)},${Math.round(cat.rgb[2] * 0.45)})`,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                >
                  {cat.label}
                </motion.button>
              ))}
            </div>
            <motion.button
              onClick={handleFinish}
              disabled={dropCount === 0}
              className="px-10 py-3 rounded-full font-sans text-xs tracking-[0.32em] uppercase border transition-colors"
              style={{
                border: dropCount > 0 ? "1px solid rgba(100,100,100,0.6)" : "1px solid rgba(200,200,200,0.4)",
                background: dropCount > 0 ? "rgba(255,255,255,0.80)" : "rgba(255,255,255,0.45)",
                color: dropCount > 0 ? "#333" : "#999",
                cursor: dropCount > 0 ? "pointer" : "not-allowed",
              }}
              whileHover={dropCount > 0 ? { scale: 1.03 } : {}}
              whileTap={dropCount > 0 ? { scale: 0.98 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              完成（Finish）
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 雫: 常にアンバー黄金色
// ─────────────────────────────────────────────────────────────────────────────
function AmberDrop({ onLand }: { onLand: () => void }) {
  return (
    <motion.div
      className="absolute z-[25] pointer-events-none"
      style={{
        left: "50%",
        top: "0%",
        transform: "translate(-50%, 0%)",
        width: 16,
        height: 22,
        borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
        background: `linear-gradient(180deg, ${AMBER_DROP_TOP} 0%, ${AMBER_DROP_BOT} 100%)`,
        boxShadow: "0 2px 10px rgba(222,182,50,0.55)",
      }}
      initial={{ y: "-75vh", opacity: 1, scale: 1 }}
      animate={{ y: 0, opacity: 1, scale: [1, 1.06, 0.94] }}
      transition={{
        y:     { duration: 0.6, ease: easeDropFall },
        scale: { duration: 0.6, times: [0, 0.78, 1] },
      }}
      onAnimationComplete={onLand}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ボトル: image_4.png (560×754) をベースに琥珀色アンバーフィル
// ─────────────────────────────────────────────────────────────────────────────
// image_4.png のボトル本体領域:
//   水平: left=17% ~ right=21% (瓶本体のみ、タグ除外)
//   垂直: top=28% ~ bottom=3%  (ショルダー以下〜底面)
//   ラベル貼付位置: top=56% ~ bottom=22% (下部ガラス面)
function ImageBottle({
  phase,
  liquidHeightPercent,
  resonanceBursts,
  engravedName,
  isNameFinalized,
}: {
  phase: Phase;
  liquidHeightPercent: number;
  resonanceBursts: ResonanceBurst[];
  engravedName: string | null;
  isNameFinalized: boolean;
}) {
  const isFinished = phase !== "perfume";

  // 560 / 754 ≈ 0.743 → 190px × 256px (mobile), 230px × 310px (md)
  return (
    <motion.div
      className="relative w-[190px] h-[256px] md:w-[230px] md:h-[310px] flex-shrink-0"
      style={{
        filter: isFinished
          ? "drop-shadow(0 0 28px rgba(222,182,50,0.5)) drop-shadow(0 10px 36px rgba(0,0,0,0.25))"
          : "drop-shadow(0 4px 24px rgba(0,0,0,0.45))",
      }}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: isNameFinalized ? 1.05 : 1 }}
      transition={{ duration: 1, ease: easeGentle }}
    >
      {/* ボトル写真 */}
      <img
        src="/image_4.png"
        alt="MY ONLY FRAGRANCE"
        className="absolute inset-0 w-full h-full object-contain"
        style={{ userSelect: "none", pointerEvents: "none" }}
        draggable={false}
      />

      {/* アンバー液体フィル: ボトル胴体にクリップ、下から上に上昇 */}
      <div
        className="absolute overflow-hidden"
        style={{ left: "17%", right: "21%", top: "28%", bottom: "3%" }}
      >
        <motion.div
          className="absolute left-0 right-0 bottom-0"
          style={{
            background: `linear-gradient(0deg, ${AMBER_DEEP} 0%, ${AMBER_MID} 50%, ${AMBER_BRIGHT} 100%)`,
            mixBlendMode: "multiply",
          }}
          initial={{ height: 0 }}
          animate={{ height: `${liquidHeightPercent}%` }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {/* 刻印テキスト: ブラー・シャドウなし、純白、Shippori Mincho */}
      {engravedName && (
        <div
          className="absolute pointer-events-none flex items-center justify-center"
          style={{ left: "17%", right: "21%", top: "56%", bottom: "22%" }}
        >
          <span
            style={{
              fontFamily: "var(--font-shippori), serif",
              fontSize: "10px",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "#FFFFFF",
              display: "block",
              textAlign: "center",
              lineHeight: 1.5,
              // blur・shadow 一切なし
            }}
          >
            {engravedName}
          </span>
        </div>
      )}

      {/* 共鳴バースト: 液面でアンバーが弾ける */}
      <div
        className="absolute overflow-hidden pointer-events-none"
        style={{ left: "17%", right: "21%", top: "28%", bottom: "3%" }}
      >
        {resonanceBursts.map((b) => (
          <motion.div
            key={b.id}
            className="absolute rounded-full"
            style={{
              left: "50%",
              bottom: `${26 + (liquidHeightPercent / 100) * 36}%`,
              width: "80%",
              paddingBottom: "80%",
              marginLeft: "-40%",
              marginBottom: "-40%",
              background:
                "radial-gradient(circle, rgba(242,202,68,0.68) 0%, rgba(222,182,50,0.36) 40%, transparent 70%)",
              filter: "blur(5px)",
            }}
            initial={{ opacity: 0.88, scale: 0.2 }}
            animate={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 1.1, ease: easeWatercolor }}
          />
        ))}
      </div>

      {/* 完成時: 黄金の光輪 */}
      <AnimatePresence>
        {isFinished && (
          <motion.div
            className="absolute -inset-6 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 100%, rgba(222,182,50,0.42) 0%, transparent 60%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, ease: easeSmoothOut }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// フィナーレグラデーション生成
// ─────────────────────────────────────────────────────────────────────────────
function buildFinaleGradient(layers: AccumulatedLayer[]): string {
  if (layers.length === 0) {
    return "radial-gradient(ellipse 140% 120% at 50% 40%, rgba(224,242,254,0.95) 0%, rgba(248,250,252,0.98) 70%, #F8FAFC 100%)";
  }
  const recent = layers.slice(-8);
  const stops = recent
    .map((layer, i) => {
      const cat = CATEGORIES.find((c) => c.id === layer.categoryId);
      if (!cat) return "";
      const pct = Math.round(20 + (i / Math.max(recent.length - 1, 1)) * 55);
      return `${cat.layerRgba} ${pct}%`;
    })
    .filter(Boolean)
    .join(", ");
  return `radial-gradient(ellipse 140% 120% at 50% 40%, ${stops}, rgba(248,250,252,0.92) 88%, #F8FAFC 100%)`;
}

// ─────────────────────────────────────────────────────────────────────────────
// スパークルパーティクル
// ─────────────────────────────────────────────────────────────────────────────
function SparkleParticles() {
  const count = 24;
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${8 + (i * 4.2) % 84}%`,
    delay: (i / count) * 3 + Math.random() * 2,
    duration: 6 + Math.random() * 4,
    size: 2 + Math.random() * 3,
    opacity: 0.3 + Math.random() * 0.5,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none z-[15] overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white"
          style={{
            left: p.left,
            bottom: "-4%",
            width: p.size,
            height: p.size,
            boxShadow: "0 0 6px rgba(255,255,255,0.9)",
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: "-120vh", opacity: [0, p.opacity, p.opacity, 0] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "linear",
            repeat: Infinity,
            repeatDelay: 0,
          }}
        />
      ))}
    </div>
  );
}
