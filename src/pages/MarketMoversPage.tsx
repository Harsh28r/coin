import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import CoinsNavbar from '../Components/navbar';
import Footer from '../Components/footer';
import JsonLd from '../Components/JsonLd';
import InternalLinksBlock from '../Components/InternalLinksBlock';
import { breadcrumbList, collectionPage, faqPage, SITE_URL } from '../utils/jsonLd';
import { buildInternalLinks } from '../utils/internalLinks';
import { buildRssBackendBasesFromEnv } from '../utils/rssBackendBases';
import { getBlogUrl } from '../utils/blogUrl';
import './SeoProgrammatic.css';

type Post = {
  _id?: string;
  id?: string;
  slug?: string;
  title?: string;
  excerpt?: string;
  content?: string;
  date?: string;
  tags?: string[];
};

const strip = (html?: string) =>
  String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const MarketMoversPage: React.FC = () => {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const bases = buildRssBackendBasesFromEnv();
      for (const base of bases) {
        try {
          const r = await fetch(`${base.replace(/\/$/, '')}/api/market-movers/latest`, {
            signal: AbortSignal.timeout(12000),
          });
          if (!r.ok) continue;
          const j = await r.json();
          if (j?.data) {
            setPost(j.data);
            break;
          }
        } catch {
          /* next */
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const title = post?.title || 'Crypto Market Movers This Week';
  const desc =
    post?.excerpt ||
    strip(post?.content).slice(0, 160) ||
    'Weekly crypto market movers: top gainers, losers, and desk analysis on CoinsClarity.';
  const path = post?.slug ? getBlogUrl(post as any) : '/market-movers';
  const links = useMemo(
    () =>
      buildInternalLinks({
        text: `${title} ${desc}`,
        coinIds: ['bitcoin', 'ethereum', 'solana'],
        limit: 10,
      }),
    [title, desc],
  );

  return (
    <div className="seo-page">
      <Helmet>
        <title>{title} | CoinsClarity</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={`${SITE_URL}/market-movers`} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
      </Helmet>
      <JsonLd
        data={[
          collectionPage({
            name: title,
            description: desc,
            url: `${SITE_URL}/market-movers`,
          }),
          breadcrumbList([
            { name: 'Home', url: SITE_URL },
            { name: 'Market Movers', url: `${SITE_URL}/market-movers` },
          ]),
          faqPage([
            {
              question: 'What are crypto market movers this week?',
              answer: desc,
            },
          ]),
        ]}
      />
      <CoinsNavbar />
      <main className="seo-main">
        <div className="seo-top">
          <Link to="/" className="seo-back">
            <ArrowLeft size={16} /> Home
          </Link>
          <button type="button" className="seo-back" onClick={load} disabled={loading}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
        <header>
          <div className="seo-hero__eyebrow">Weekly cluster · Markets desk</div>
          <h1 className="seo-hero__title">{title}</h1>
          <p className="seo-hero__standfirst">{desc}</p>
        </header>

        {loading && <p className="seo-loading">Loading weekly movers…</p>}
        {!loading && !post && (
          <p className="seo-loading">
            No weekly movers article yet. Cron publishes Mondays — or trigger{' '}
            <code>/api/market-movers/run-now</code>.
          </p>
        )}
        {post && (
          <section className="seo-section">
            <div
              className="seo-answer"
              dangerouslySetInnerHTML={{
                __html: (post.content || '').slice(0, 12000),
              }}
            />
            <p>
              <Link to={path}>Open full desk article →</Link>
            </p>
          </section>
        )}

        <section className="seo-section">
          <h2>Related hubs</h2>
          <div className="seo-hub-grid">
            <Link to="/today/why-is-bitcoin-up" className="seo-hub-card">
              <strong>Why BTC up</strong>
              <span>Today movers</span>
            </Link>
            <Link to="/today/why-is-ethereum-up" className="seo-hub-card">
              <strong>Why ETH up</strong>
              <span>Today movers</span>
            </Link>
            <Link to="/events/etf" className="seo-hub-card">
              <strong>ETF events</strong>
              <span>Weekly catalysts</span>
            </Link>
            <Link to="/trending-desk" className="seo-hub-card">
              <strong>Trending desk</strong>
              <span>Daily column</span>
            </Link>
          </div>
        </section>
        <InternalLinksBlock links={links} />
      </main>
      <Footer />
    </div>
  );
};

export default MarketMoversPage;
