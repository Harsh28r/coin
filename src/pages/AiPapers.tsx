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

  const endpoints: string[] = [];
  for (const raw of buildRssBackendBasesFromEnv()) {
    const base = raw.replace(/\/$/, '');
    if (base.includes('c-back-seven.vercel.app')) continue;
    endpoints.push(`${base}/api/ai-papers?${qs}`);
  }

  let lastErr: unknown;
  for (const url of endpoints) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
      if (!res.ok) continue;
      const json = await res.json();
      if (json?.success && Array.isArray(json.papers) && json.papers.length) {
        return json.papers;
      }
    } catch (e) {
      lastErr = e;
    }
  }

  // CORS-safe arXiv pull (works without camify / Vercel fn)
  try {
    const query =
      q?.trim() ||
      '(cat:cs.AI OR cat:cs.LG OR cat:cs.CL OR cat:cs.CV OR all:blockchain OR all:cryptocurrency)';
    const arxiv =
      `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(query)}` +
      `&sortBy=submittedDate&sortOrder=descending&start=0&max_results=${limit}`;
    const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(arxiv)}`, {
      signal: AbortSignal.timeout(25000),
    });
    if (res.ok) {
      const xml = await res.text();
      const papers = parseAtomClient(xml);
      if (papers.length) return papers;
    }
  } catch (e) {
    lastErr = e;
  }

  throw lastErr || new Error('Could not load papers');
}

/** Minimal client-side Atom parse for CORS-proxy fallback */
function parseAtomClient(xml: string): AiPaper[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const entries = Array.from(doc.getElementsByTagName('entry'));
  return entries
    .map((el) => {
      const text = (tag: string) =>
        el.getElementsByTagName(tag)[0]?.textContent?.replace(/\s+/g, ' ').trim() || '';
      const idRaw = text('id');
      const m = idRaw.match(/arxiv\.org\/abs\/([0-9.]+)/i);
      const id = m?.[1] || idRaw.split('/').pop()?.replace(/v\d+$/, '') || '';
      if (!id) return null;
      const authors = Array.from(el.getElementsByTagName('author'))
        .map((a) => a.getElementsByTagName('name')[0]?.textContent?.trim() || '')
        .filter(Boolean);
      const categories = Array.from(el.getElementsByTagName('category'))
        .map((c) => c.getAttribute('term') || '')
        .filter(Boolean)
        .slice(0, 8);
      return {
        id,
        title: text('title'),
        authors,
        abstract: text('summary'),
        published: text('published'),
        categories,
        absUrl: `https://arxiv.org/abs/${id}`,
        pdfUrl: `https://arxiv.org/pdf/${id}.pdf`,
        source: 'arXiv',
      } as AiPaper;
    })
    .filter(Boolean) as AiPaper[];
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
