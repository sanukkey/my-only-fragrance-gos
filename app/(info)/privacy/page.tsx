import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'プライバシーポリシー | 家電比較ランキング',
  description: '家電比較ランキングのプライバシーポリシーです。',
  robots: { index: true, follow: true },
};

const LAST_UPDATED = '2026年4月28日';

export default function PrivacyPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">プライバシーポリシー</h1>
      <p className="text-xs text-gray-400 mb-8">最終更新日：{LAST_UPDATED}</p>

      <div className="space-y-10 text-sm text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">1. 基本方針</h2>
          <p>
            家電比較ランキング（以下「当サイト」）は、ユーザーの個人情報の保護を重要事項と認識し、
            個人情報の保護に関する法律（個人情報保護法）および関連法令を遵守します。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">2. アフィリエイト広告について</h2>
          <p>
            当サイトは、楽天グループ株式会社が運営する楽天アフィリエイトプログラムに参加しています。
            商品リンクを経由してご購入いただいた場合、当サイトは楽天市場から成果報酬を受け取ることがあります。
          </p>
          <ul className="mt-3 list-disc list-inside space-y-1 text-gray-600">
            <li>掲載商品の選定・ランキングは報酬の有無にかかわらず、独自のAEOスコアにより公平に行っています。</li>
            <li>商品価格・在庫状況は楽天市場の最新情報をご確認ください。</li>
            <li>楽天アフィリエイトのプライバシーポリシーは楽天グループ株式会社の定めに準じます。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">3. アクセス解析ツールについて</h2>
          <p>
            当サイトでは、Googleが提供するアクセス解析ツール「Google Analytics」を使用する場合があります。
            Google Analyticsはトラフィックデータの収集のためにCookieを使用します。
            このトラフィックデータは匿名で収集されており、個人を特定するものではありません。
          </p>
          <ul className="mt-3 list-disc list-inside space-y-1 text-gray-600">
            <li>Cookieを無効にすることで収集を拒否することができます（ブラウザの設定からご変更ください）。</li>
            <li>Google Analyticsのデータ収集・処理の仕組みについては
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer"
                 className="text-blue-600 underline ml-1">Google のプライバシーポリシー</a>をご確認ください。
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">4. Cookieについて</h2>
          <p>
            当サイトはCookieを使用することがあります。Cookieとは、ウェブサイトがお使いのブラウザに送信する
            小さなデータファイルです。ユーザーの利便性向上・アクセス解析・広告配信の最適化を目的として利用します。
            Cookie の利用を望まない場合は、ブラウザの設定でCookieを無効にしてください。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">5. 個人情報の収集と利用</h2>
          <p>
            当サイトでは、お問い合わせの際に氏名・メールアドレスなどの個人情報をご提供いただく場合があります。
            収集した個人情報は、お問い合わせへの対応のみを目的として使用し、
            本人の同意なく第三者に提供することはありません。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">6. 免責事項</h2>
          <p>
            当サイトに掲載する情報は正確性を期しておりますが、その完全性・正確性を保証するものではありません。
            当サイトの情報に基づいて行われた判断・行動により生じた損害については、
            当サイト運営者は責任を負いかねますのでご了承ください。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">7. プライバシーポリシーの変更</h2>
          <p>
            本ポリシーは、必要に応じて予告なく変更する場合があります。
            変更後のプライバシーポリシーは当ページに掲載した時点で効力を生じるものとします。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">8. お問い合わせ</h2>
          <p>
            本プライバシーポリシーに関するお問い合わせは、各ページのお問い合わせフォームよりご連絡ください。
          </p>
        </section>

      </div>
    </>
  );
}
