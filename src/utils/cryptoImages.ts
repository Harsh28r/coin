// Branded SVG fallback for news/blog/airdrop/etc. cards.
//
// Design notes:
// - We avoid external placeholder services (placehold.co / DiceBear). The backend's
//   stale rssfeeds cache contains a lot of those URLs and they look like generic
//   "image broken" graphics. Treat them as fake and substitute a clean SVG instead.
// - The SVG is a deterministic, title-derived gradient with a tiny crypto glyph and
//   the headline overlaid. Same title → same colors, so refreshes don't flicker.
// - Returned as a data URL so it works as `<img src>` everywhere existing call sites
//   already render an <img>.

type ImageType = 'news' | 'blog' | 'nft' | 'coin' | 'airdrop';

const PALETTE: Array<[string, string, string]> = [
  ['#0f172a', '#7c3aed', '#f59e0b'], // navy → violet → amber
  ['#0b132b', '#1c2541', '#5bc0be'], // deep blue → teal
  ['#1a1a2e', '#16213e', '#e43f5a'], // midnight → crimson
  ['#0f0e17', '#ff8906', '#f25f4c'], // black → orange
  ['#0d1b2a', '#1b263b', '#fca311'], // ink → gold
  ['#1f0036', '#5a189a', '#ffba08'], // royal → saffron
  ['#0a1128', '#034078', '#fefcfb'], // navy → azure
  ['#000814', '#003566', '#ffd60a'], // black → sun
  ['#0c0032', '#190061', '#ff5c8a'], // indigo → pink
  ['#001219', '#005f73', '#ee9b00'], // teal → mustard
];

const TYPE_GLYPH: Record<ImageType, string> = {
  // Compact crypto-evocative SVG glyphs (paths drawn at 0,0 in 80×80 viewBox)
  news: 'M14 18h52v44H14zM20 26h40M20 34h40M20 42h28M20 50h32',
  blog: 'M16 14h48v52H16zM24 26h32M24 34h32M24 42h32M24 50h22M24 58h28',
  airdrop: 'M40 12c-9 12-18 22-18 32a18 18 0 1 0 36 0c0-10-9-20-18-32z',
  nft: 'M16 16h48v48H16zM24 24h14v14H24zM42 24h14v14H42zM24 42h14v14H24zM42 42h14v14H42z',
  coin: 'M40 12a28 28 0 1 0 0.001 0zM30 28h20M30 36h20M30 44h20M30 52h14',
};

const hash = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const escapeXml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const wrapTitle = (title: string, perLine = 22, maxLines = 3): string[] => {
  const words = title.replace(/\s+/g, ' ').trim().split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > perLine) {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length >= maxLines - 1) break;
    } else {
      cur = (cur ? cur + ' ' : '') + w;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (words.join(' ').length > lines.join(' ').length && lines.length === maxLines) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s\S+$/, '') + '…';
  }
  return lines.length ? lines : [title.slice(0, perLine)];
};

const buildSvg = (title: string, type: ImageType, w: number, h: number): string => {
  const id = hash(title || type);
  const [c1, c2, accent] = PALETTE[id % PALETTE.length];
  const glyph = TYPE_GLYPH[type];
  const lines = wrapTitle(title || 'CoinsClarity', 22, 3);
  const baseY = h / 2 - (lines.length - 1) * 16;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="r${id}" cx="85%" cy="15%" r="60%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g${id})"/>
  <rect width="${w}" height="${h}" fill="url(#r${id})"/>
  <g transform="translate(${w - 96} ${h - 96})" opacity="0.18" fill="none" stroke="${accent}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
    <path d="${glyph}"/>
  </g>
  <text x="32" y="40" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="13" font-weight="700" letter-spacing="2" fill="${accent}">COINSCLARITY</text>
  ${lines
    .map(
      (line, i) =>
        `<text x="32" y="${baseY + i * 32}" font-family="Georgia,'Times New Roman',serif" font-size="26" font-weight="700" fill="#fff">${escapeXml(line)}</text>`
    )
    .join('\n  ')}
</svg>`;
};

const toDataUrl = (svg: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

// URLs that the backend stamps when it can't extract a real image. Treat as missing
// so we can replace them with our branded SVG client-side.
const FAKE_HOSTS = [
  'placehold.co',
  'placehold.it',
  'via.placeholder.com',
  'placeholder.com',
  'api.dicebear.com',
  'avatars.dicebear.com',
];

export const isFakeImageUrl = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (trimmed === '#' || trimmed === 'null' || trimmed === 'undefined') return true;
  try {
    const u = new URL(trimmed, 'http://x');
    if (FAKE_HOSTS.includes(u.hostname)) return true;
  } catch {
    // Not a URL — definitely fake.
    return true;
  }
  return false;
};

export const getCryptoFallbackImage = (
  title?: string,
  type: ImageType = 'news'
): string => {
  const w = type === 'nft' || type === 'coin' ? 400 : 600;
  const h = type === 'nft' ? 400 : type === 'coin' ? 400 : 360;
  return toDataUrl(buildSvg(title || 'CoinsClarity', type, w, h));
};

// Resolve src once, accounting for known-bad placeholder URLs.
export const resolveImageSrc = (
  src: string | undefined | null,
  title?: string,
  type: ImageType = 'news'
): string => (isFakeImageUrl(src) ? getCryptoFallbackImage(title, type) : (src as string));

export const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackTitle?: string,
  type: ImageType = 'news'
) => {
  const target = e.currentTarget as HTMLImageElement;
  // Avoid infinite loop if the fallback itself fails for some reason
  if (target.dataset.fallbackApplied === '1') return;
  target.dataset.fallbackApplied = '1';
  target.src = getCryptoFallbackImage(fallbackTitle, type);
};
