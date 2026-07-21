import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts } from '../services/api';
import type { BlogPost } from '../types/blog';
import { getBlogUrl } from '../utils/blogUrl';
import { resolveImageSrc, handleImageError } from '../utils/cryptoImages';
import './AiAgentsDesk.css';

const DESKS = [
  { id: 'markets', label: 'Markets', tag: 'agent-markets', byline: 'Elena Vasquez' },
  { id: 'geopolitics', label: 'Geopolitics', tag: 'agent-geopolitics', byline: 'James Okonkwo' },
  { id: 'india', label: 'India Policy', tag: 'agent-india', byline: 'Maya Rao' },
  { id: 'onchain', label: 'On-chain', tag: 'agent-onchain', byline: 'Kenji Tanaka' },
] as const;

const stripTags = (html?: string): string =>
  (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const dek = (p: BlogPost) => {
  const raw = (p.excerpt || stripTags(p.content)).trim();
  return raw.length > 140 ? `${raw.slice(0, 140)}…` : raw;
};

/** Mid-landing section: one card per AI desk + latest flashes. */
const AiAgentsDesk: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchPosts({ tag: 'ai-agent', limit: 40 });
        if (!cancelled) setPosts(list);
      } catch {
        if (!cancelled) setPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const byDesk = useMemo(() => {
    const map: Record<string, BlogPost | null> = {
      markets: null,
      geopolitics: null,
      india: null,
      onchain: null,
    };
    const sorted = [...posts].sort((a, b) => {
      const ta = new Date((a as any).date || 0).getTime();
      const tb = new Date((b as any).date || 0).getTime();
      return tb - ta;
    });
    for (const desk of DESKS) {
      map[desk.id] = sorted.find((p) => (p.tags || []).includes(desk.tag)) || null;
    }
    return map;
  }, [posts]);

  return (
    <section className="aad" aria-label="AI agents newsroom">
      <div className="aad-inner">
        <header className="aad-head">
          <h2 className="aad-title">AI Agents newsroom</h2>
          <p className="aad-sub">
            Four desks hunt trending keywords every 3 hours, then file journalist-style news and
            features with internal + Wikipedia links for depth.
          </p>
          <Link to="/ai-agents" className="aad-all">
            Full archive →
          </Link>
        </header>

        {loading && <p className="aad-muted">Loading desks…</p>}

        {!loading && (
          <div className="aad-grid">
            {DESKS.map((desk) => {
              const post = byDesk[desk.id];
              return (
                <article key={desk.id} className={`aad-card aad-card--${desk.id}`}>
                  <span className="aad-desk">{desk.label}</span>
                  <span className="aad-byline">{desk.byline}</span>
                  {post ? (
                    <Link to={getBlogUrl(post)} className="aad-link">
                      <div className="aad-img">
                        <img
                          src={resolveImageSrc(post.imageUrl, post.title, 'blog')}
                          alt=""
                          loading="lazy"
                          onError={(e) => handleImageError(e, post.title, 'blog')}
                        />
                      </div>
                      <h3 className="aad-card-title">{post.title}</h3>
                      <p className="aad-dek">{dek(post)}</p>
                    </Link>
                  ) : (
                    <p className="aad-empty">No filing yet — next cron cycle will assign this desk.</p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default AiAgentsDesk;
