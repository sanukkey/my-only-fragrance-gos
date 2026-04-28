import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://my-only-fragrance-gos.vercel.app'
  ),
};

export default function RefrigeratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/refrigerator" className="text-sm font-bold text-gray-800">
            大型冷蔵庫比較
          </a>
          <span className="text-xs text-gray-400">楽天市場 最新ランキング</span>
        </div>
      </header>

      {children}

      <footer className="mt-16 border-t border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-8 text-xs text-gray-400 space-y-2">
          <p>※ 本サイトはアフィリエイト広告（楽天アフィリエイト）を利用しています。</p>
          <p>※ 商品の価格・レビュー数は取得時点のものです。最新情報は各商品ページでご確認ください。</p>
          <p>© 2026 大型冷蔵庫比較ランキング</p>
        </div>
      </footer>
    </div>
  );
}
