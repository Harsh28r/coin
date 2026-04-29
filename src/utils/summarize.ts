// Extractive summariser — runs entirely in the browser, no API key.
// Algorithm: lightweight TextRank-style sentence scoring.
//   1. Split article into sentences.
//   2. For each sentence compute (length-bonus * keyword-density * position-bonus).
//   3. Bias toward sentences that mention the article's most frequent nouns.
//   4. Return the top N, in original order.
//
// Cached per articleId in sessionStorage so we only pay the cost once per visit.

const STOP = new Set([
  'the','a','an','and','or','but','of','to','in','on','at','for','with','from','by',
  'is','are','was','were','be','been','being','it','its','this','that','these','those',
  'as','if','than','then','so','also','not','no','yes','i','we','our','you','your',
  'they','their','his','her','he','she','him','my','me','us','do','does','did','done',
  'has','have','had','will','would','can','could','should','may','might','must',
  'about','into','over','under','between','through','during','before','after',
  'said','says','say','told','tells','reported','says','according','today','yesterday',
  'one','two','three','first','second','last','new','more','most','some','any','many',
]);

const stripHtml = (s: string): string =>
  s.replace(/<script[\s\S]*?<\/script>/gi, ' ')
   .replace(/<style[\s\S]*?<\/style>/gi, ' ')
   .replace(/<[^>]+>/g, ' ')
   .replace(/&nbsp;/g, ' ')
   .replace(/&amp;/g, '&')
   .replace(/&lt;/g, '<')
   .replace(/&gt;/g, '>')
   .replace(/&quot;/g, '"')
   .replace(/&#39;/g, "'")
   .replace(/\s+/g, ' ')
   .trim();

const splitSentences = (text: string): string[] => {
  // Naive but reliable: split on . ! ? followed by whitespace + capital.
  // Keep sentences between 30–400 chars.
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z"'])/)
    .map(s => s.trim())
    .filter(s => s.length >= 30 && s.length <= 400);
};

const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9$\s%-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w));

export interface Summary {
  bullets: string[];
  fullSentenceCount: number;
}

const CACHE_KEY = (id: string) => `tldr:${id}`;

export const summarize = (
  rawHtmlOrText: string,
  options: { maxBullets?: number; cacheId?: string } = {},
): Summary => {
  const { maxBullets = 3, cacheId } = options;

  if (cacheId) {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY(cacheId));
      if (raw) return JSON.parse(raw);
    } catch {}
  }

  const text = stripHtml(rawHtmlOrText || '');
  const sentences = splitSentences(text);
  if (sentences.length === 0) return { bullets: [], fullSentenceCount: 0 };

  // Build keyword frequency map.
  const allTokens = tokenize(text);
  const freq = new Map<string, number>();
  for (const w of allTokens) freq.set(w, (freq.get(w) || 0) + 1);

  // Score each sentence.
  const scored = sentences.map((sent, idx) => {
    const tokens = tokenize(sent);
    if (tokens.length === 0) return { sent, idx, score: 0 };

    let kwScore = 0;
    for (const t of tokens) kwScore += (freq.get(t) || 0);
    const density = kwScore / tokens.length;

    // Position bonus: first 20% of article gets boost, last 30% small penalty.
    const rel = idx / sentences.length;
    const positionBonus = rel < 0.2 ? 1.4 : rel > 0.7 ? 0.8 : 1.0;

    // Length sweet spot: 80–250 chars.
    const len = sent.length;
    const lengthBonus = len >= 80 && len <= 250 ? 1.2 : len < 50 || len > 320 ? 0.7 : 1.0;

    // Penalize sentences that look like cruft.
    const lower = sent.toLowerCase();
    const cruftPenalty =
      /(subscribe|follow us|join our|click here|read more|disclaimer|trademark)/.test(lower)
        ? 0.3 : 1.0;

    return {
      sent,
      idx,
      score: density * positionBonus * lengthBonus * cruftPenalty,
    };
  });

  // Pick top N, return in original order.
  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxBullets)
    .sort((a, b) => a.idx - b.idx);

  // Strip leading "The/A/An" and trailing fluff for tighter bullets.
  const bullets = top.map(t => {
    let s = t.sent;
    s = s.replace(/\s+\([^)]{0,40}\)\s*\.?$/, '.');
    s = s.replace(/\s+—\s+(.{0,60})$/, '');
    if (!/[.!?]$/.test(s)) s += '.';
    return s;
  });

  const result: Summary = { bullets, fullSentenceCount: sentences.length };

  if (cacheId) {
    try { sessionStorage.setItem(CACHE_KEY(cacheId), JSON.stringify(result)); } catch {}
  }
  return result;
};
