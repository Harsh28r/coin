import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ExternalLink, FileText, RefreshCw, Search } from 'lucide-react';
import CoinsNavbar from '../Components/navbar';
import Footer from '../Components/footer';
import { buildRssBackendBasesFromEnv } from '../utils/rssBackendBases';
import { SITE_URL } from '../utils/jsonLd';
import './AiPapers.css';

export type AiPaper = {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  published?: string;
  categories?: string[];
  absUrl: string;
  pdfUrl: string;
  source?: string;
};

async function fetchPapers(limit = 20, q?: string): Promise<AiPaper[]> {
  const qs = new URLSearchParams({ limit: String(limit) });
  if (q?.trim()) qs.set('q', q.trim());

  // 1) Same-origin proxy (Vercel function via /papers-feed rewrite)
  const endpoints = [`/papers-feed?${qs}`, `/api/ai-papers?${qs}`];

  // 2) Backend failover once camify/render catch up
  for (const raw of buildRssBackendBasesFromEnv()) {
    const base = raw.replace(/\/$/, '');
    if (base.includes('c-back-seven.vercel.app')) continue;
    endpoints.push(`${base}/api/ai-papers?${qs}`);
  }

  let lastErr: unknown;
  for (const url of endpoints) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) continue;
      const json = await res.json();
      if (json?.success && Array.isArray(json.papers) && json.papers.length) {
        return json.papers;
      }
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Could not load papers');
}

const AiPapersPage: React.FC = () => {
  const [papers, setPapers] = useState<AiPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchPapers(20, q);
      setPapers(list);
      if (list[0]?.id) setOpenId(list[0].id);
    } catch (e: any) {
      setError(e?.message || 'Could not load research papers.');
      setPapers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="ap-page">
      <Helmet>
        <title>Daily AI Research Papers — Full Abstracts & PDFs | CoinsClarity</title>
        <meta
          name="description"
          content="Fresh AI and tech research papers from arXiv every day — full abstracts, authors, categories, and PDF downloads. ML, NLP, CV, crypto-adjacent science."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE_URL}/ai-papers`} />
        <meta property="og:title" content="Daily AI Research Papers — CoinsClarity" />
        <meta
          property="og:description"
          content="Whole papers from arXiv: abstract, authors, PDF. Updated daily."
        />
        <meta property="og:url" content={`${SITE_URL}/ai-papers`} />
      </Helmet>
      <CoinsNavbar />
      <main className="ap-main">
        <header className="ap-head">
          <span className="ap-eyebrow">Research desk</span>
          <h1 className="ap-title">Daily AI &amp; tech papers</h1>
          <p className="ap-lead">
            Latest submissions from arXiv — full abstract on the page, PDF for the whole paper.
            AI, ML, NLP, vision, and crypto-adjacent work. No signup.
          </p>
          <form
            className="ap-search"
            onSubmit={(e) => {
              e.preventDefault();
              load(query);
            }}
          >
            <Search size={16} aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search arXiv (e.g. "transformer bitcoin" or leave blank for daily feed)'
              aria-label="Search papers"
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Loading…' : 'Find papers'}
            </button>
            <button
              type="button"
              className="ap-refresh"
              disabled={loading}
              onClick={() => load(query)}
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? 'ap-spin' : ''} />
            </button>
          </form>
        </header>

        {error && <div className="ap-warn">{error}</div>}
        {loading && !papers.length && (
          <div className="ap-loading">Pulling fresh papers from arXiv…</div>
        )}

        <div className="ap-list">
          {papers.map((p) => {
            const open = openId === p.id;
            const authorLine =
              p.authors.slice(0, 5).join(', ') + (p.authors.length > 5 ? ' et al.' : '');
            return (
              <article key={p.id} className={`ap-card ${open ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className="ap-card__toggle"
                  onClick={() => setOpenId(open ? null : p.id)}
                  aria-expanded={open}
                >
                  <div className="ap-card__meta">
                    <span className="ap-card__id">{p.id}</span>
                    {p.published && (
                      <time dateTime={p.published}>{p.published.slice(0, 10)}</time>
                    )}
                    {(p.categories || []).slice(0, 3).map((c) => (
                      <span key={c} className="ap-chip">
                        {c}
                      </span>
                    ))}
                  </div>
                  <h2 className="ap-card__title">{p.title}</h2>
                  <p className="ap-card__authors">{authorLine || 'Unknown authors'}</p>
                </button>

                {open && (
                  <div className="ap-card__body">
                    <h3 className="ap-abs-label">Abstract</h3>
                    <p className="ap-abstract">{p.abstract}</p>
                    <div className="ap-actions">
                      <a
                        className="ap-btn ap-btn--primary"
                        href={p.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileText size={15} /> Full PDF
                      </a>
                      <a
                        className="ap-btn"
                        href={p.absUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink size={15} /> arXiv page
                      </a>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {!loading && !error && papers.length === 0 && (
          <p className="ap-muted">No papers matched. Try a broader query.</p>
        )}

        <p className="ap-foot">
          Source: <a href="https://arxiv.org" target="_blank" rel="noopener noreferrer">arXiv.org</a>.
          Past roundups also land on the <Link to="/blog">blog</Link> as daily editions.
          Related: <Link to="/ai-news">AI news</Link>.
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default AiPapersPage;
