import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBlog } from '../context/BlogContext';
import { resolveImageSrc, handleImageError } from '../utils/cryptoImages';
import './BlogHome.css';

const formatDate = (input?: string | Date): string => {
  if (!input) return '';
  const d = new Date(input);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const stripTags = (html?: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

const excerpt = (text: string, max = 180): string => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const ws = cut.lastIndexOf(' ');
  return (ws > 60 ? cut.slice(0, ws) : cut) + '…';
};

const readMinutes = (content?: string): number => {
  const words = stripTags(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
};

const BlogHome: React.FC = () => {
  const { posts } = useBlog();
  const [query, setQuery] = useState('');

  const sorted = useMemo(() => {
    return [...posts].sort((a, b) => {
      const da = new Date((a as any).date || 0).getTime();
      const db = new Date((b as any).date || 0).getTime();
      return db - da;
    });
  }, [posts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        stripTags(p.content).toLowerCase().includes(q) ||
        (p as any).author?.toLowerCase().includes(q)
    );
  }, [sorted, query]);

  const [hero, ...rest] = filtered;

  if (!posts.length) {
    return (
      <section className="bh-shell">
        <div className="bh-container">
          <div className="bh-empty">
            <h1>The Blog</h1>
            <p>Long-form crypto, market commentary, and operator notes. Nothing's been published yet — check back soon.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bh-shell">
      <div className="bh-container">
        <header className="bh-masthead">
          <div>
            <p className="bh-kicker">CoinsClarity Editorial</p>
            <h1 className="bh-title">The Blog</h1>
            <p className="bh-tagline">Long-form analysis, market commentary, and operator notes from the crypto frontier.</p>
          </div>
          <div className="bh-search">
            <input
              type="text"
              placeholder="Search articles…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search blog"
            />
          </div>
        </header>

        {hero && (
          <Link to={`/blog/${hero.id}`} className="bh-hero" aria-label={hero.title}>
            <div className="bh-hero__media">
              <img
                src={resolveImageSrc(hero.imageUrl, hero.title, 'blog')}
                alt=""
                loading="eager"
                onError={(e) => handleImageError(e, hero.title, 'blog')}
              />
            </div>
            <div className="bh-hero__body">
              <span className="bh-eyebrow">{(hero as any).category || 'Featured'}</span>
              <h2 className="bh-hero__title">{hero.title}</h2>
              <p className="bh-hero__dek">{excerpt(stripTags(hero.content))}</p>
              <div className="bh-byline">
                <strong>{hero.author}</strong>
                <span className="bh-sep" aria-hidden>·</span>
                <span>{formatDate(hero.date)}</span>
                <span className="bh-sep" aria-hidden>·</span>
                <span>{readMinutes(hero.content)} min read</span>
              </div>
            </div>
          </Link>
        )}

        {rest.length > 0 && (
          <>
            <div className="bh-section-head">
              <h3>Latest articles</h3>
              <span className="bh-count">{rest.length} {rest.length === 1 ? 'post' : 'posts'}</span>
            </div>
            <div className="bh-grid">
              {rest.map((post) => (
                <Link key={post.id} to={`/blog/${post.id}`} className="bh-card" aria-label={post.title}>
                  <div className="bh-card__media">
                    <img
                      src={resolveImageSrc(post.imageUrl, post.title, 'blog')}
                      alt=""
                      loading="lazy"
                      onError={(e) => handleImageError(e, post.title, 'blog')}
                    />
                  </div>
                  <div className="bh-card__body">
                    <span className="bh-eyebrow bh-eyebrow--muted">{(post as any).category || 'Article'}</span>
                    <h4 className="bh-card__title">{post.title}</h4>
                    <p className="bh-card__dek">{excerpt(stripTags(post.content), 140)}</p>
                    <div className="bh-byline">
                      <strong>{post.author}</strong>
                      <span className="bh-sep" aria-hidden>·</span>
                      <span>{formatDate(post.date)}</span>
                      <span className="bh-sep" aria-hidden>·</span>
                      <span>{readMinutes(post.content)} min</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {!filtered.length && (
          <div className="bh-empty">
            <h2>No matches</h2>
            <p>Nothing matched “{query}”. Try a different keyword.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogHome;
