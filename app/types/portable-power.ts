export interface RankingItem {
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
    capacity_wh: number | null;
    output_w: number | null;
    weight_kg: number | null;
    capacityCategory: string;
  };
  useCases: string[];
  jsonLd: Record<string, unknown>;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ProcessedData {
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
  ranking: RankingItem[];
  faq: FaqItem[];
  summary: {
    topPick: string;
    totalReviewed: number;
    priceRange: { min: number; max: number };
    brands: string[];
  };
}
