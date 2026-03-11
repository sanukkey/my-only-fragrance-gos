"use client";

import { useState } from "react";
import { Search, MessageCircle } from "lucide-react";

const MOCK_PREFERENCES = {
  tone: "ウッディ・甘め",
  top: "ベルガモット",
  middle: "ジャスミン",
  base: "サンダルウッド",
  lastVisit: "2024年2月",
};

const MOCK_MESSAGE = `【MY ONLY FRAGRANCE】〇〇様

いつもご来店いただきありがとうございます。
お客様のレシピ「${MOCK_PREFERENCES.top} × ${MOCK_PREFERENCES.middle} × ${MOCK_PREFERENCES.base}」は、約半年の熟成でよりまろやかな香りに変化します。

このタイミングで、同じ配合のルームスプレーをご自宅用にいかがでしょうか。店舗でお渡しした「あなただけの香り」を、空間でもお楽しみいただけます。

▼ ルームスプレー 50mL（6ヶ月分目安）
  月額 2,200 円（税込）・いつでも解約OK

ご希望の方は、このLINEに「ルームスプレー希望」と返信ください。`;

export default function LTVHub() {
  const [recipeId, setRecipeId] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (recipeId.trim()) setSearched(true);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-warmInk tracking-tight">
          LTV-Hub
        </h1>
        <p className="font-sans text-warmMuted mt-2">
          香りの資産化デモ — 店舗体験を「点」からオンラインサブスクの「線」へ
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-inkMuted" size={20} />
          <input
            type="text"
            value={recipeId}
            onChange={(e) => setRecipeId(e.target.value)}
            placeholder="顧客レシピID（例: MOF-RCP-2024-01234）"
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-champagneLight bg-cream font-sans text-warmInk placeholder:text-warmMuted focus:outline-none focus:ring-2 focus:ring-champagne/30"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 bg-champagne text-cream rounded-xl font-sans font-medium hover:opacity-90 transition-silent"
        >
          解析
        </button>
      </form>

      {searched && (
        <div className="space-y-6 transition-silent">
          <div className="bg-cream rounded-2xl p-6 card-shadow border border-champagneLight/50">
            <h2 className="font-sans text-lg font-semibold text-warmInk mb-4">過去の好み解析</h2>
            <dl className="grid grid-cols-2 gap-3 font-sans text-sm">
              <dt className="text-warmMuted">トーン</dt>
              <dd className="text-warmInk font-medium">{MOCK_PREFERENCES.tone}</dd>
              <dt className="text-warmMuted">トップ</dt>
              <dd className="text-warmInk font-medium">{MOCK_PREFERENCES.top}</dd>
              <dt className="text-warmMuted">ミドル</dt>
              <dd className="text-warmInk font-medium">{MOCK_PREFERENCES.middle}</dd>
              <dt className="text-warmMuted">ベース</dt>
              <dd className="text-warmInk font-medium">{MOCK_PREFERENCES.base}</dd>
              <dt className="text-warmMuted">最終来店</dt>
              <dd className="text-warmInk font-medium">{MOCK_PREFERENCES.lastVisit}</dd>
            </dl>
          </div>

          <div className="bg-cream rounded-2xl p-6 card-shadow border border-champagneLight/50">
            <div className="flex items-center gap-2 font-sans text-lg font-semibold text-warmInk mb-3">
              <MessageCircle size={20} />
              半年後熟成に合わせたルームスプレー 提案メッセージ案
            </div>
            <div className="bg-offwhite rounded-xl p-4 font-sans text-sm text-warmInk whitespace-pre-wrap leading-relaxed border border-champagneLight/50">
              {MOCK_MESSAGE}
            </div>
            <p className="font-sans text-xs text-warmMuted mt-3">
              店舗体験を「点」ではなく、オンラインサブスクの「線」に変えるシミュレーション。レシピIDに紐づく好みから、タイミングに合った提案文を自動生成します。
            </p>
          </div>
        </div>
      )}

      {!searched && (
        <div className="bg-champagneLight/30 rounded-2xl p-8 text-center border border-champagneLight/50">
          <p className="font-sans text-warmMuted">
            レシピIDを入力して「解析」を押すと、顧客の過去の好みを解析し、半年後熟成に合わせたルームスプレー提案メッセージ案を表示します。
          </p>
        </div>
      )}
    </div>
  );
}
