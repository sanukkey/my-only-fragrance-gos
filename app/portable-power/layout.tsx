import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://my-only-fragrance-gos.vercel.app'
  ),
};

export default function PortablePowerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/portable-power" className="text-sm font-bold text-gray-800">
            ⚡ ポータブル電源比較
          </a>
          <span className="text-xs text-gray-400">楽天市場 最新ランキング</span>
        </div>
      </header>

      {children}

      {/* フッター */}
      <footer className="mt-16 border-t border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-8 text-xs text-gray-400 space-y-3">
          <nav className="flex flex-wrap gap-4">
            <a href="/portable-power"       className="hover:text-gray-600">ポータブル電源</a>
            <a href="/drum-washing-machine"  className="hover:text-gray-600">ドラム式洗濯機</a>
            <a href="/refrigerator"         className="hover:text-gray-600">大型冷蔵庫</a>
            <a href="/robot-cleaner"        className="hover:text-gray-600">ロボット掃除機</a>
            <a href="/clothes-dryer"        className="hover:text-gray-600">衣類乾燥機</a>
            <a href="/air-conditioner"      className="hover:text-gray-600">エアコン</a>
            <span className="text-gray-200">|</span>
            <a href="/about"   className="hover:text-gray-600">運営者情報</a>
            <a href="/privacy" className="hover:text-gray-600">プライバシーポリシー</a>
            <a href="/legal"   className="hover:text-gray-600">特商法に基づく表記</a>
          </nav>
          <p>※ 本サイトはアフィリエイト広告（楽天アフィリエイト）を利用しています。</p>
          <p>※ 商品の価格・レビュー数は取得時点のものです。最新情報は各商品ページでご確認ください。</p>
          <p>© 2026 ポータブル電源比較ランキング</p>
        </div>
      </footer>
    </div>
  );
}
