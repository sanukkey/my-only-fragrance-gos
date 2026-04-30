export interface ClothesDryerRankingItem {
  rank: number;
  itemName: string;
  itemPrice: number;
  itemUrl: string;
  imageUrl: string;
  reviewAverage: number;
  reviewCount: number;
  aeoScore: number;
  brand: string | null;
  specs: {
    dry_kg: number | null;
    method: string | null;
    power_w: number | null;
  };
  useCases: string[];
  jsonLd: Record<string, unknown>;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ClothesDryerProcessedData {
  meta: {
    processedAt: string;
    totalItems: number;
    isMockData: boolean;
    keyword: string;
  };
  pageMeta: {
    title: string;
    description: string;
    h1: string;
    canonicalUrl: string;
    updatedAt: string;
  };
  jsonLd: {
    faqPage: Record<string, unknown>;
    breadcrumb: Record<string, unknown>;
  };
  ranking: ClothesDryerRankingItem[];
  faq: FaqItem[];
  summary: {
    topPick: string;
    totalReviewed: number;
    priceRange: { min: number; max: number };
    brands: string[];
  };
}
