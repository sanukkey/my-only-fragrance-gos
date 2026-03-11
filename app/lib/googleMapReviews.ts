/**
 * Google Map / Google Business Profile レビューデータ取得
 * 現在はモックデータを返す。将来的に Google Business Profile API と接続可能な形で定義。
 */

export type GoogleMapReviewItem = {
  placeId: string;
  storeId: string;
  rating: number;
  totalReviews: number;
  /** 4.2 未満で品質改善アラート対象 */
  qualityAlert: boolean;
};

export type FetchGoogleMapReviewsResult = {
  items: GoogleMapReviewItem[];
  /** 全店舗の加重平均（口コミ数で加重） */
  averageRating: number;
  /** 4.0 未満の店舗があれば CS アラート（接客品質低下の懸念） */
  hasCsAlert: boolean;
};

/** 品質改善アラートの閾値（このブランドは4.9以上が標準のため、4.8未満で Red Alert） */
export const QUALITY_IMPROVEMENT_ALERT_THRESHOLD = 4.8;
/** CS（顧客満足度）アラートの閾値（4.8未満で「ブランド毀損の緊急警報」） */
export const CS_ALERT_THRESHOLD = 4.8;

const MOCK_STORE_RATINGS: { storeId: string; rating: number; totalReviews: number }[] = [
  { storeId: "kyoto-gion", rating: 4.8, totalReviews: 312 },
  { storeId: "kyoto-kawaramachi", rating: 4.6, totalReviews: 198 },
  { storeId: "nagoya-sakae", rating: 4.9, totalReviews: 445 },
  { storeId: "nagoya-meieki", rating: 4.7, totalReviews: 267 },
  { storeId: "kanazawa", rating: 4.5, totalReviews: 124 },
  { storeId: "osaka-shinsaibashi", rating: 4.8, totalReviews: 523 },
  { storeId: "osaka-umeda", rating: 4.7, totalReviews: 389 },
  { storeId: "tokyo-ginza", rating: 4.9, totalReviews: 612 },
  { storeId: "tokyo-omotesando", rating: 4.8, totalReviews: 478 },
  { storeId: "tokyo-shibuya", rating: 4.6, totalReviews: 401 },
  { storeId: "yokohama", rating: 4.5, totalReviews: 156 },
  { storeId: "fukuoka", rating: 4.7, totalReviews: 234 },
  { storeId: "sapporo", rating: 4.1, totalReviews: 89 },
  { storeId: "hiroshima", rating: 3.9, totalReviews: 67 },
  { storeId: "sendai", rating: 4.3, totalReviews: 112 },
];

/**
 * Google Map レビューを取得する。
 * 現在はモックデータを返す。将来的に Google Business Profile API のレスポンスをマッピングして返す想定。
 */
export function fetchGoogleMapReviews(): Promise<FetchGoogleMapReviewsResult> {
  return Promise.resolve(getMockGoogleMapReviews());
}

/**
 * 同期的にモックデータを返す（初期表示・store リストとのマージ用）。
 */
export function getMockGoogleMapReviews(): FetchGoogleMapReviewsResult {
  let totalWeighted = 0;
  let totalReviews = 0;
  const items: GoogleMapReviewItem[] = MOCK_STORE_RATINGS.map((r) => {
    const qualityAlert = r.rating < QUALITY_IMPROVEMENT_ALERT_THRESHOLD;
    totalWeighted += r.rating * r.totalReviews;
    totalReviews += r.totalReviews;
    return {
      placeId: `place-${r.storeId}`,
      storeId: r.storeId,
      rating: r.rating,
      totalReviews: r.totalReviews,
      qualityAlert,
    };
  });
  const averageRating = totalReviews > 0 ? Math.round((totalWeighted / totalReviews) * 10) / 10 : 0;
  const hasCsAlert = items.some((i) => i.rating < CS_ALERT_THRESHOLD);
  return { items, averageRating, hasCsAlert };
}

/**
 * storeId ごとのレビュー情報をマップで返す（UI で店舗リストにマージしやすい形）。
 */
export function getMockGoogleMapReviewsByStore(): Map<string, { rating: number; totalReviews: number; qualityAlert: boolean }> {
  const { items } = getMockGoogleMapReviews();
  const map = new Map<string, { rating: number; totalReviews: number; qualityAlert: boolean }>();
  items.forEach((i) => map.set(i.storeId, { rating: i.rating, totalReviews: i.totalReviews, qualityAlert: i.qualityAlert }));
  return map;
}
