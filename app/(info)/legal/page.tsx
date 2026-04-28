import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '特定商取引法に基づく表記 | 家電比較ランキング',
  description: '家電比較ランキングの特定商取引法に基づく表記です。',
  robots: { index: true, follow: true },
};

export default function LegalPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 mb-8 pb-4 border-b border-gray-200">
        特定商取引法に基づく表記
      </h1>

      {/* 重要なお知らせ */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-sm text-amber-800">
        <p className="font-semibold mb-1">重要</p>
        <p>
          当サイトは商品の紹介・比較を行うアフィリエイトサイトです。
          商品の販売・決済・発送は各ショッピングモール（楽天市場等）および出店店舗が行います。
          当サイトでは商品の販売は一切行っておりません。
        </p>
      </div>

      {/* 運営者情報テーブル */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-gray-800 mb-4">運営者情報</h2>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <tbody>
              {[
                ['運営者氏名',   'たかお'],
                ['所在地',       '本人確認が必要な場合は開示いたします。お問い合わせよりご連絡ください。'],
                ['連絡先',       '各ページのお問い合わせフォームよりご連絡ください。'],
                ['サイトURL',    'https://my-only-fragrance-gos.vercel.app'],
                ['事業内容',     'インターネットを通じた家電製品の比較情報提供・アフィリエイト'],
                ['販売価格',     '当サイトでは商品の販売を行っておりません。価格は各販売店舗にてご確認ください。'],
                ['支払方法',     '当サイトでは決済を行っておりません。お支払いは各販売店舗の定める方法に準じます。'],
                ['商品引渡し時期', '当サイトでは商品の発送を行っておりません。納期は各販売店舗にご確認ください。'],
                ['返品・キャンセル', '当サイトでは商品の販売を行っておりません。返品・交換は各販売店舗の定める規定に準じます。'],
              ].map(([label, value], i) => (
                <tr key={label} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <th className="px-4 py-3 text-left text-gray-500 font-normal w-36 align-top whitespace-nowrap">
                    {label}
                  </th>
                  <td className="px-4 py-3 text-gray-700 leading-relaxed">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 免責事項 */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-gray-800 mb-4">免責事項</h2>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-sm text-gray-700 leading-relaxed space-y-4">
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">商品・サービスについて</h3>
            <p>
              当サイトに掲載している商品情報（価格・スペック・レビュー数等）は取得時点のデータです。
              最新の情報は各商品の販売ページにてご確認ください。
              掲載情報の誤りにより生じた損害について、当サイトは責任を負いかねます。
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">商品の不具合・トラブルについて</h3>
            <p>
              購入した商品の初期不良・動作不良・配送トラブルなどについては、
              購入先の販売店舗へ直接お問い合わせください。
              当サイトは商品の販売に一切関与しておらず、これらに関する対応は行っておりません。
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">リンク先サイトについて</h3>
            <p>
              当サイトからリンクされている外部サイト（楽天市場等）の内容・サービスについて、
              当サイトは責任を負いかねます。リンク先サイトの利用規約・プライバシーポリシーを
              各自でご確認のうえご利用ください。
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">アフィリエイトリンクについて</h3>
            <p>
              当サイトに掲載されている一部のリンクはアフィリエイトリンクです。
              リンクを経由してご購入いただいた場合、当サイトは販売元から成果報酬を受け取ることがあります。
              ただし、掲載順位・評価はアフィリエイト報酬の有無にかかわらず独自スコアにより決定しており、
              特定の商品・店舗を優遇することはありません。
            </p>
          </div>
        </div>
      </section>

      {/* 著作権 */}
      <section>
        <h2 className="text-base font-bold text-gray-800 mb-4">著作権</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          当サイトに掲載されているテキスト・画像・構成等の著作権は当サイト運営者に帰属します。
          無断転載・複製を禁じます。商品画像の著作権は各メーカー・販売店舗に帰属します。
        </p>
      </section>
    </>
  );
}
