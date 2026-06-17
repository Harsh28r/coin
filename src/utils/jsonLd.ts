/** Shared Schema.org JSON-LD builders for CoinsClarity */

export const SITE_URL = 'https://coinsclarity.com';
export const SITE_NAME = 'CoinsClarity';
export const SITE_LOGO = `${SITE_URL}/logo3.png`;

export type JsonLdObject = Record<string, unknown>;

export const organization = (): JsonLdObject => ({
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: SITE_LOGO,
});

export const publisher = (): JsonLdObject => ({
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: { '@type': 'ImageObject', url: SITE_LOGO, width: 512, height: 512 },
});

export const webPage = (opts: {
  name: string;
  description: string;
  url: string;
  type?: string;
}): JsonLdObject => ({
  '@context': 'https://schema.org',
  '@type': opts.type || 'WebPage',
  name: opts.name,
  description: opts.description,
  url: opts.url,
  isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
  publisher: publisher(),
});

export const collectionPage = (opts: {
  name: string;
  description: string;
  url: string;
}): JsonLdObject =>
  webPage({ ...opts, type: 'CollectionPage' });

export const breadcrumbList = (
  items: Array<{ name: string; url: string }>,
): JsonLdObject => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: item.url,
  })),
});

export const faqPage = (
  items: Array<{ question: string; answer: string }>,
): JsonLdObject => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
});

export const webApplication = (opts: {
  name: string;
  description: string;
  url: string;
  features?: string[];
}): JsonLdObject => ({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: opts.name,
  description: opts.description,
  url: opts.url,
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web Browser',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  publisher: publisher(),
  ...(opts.features?.length ? { featureList: opts.features } : {}),
});

export const newsArticle = (opts: {
  headline: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  author?: string;
  keywords?: string;
  articleBody?: string;
  wordCount?: number;
  section?: string;
}): JsonLdObject => ({
  '@context': 'https://schema.org',
  '@type': 'NewsArticle',
  headline: opts.headline,
  description: opts.description,
  image: [opts.image || SITE_LOGO],
  datePublished: opts.datePublished || new Date().toISOString(),
  dateModified: opts.dateModified || opts.datePublished || new Date().toISOString(),
  author: opts.author
    ? { '@type': 'Person', name: opts.author }
    : { '@type': 'Organization', name: SITE_NAME },
  publisher: publisher(),
  mainEntityOfPage: { '@type': 'WebPage', '@id': opts.url },
  ...(opts.keywords ? { keywords: opts.keywords } : {}),
  ...(opts.articleBody ? { articleBody: opts.articleBody } : {}),
  ...(opts.wordCount ? { wordCount: opts.wordCount } : {}),
  ...(opts.section ? { articleSection: opts.section } : {}),
});

export const blogPosting = (opts: {
  headline: string;
  description: string;
  url: string;
  image?: string;
  datePublished: string;
  author: string;
  keywords?: string;
}): JsonLdObject => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: opts.headline,
  description: opts.description,
  image: [opts.image || SITE_LOGO],
  datePublished: opts.datePublished,
  dateModified: opts.datePublished,
  author: { '@type': 'Person', name: opts.author },
  publisher: publisher(),
  mainEntityOfPage: opts.url,
  ...(opts.keywords ? { keywords: opts.keywords } : {}),
});

export const financialProduct = (opts: {
  name: string;
  symbol: string;
  url: string;
  description: string;
  price?: number;
  priceCurrency?: string;
}): JsonLdObject => ({
  '@context': 'https://schema.org',
  '@type': 'FinancialProduct',
  name: opts.name,
  alternateName: opts.symbol,
  url: opts.url,
  description: opts.description,
  provider: organization(),
  ...(opts.price != null
    ? {
        offers: {
          '@type': 'Offer',
          price: String(opts.price),
          priceCurrency: opts.priceCurrency || 'USD',
        },
      }
    : {}),
});

export const contactPage = (url: string): JsonLdObject =>
  webPage({
    name: 'Contact CoinsClarity',
    description:
      'Contact CoinsClarity for questions, feedback, business inquiries, advertising, or press releases.',
    url,
    type: 'ContactPage',
  });

export const aboutPage = (url: string): JsonLdObject =>
  webPage({
    name: 'About CoinsClarity',
    description:
      'CoinsClarity is a cryptocurrency news and information platform committed to bringing clarity to the crypto world.',
    url,
    type: 'AboutPage',
  });
