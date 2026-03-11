"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// イージング
const easeOutExpo = [0.19, 1, 0.22, 1] as const;
const easeSmoothOut = [0.33, 1, 0.68, 1] as const;
const easeGentle = [0.22, 1, 0.36, 1] as const;
const easeInOutQuart = [0.76, 0, 0.24, 1] as const;
const easeWatercolor = [0.4, 0, 0.2, 1] as const;
const easeDropFall = [0.25, 0.46, 0.45, 0.94] as const; // 自然な落下

type Phase = "perfume" | "finished" | "titling" | "complete";
type Note = "top" | "middle" | "base";

export type CategoryId = "floral" | "citrus" | "woody" | "spicy" | "herbal" | "ocean";

interface CategoryDef {
  id: CategoryId;
  label: string;
  note: Note;
  rgb: [number, number, number];
  rgba: string;
  layerRgba: string;
}

/** 爽やか・透明感重視パレット（高級ブランド用） */
const CATEGORIES: CategoryDef[] = [
  { id: "floral", label: "Floral", note: "middle", rgb: [255, 209, 220], rgba: "rgba(255,209,220,0.85)", layerRgba: "rgba(255,209,220,0.4)" },
  { id: "citrus", label: "Citrus", note: "top", rgb: [255, 244, 79], rgba: "rgba(255,244,79,0.85)", layerRgba: "rgba(255,244,79,0.45)" },
  { id: "woody", label: "Woody", note: "base", rgb: [193, 154, 107], rgba: "rgba(193,154,107,0.8)", layerRgba: "rgba(193,154,107,0.38)" },
  { id: "spicy", label: "Spicy", note: "middle", rgb: [255, 127, 80], rgba: "rgba(255,127,80,0.8)", layerRgba: "rgba(255,127,80,0.4)" },
  { id: "herbal", label: "Herbal", note: "middle", rgb: [172, 225, 175], rgba: "rgba(172,225,175,0.8)", layerRgba: "rgba(172,225,175,0.4)" },
  { id: "ocean", label: "Ocean", note: "top", rgb: [125, 249, 255], rgba: "rgba(125,249,255,0.85)", layerRgba: "rgba(125,249,255,0.45)" },
];

/** image_1 風：瑞々しく鮮やかな黄金色（Rich Golden / Deep Amber） */
const LIQUID_GOLD = {
  deep: "#9A7B2E",
  rich: "#C9A227",
  mid: "#E5C158",
  bright: "#F5D97A",
  highlight: "#FFEB99",
  rgbaDeep: "rgba(154,123,46,0.94)",
  rgbaRich: "rgba(201,162,39,0.92)",
  rgbaMid: "rgba(229,193,88,0.9)",
  rgbaBright: "rgba(245,217,122,0.88)",
  rgbaHighlight: "rgba(255,235,153,0.85)",
};

function getRippleDuration(note: Note): number {
  switch (note) {
    case "top": return 1.2;
    case "middle": return 1.8;
    case "base": return 2.6;
  }
}

const SAMPLE_TITLE = "Éternité";
const BG_WHITE_TINT = "#F8FAFC";

interface DropRecord {
  id: number;
  categoryId: CategoryId;
}

interface RippleRecord {
  id: number;
  categoryId: CategoryId;
  duration: number;
}

interface AccumulatedLayer {
  id: number;
  categoryId: CategoryId;
}

interface ResonanceBurst {
  id: number;
  categoryId: CategoryId;
}

export default function GOSExperience() {
  const [phase, setPhase] = useState<Phase>("perfume");
  const [title, setTitle] = useState(SAMPLE_TITLE);
  const [drops, setDrops] = useState<DropRecord[]>([]);
  const [ripples, setRipples] = useState<RippleRecord[]>([]);
  const [accumulatedLayers, setAccumulatedLayers] = useState<AccumulatedLayer[]>([]);
  const [resonanceBursts, setResonanceBursts] = useState<ResonanceBurst[]>([]);
  const [isNamingActive, setIsNamingActive] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [engravedName, setEngravedName] = useState<string | null>(null);
  const [isNameFinalized, setIsNameFinalized] = useState(false);

  const handleCategoryClick = useCallback((categoryId: CategoryId) => {
    const id = Date.now();
    setDrops((prev) => [...prev, { id, categoryId }]);
  }, []);

  const handleDropLand = useCallback(
    (dropId: number, categoryId: CategoryId) => {
      const cat = CATEGORIES.find((c) => c.id === categoryId);
      if (!cat) return;
      const rippleId = Date.now();
      setDrops((prev) => prev.filter((d) => d.id !== dropId));
      setRipples((prev) => [...prev, { id: rippleId, categoryId, duration: getRippleDuration(cat.note) }]);
      setAccumulatedLayers((prev) => {
        const next = [...prev, { id: rippleId, categoryId }];
        const nextCount = next.length;
        if (nextCount * 15 >= 90 && !isNamingActive && !isNameFinalized) {
          setPhase("finished");
          setIsNamingActive(true);
        }
        return next;
      });
      setResonanceBursts((prev) => [...prev, { id: rippleId, categoryId }]);
      setTimeout(() => {
        setResonanceBursts((prev) => prev.filter((b) => b.id !== rippleId));
      }, 1400);
    },
    [isNamingActive, isNameFinalized]
  );

  const handleFinish = useCallback(() => {
    setPhase("finished");
    if (!isNamingActive && !isNameFinalized) {
      setIsNamingActive(true);
    }
  }, [isNamingActive, isNameFinalized]);

  const handleConfirmName = useCallback(() => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setEngravedName(trimmed);
    setTitle(trimmed);
    setIsNameFinalized(true);
    setIsNamingActive(false);
    setPhase("titling");
    setTimeout(() => setPhase("complete"), 4000);
  }, [nameInput]);

  const dropCount = accumulatedLayers.length;
  const hasAnyDrop = dropCount > 0;

  // 雫1滴あたり 15% ずつ正確に上昇（0% → 15% → 30% ...）、最大 90% で肩ラインに到達
  const liquidHeightPercent = Math.min(dropCount * 15, 90);

  return (
    <div
      className="fixed inset-0 w-full min-h-[100dvh] h-[100dvh] overflow-hidden touch-none select-none bg-black"
      style={{
        // ユーザー指定：最新の店舗画像 image_2.png をそのまま背景に使用
        backgroundImage: 'url("/image_2.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* 背景画像の上に、ごく薄いダークオーバーレイを敷いて視認性を確保 */}
      <div className="absolute inset-0 z-0 bg-black/30" aria-hidden />

      {/* フィナーレ：Bright World（白＋パステルグラデ） */}
      <AnimatePresence mode="wait">
        {phase !== "perfume" && (
          <motion.div
            key="gradient-bg"
            className="absolute inset-0 z-10 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, ease: easeSmoothOut }}
            style={{
              background: phase === "complete" || phase === "titling"
                ? "linear-gradient(180deg, #FFF9F0 0%, #FFF5E8 30%, #FFFFFF 60%, #F0F8FF 100%)"
                : buildFinaleGradient(accumulatedLayers),
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(phase === "finished" || phase === "titling" || phase === "complete") && (
          <SparkleParticles />
        )}
      </AnimatePresence>

      {/* レイアウト：画面中央にボトルと雫・波紋を集約（上下左右の完全中央） */}
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          {/* 波紋：ボトル中央で広がる */}
          {ripples.map((r) => {
            const cat = CATEGORIES.find((c) => c.id === r.categoryId);
            if (!cat) return null;
            return (
              <motion.div
                key={`ripple-${r.id}`}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  background: `radial-gradient(circle, ${cat.layerRgba} 0%, transparent 65%)`,
                  boxShadow: `0 0 60px rgba(${cat.rgb[0]},${cat.rgb[1]},${cat.rgb[2]},0.25)`,
                }}
                initial={{ width: 60, height: 60, opacity: 0.95 }}
                animate={{
                  width: 800,
                  height: 800,
                  opacity: 0,
                }}
                transition={{ duration: r.duration, ease: easeWatercolor }}
              />
            );
          })}
          {/* 一雫：画面上部中央からボトル中央へ落下 */}
          {drops.map((d) => (
            <TheDrop
              key={d.id}
              categoryId={d.categoryId}
              onLand={() => handleDropLand(d.id, d.categoryId)}
              landingXPercent={50}
            />
          ))}
          <GoldenBottle
            phase={phase}
            liquidHeightPercent={liquidHeightPercent}
            resonanceBursts={resonanceBursts}
            engravedName={engravedName}
            isNameFinalized={isNameFinalized}
          />
        </div>
      </div>

      {/* 命名フェーズ：暗転＋スポットライト＋入力フォーム */}
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
            {/* 暗転＋ボトル周辺へのスポットライト */}
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative z-10 max-w-lg w-full bg-white/6 border border-white/10 backdrop-blur-xl rounded-2xl shadow-xl px-6 py-6 md:px-8 md:py-7">
              <p className="font-serif text-lg md:text-2xl text-gray-50 mb-5">
                この香りに、名前を授けてください。
              </p>
              <div className="flex flex-col md:flex-row gap-3 items-stretch">
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value.slice(0, 32))}
                  placeholder="例）Éternité, Dawn of You, No.13 Takao"
                  className="flex-1 bg-black/80 border border-champagne/80 rounded-lg px-3 py-2 md:py-2.5 text-sm md:text-base text-white placeholder:text-[#C8B898] focus:outline-none focus:ring-2 focus:ring-champagne focus:border-champagne"
                  style={{ fontFamily: "var(--font-shippori), serif" }}
                />
                <button
                  onClick={handleConfirmName}
                  disabled={!nameInput.trim()}
                  className={`px-4 md:px-6 py-2 md:py-2.5 rounded-lg font-sans text-xs md:text-sm tracking-[0.22em] uppercase border transition-colors ${
                    nameInput.trim()
                      ? "border-champagne bg-champagne text-warmInk hover:bg-champagne/90"
                      : "border-gray-500/40 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  刻印する
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6カテゴリーボタン */}
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
            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {CATEGORIES.map((cat) => (
                <motion.button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className="px-4 py-2.5 rounded-full font-sans text-xs tracking-widest uppercase border bg-white/80 backdrop-blur-sm shadow-sm transition-colors hover:opacity-90"
                  style={{
                    borderColor: `rgba(${cat.rgb[0]},${cat.rgb[1]},${cat.rgb[2]},0.5)`,
                    color: `rgb(${cat.rgb[0] * 0.5},${cat.rgb[1] * 0.5},${cat.rgb[2] * 0.5})`,
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
              disabled={!hasAnyDrop}
              className={`px-10 py-3 rounded-full font-sans text-xs tracking-[0.32em] uppercase border transition-colors ${
                hasAnyDrop
                  ? "border-gray-400 text-gray-700 hover:bg-gray-100 bg-white/80 shadow-sm"
                  : "border-gray-200 text-gray-400 cursor-not-allowed bg-white/50"
              }`}
              whileHover={hasAnyDrop ? { scale: 1.03 } : {}}
              whileTap={hasAnyDrop ? { scale: 0.98 } : {}}
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

/** 一雫：画面上部から左側の着地点へ落下し、着地で onLand */
function TheDrop({
  categoryId,
  onLand,
  landingXPercent = 50,
}: {
  categoryId: CategoryId;
  onLand: () => void;
  landingXPercent?: number;
}) {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return null;

  return (
    <motion.div
      className="absolute z-[25] pointer-events-none"
      style={{
        left: `${landingXPercent}%`,
        top: "0%",
        transform: "translate(-50%, 0%)",
        width: 22,
        height: 28,
        borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
        background: `linear-gradient(180deg, ${cat.rgba} 0%, rgba(${cat.rgb[0]},${cat.rgb[1]},${cat.rgb[2]},0.55) 100%)`,
        boxShadow: `0 2px 12px rgba(${cat.rgb[0]},${cat.rgb[1]},${cat.rgb[2]},0.45)`,
      }}
      initial={{ y: "-75vh", opacity: 1, scale: 1 }}
      animate={{
        y: 0,
        opacity: 1,
        scale: [1, 1.06, 0.94],
      }}
      transition={{
        y: { duration: 0.6, ease: easeDropFall },
        scale: { duration: 0.6, times: [0, 0.78, 1] },
      }}
      onAnimationComplete={() => {
        onLand();
      }}
    />
  );
}

/** 右側：数値固定指定版 — 横180px × 縦140px ボトル本体＋底30px＋キャップ60×40px（すべて絶対座標で描画） */
function GoldenBottle({
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

  // ここから先はユーザー指定の絶対数値に「固定」
  // ボトル本体（Glass Body）：幅180px × 高さ140px、どっしり横長
  const BODY_X = 20; // 左余白
  const BODY_Y = 70; // 上余白
  const BODY_WIDTH = 180;
  const BODY_HEIGHT = 140;
  const BODY_BOTTOM = BODY_Y + BODY_HEIGHT; // 210

  // 底のガラス厚み：底部30px（210〜240）を分厚いガラスとして描画
  const BASE_Y = BODY_BOTTOM;
  const BASE_HEIGHT = 30; // 210〜240

  // 液体はボトル本体の内側いっぱいを使う（必ず下から上へ）
  const LIQUID_INNER_TOP = BODY_Y; // 必要ならここを少し下げてマージンを取れる
  const LIQUID_INNER_BOTTOM = BODY_BOTTOM;
  const LIQUID_INNER_HEIGHT = LIQUID_INNER_BOTTOM - LIQUID_INNER_TOP;

  const liquidHeight = (LIQUID_INNER_HEIGHT * liquidHeightPercent) / 100;
  const liquidY = LIQUID_INNER_BOTTOM - liquidHeight; // 底から上方向にのみ伸びる

  return (
    <motion.div
      className="relative w-[220px] md:w-[260px] h-[260px] md:h-[280px] flex-shrink-0"
      style={{
        filter: isFinished
          ? "drop-shadow(0 0 32px rgba(212,175,55,0.4)) drop-shadow(0 12px 40px rgba(0,0,0,0.15))"
          : "drop-shadow(0 4px 12px rgba(0,0,0,0.08)) drop-shadow(0 16px 48px rgba(0,0,0,0.18))",
      }}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: isNameFinalized ? 1.06 : 1 }}
      transition={{ duration: 1, ease: easeGentle }}
    >
      {/* 数値固定：横180×縦140のスクエアボトル＋底30px＋キャップ60×40px（borderRadius 一切なし） */}
      <svg
        viewBox="0 0 240 280"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          {/* ガラス面：直方体の稜線ハイライト・厚みの影 */}
          <linearGradient id="glassFace" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
            <stop offset="12%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="88%" stopColor="rgba(250,248,246,0.03)" />
            <stop offset="100%" stopColor="rgba(185,183,180,0.35)" />
          </linearGradient>
          {/* 底面のガラス厚み（分厚い直方体ブロック・屈折） */}
          <linearGradient id="glassBase" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(205,203,200,0.6)" />
            <stop offset="100%" stopColor="rgba(125,123,120,0.8)" />
          </linearGradient>
          {/* キャップ：クリアガラス／クリスタル（角型） */}
          <linearGradient id="capCrystal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
            <stop offset="50%" stopColor="rgba(240,248,255,0.5)" />
            <stop offset="100%" stopColor="rgba(220,230,240,0.6)" />
          </linearGradient>
          {/* 首：メタリックゴールド */}
          <linearGradient id="neckGold" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E8D48A" />
            <stop offset="50%" stopColor="#C9A227" />
            <stop offset="100%" stopColor="#B8860B" />
          </linearGradient>
          {/* 液体：瑞々しい黄金色・下から上へグラデ */}
          <linearGradient id="liquidRichGold" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={LIQUID_GOLD.rgbaDeep} />
            <stop offset="40%" stopColor={LIQUID_GOLD.rgbaRich} />
            <stop offset="75%" stopColor={LIQUID_GOLD.rgbaMid} />
            <stop offset="100%" stopColor={LIQUID_GOLD.rgbaHighlight} />
          </linearGradient>
          {/* 胴体内側クリップ：完璧な矩形（丸みなし） */}
          <clipPath id="bottleBodyInnerSquare">
            <rect
              x={BODY_X}
              y={BODY_Y}
              width={BODY_WIDTH}
              height={BODY_HEIGHT}
            />
          </clipPath>
        </defs>

        {/* 底面：分厚いガラスの直方体（角はすべて直角） — 高さ30px固定 */}
        <rect x={BODY_X - 8} y={BASE_Y} width={BODY_WIDTH + 16} height={BASE_HEIGHT} fill="url(#glassBase)" />
        <rect x={BODY_X - 4} y={BASE_Y - 4} width={BODY_WIDTH + 8} height={4} fill="rgba(150,148,145,0.55)" />

        {/* 胴体：幅180px × 高さ140px の完全な直方体（rect のみ・rx/ry なし） */}
        <rect
          x={BODY_X}
          y={BODY_Y}
          width={BODY_WIDTH}
          height={BODY_HEIGHT}
          fill="url(#glassFace)"
          stroke="rgba(210,208,205,0.8)"
          strokeWidth="1.2"
        />
        {/* 左稜線：光沢 */}
        <line x1={BODY_X + 1} y1={BODY_Y} x2={BODY_X + 1} y2={BODY_BOTTOM} stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
        {/* 右稜線：厚みの影 */}
        <line x1={BODY_X + BODY_WIDTH - 1} y1={BODY_Y} x2={BODY_X + BODY_WIDTH - 1} y2={BODY_BOTTOM} stroke="rgba(160,158,155,0.5)" strokeWidth="1" />

        {/* 首：ゴールドの金属バンド（矩形） */}
        <rect
          x={BODY_X + BODY_WIDTH / 2 - 40}
          y={BODY_Y - 24}
          width={80}
          height={14}
          fill="url(#neckGold)"
          stroke="rgba(180,160,80,0.6)"
          strokeWidth="0.6"
        />

        {/* キャップ：横幅60px × 高さ40px のスクエア（中央配置） */}
        <rect
          x={BODY_X + BODY_WIDTH / 2 - 30}
          y={BODY_Y - 64}
          width={60}
          height={40}
          fill="url(#capCrystal)"
          stroke="rgba(210,218,230,0.9)"
          strokeWidth="0.9"
        />

        {/* 液体：底面 LIQUID_INNER_BOTTOM を固定し、上方向にのみ height を伸ばす（下から溜まる黄金色） */}
        <g clipPath="url(#bottleBodyInnerSquare)">
          <motion.rect
            x={BODY_X}
            y={liquidY}
            width={BODY_WIDTH}
            height={liquidHeight}
            fill="url(#liquidRichGold)"
            initial={false}
            animate={{ y: liquidY, height: liquidHeight }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          />
        </g>
      </svg>

      {/* ボトル中央のデジタル刻印ラベル（Shippori Mincho × ゴールドエンボス） */}
      {engravedName && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="px-4 py-1.5 rounded-sm border border-white/30 bg-black/75 shadow-lg">
            <span
              className="text-xs md:text-sm tracking-[0.28em] uppercase text-white"
              style={{
                fontFamily: "var(--font-shippori), serif",
                textShadow: "0 1px 4px rgba(0,0,0,0.8)",
              }}
            >
              {engravedName}
            </span>
          </div>
        </div>
      )}

      {/* 共鳴バースト：液面で雫の色が弾ける（横180pxボトルに合わせた矩形マスク） */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{
          // 横幅180px・高さ140px をざっくりカバーする 28〜72% × 24〜90% の矩形
          clipPath: "polygon(28% 24%, 72% 24%, 72% 90%, 28% 90%)",
        }}
      >
        {resonanceBursts.map((b) => {
          const cat = CATEGORIES.find((c) => c.id === b.categoryId);
          if (!cat) return null;
          return (
            <motion.div
              key={b.id}
              className="absolute rounded-full"
              style={{
                left: "50%",
                // 液面が上がるほど、ボトル本体内で少し上に追従
                bottom: `${30 + (liquidHeightPercent / 100) * 40}%`,
                width: "75%",
                paddingBottom: "75%",
                marginLeft: "-37.5%",
                marginBottom: "-37.5%",
                background: `radial-gradient(circle, ${cat.rgba} 0%, rgba(${cat.rgb[0]},${cat.rgb[1]},${cat.rgb[2]},0.4) 40%, transparent 70%)`,
                filter: "blur(12px)",
              }}
              initial={{ opacity: 0.95, scale: 0.2 }}
              animate={{
                opacity: 0,
                scale: 1.6,
              }}
              transition={{
                duration: 1.25,
                ease: easeWatercolor,
              }}
            />
          );
        })}
      </div>

      {/* フィナーレ時：ボトルを黄金の光が包む */}
      <AnimatePresence>
        {isFinished && (
          <motion.div
            className="absolute -inset-5 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 70% 80% at 50% 100%, rgba(255,236,180,0.5) 0%, transparent 55%)",
              boxShadow: "0 0 48px rgba(212,175,55,0.35)",
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

/** 蓄積色からフィナーレ用グラデーションを生成（混ざり合った色がふわっと広がる） */
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

/** 完成フェーズ：上昇する光の粒 */
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
            boxShadow: "0 0 6px rgba(255,255,255,0.9), 0 0 12px rgba(255,255,255,0.4)",
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{
            y: "-120vh",
            opacity: [0, p.opacity, p.opacity, 0],
          }}
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
