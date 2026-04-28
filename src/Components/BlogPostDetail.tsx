import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Heart, Bookmark, Share2, Twitter, Send, Copy } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useBlog } from '../context/BlogContext';
import { format } from 'date-fns';
import { resolveImageSrc, handleImageError } from '../utils/cryptoImages';
import './BlogPostDetail.css';

const stripTags = (html?: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

const wordCount = (s?: string) => stripTags(s).split(/\s+/).filter(Boolean).length;
const readMinutes = (s?: string) => Math.max(1, Math.round(wordCount(s) / 220));

const normalizeContent = (raw?: string): string => {
  if (!raw) return '';
  if (/<[^>]+>/.test(raw)) return raw;
  return raw
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');
};

const BlogPostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPostById, posts } = useBlog();
  const [post, setPost] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (id && posts.length > 0) {
      const found = getPostById(id);
      if (found) setPost(found);
    }
  }, [id, posts, getPostById]);

  const flash = (msg: string, ms = 2000) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), ms);
  };

  const handleLike = () => {
    setIsLiked((v) => !v);
    flash(isLiked ? 'Unliked' : 'Liked!');
  };

  const handleBookmark = () => {
    setIsBookmarked((v) => !v);
    flash(isBookmarked ? 'Removed from bookmarks' : 'Bookmarked');
  };

  const handleShareNative = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post?.title,
          text: stripTags(post?.content).slice(0, 120) + '…',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        flash('Link copied to clipboard');
      }
    } catch {
      /* user cancelled or share failed silently */
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      flash('Link copied');
    } catch {
      flash('Copy failed');
    }
  };

  const tweetUrl = useMemo(() => {
    if (!post) return '#';
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`;
  }, [post]);

  const tgUrl = useMemo(() => {
    if (!post) return '#';
    return `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`;
  }, [post]);

  const related = useMemo(() => {
    if (!post) return [];
    return posts.filter((p) => p.id !== post.id).slice(0, 3);
  }, [post, posts]);

  if (!post) {
    return (
      <div className="bd-shell">
        <div className="bd-container bd-loading">
          <div className="bd-skel-eyebrow" />
          <div className="bd-skel-title" />
          <div className="bd-skel-meta" />
          <div className="bd-skel-hero" />
          <div className="bd-skel-line" />
          <div className="bd-skel-line" />
          <div className="bd-skel-line bd-skel-line--short" />
        </div>
      </div>
    );
  }

  const formattedDate = (() => {
    try { return format(new Date(post.date), 'MMMM d, yyyy'); } catch { return ''; }
  })();
  const minutes = readMinutes(post.content);
  const html = normalizeContent(post.content);

  return (
    <div className="bd-shell">
      <Helmet>
        <title>{post.title} | CoinsClarity</title>
        <meta name="description" content={stripTags(post.content).slice(0, 160)} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={stripTags(post.content).slice(0, 200)} />
        <meta property="og:image" content={resolveImageSrc(post.imageUrl, post.title, 'blog')} />
        <meta property="og:type" content="article" />
      </Helmet>

      <div className="bd-container">
        <button className="bd-back" onClick={() => navigate('/blog')}>
          <ArrowLeft size={16} /> Back to blog
        </button>

        <header className="bd-header">
          <span className="bd-eyebrow">{(post as any).category || 'Editorial'}</span>
          <h1 className="bd-title">{post.title}</h1>
          <div className="bd-meta">
            <div className="bd-author">
              <div className="bd-avatar">{(post.author || '?').charAt(0).toUpperCase()}</div>
              <span><strong>{post.author}</strong></span>
            </div>
            <span className="bd-dot" aria-hidden>·</span>
            <span className="bd-meta__item"><Calendar size={14} /> {formattedDate}</span>
            <span className="bd-dot" aria-hidden>·</span>
            <span className="bd-meta__item"><Clock size={14} /> {minutes} min read</span>
          </div>
        </header>

        <div className="bd-layout">
          <aside className="bd-rail" aria-label="Article actions">
            <button className={`bd-rail__btn ${isLiked ? 'is-active' : ''}`} onClick={handleLike} title={isLiked ? 'Unlike' : 'Like'} aria-label="Like">
              <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
            </button>
            <button className={`bd-rail__btn ${isBookmarked ? 'is-active' : ''}`} onClick={handleBookmark} title={isBookmarked ? 'Unbookmark' : 'Bookmark'} aria-label="Bookmark">
              <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>
            <a className="bd-rail__btn" href={tweetUrl} target="_blank" rel="noopener noreferrer" title="Share on X" aria-label="Share on X">
              <Twitter size={18} />
            </a>
            <a className="bd-rail__btn" href={tgUrl} target="_blank" rel="noopener noreferrer" title="Share on Telegram" aria-label="Share on Telegram">
              <Send size={18} />
            </a>
            <button className="bd-rail__btn" onClick={handleCopy} title="Copy link" aria-label="Copy link">
              <Copy size={18} />
            </button>
            <button className="bd-rail__btn" onClick={handleShareNative} title="Share" aria-label="Share">
              <Share2 size={18} />
            </button>
          </aside>

          <article className="bd-article">
            <figure className="bd-figure">
              <img
                src={resolveImageSrc(post.imageUrl, post.title, 'blog')}
                alt={post.title}
                loading="eager"
                onError={(e) => handleImageError(e, post.title, 'blog')}
              />
            </figure>
            <div className="bd-prose" dangerouslySetInnerHTML={{ __html: html }} />

            {actionMessage && <div className="bd-toast">{actionMessage}</div>}
          </article>
        </div>

        {related.length > 0 && (
          <section className="bd-related">
            <h3 className="bd-related__head">More from the blog</h3>
            <div className="bd-related__grid">
              {related.map((p) => (
                <Link key={p.id} to={`/blog/${p.id}`} className="bd-related__card">
                  <div className="bd-related__media">
                    <img
                      src={resolveImageSrc(p.imageUrl, p.title, 'blog')}
                      alt=""
                      loading="lazy"
                      onError={(e) => handleImageError(e, p.title, 'blog')}
                    />
                  </div>
                  <div className="bd-related__body">
                    <h4>{p.title}</h4>
                    <span>{p.author} · {readMinutes(p.content)} min</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default BlogPostDetail;
