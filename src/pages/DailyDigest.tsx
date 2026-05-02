import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import CoinsNavbar from '../Components/navbar';
import Footer from '../Components/footer';
import { fetchPosts } from '../services/api';
import type { BlogPost } from '../types/blog';
import { resolveImageSrc, handleImageError } from '../utils/cryptoImages';
import { getBlogUrl } from '../utils/blogUrl';
import './DailyDigest.css';

const stripTags = (html?: string): string =>
  (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

/** Posts tagged `daily-digest` (see backend dailyDigest.js). */
const DailyDigestArchive: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const list = await fetchPosts({ tag: 'daily-digest', limit: 100 });
        if (!cancelled) setPosts(list);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || 'Could not load digests.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = useMemo(
    () =>
      [...posts].sort((a, b) => {
        const ta = new Date((a as any).date || 0).getTime();
        const tb = new Date((b as any).date || 0).getTime();
        return tb - ta;
      }),
    [posts],
  );

  return (
    <div className="dd-page">
      <Helmet>
        <title>Daily digest archive — CoinsClarity</title>
        <meta
          name="description"
          content="Past crypto daily digests: three top stories, one place. Separate from long-form blog."
        />
        <link rel="canonical" href={`${window.location.origin}/daily-digest`} />
      </Helmet>
      <CoinsNavbar />
      <main className="dd-main">
        <header className="dd-header">
          <h1 className="dd-title">Daily digest</h1>
          <p className="dd-lead">
            The three-story morning brief lives here. Long-form editorials stay on{' '}
            <Link to="/blog">the blog</Link>.
          </p>
        </header>

        {loading && <p className="dd-muted">Loading…</p>}
        {err && <p className="dd-error">{err}</p>}
        {!loading && !err && sorted.length === 0 && (
          <p className="dd-muted">No digest editions yet.</p>
        )}

        <ul className="dd-grid">
          {sorted.map((p) => (
            <li key={p.id || (p as any)._id}>
              <Link to={getBlogUrl(p)} className="dd-card">
                <div className="dd-card__img">
                  <img
                    src={resolveImageSrc(p.imageUrl, p.title, 'blog')}
                    alt=""
                    loading="lazy"
                    onError={(e) => handleImageError(e, p.title, 'blog')}
                  />
                </div>
                <div className="dd-card__body">
                  <h2 className="dd-card__title">{p.title}</h2>
                  <p className="dd-card__excerpt">
                    {(p.excerpt || stripTags(p.content)).slice(0, 160)}
                    {(p.excerpt || stripTags(p.content)).length > 160 ? '…' : ''}
                  </p>
                  <span className="dd-card__cta">Read digest →</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
};

export default DailyDigestArchive;
