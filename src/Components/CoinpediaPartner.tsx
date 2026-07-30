import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ExternalLink, Handshake } from 'lucide-react';
import { buildRssBackendBasesFromEnv, joinBackendPath } from '../utils/rssBackendBases';
import { resolveImageSrc, handleImageError } from '../utils/cryptoImages';
import './CoinpediaPartner.css';

type PartnerItem = {
  article_id?: string;
  title: string;
  description?: string;
  content?: string;
  link: string;
  image_url?: string;
  pubDate?: string;
  creator?: string[];
  source_name?: string;
};

const formatDate = (d?: string) => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

const strip = (s?: string) =>
  (s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

type CoinpediaPartnerProps = {
  limit?: number;
  compact?: boolean;
  /** Hide “All partner stories” (already on that page). */
  pageMode?: boolean;
  /** Show empty state instead of unmounting when feed fails. */
  showEmpty?: boolean;
};

/** Coinpedia partner wire — full articles open on CoinsClarity (/news/:id). */
const CoinpediaPartner = ({
  limit = 6,
  compact = false,
  pageMode = false,
  showEmpty = false,
}: CoinpediaPartnerProps) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<PartnerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const bases = buildRssBackendBasesFromEnv();
      for (const base of bases) {
        try {
          const b = base.replace(/\/$/, '');
          const q = `fetch-coinpedia-rss?limit=${limit}`;
          for (const url of [`${b}/${q}`, `${b}/api/${q}`, joinBackendPath(base, `/${q}`)]) {
            const ctrl = new AbortController();
            const t = setTimeout(() => ctrl.abort(), 6000);
            let r: Response;
            try {
              r = await fetch(url, { credentials: 'omit', mode: 'cors', signal: ctrl.signal });
            } finally {
              clearTimeout(t);
            }
            if (!r.ok) continue;
            const j = await r.json();
            const list = Array.isArray(j?.data) ? j.data : [];
            if (!cancelled && list.length) {
              setItems(list);
              setLoading(false);
              return;
            }
          }
        } catch {
          /* next base */
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  const openArticle = (item: PartnerItem) => {
    const targetId = item.article_id || encodeURIComponent(item.title);
    const body = item.content || item.description || '';
    const bodyHtml = body.includes('<')
      ? body
      : body
          .split(/\n{2,}/)
          .map((p) => `<p>${p.trim()}</p>`)
          .filter((p) => p !== '<p></p>')
          .join('') || `<p>${body}</p>`;
    navigate(`/news/${targetId}`, {
      state: {
        item: {
          ...item,
          source_name: 'Coinpedia',
          creator: item.creator?.length ? item.creator : ['Coinpedia'],
          partner: 'coinpedia',
          content: body,
          fullContent: bodyHtml,
          contentHtml: bodyHtml,
          description: item.description || body,
        },
      },
    });
  };

  if (!loading && items.length === 0 && !showEmpty) return null;

  return (
    <section
      className={`cp-partner ${compact ? 'cp-partner--compact' : ''} ${pageMode ? 'cp-partner--on-page' : ''}`}
      aria-label="Coinpedia partner feed"
    >
      <div className="cp-partner__inner">
        <header className="cp-partner__head">
          <div className="cp-partner__brand">
            {!pageMode && (
              <span className="cp-partner__badge">
                <Handshake size={14} /> Official partner
              </span>
            )}
            <h2 className="cp-partner__title">
              {pageMode ? (
                <>
                  Latest from <span>Coinpedia</span>
                </>
              ) : (
                <>
                  From <span>Coinpedia</span>
                </>
              )}
            </h2>
            <p className="cp-partner__dek">
              Full articles on CoinsClarity via our media partnership — attributed to Coinpedia.
            </p>
          </div>
          <div className="cp-partner__actions">
            {!pageMode && (
              <Link to="/partners/coinpedia" className="cp-partner__more">
                All partner stories
              </Link>
            )}
            <a
              href="https://coinpedia.org/"
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="cp-partner__ext"
            >
              coinpedia.org <ExternalLink size={13} />
            </a>
          </div>
        </header>

        {loading && <p className="cp-partner__muted">Loading partner wire…</p>}

        {!loading && items.length === 0 && showEmpty && (
          <div className="cp-partner__empty">
            <strong>Partner wire is quiet right now</strong>
            <p>Stories will show here when the Coinpedia feed responds. Check coinpedia.org meanwhile.</p>
          </div>
        )}

        {items.length > 0 && (
          <ul className="cp-partner__grid">
            {items.map((item) => (
              <li key={item.article_id || item.link}>
                <button
                  type="button"
                  className="cp-partner__card"
                  onClick={() => openArticle(item)}
                >
                  <div className="cp-partner__img">
                    <img
                      src={resolveImageSrc(item.image_url, item.title, 'news')}
                      alt=""
                      loading="lazy"
                      onError={(e) => handleImageError(e, item.title, 'news')}
                    />
                  </div>
                  <div className="cp-partner__body">
                    <span className="cp-partner__meta">
                      Coinpedia · {formatDate(item.pubDate)}
                    </span>
                    <h3>{item.title}</h3>
                    <p>
                      {strip(item.description).slice(0, 120)}
                      {strip(item.description).length > 120 ? '…' : ''}
                    </p>
                    <span className="cp-partner__out">Read full article →</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="cp-partner__legal">
          Content © Coinpedia. Published on CoinsClarity under partnership with source attribution.
        </p>
      </div>
    </section>
  );
};

export default CoinpediaPartner;
