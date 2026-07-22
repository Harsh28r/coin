import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Handshake } from 'lucide-react';
import { buildRssBackendBasesFromEnv, joinBackendPath } from '../utils/rssBackendBases';
import { resolveImageSrc, handleImageError } from '../utils/cryptoImages';
import './CoinpediaPartner.css';

type PartnerItem = {
  article_id?: string;
  title: string;
  description?: string;
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

/** Labeled Coinpedia partner wire — links out, never claimed as CoinsClarity original. */
const CoinpediaPartner: React.FC<{ limit?: number; compact?: boolean }> = ({
  limit = 6,
  compact = false,
}) => {
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
            const r = await fetch(url, { credentials: 'omit', mode: 'cors' });
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

  if (!loading && items.length === 0) return null;

  return (
    <section className={`cp-partner ${compact ? 'cp-partner--compact' : ''}`} aria-label="Coinpedia partner feed">
      <div className="cp-partner__inner">
        <header className="cp-partner__head">
          <div className="cp-partner__brand">
            <span className="cp-partner__badge">
              <Handshake size={14} /> Official partner
            </span>
            <h2 className="cp-partner__title">
              From <span>Coinpedia</span>
            </h2>
            <p className="cp-partner__dek">
              Fintech &amp; crypto coverage via our media partnership. Stories open on Coinpedia —
              attributed, not rewritten.
            </p>
          </div>
          <div className="cp-partner__actions">
            <Link to="/partners/coinpedia" className="cp-partner__more">
              All partner stories
            </Link>
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

        <ul className="cp-partner__grid">
          {items.map((item) => (
            <li key={item.article_id || item.link}>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="cp-partner__card"
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
                  <p>{strip(item.description).slice(0, 120)}{strip(item.description).length > 120 ? '…' : ''}</p>
                  <span className="cp-partner__out">
                    Read on Coinpedia <ExternalLink size={12} />
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>

        <p className="cp-partner__legal">
          Content © Coinpedia. Displayed on CoinsClarity under partnership. We do not claim authorship.
        </p>
      </div>
    </section>
  );
};

export default CoinpediaPartner;
