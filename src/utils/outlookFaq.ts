/** Search-intent FAQs from Markets Desk outlooks — visible copy + FAQPage schema. */

export type FaqItem = { question: string; answer: string };

type OutlookLike = {
  coinId?: string;
  coinName?: string;
  symbol?: string;
  horizon?: string;
  stance?: string;
  stanceSummary?: string;
  methodology?: string;
  spotAtWrite?: number;
  scenarios?: Array<{ label?: string; priceLow?: number; priceHigh?: number; thesis?: string }>;
  catalysts?: string[];
  risks?: string[];
};

const money = (n?: number) => {
  if (n == null || !Number.isFinite(n)) return null;
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: n >= 1 ? 2 : 6 })}`;
};

const sentence = (s?: string) => String(s || '').replace(/\s+/g, ' ').trim();

export function buildOutlookFaqs(outlook?: OutlookLike | null, coinId?: string): FaqItem[] {
  if (!outlook) return [];
  const name = outlook.coinName || coinId || 'this asset';
  const sym = outlook.symbol || '';
  const horizon = outlook.horizon || '2026–2030';
  const base = (outlook.scenarios || []).find((s) => /base/i.test(s.label || ''));
  const bear = (outlook.scenarios || []).find((s) => /bear/i.test(s.label || ''));
  const faqs: FaqItem[] = [];

  const pred = sentence(outlook.stanceSummary);
  if (pred) {
    faqs.push({
      question: `What is the ${name} price prediction for ${horizon}?`,
      answer: pred,
    });
  }

  if (base && money(base.priceLow) && money(base.priceHigh)) {
    faqs.push({
      question: `What is the ${name} (${sym || name}) base-case price range?`,
      answer: `CoinsClarity Markets Desk base case: ${money(base.priceLow)} to ${money(base.priceHigh)}${base.thesis ? `. ${sentence(base.thesis)}` : '.'}`,
    });
  }

  const stance = (outlook.stance || 'neutral').toLowerCase();
  const buyLine =
    stance === 'constructive'
      ? `Desk stance is constructive, not a buy alert.`
      : stance === 'bearish'
        ? `Desk stance is bearish — treat strength as a place to reduce risk, not chase.`
        : stance === 'cautious'
          ? `Desk stance is cautious. Wait for a catalyst or a cleaner level.`
          : `Desk stance is neutral. This is a map, not a trade ticket.`;
  faqs.push({
    question: `Is ${name} a buy right now?`,
    answer: `${buyLine} ${pred}`.trim(),
  });

  if (bear?.thesis) {
    faqs.push({
      question: `What is the bear case for ${sym || name}?`,
      answer: sentence(bear.thesis),
    });
  } else if (outlook.risks?.[0]) {
    faqs.push({
      question: `What could send ${sym || name} lower?`,
      answer: outlook.risks.slice(0, 3).join('; ') + '.',
    });
  }

  if (outlook.catalysts?.[0]) {
    faqs.push({
      question: `What are the main ${name} price catalysts?`,
      answer: outlook.catalysts.slice(0, 4).join('; ') + '.',
    });
  }

  if (outlook.methodology) {
    faqs.push({
      question: `How does CoinsClarity build the ${name} outlook?`,
      answer: sentence(outlook.methodology),
    });
  }

  return faqs.filter((f) => f.question && f.answer && f.answer.length > 24).slice(0, 6);
}

export function extractFaqFromHtml(html?: string): FaqItem[] {
  const raw = String(html || '');
  if (!/frequently asked|class="[^"]*cc-faq/i.test(raw)) return [];
  const out: FaqItem[] = [];
  const re = /<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) && out.length < 6) {
    const question = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const answer = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (question && answer.length > 20) out.push({ question, answer });
  }
  return out;
}

export function predictionSeoTitle(title: string, outlook?: OutlookLike | null): string {
  const t = String(title || '').trim();
  const name = outlook?.coinName || '';
  const horizon = (outlook?.horizon || '2026–2030').replace(/\s+/g, ' ');
  if (!t) return name ? `${name} Price Prediction ${horizon} | CoinsClarity` : 'Price Prediction | CoinsClarity';
  const hasQuery = /price (prediction|outlook|forecast)/i.test(t);
  if (hasQuery) return `${t} | CoinsClarity`;
  if (name && t.length < 48) return `${t} | ${name} Price Prediction ${horizon}`;
  if (name) return `${t} | ${name} Price Prediction`;
  return `${t} | CoinsClarity`;
}
