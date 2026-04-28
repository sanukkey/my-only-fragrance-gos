import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '運営者情報 | 家電比較ランキング',
  description: '家電比較ランキングの運営者・執筆者情報です。',
  robots: { index: true, follow: true },
};

export default function AboutPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 mb-8 pb-4 border-b border-gray-200">
        運営者情報
      </h1>

      {/* 執筆・監修者 */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-800 mb-4">執筆・監修</h2>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-2xl">
              🧑‍💼
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">たかお</p>
              <p className="text-xs text-gray-500 mt-0.5">家電比較ランキング 編集長</p>
            </div>
          </div>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex gap-3">
              <dt className="text-gray-500 whitespace-nowrap w-20">生年月日</dt>
              <dd className="text-gray-700">昭和58年2月2日生まれ</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-gray-500 whitespace-nowrap w-20">経歴</dt>
              <dd className="text-gray-700 leading-relaxed">
                メンズ脱毛専門店のフランチャイズ経営を13年経験した元経営者。
                顧客へ機器・設備投資の意思決定を繰り返す中で「スペックと価格と口コミをどう総合判断するか」のノウハウを蓄積。
                現在は実務経験とAI技術を組み合わせた「失敗しない家電選び」をテーマに、
                最新データを基にした中立的な比較情報を発信している。
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* 運営の目的 */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-800 mb-4">運営の目的</h2>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-sm text-gray-700 leading-relaxed space-y-3">
          <p>
            多忙なビジネスマンや家事に追われる家庭が、データに基づいた「正解」を最短で見つけられる場を作ること。
          </p>
          <p>
            家電の購入は金額も大きく、失敗すると長期間後悔するにもかかわらず、
            ネット上には広告目的の恣意的なランキングが溢れています。
            本サイトは楽天市場の実売データ・レビュー数・評価を独自のAEOスコアで数値化し、
            中立的な視点から「今買うべき1台」を提案します。
          </p>
          <p>
            特定のメーカー・ブランドとのタイアップは一切行っておらず、
            すべての情報は公開データをもとに算出しています。
          </p>
        </div>
      </section>

      {/* サイト概要 */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-800 mb-4">サイト概要</h2>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <tbody>
              {[
                ['サイト名',   '家電比較ランキング'],
                ['運営者',     'たかお'],
                ['開設年',     '2026年'],
                ['対象カテゴリ', 'ポータブル電源・ドラム式洗濯機・大型冷蔵庫（順次拡大予定）'],
                ['データ取得元', '楽天市場商品検索API'],
                ['収益モデル',   '楽天アフィリエイトプログラムによる成果報酬'],
              ].map(([label, value], i) => (
                <tr key={label} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <th className="px-4 py-3 text-left text-gray-500 font-normal w-36 align-top">
                    {label}
                  </th>
                  <td className="px-4 py-3 text-gray-700">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* お問い合わせ */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">お問い合わせ</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          掲載内容に関するご意見・誤りのご指摘などは、
          各ページ下部のお問い合わせフォームよりご連絡ください。
          なお、掲載商品・価格に関する個別のご質問には対応しかねますので、
          各商品の販売店舗へ直接お問い合わせください。
        </p>
      </section>
    </>
  );
}
