export interface RawItem {
  title?: string;
  description?: string;
  content?: string;
  pubDate?: string;
  link?: string;
  source_name?: string;
}

export interface EventItem {
  title: string;
  date: string;
  kind: 'Listing' | 'Delisting' | 'Upgrade' | 'Fork' | 'Mainnet' | 'ETF' | 'Unlock' | 'Court' | 'Other';
  source?: string;
  link?: string;
}

const EVENT_KEYWORDS: Array<{ re: RegExp; kind: EventItem['kind'] }> = [
  { re: /listing|lists|listed|trading starts|launches on/i, kind: 'Listing' },
  { re: /delist|delisting|trading halt|suspension/i, kind: 'Delisting' },
  { re: /upgrade|v\d+ release|release candidate|rc\d+/i, kind: 'Upgrade' },
  { re: /hard fork|soft fork|fork/i, kind: 'Fork' },
  { re: /mainnet|go live|genesis/i, kind: 'Mainnet' },
  { re: /etf|spot etf|sec filing|approval/i, kind: 'ETF' },
  { re: /token unlock|vesting|cliff/i, kind: 'Unlock' },
  { re: /court|hearing|injunction|lawsuit|settlement/i, kind: 'Court' },
];

const DATE_REGEX = /\b(\d{4}[-\/\.](\d{1,2})[-\/\.]\d{1,2}|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s+\d{1,2}(,\s*\d{4})?)\b/i;

export function extractEvents(items: RawItem[]): EventItem[] {
  const events: EventItem[] = [];
  for (const it of items) {
    const text = `${it.title || ''} ${it.description || ''} ${it.content || ''}`;
    let kind: EventItem['kind'] = 'Other';
    for (const k of EVENT_KEYWORDS) {
      if (k.re.test(text)) { kind = k.kind; break; }
    }
    if (kind === 'Other') continue;
    let dateStr = '';
    const m = text.match(DATE_REGEX);
    if (m) dateStr = m[0];
    else if (it.pubDate) dateStr = new Date(it.pubDate).toDateString();
    events.push({
      title: it.title || 'Untitled',
      date: dateStr || 'TBA',
      kind,
      source: it.source_name,
      link: it.link,
    });
  }
  // Deduplicate by title+date
  const seen = new Set<string>();
  const out: EventItem[] = [];
  for (const e of events) {
    const key = `${e.title}|${e.date}|${e.kind}`;
    if (!seen.has(key)) { seen.add(key); out.push(e); }
  }
  // Sort by date (fallback TBA last)
  out.sort((a, b) => {
    const da = Date.parse(a.date) || Number.MAX_SAFE_INTEGER;
    const db = Date.parse(b.date) || Number.MAX_SAFE_INTEGER;
    return da - db;
  });
  return out.slice(0, 100);
}


