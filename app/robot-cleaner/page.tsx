import type { Metadata } from 'next';
import Image from 'next/image';
import { getRobotCleanerData, cleanItemName } from '@/app/lib/getRobotCleanerData';
import { RankingCard } from '@/app/components/robot-cleaner/RankingCard';
import { FaqSection } from '@/app/components/robot-cleaner/FaqSection';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://my-only-fragrance-gos.vercel.app';

export async function generateMetadata(): Promise<Metadata> {
  const data = getRobotCleanerData();
  const { pageMeta } = data;

  return {
    title: pageMeta.title,
    description: pageMeta.description,
    alternates: { canonical: `${SITE_URL}/robot-cleaner` },
    openGraph: {
      title: pageMeta.title,
      description: pageMeta.description,
      url: `${SITE_URL}/robot-cleaner`,
      type: 'website',
      locale: 'ja_JP',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageMeta.title,
      description: pageMeta.description,
    },
    robots: { index: true, follow: true },
  };
}

export default function RobotCleanerPage() {
  const data = getRobotCleanerData();
  const { pageMeta, faq, ranking, summary, meta } = data;

  const updatedDate = new Date(pageMeta.updatedAt).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'ロボット掃除機 比較ランキング', item: `${SITE_URL}/robot-cleaner` },
    ],
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: pageMeta.h1,
    description: pageMeta.description,
    numberOfItems: ranking.length,
    itemListElement: ranking.map(item => ({
      '@type': 'ListItem',
      position: item.rank,
      item: {
        '@type': 'Product',
        name: item.itemName,
        image: item.imageUrl,
        url: item.itemUrl,
        ...(item.brand ? { brand: { '@type': 'Brand', name: item.brand } } : {}),
        offers: {
          '@type': 'Offer',
          priceCurrency: 'JPY',
          price: item.itemPrice,
          availability: 'https://schema.org/InStock',
          url: item.itemUrl,
        },
        ...(item.reviewCount > 0 ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: item.reviewAverage,
            reviewCount: item.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        } : {}),
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />

      <main className="max-w-3xl mx-auto px-4 pb-16">

        {/* Hero */}
        <section className="pt-8 pb-6">
          <nav aria-label="パンくずリスト" className="text-xs text-gray-400 mb-3">
            <a href="/" className="hover:text-gray-600">ホーム</a>
            <span className="mx-1">/</span>
            <span className="text-gray-600">ロボット掃除機 比較ランキング</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{pageMeta.h1}</h1>
          <p className="mt-3 text-sm text-gray-600 leading-relaxed">{pageMeta.description}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-400">
            <span>更新日: {updatedDate}</span>
            <span>対象商品: {summary.totalReviewed}件</span>
            <span>価格帯: ¥{summary.priceRange.min.toLocaleString()} 〜 ¥{summary.priceRange.max.toLocaleString()}</span>
          </div>
        </section>

        {/* 1位ピックアップ */}
        {ranking.length > 0 && (
          <section className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-8">
            <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-3">
              編集部 最推薦 — 2026年 第1位
            </p>
            <div className="flex gap-4 items-start">
              {ranking[0].imageUrl && (
                <a
                  href={ranking[0].itemUrl}
                  target="_blank"
                  rel="nofollow noopener noreferrer sponsored"
                  className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-white border border-green-200 block"
                >
                  <Image
                    src={ranking[0].imageUrl}
                    alt={cleanItemName(ranking[0].itemName)}
                    fill
                    sizes="96px"
                    className="object-contain p-1"
                    unoptimized
                  />
                </a>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-gray-800 leading-snug line-clamp-3">
                  {cleanItemName(ranking[0].itemName)}
                </h2>
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="text-yellow-400 text-xs" aria-hidden="true">★</span>
                  <span className="text-xs text-gray-600">
                    {ranking[0].reviewAverage}（{ranking[0].reviewCount.toLocaleString()}件）
                  </span>
                </div>
                <p className="text-lg font-bold text-red-600 mt-1">
                  ¥{ranking[0].itemPrice.toLocaleString()}
                  <span className="text-xs font-normal text-gray-400 ml-1">（税込）</span>
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 gap-3">
              <p className="text-xs text-gray-500 leading-relaxed">
                レビュー数・評価・価格帯を総合したAEOスコアで算出
              </p>
              <a
                href={ranking[0].itemUrl}
                target="_blank"
                rel="nofollow noopener noreferrer sponsored"
                className="flex-shrink-0 text-xs font-bold bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
              >
                楽天で詳細を見る →
              </a>
            </div>
          </section>
        )}

        {/* ランキング */}
        <section aria-label="ロボット掃除機 ランキング TOP10" className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-1">ランキング TOP{ranking.length}</h2>
          <p className="text-xs text-gray-500 mb-5">※ レビュー数・評価・価格帯から算出したAEOスコア順</p>
          <div className="space-y-4">
            {ranking.map(item => (
              <RankingCard key={item.itemUrl} item={item} />
            ))}
          </div>
        </section>

        {/* スペック比較表 */}
        <section aria-label="スペック比較表" className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">スペック比較表</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-left">
                  <th className="px-3 py-3 font-semibold">順位</th>
                  <th className="px-3 py-3 font-semibold">商品名</th>
                  <th className="px-3 py-3 font-semibold text-right">価格</th>
                  <th className="px-3 py-3 font-semibold text-center">評価</th>
                  <th className="px-3 py-3 font-semibold text-center">吸引力</th>
                  <th className="px-3 py-3 font-semibold text-center">稼働面積</th>
                  <th className="px-3 py-3 font-semibold text-center">自動集塵</th>
                  <th className="px-3 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((item, i) => (
                  <tr key={item.itemUrl} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-3 font-bold text-center">
                      {item.rank <= 3 ? ['🥇', '🥈', '🥉'][item.rank - 1] : item.rank}
                    </td>
                    <td className="px-3 py-3 max-w-[180px]">
                      <span className="line-clamp-2 text-gray-800">
                        {item.itemName.replace(/【[^】]*?】/g, '').replace(/＜[^＞]*?＞/g, '').trim().slice(0, 50)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-red-600 whitespace-nowrap">
                      ¥{item.itemPrice.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      ★{item.reviewAverage}<br />
                      <span className="text-gray-400">({item.reviewCount.toLocaleString()}件)</span>
                    </td>
                    <td className="px-3 py-3 text-center text-blue-700">
                      {item.specs.suction_pa ? `${item.specs.suction_pa.toLocaleString()}Pa` : '−'}
                    </td>
                    <td className="px-3 py-3 text-center text-green-700">
                      {item.specs.coverage_sqm ? `${item.specs.coverage_sqm}㎡` : '−'}
                    </td>
                    <td className="px-3 py-3 text-center text-purple-700">
                      {item.specs.auto_dust == null ? '−' : item.specs.auto_dust ? '○' : '×'}
                    </td>
                    <td className="px-3 py-3">
                      <a
                        href={item.itemUrl}
                        target="_blank"
                        rel="nofollow noopener noreferrer sponsored"
                        className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded whitespace-nowrap transition-colors"
                      >
                        楽天 →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section aria-label="ロボット掃除機 よくある質問" className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-2">よくある質問（FAQ）</h2>
          <p className="text-xs text-gray-500 mb-5">ロボット掃除機についてのよくある疑問をまとめました</p>
          <FaqSection faqs={faq} />
        </section>

        {/* データ出典 */}
        <section className="bg-gray-100 rounded-xl p-4 text-xs text-gray-500">
          <h2 className="font-semibold text-gray-700 mb-1">データについて</h2>
          <p>
            本ランキングは楽天市場の商品データ（{meta.totalItems}件）をもとに、
            レビュー数・評価・価格帯を加味したAEOスコアで算出しています。
            データ取得日: {updatedDate}
          </p>
        </section>
      </main>
    </>
  );
}
