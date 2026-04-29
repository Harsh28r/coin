// src/Components/EditorialHero.tsx
// CryptoSlate-style magazine hero: 1 lead story + secondary rail
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { BRAND_DISPLAY_NAME, stripAppearedFirstOn } from '../utils/branding';
import { resolveImageSrc, handleImageError } from '../utils/cryptoImages';
import { buildRssBackendBases } from '../utils/rssBackendBases';
import './EditorialHero.css';

interface HeroItem {
  article_id: string;
  title: string;
  description: string;
  creator: string[];
  pubDate: string;
  image_url: string;
  link: string;
  source: string;
  category?: string;
  content?: string;
}

const PLACEHOLDER = 'https://placehold.co/1200x675/0a0a0a/737373?text=CoinsClarity';

function decodeHtml(s: string): string {
  if (typeof s !== 'string') return '';
  return s
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function extractImg(html: string): string {
  if (typeof html !== 'string' || !html.trim()) return '';
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1].trim() : '';
}

function getImage(it: any): string {
  const candidates: any[] = [
    it?.image_url,
    typeof it?.image === 'string' ? it.image : it?.image?.url,
    typeof it?.thumbnail === 'string' ? it.thumbnail : it?.thumbnail?.url,
    typeof it?.enclosure === 'string' ? it.enclosure : it?.enclosure?.url,
    Array.isArray(it?.enclosures) ? (it.enclosures[0]?.url || it.enclosures[0]) : '',
    it?.media?.content?.[0]?.$?.url,
    it?.featured_image,
    it?.og_image,
    extractImg(it?.content || it?.description || ''),
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) {
      const s = c.trim();
      if (/^https?:\/\//i.test(s)) return s;
      if (s.startsWith('//')) return `https:${s}`;
    }
  }
  return PLACEHOLDER;
}

function timeAgo(date: string | Date | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const FALLBACK: HeroItem[] = [
  {
    article_id: 'fallback-1', title: 'The story is loading…',
    description: 'Top crypto headlines will appear here.',
    creator: [BRAND_DISPLAY_NAME], pubDate: new Date().toISOString(),
    image_url: PLACEHOLDER, link: '#', source: 'Top Story', category: 'Markets',
  },
  {
    article_id: 'fallback-2', title: 'Bitcoin and the regulatory landscape',
    description: '', creator: [BRAND_DISPLAY_NAME], pubDate: new Date().toISOString(),
    image_url: PLACEHOLDER, link: '#', source: 'Bitcoin', category: 'Bitcoin',
  },
  {
    article_id: 'fallback-3', title: 'Ethereum upgrades and Layer 2 momentum',
    description: '', creator: [BRAND_DISPLAY_NAME], pubDate: new Date().toISOString(),
    image_url: PLACEHOLDER, link: '#', source: 'Ethereum', category: 'Ethereum',
  },
  {
    article_id: 'fallback-4', title: 'DeFi protocols see renewed inflows',
    description: '', creator: [BRAND_DISPLAY_NAME], pubDate: new Date().toISOString(),
    image_url: PLACEHOLDER, link: '#', source: 'DeFi', category: 'DeFi',
  },
  {
    article_id: 'fallback-5', title: 'NFT markets quietly recovering',
    description: '', creator: [BRAND_DISPLAY_NAME], pubDate: new Date().toISOString(),
    image_url: PLACEHOLDER, link: '#', source: 'NFTs', category: 'NFTs',
  },
];

const EditorialHero: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<HeroItem[]>([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-2.onrender.com';

  useEffect(() => {
    let cancelled = false;
    const fetchJson = async (url: string, timeout = 5000) => {
      const ctrl = new AbortController();
      const id = window.setTimeout(() => ctrl.abort(), timeout);
      try {
        const r = await fetch(url, { signal: ctrl.signal });
        if (!r.ok) throw new Error('bad');
        return await r.json();
      } catch { return null; }
      finally { clearTimeout(id); }
    };
    const extract = (j: any): any[] => {
      if (!j) return [];
      return Array.isArray(j.data) ? j.data : Array.isArray(j.items) ? j.items : [];
    };

    (async () => {
      const bases = buildRssBackendBases(API_BASE_URL);
      const mapItem = (it: any, cat: string, idx: number): HeroItem => {
        const desc = stripAppearedFirstOn(decodeHtml(it.description || ''));
        return {
          article_id: it.article_id || it.id || it.guid || `${cat}-${idx}`,
          title: decodeHtml(it.title || 'Untitled'),
          description: desc.replace(/<[^>]+>/g, '').slice(0, 220),
          creator: Array.isArray(it.creator) ? it.creator : [it.author || BRAND_DISPLAY_NAME],
          pubDate: it.pubDate || it.date || new Date().toISOString(),
          image_url: getImage(it),
          link: it.link || '#',
          source: it.source_name || cat,
          category: Array.isArray(it.category) ? it.category[0] : (it.category || cat),
          content: it.content || it.description || '',
        };
      };

      // Pass 1: try aggregated fetch-all-rss across all backends (1 request per backend)
      let merged: HeroItem[] = [];
      for (const base of bases) {
        const j = await fetchJson(`${base.replace(/\/$/, '')}/fetch-all-rss?limit=12`, 6000);
        if (j?.success) {
          const arr = extract(j);
          if (arr.length >= 3) {
            merged = arr.slice(0, 10).map((it: any, i: number) => mapItem(it, 'Top Story', i));
            break;
          }
        }
      }

      // Pass 2: try individual sources per backend if aggregated failed
      if (!merged.length) {
        const categories = [
          { path: 'fetch-cointelegraph-rss?limit=4', category: 'Top Story' },
          { path: 'fetch-coindesk-rss?limit=4', category: 'Markets' },
          { path: 'fetch-decrypt-rss?limit=4', category: 'Editorial' },
          { path: 'fetch-cryptoslate-rss?limit=4', category: 'Insights' },
          { path: 'fetch-blockworks-rss?limit=4', category: 'Industry' },
        ];
        for (const base of bases) {
          const results = await Promise.allSettled(
            categories.map(({ path }) => fetchJson(`${base.replace(/\/$/, '')}/${path}`, 5500))
          );
          results.forEach((res, idx) => {
            if (res.status !== 'fulfilled' || !res.value) return;
            const arr = extract(res.value);
            const cat = categories[idx].category;
            arr.slice(0, 2).forEach((it: any) => {
              merged.push(mapItem(it, cat, merged.length));
            });
          });
          if (merged.length >= 3) break;
        }
      }

      if (cancelled) return;
      // Dedupe by title
      const seen = new Set<string>();
      const dedup = (merged.length ? merged : FALLBACK).filter(x => {
        const key = (x.title || '').toLowerCase().trim();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setItems(dedup.slice(0, 9));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [API_BASE_URL]);

  const lead = items[0];
  const rail = useMemo(() => items.slice(1, 5), [items]);
  const lower = useMemo(() => items.slice(5, 9), [items]);

  const goToArticle = (it: HeroItem) => {
    const id = it.article_id || encodeURIComponent(it.link || it.title);
    const stateItem = {
      article_id: id,
      title: it.title,
      description: it.description,
      creator: it.creator,
      pubDate: it.pubDate,
      image_url: it.image_url,
      link: it.link,
      source_name: BRAND_DISPLAY_NAME,
      content: it.content || it.description,
    };
    navigate(`/news/${id}`, { state: { item: stateItem } });
  };

  if (loading) {
    return (
      <section className="cc-hero py-3 py-md-4">
        <div className="cc-container">
          <div className="cc-hero__grid">
            <div className="cc-hero__lead">
              <Skeleton height={460} borderRadius={12} />
            </div>
            <div className="cc-hero__rail">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="cc-hero__rail-item">
                  <Skeleton height={80} width={120} borderRadius={8} />
                  <div style={{ flex: 1 }}>
                    <Skeleton count={2} />
                    <Skeleton width={80} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!lead) return null;

  return (
    <section className="cc-hero py-3 py-md-4">
      <div className="cc-container">
        <div className="cc-hero__grid">
          {/* Lead story */}
          <article className="cc-hero__lead" onClick={() => goToArticle(lead)} role="button" tabIndex={0}>
            <div className="cc-hero__lead-media">
              <img
                src={resolveImageSrc(lead.image_url, lead.title, 'news')}
                alt=""
                loading="eager"
                onError={(e) => handleImageError(e, lead.title, 'news')}
              />
            </div>
            <div className="cc-hero__lead-body">
              <span className="cc-eyebrow">{lead.category || 'Top Story'}</span>
              <h1 className="cc-hero__lead-title">{lead.title}</h1>
              {lead.description && (
                <p className="cc-hero__lead-dek">{lead.description}</p>
              )}
              <div className="cc-byline">
                <strong>{BRAND_DISPLAY_NAME}</strong>
                <span className="cc-hero__sep" aria-hidden>·</span>
                <span>{timeAgo(lead.pubDate)}</span>
              </div>
            </div>
          </article>

          {/* Rail of 4 secondary stories */}
          <aside className="cc-hero__rail" aria-label="More headlines">
            {rail.map((it) => (
              <article
                key={it.article_id}
                className="cc-hero__rail-item"
                onClick={() => goToArticle(it)}
                role="button"
                tabIndex={0}
              >
                <div className="cc-hero__rail-media">
                  <img
                    src={resolveImageSrc(it.image_url, it.title, 'news')}
                    alt=""
                    loading="lazy"
                    onError={(e) => handleImageError(e, it.title, 'news')}
                  />
                </div>
                <div className="cc-hero__rail-body">
                  <span className="cc-eyebrow cc-eyebrow--muted">{it.category || it.source}</span>
                  <h3 className="cc-hero__rail-title">{it.title}</h3>
                  <span className="cc-byline">{timeAgo(it.pubDate)}</span>
                </div>
              </article>
            ))}
          </aside>
        </div>

        {/* Lower trending row (4 micro tiles) */}
        {lower.length >= 2 && (
          <>
            <div className="cc-hero__rule" />
            <div className="cc-hero__lower">
              {lower.map((it) => (
                <article
                  key={it.article_id}
                  className="cc-hero__tile"
                  onClick={() => goToArticle(it)}
                  role="button"
                  tabIndex={0}
                >
                  <span className="cc-eyebrow cc-eyebrow--muted">{it.category || it.source}</span>
                  <h4 className="cc-hero__tile-title">{it.title}</h4>
                  <span className="cc-byline">{timeAgo(it.pubDate)}</span>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default EditorialHero;
