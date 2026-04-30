import Image from 'next/image';
import { RobotCleanerRankingItem } from '@/app/types/robot-cleaner';
import { cleanItemName } from '@/app/lib/getRobotCleanerData';

interface Props {
  item: RobotCleanerRankingItem;
}

const RANK_COLORS: Record<number, string> = {
  1: 'bg-yellow-400 text-yellow-900',
  2: 'bg-gray-300 text-gray-800',
  3: 'bg-amber-600 text-white',
};

const RANK_LABEL: Record<number, string> = {
  1: '1位',
  2: '2位',
  3: '3位',
};

export function RankingCard({ item }: Props) {
  const badgeClass = RANK_COLORS[item.rank] ?? 'bg-slate-100 text-slate-700';
  const cleanName  = cleanItemName(item.itemName);
  const stars      = Math.round(item.reviewAverage * 2) / 2;
  const fullStars  = Math.floor(stars);
  const halfStar   = stars % 1 !== 0;

  return (
    <article className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* ランクバッジ */}
      <div className="flex flex-col items-center gap-2 min-w-[52px]">
        <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${badgeClass}`}>
          {RANK_LABEL[item.rank] ?? `${item.rank}位`}
        </span>
      </div>

      {/* 商品画像 */}
      {item.imageUrl && (
        <a
          href={item.itemUrl}
          target="_blank"
          rel="nofollow noopener noreferrer sponsored"
          className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 block"
        >
          <Image
            src={item.imageUrl}
            alt={cleanName}
            fill
            sizes="80px"
            className="object-contain p-1 hover:scale-105 transition-transform"
            unoptimized
          />
        </a>
      )}

      {/* 商品情報 */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
          {cleanName}
        </h3>

        {/* スター評価 */}
        <div className="flex items-center gap-1 mt-1">
          <span className="text-yellow-400 text-sm" aria-hidden="true">
            {'★'.repeat(fullStars)}{halfStar ? '½' : ''}{'☆'.repeat(5 - fullStars - (halfStar ? 1 : 0))}
          </span>
          <span className="text-xs text-gray-500">
            {item.reviewAverage} ({item.reviewCount.toLocaleString()}件)
          </span>
        </div>

        {/* スペックバッジ */}
        <div className="flex flex-wrap gap-1 mt-2">
          {item.specs.suction_pa && (
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
              {item.specs.suction_pa.toLocaleString()}Pa
            </span>
          )}
          {item.specs.coverage_sqm && (
            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
              {item.specs.coverage_sqm}㎡対応
            </span>
          )}
          {item.specs.auto_dust != null && (
            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
              自動ゴミ収集{item.specs.auto_dust ? '○' : '×'}
            </span>
          )}
          {item.useCases.slice(0, 2).map(uc => (
            <span key={uc} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
              {uc}
            </span>
          ))}
        </div>

        {/* 価格 + CTAボタン */}
        <div className="flex items-center justify-between mt-3">
          <p className="text-lg font-bold text-red-600">
            ¥{item.itemPrice.toLocaleString()}
            <span className="text-xs text-gray-400 font-normal ml-1">（税込）</span>
          </p>
          <a
            href={item.itemUrl}
            target="_blank"
            rel="nofollow noopener noreferrer sponsored"
            className="text-xs font-bold bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            楽天で見る →
          </a>
        </div>
      </div>
    </article>
  );
}
