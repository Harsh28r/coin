import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts } from '../services/api';
import type { BlogPost } from '../types/blog';
import { resolveImageSrc, handleImageError } from '../utils/cryptoImages';
import { getBlogUrl } from '../utils/blogUrl';
import './LandingEditorialStrip.css';

const stripTags = (html?: string): string =>
  (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const pickLatest = (list: BlogPost[]): BlogPost | null => {
  if (!list.length) return null;
  return [...list].sort((a, b) => {
    const ta = new Date((a as any).date || 0).getTime();
    const tb = new Date((b as any).date || 0).getTime();
    return tb - ta;
  })[0];
};

/** Latest daily digest + trending desk cards for the landing page. */
const LandingEditorialStrip: React.FC = () => {
  const [digestList, setDigestList] = useState<BlogPost[]>([]);
  const [trendList, setTrendList] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [d, t] = await Promise.all([
          fetchPosts({ tag: 'daily-digest', limit: 12 }),
          fetchPosts({ tag: 'trending-desk', limit: 12 }),
        ]);
        if (!cancelled) {
          setDigestList(d);
          setTrendList(t);
        }
      } catch {
        if (!cancelled) {
          setDigestList([]);
          setTrendList([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const latestDigest = useMemo(() => pickLatest(digestList), [digestList]);
  const latestTrend = useMemo(() => pickLatest(trendList), [trendList]);

  const dek = (p: BlogPost) => {
    const raw = (p.excerpt || stripTags(p.content)).trim();
    return raw.length > 200 ? `${raw.slice(0, 200)}…` : raw;
  };

  return (
    <section className="les" aria-label="Daily digest and trending desk">
      <div className="les-inner">
        <header className="les-head">
          <h2 className="les-title">On the desk today</h2>
          <p className="les-sub">
            Brief at noon IST, then a deeper read on what&apos;s trending half an hour later.
          </p>
        </header>

        {loading && <p className="les-muted">Loading…</p>}

        {!loading && (
          <div className="les-grid">
            <article className="les-card">
              <span className="les-kicker les-kicker--digest">Daily digest</span>
              {latestDigest ? (
                <>
                  <Link to={getBlogUrl(latestDigest)} className="les-card__link">
                    <div className="les-card__img">
                      <img
                        src={resolveImageSrc(latestDigest.imageUrl, latestDigest.title, 'blog')}
                        alt=""
                        loading="lazy"
                        onError={(e) => handleImageError(e, latestDigest.title, 'blog')}
                      />
                    </div>
                    <h3 className="les-card__title">{latestDigest.title}</h3>
                    <p className="les-dek">{dek(latestDigest)}</p>
                  </Link>
                  <Link to="/daily-digest" className="les-archive">
                    All digest editions →
                  </Link>
                </>
              ) : (
                <p className="les-empty">No digest edition yet.</p>
              )}
            </article>

            <article className="les-card">
              <span className="les-kicker les-kicker--trend">Trending desk</span>
              {latestTrend ? (
                <>
                  <Link to={getBlogUrl(latestTrend)} className="les-card__link">
                    <div className="les-card__img">
                      <img
                        src={resolveImageSrc(latestTrend.imageUrl, latestTrend.title, 'blog')}
                        alt=""
                        loading="lazy"
                        onError={(e) => handleImageError(e, latestTrend.title, 'blog')}
                      />
                    </div>
                    <h3 className="les-card__title">{latestTrend.title}</h3>
                    <p className="les-dek">{dek(latestTrend)}</p>
                  </Link>
                  <Link to="/trending-desk" className="les-archive">
                    Trending desk archive →
                  </Link>
                </>
              ) : (
                <p className="les-empty">No trending desk article yet.</p>
              )}
            </article>
          </div>
        )}
      </div>
    </section>
  );
};

export default LandingEditorialStrip;
