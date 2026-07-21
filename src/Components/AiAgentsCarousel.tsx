import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { fetchPosts } from '../services/api';
import type { BlogPost } from '../types/blog';
import { getBlogUrl } from '../utils/blogUrl';
import { resolveImageSrc, handleImageError } from '../utils/cryptoImages';
import './AiAgentsCarousel.css';

const stripTags = (html?: string): string =>
  (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const deskFromTags = (tags?: string[]): string => {
  const t = tags || [];
  if (t.includes('agent-geopolitics')) return 'Geopolitics';
  if (t.includes('agent-india')) return 'India Policy';
  if (t.includes('agent-onchain')) return 'On-chain';
  if (t.includes('agent-markets')) return 'Markets';
  return 'Newsroom';
};

/** Top-of-landing carousel for AI agent posts (tag: ai-agent). */
const AiAgentsCarousel: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchPosts({ tag: 'ai-agent', limit: 8 });
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

  const slides = posts.length
    ? posts
    : ([
        {
          id: 'fallback',
          title: 'AI newsroom warming up',
          excerpt:
            'Four desks scan trending keywords every three hours — markets, geopolitics, India policy, and on-chain.',
          author: 'CoinsClarity',
          content: '',
          imageUrl: '',
          tags: ['ai-agent'],
          date: new Date().toISOString(),
        },
      ] as BlogPost[]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const t = setInterval(() => setActive((i) => (i + 1) % slides.length), 5500);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  const go = useCallback(
    (dir: number) => {
      setActive((i) => (i + dir + slides.length) % slides.length);
    },
    [slides.length],
  );

  const current = slides[active] || slides[0];
  if (!current) return null;

  const open = () => {
    if (current.id === 'fallback') {
      navigate('/ai-agents');
      return;
    }
    navigate(getBlogUrl(current));
  };

  if (loading) {
    return (
      <section className="aac" aria-label="AI agents carousel loading">
        <div className="aac-stage">
          <Skeleton height="100%" width="100%" baseColor="#1e293b" highlightColor="#334155" />
        </div>
      </section>
    );
  }

  return (
    <section
      className="aac"
      aria-label="AI agents newsroom carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="aac-stage">
        <img
          className="aac-bg"
          src={resolveImageSrc(current.imageUrl, current.title, 'blog')}
          alt=""
          onError={(e) => handleImageError(e, current.title, 'blog')}
        />
        <div className="aac-veil" />
        <div className="aac-body">
          <div className="aac-meta">
            <span className="aac-kicker">AI Agents · {deskFromTags(current.tags)}</span>
            <span className="aac-author">{current.author || 'CoinsClarity Desk'}</span>
          </div>
          <button type="button" className="aac-title-btn" onClick={open}>
            <h2 className="aac-title">{current.title}</h2>
          </button>
          <p className="aac-dek">
            {(current.excerpt || stripTags(current.content)).slice(0, 180)}
            {(current.excerpt || stripTags(current.content)).length > 180 ? '…' : ''}
          </p>
          <div className="aac-actions">
            <button type="button" className="aac-cta" onClick={open}>
              Read piece
            </button>
            <Link to="/ai-agents" className="aac-archive">
              All agent posts →
            </Link>
          </div>
        </div>
        {slides.length > 1 && (
          <>
            <button type="button" className="aac-nav aac-nav--prev" aria-label="Previous" onClick={() => go(-1)}>
              ‹
            </button>
            <button type="button" className="aac-nav aac-nav--next" aria-label="Next" onClick={() => go(1)}>
              ›
            </button>
            <div className="aac-dots" role="tablist">
              {slides.map((p, i) => (
                <button
                  key={p.id || p.slug || i}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  className={`aac-dot${i === active ? ' is-active' : ''}`}
                  onClick={() => setActive(i)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default AiAgentsCarousel;
