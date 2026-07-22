import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Radio, ShieldCheck } from 'lucide-react';
import CoinsNavbar from '../Components/navbar';
import Footer from '../Components/footer';
import JsonLd from '../Components/JsonLd';
import { breadcrumbList, SITE_URL } from '../utils/jsonLd';
import { fetchLiveThread, type LiveThread } from '../services/liveApi';
import { getAuthorBySlug, authorPath } from '../config/authors';
import './LivePages.css';

const formatStamp = (d: string | Date) => {
  try {
    return new Date(d).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '';
  }
};

const LiveDetail: React.FC = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const [thread, setThread] = useState<LiveThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    const res = await fetchLiveThread(slug);
    if (res.data) setThread(res.data);
    else {
      setThread(null);
      setError(res.missing ? 'Thread not found.' : res.error || 'Failed to load');
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  // Soft poll while live
  useEffect(() => {
    if (!thread || thread.status !== 'live') return;
    const id = window.setInterval(load, 45000);
    return () => window.clearInterval(id);
  }, [thread?.status, load]);

  const author = getAuthorBySlug(thread?.authorSlug) || getAuthorBySlug('elena-vasquez');
  const canonical = `${typeof window !== 'undefined' ? window.location.origin : SITE_URL}/live/${slug}`;
  const updates = thread?.updates || [];

  return (
    <div className="lv-page">
      {thread && (
        <Helmet>
          <title>{thread.title} — CoinsClarity Live</title>
          <meta name="description" content={(thread.summary || thread.title).slice(0, 160)} />
          <link rel="canonical" href={canonical} />
          <meta name="robots" content="index, follow" />
          <meta property="og:type" content="article" />
          <meta property="og:title" content={thread.title} />
          <meta property="og:description" content={(thread.summary || '').slice(0, 160)} />
          <meta property="og:url" content={canonical} />
          {thread.coverImage && <meta property="og:image" content={thread.coverImage} />}
          <meta name="author" content={thread.authorName || author?.name} />
        </Helmet>
      )}
      {thread && (
        <JsonLd
          data={[
            {
              '@context': 'https://schema.org',
              '@type': 'LiveBlogPosting',
              headline: thread.title,
              description: thread.summary,
              url: canonical,
              datePublished: thread.startedAt || thread.createdAt,
              dateModified: thread.updatedAt,
              author: {
                '@type': 'Person',
                name: thread.authorName || author?.name,
                url: `${SITE_URL}${authorPath(author?.slug || 'elena-vasquez')}`,
              },
              publisher: {
                '@type': 'Organization',
                name: 'CoinsClarity',
                logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo3.png` },
              },
              coverageStartTime: thread.startedAt || thread.createdAt,
              coverageEndTime: thread.endedAt || undefined,
              liveBlogUpdate: updates.slice(0, 12).map((u) => ({
                '@type': 'BlogPosting',
                headline: u.title,
                datePublished: u.at,
                articleBody: String(u.html || '').replace(/<[^>]+>/g, ' ').slice(0, 280),
              })),
            },
            breadcrumbList([
              { name: 'Home', url: SITE_URL },
              { name: 'Live', url: `${SITE_URL}/live` },
              { name: thread.title, url: canonical },
            ]),
          ]}
        />
      )}

      <CoinsNavbar />
      <main className="lv-main">
        <Link to="/live" className="lv-back">
          <ArrowLeft size={16} /> All live coverage
        </Link>

        {loading && !thread && <p className="lv-muted">Loading thread…</p>}
        {error && !thread && <p className="lv-muted">{error}</p>}

        {thread && (
          <>
            <header>
              <div className="lv-eyebrow">
                {thread.status === 'live' ? (
                  <>
                    <span className="lv-live-dot" /> LIVE
                  </>
                ) : (
                  <>
                    <Radio size={14} /> Desk thread
                  </>
                )}
              </div>
              <h1 className="lv-title">{thread.title}</h1>
              {thread.summary && <p className="lv-lead">{thread.summary}</p>}
              <div className="lv-meta">
                <span className={`lv-status is-${thread.status}`}>{thread.status}</span>
                <span>{updates.length} updates</span>
                {author && (
                  <Link to={authorPath(author.slug)} className="lv-author-link">
                    <span className="lv-avatar" style={{ background: author.accent }}>
                      {author.initials}
                    </span>
                    {author.name}
                  </Link>
                )}
              </div>
            </header>

            <ol className="lv-timeline">
              {updates.map((u) => (
                <li
                  key={String(u._id || `${u.at}-${u.title}`)}
                  className={`lv-update is-${u.kind || 'update'}`}
                >
                  <div className="lv-update__time">
                    {formatStamp(u.at)}
                    {u.kind && u.kind !== 'update' && (
                      <span className="lv-update__kind">{u.kind}</span>
                    )}
                  </div>
                  <h2>{u.title}</h2>
                  <div
                    className="lv-update__body"
                    dangerouslySetInnerHTML={{ __html: u.html || '' }}
                  />
                </li>
              ))}
            </ol>

            {updates.length === 0 && (
              <p className="lv-muted">No updates yet — check back when the desk goes live.</p>
            )}

            <aside className="lv-trust">
              <ShieldCheck size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              <strong>Trust with CoinsClarity.</strong> Live threads are filed by named desk analysts
              as events unfold. Quotes are paraphrased carefully; this is education, not trading
              advice.{' '}
              <Link to="/disclaimer">Disclaimer</Link>
              {author && (
                <>
                  {' · '}
                  <Link to={authorPath(author.slug)}>About {author.name.split(' ')[0]}</Link>
                </>
              )}
            </aside>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default LiveDetail;
