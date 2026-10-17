import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchSyndicatedWire,
  wireItemToNewsState,
  type WireItem,
} from '../utils/syndicatedWire';
import './LandingWireStrip.css';

/** CoinsCapture-style syndicated wire — read on CoinsClarity, not bounce to publisher. */
const LandingWireStrip: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<WireItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();

    fetchSyndicatedWire({ limit: 14, mode: 'interleave', signal: ac.signal })
      .then((merged) => {
        if (!cancelled) setItems(merged);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, []);

  const openOnPlatform = (it: WireItem) => {
    const targetId = encodeURIComponent(it.id || it.title);
    navigate(`/news/${targetId}`, { state: { item: wireItemToNewsState(it) } });
  };

  if (!items.length) return null;

  return (
    <section className="lws" aria-label="Syndicated news wire">
      <div className="lws-inner">
        <header className="lws-head">
          <div>
            <span className="lws-eyebrow">Wire</span>
            <h2 className="lws-title">Live wire</h2>
            <p className="lws-dek">
              Syndicated headlines from Bitcoin News, Blockchain News, CryptoNews, CryptoNewsZ, Decrypt
              and more — open on CoinsClarity. Original publisher credited on the article page.
            </p>
          </div>
        </header>
        <ul className="lws-list">
          {items.map((it) => (
            <li key={it.id}>
              <button type="button" className="lws-row" onClick={() => openOnPlatform(it)}>
                {it.image ? (
                  <img
                    className="lws-img"
                    src={it.image}
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="lws-img lws-img--ph" aria-hidden />
                )}
                <div className="lws-body">
                  <strong>{it.title}</strong>
                  {it.excerpt ? <p>{it.excerpt}…</p> : null}
                  <span className="lws-meta">
                    Source: {it.source}
                    {it.published ? ` · Published: ${it.published}` : ''}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default LandingWireStrip;
