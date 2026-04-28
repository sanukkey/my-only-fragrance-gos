import type { Metadata } from 'next';
import { getDrumWashingMachineData } from '@/app/lib/getDrumWashingMachineData';
import { RankingCard } from '@/app/components/drum-washing-machine/RankingCard';
import { FaqSection } from '@/app/components/drum-washing-machine/FaqSection';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://my-only-fragrance-gos.vercel.app';

export async function generateMetadata(): Promise<Metadata> {
  const data = getDrumWashingMachineData();
  const { pageMeta } = data;

  return {
    title: pageMeta.title,
    description: pageMeta.description,
    alternates: { canonical: `${SITE_URL}/drum-washing-machine` },
    openGraph: {
      title: pageMeta.title,
      description: pageMeta.description,
      url: `${SITE_URL}/drum-washing-machine`,
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

export default function DrumWashingMachinePage() {
  const data = getDrumWashingMachineData();
  const { pageMeta, jsonLd, ranking, faq, summary, meta } = data;

  const updatedDate = new Date(pageMeta.updatedAt).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // JSON-LD: BreadcrumbList
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: SITE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'ドラム式洗濯機 比較ランキング',
        item: `${SITE_URL}/drum-washing-machine`,
      },
    ],
  };

  // JSON-LD: FAQPage
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };

  // JSON-LD: ItemList
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
        ...(item.reviewCount > 0
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: item.reviewAverage,
                reviewCount: item.reviewCount,
                bestRating: 5,
                worstRating: 1,
              },
            }
          : {}),
      },
    })),
  };

  return (
    <>
      {/* JSON-LD 構造化データ（3種） */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />

      <main className="max-w-3xl mx-auto px-4 pb-16">

        {/* Hero */}
        <section className="pt-8 pb-6">
          <nav aria-label="パンくずリスト" className="text-xs text-gray-400 mb-3">
            <a href="/" className="hover:text-gray-600">ホーム</a>
            <span className="mx-1">/</span>
            <span className="text-gray-600">ドラム式洗濯機 比較ランキング</span>
          </nav>

          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {pageMeta.h1}
          </h1>
          <p className="mt-3 text-sm text-gray-600 leading-relaxed">
            {pageMeta.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-400">
            <span>更新日: {updatedDate}</span>
            <span>対象商品: {summary.totalReviewed}件</span>
            <span>
              価格帯: ¥{summary.priceRange.min.toLocaleString()} 〜
              ¥{summary.priceRange.max.toLocaleString()}
            </span>
          </div>
        </section>

        {/* 1位ピックアップ */}
        <section className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-8">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">
            編集部 最推薦
          </p>
          <h2 className="text-base font-bold text-gray-800">
            2026年 ドラム式洗濯機 おすすめ第1位
          </h2>
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {summary.topPick}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            レビュー数・評価・価格帯を総合したAEOスコアで算出
          </p>
        </section>

        {/* ランキング */}
        <section aria-label="ドラム式洗濯機 ランキング TOP10" className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            ランキング TOP{ranking.length}
          </h2>
          <p className="text-xs text-gray-500 mb-5">
            ※ レビュー数・評価・価格帯から算出したAEOスコア順
          </p>

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
                  <th className="px-3 py-3 font-semibold text-center">洗濯容量</th>
                  <th className="px-3 py-3 font-semibold text-center">乾燥容量</th>
                  <th className="px-3 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((item, i) => (
                  <tr
                    key={item.itemUrl}
                    className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
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
                      ★{item.reviewAverage}
                      <br />
                      <span className="text-gray-400">({item.reviewCount.toLocaleString()}件)</span>
                    </td>
                    <td className="px-3 py-3 text-center text-blue-700">
                      {item.specs.wash_kg ? `${item.specs.wash_kg}kg` : '−'}
                    </td>
                    <td className="px-3 py-3 text-center text-green-700">
                      {item.specs.dry_kg ? `${item.specs.dry_kg}kg` : '−'}
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
        <section aria-label="ドラム式洗濯機 よくある質問" className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            よくある質問（FAQ）
          </h2>
          <p className="text-xs text-gray-500 mb-5">
            ドラム式洗濯機についてのよくある疑問をまとめました
          </p>
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
