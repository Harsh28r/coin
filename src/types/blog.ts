export interface BlogPost {
  id: string;
  _id?: string;
  slug?: string;
  title: string;
  content: string;
  imageUrl: string;
  author: string;
  tags?: string[];
  excerpt?: string;
  date: string | Date;
  outlook?: {
    coinId?: string;
    coinName?: string;
    symbol?: string;
    horizon?: string;
    spotAtWrite?: number;
    currency?: string;
    stance?: string;
    stanceSummary?: string;
    scenarios?: Array<{
      label: string;
      priceLow: number;
      priceHigh: number;
      thesis: string;
    }>;
    catalysts?: string[];
    risks?: string[];
    methodology?: string;
    asOf?: string | Date;
  };
}