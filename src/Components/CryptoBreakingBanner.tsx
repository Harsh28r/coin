import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type RawItem = {
  article_id?: string;
  _id?: string;
  title?: string;
  description?: string;
  contentSnippet?: string;
  creator?: string[] | string;
  author?: string;
  pubDate?: string;
  publishedAt?: string;
  date?: string;
  image_url?: string;
  image?: string;
  link?: string;
  url?: string;
};

type BreakingItem = {
  id: string;
  title: string;
  description: string;
  author: string;
  pubDate: string;
  image_url: string;
  link: string;
  isBreaking: boolean;
};

const URGENT_KEYWORDS = [
  'breaking',
  'urgent',
  'just in',
  'etf',
  'sec',
  'hack',
  'exploit',
  'liquidation',
  'surge',
  'crash',
  'bitcoin',
  'ethereum'
];

const normalizeItem = (item: RawItem, idx: number): BreakingItem => {
  const title = (item.title || 'Crypto market update').trim();
  const idBase = item.article_id || item._id || item.link || item.url || `${title}-${idx}`;
  const id = encodeURIComponent(String(idBase));
  const author =
    Array.isArray(item.creator) ? item.creator.join(', ') : item.creator || item.author || 'CoinsClarity';
  const pubDate = item.pubDate || item.publishedAt || item.date || new Date().toISOString();
  const description = item.description || item.contentSnippet || 'Latest crypto update';
  const image_url = item.image_url || item.image || '';
  const link = item.link || item.url || '#';
  const text = title.toLowerCase();
  const isBreaking = URGENT_KEYWORDS.some((kw) => text.includes(kw));

  return { id, title, description, author, pubDate, image_url, link, isBreaking };
};

const getApiBases = (): string[] => {
  const envA = (process.env.REACT_APP_API_URL as string) || '';
  const envB = (process.env.REACT_APP_API_BASE_URL as string) || '';
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const sameOrigin = typeof window !== 'undefined' ? `${window.location.origin}/api` : '';
  const isProd = typeof window !== 'undefined' && !/localhost|127\.0\.0\.1/i.test(host);
  const local = isProd ? '' : 'http://localhost:5000';
  const camify = 'https://camify.fun.coinsclarity.com/api';
  const list = [sameOrigin, envA, envB, camify, local].filter(Boolean);
  return Array.from(new Set(list.map((v) => String(v).replace(/\/$/, ''))));
};

const CryptoBreakingBanner: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<BreakingItem[]>([]);
  const [index, setIndex] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchBreaking = async () => {
      const paths = ['/fetch-all-rss?limit=10', '/fetch-another-rss?limit=10', '/fetch-coindesk-rss?limit=10'];
      for (const base of getApiBases()) {
        for (const path of paths) {
          try {
            const res = await fetch(`${base}${path}`);
            if (!res.ok) continue;
            const json = await res.json();
            const list = Array.isArray(json?.data) ? json.data : Array.isArray(json?.items) ? json.items : [];
            if (!Array.isArray(list) || list.length === 0) continue;

            const normalized = list
              .slice(0, 8)
              .map((it: RawItem, idx: number) => normalizeItem(it, idx))
              .filter((it) => !!it.title);
            if (!mounted || normalized.length === 0) continue;

            setItems(normalized);
            setIndex(0);
            return;
          } catch {
            // try next path/base
          }
        }
      }

      if (mounted) {
        setItems([
          {
            id: 'welcome',
            title: 'Live crypto breaking updates from CoinsClarity',
            description: 'Latest crypto market updates',
            author: 'CoinsClarity',
            pubDate: new Date().toISOString(),
            image_url: '',
            link: '#',
            isBreaking: false
          }
        ]);
      }
    };

    fetchBreaking();
    const refresh = setInterval(fetchBreaking, 5 * 60 * 1000);
    return () => {
      mounted = false;
      clearInterval(refresh);
    };
  }, []);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [items.length]);

  const current = useMemo(() => items[index], [items, index]);
  const hasBreaking = useMemo(() => items.some((it) => it.isBreaking), [items]);

  if (hidden || !current) return null;

  return (
    <div style={{ background: hasBreaking ? '#dc2626' : '#111827', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '6px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}
      >
        <span
          style={{
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontWeight: 700,
            background: hasBreaking ? 'rgba(255,255,255,0.2)' : '#f97316',
            borderRadius: 4,
            padding: '2px 8px',
            whiteSpace: 'nowrap',
            lineHeight: '18px'
          }}
        >
          {hasBreaking ? '🔴 Breaking' : 'Latest'}
        </span>

        <button
          type="button"
          onClick={() =>
            navigate(`/news/${current.id}`, {
              state: {
                item: {
                  article_id: current.id,
                  title: current.title,
                  description: current.description,
                  creator: [current.author],
                  pubDate: current.pubDate,
                  image_url: current.image_url,
                  link: current.link,
                  source_name: 'CoinsClarity',
                  content: current.description
                }
              }
            })
          }
          style={{
            border: 0,
            background: 'transparent',
            color: '#fff',
            textAlign: 'left',
            fontSize: 13,
            fontWeight: 500,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            padding: 0,
            lineHeight: '18px'
          }}
        >
          {current.title}
        </button>

        {items.length > 1 && (
          <span style={{ fontSize: 11, opacity: 0.5, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
            {index + 1}/{items.length}
          </span>
        )}

        <button
          type="button"
          onClick={() => setHidden(true)}
          aria-label="Close"
          style={{
            border: 0,
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
            borderRadius: 4,
            width: 22,
            height: 22,
            lineHeight: '22px',
            padding: 0,
            fontSize: 12,
            cursor: 'pointer',
            opacity: 0.6
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default CryptoBreakingBanner;
