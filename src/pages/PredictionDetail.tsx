import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft,
  Calendar,
  Clock,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import CoinsNavbar from '../Components/navbar';
import Footer from '../Components/footer';
import JsonLd from '../Components/JsonLd';
import { breadcrumbList, faqPage, SITE_URL } from '../utils/jsonLd';
import { buildOutlookFaqs, predictionSeoTitle } from '../utils/outlookFaq';
import { fetchPriceOutlook, generatePriceOutlook, type PriceOutlookPost } from '../services/priceOutlookApi';
import { resolveImageSrc, handleImageError } from '../utils/cryptoImages';
import { authorPath } from '../config/authors';
import './PredictionPages.css';

const stripTags = (html?: string) =>
  (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const readMinutes = (s?: string) =>
  Math.max(4, Math.round(stripTags(s).split(/\s+/).filter(Boolean).length / 220));

const formatUsd = (n?: number) => {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  if (n >= 1) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 4 })}`;
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 8 })}`;
};

const stanceClass = (s?: string) => {
  const v = (s || '').toLowerCase();
  if (v === 'constructive') return 'is-bull';
  if (v === 'bearish') return 'is-bear';
  if (v === 'cautious') return 'is-caution';
  return 'is-neutral';
};

const DESK_BIO =
  'Elena covers macro liquidity, ETF flows, and multi-year crypto cycles for CoinsClarity. Outlooks are desk products — sourced from live market data, not recycled wire copy.';

const PredictionDetail: React.FC = () => {
  const { coinId = '' } = useParams<{ coinId: string }>();
  const [post, setPost] = useState<PriceOutlookPost | null>(null);
  const [stale, setStale] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (opts?: { generate?: boolean }) => {
      if (!coinId) return;
      setError(null);
      if (opts?.generate) setGenerating(true);
      else setLoading(true);
      try {
        const res = opts?.generate
          ? await generatePriceOutlook(coinId)
          : await fetchPriceOutlook(coinId);
        if (res.missing || !res.data) {
          // Auto-kick desk generation on first visit
          setGenerating(true);
          const gen = await generatePriceOutlook(coinId);
          if (!gen.data) {
            setError(gen.error || 'Outlook not ready yet. Try again in a minute.');
            setPost(null);
            return;
          }
          setPost(gen.data);
          setStale(!!gen.stale);
          return;
        }
        setPost(res.data);
        setStale(!!res.stale);
      } catch (e: any) {
        setError(e?.message || 'Failed to load outlook');
      } finally {
        setLoading(false);
        setGenerating(false);
      }
    },
    [coinId],
  );

  useEffect(() => {
    load();
  }, [load]);

  const outlook = post?.outlook;
  const rawTitle =
    post?.title ||
    `${(outlook?.coinName || coinId).replace(/^\w/, (c) => c.toUpperCase())} price outlook`;
  const title = predictionSeoTitle(rawTitle, outlook);
  const faqs = useMemo(() => buildOutlookFaqs(outlook, coinId), [outlook, coinId]);
  const desc =
    outlook?.stanceSummary ||
    post?.excerpt ||
    `${outlook?.coinName || coinId} price prediction — scenarios, catalysts, and risks through ${outlook?.horizon || '2030'}.`;

  const canonical = `${SITE_URL}/prediction/${coinId}`;

  const jsonLd = useMemo(() => {
    if (!post) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: desc,
      datePublished: post.date,
      dateModified: outlook?.asOf || post.date,
      author: {
        '@type': 'Person',
        name: post.author || 'Elena Vasquez',
        jobTitle: 'Markets Analyst',
        worksFor: { '@type': 'Organization', name: 'CoinsClarity' },
      },
      publisher: {
        '@type': 'Organization',
        name: 'CoinsClarity',
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo3.png` },
      },
      image: post.imageUrl,
      mainEntityOfPage: canonical,
      about: {
        '@type': 'Cryptocurrency',
        name: outlook?.coinName || coinId,
        currency: outlook?.symbol,
      },
    };
  }, [post, desc, outlook, coinId, canonical]);

  return (
    <div className="po-page">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={desc.slice(0, 160)} />
        <meta
          name="keywords"
          content={`${outlook?.coinName || coinId} price prediction, ${outlook?.symbol || ''} outlook, crypto analysis, ${outlook?.horizon || '2026-2030'}`}
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc.slice(0, 160)} />
        <meta property="og:url" content={canonical} />
        {post?.imageUrl && <meta property="og:image" content={post.imageUrl} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="author" content={post?.author || 'Elena Vasquez'} />
      </Helmet>
      {jsonLd && (
        <JsonLd
          data={[
            jsonLd,
            ...(faqs.length ? [faqPage(faqs)] : []),
            breadcrumbList([
              { name: 'Home', url: SITE_URL },
              { name: 'Price Predictions', url: `${SITE_URL}/predictions` },
              { name: outlook?.coinName || coinId, url: canonical },
            ]),
          ]}
        />
      )}

      <CoinsNavbar />

      <main className="po-main">
        <div className="po-top">
          <Link to="/predictions" className="po-back">
            <ArrowLeft size={16} /> All predictions
          </Link>
          {coinId && (
            <Link to={`/coin/${coinId}`} className="po-coin-link">
              Live {outlook?.symbol || coinId} market <ExternalLink size={12} />
            </Link>
          )}
        </div>

        {(loading || generating) && !post && (
          <div className="po-loading">
            <div className="po-loading__pulse" />
            <h1>Markets Desk is preparing this outlook</h1>
            <p>
              Pulling live CoinGecko data, fear &amp; greed, and filing an original note — not a scraped
              rewrite. Usually under a minute.
            </p>
          </div>
        )}

        {error && !post && (
          <div className="po-error">
            <p>{error}</p>
            <button type="button" className="po-btn" onClick={() => load({ generate: true })}>
              <RefreshCw size={16} /> Retry desk filing
            </button>
          </div>
        )}

        {post && (
          <>
            <header className="po-hero">
              <div className="po-hero__eyebrow">
                <Sparkles size={14} /> Markets Desk · Price outlook
              </div>
              <h1 className="po-hero__title">{post.title}</h1>
              <p className="po-hero__standfirst">
                {outlook?.stanceSummary || post.excerpt || desc}
              </p>

              <div className="po-hero__meta">
                <Link to={authorPath('elena-vasquez')} className="po-author" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="po-author__avatar">{(post.author || 'E').charAt(0)}</div>
                  <div>
                    <strong>{post.author}</strong>
                    <span>CoinsClarity Markets Desk</span>
                  </div>
                </Link>
                <div className="po-meta-bits">
                  <span>
                    <Calendar size={14} />{' '}
                    {post.date
                      ? new Date(post.date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </span>
                  <span>
                    <Clock size={14} /> {readMinutes(post.content)} min read
                  </span>
                  {outlook?.stance && (
                    <span className={`po-stance ${stanceClass(outlook.stance)}`}>
                      {outlook.stance}
                    </span>
                  )}
                </div>
              </div>

              {stale && (
                <button
                  type="button"
                  className="po-refresh"
                  disabled={generating}
                  onClick={() => load({ generate: true })}
                >
                  <RefreshCw size={14} className={generating ? 'po-spin' : undefined} />
                  {generating ? 'Refreshing…' : 'Outlook is stale — refresh desk note'}
                </button>
              )}
            </header>

            {outlook && (
              <>
                <section className="po-spot">
                  <div className="po-spot__coin">
                    <img
                      src={resolveImageSrc(post.imageUrl, outlook.coinName, 'coin')}
                      alt=""
                      onError={(e) => handleImageError(e, outlook.coinName, 'coin')}
                    />
                    <div>
                      <strong>
                        {outlook.coinName} <em>{outlook.symbol}</em>
                      </strong>
                      <span>Spot at filing</span>
                    </div>
                  </div>
                  <div className="po-spot__price">{formatUsd(outlook.spotAtWrite)}</div>
                  <div className="po-spot__horizon">Horizon {outlook.horizon || '2026–2030'}</div>
                </section>

                {(outlook.scenarios || []).length > 0 && (
                  <section className="po-scenarios" aria-label="Price scenarios">
                    <h2>Scenario map</h2>
                    <p className="po-section-lead">
                      Three desk ranges — not guarantees. Use them to frame risk, not to time entries.
                    </p>
                    <div className="po-scenarios__grid">
                      {(outlook.scenarios || []).map((s) => (
                        <article
                          key={s.label}
                          className={`po-scenario po-scenario--${(s.label || '').toLowerCase()}`}
                        >
                          <header>
                            <h3>{s.label}</h3>
                            <div className="po-scenario__range">
                              {formatUsd(s.priceLow)} – {formatUsd(s.priceHigh)}
                            </div>
                          </header>
                          <p>{s.thesis}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                )}

                <div className="po-split">
                  {(outlook.catalysts || []).length > 0 && (
                    <section className="po-list-card">
                      <h2>
                        <TrendingUp size={18} /> Catalysts
                      </h2>
                      <ul>
                        {(outlook.catalysts || []).map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {(outlook.risks || []).length > 0 && (
                    <section className="po-list-card po-list-card--risk">
                      <h2>
                        <AlertTriangle size={18} /> Risks
                      </h2>
                      <ul>
                        {(outlook.risks || []).map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              </>
            )}

            <article className="po-body">
              <h2 className="po-body__label">Full desk note</h2>
              <div
                className="po-prose"
                dangerouslySetInnerHTML={{ __html: post.content || '' }}
              />
            </article>

            {faqs.length > 0 && (
              <section className="po-faq" aria-labelledby="po-faq-h">
                <h2 id="po-faq-h">{outlook?.coinName || coinId} price prediction FAQ</h2>
                {faqs.map((f) => (
                  <div key={f.question}>
                    <h3>{f.question}</h3>
                    <p>{f.answer}</p>
                  </div>
                ))}
              </section>
            )}

            <section className="po-method">
              <h2>How we build this</h2>
              <p>
                {outlook?.methodology ||
                  'Ranges framed from live CoinGecko market data, Fear & Greed, and public market context; qualitative desk judgment applied.'}
              </p>
            </section>

            <aside className="po-trust">
              <div className="po-trust__icon">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2>Trust with CoinsClarity</h2>
                <p>{DESK_BIO}</p>
                <p className="po-trust__nfa">
                  Educational content only — not investment advice. Crypto is volatile; verify facts and
                  size risk yourself. Sponsored placements, when present, are labeled separately from
                  desk analysis.
                </p>
                <div className="po-trust__links">
                  <Link to={authorPath('elena-vasquez')}>Elena Vasquez</Link>
                  <Link to="/about">About the desk</Link>
                  <Link to="/disclaimer">Disclaimer</Link>
                  <Link to={`/coin/${coinId}`}>Live chart</Link>
                  <Link to={`/compare/${coinId}-vs-ethereum`}>Compare</Link>
                </div>
              </div>
            </aside>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PredictionDetail;
