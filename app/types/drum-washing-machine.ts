export interface DWMRankingItem {
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
    wash_kg: number | null;
    dry_kg: number | null;
    noise_db: number | null;
  };
  useCases: string[];
  jsonLd: Record<string, unknown>;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface DWMProcessedData {
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
  ranking: DWMRankingItem[];
  faq: FaqItem[];
  summary: {
    topPick: string;
    totalReviewed: number;
    priceRange: { min: number; max: number };
    brands: string[];
  };
}
