import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft } from 'lucide-react';
import CoinsNavbar from '../Components/navbar';
import Footer from '../Components/footer';
import JsonLd from '../Components/JsonLd';
import { breadcrumbList, SITE_URL } from '../utils/jsonLd';
import {
  AUTHORS,
  getAuthorBySlug,
  authorPath,
  resolveAuthorFromPost,
  type DeskAuthor,
} from '../config/authors';
import { fetchPosts } from '../services/api';
import type { BlogPost } from '../types/blog';
import { getBlogUrl } from '../utils/blogUrl';
import { listPriceOutlooks } from '../services/priceOutlookApi';
import './LivePages.css';

const stripTags = (html?: string) =>
  (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const AuthorIndex: React.FC = () => (
  <div className="au-page">
    <Helmet>
      <title>Our Desk — CoinsClarity Authors</title>
      <meta
        name="description"
        content="Meet the CoinsClarity Markets, Geopolitics, India Policy, and On-chain desks — named analysts behind our original coverage."
      />
      <link rel="canonical" href={`${window.location.origin}/authors`} />
    </Helmet>
    <CoinsNavbar />
    <main className="au-main">
      <h1 className="lv-title">Our desk</h1>
      <p className="lv-lead">
        Named analysts. Original filings. No anonymous scrapes posing as journalism.
      </p>
      <div className="au-index-grid">
        {AUTHORS.filter((a) => a.slug !== 'editorial').map((a) => (
          <Link key={a.slug} to={authorPath(a.slug)} className="au-index-card">
            <span className="au-avatar" style={{ background: a.accent, width: 52, height: 52, fontSize: '1rem' }}>
              {a.initials}
            </span>
            <div>
              <strong>{a.name}</strong>
              <span>
                {a.role} · {a.desk}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
    <Footer />
  </div>
);

const AuthorProfile: React.FC<{ author: DeskAuthor }> = ({ author }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // Pull agent tag posts + outlooks; filter by author aliases client-side
        const bags: BlogPost[] = [];
        for (const tag of author.tags.slice(0, 3)) {
          try {
            const list = await fetchPosts({ tag, limit: 40 });
            bags.push(...list);
          } catch {
            /* next */
          }
        }
        if (author.tags.includes('price-outlook') || author.slug === 'elena-vasquez') {
          try {
            const outlooks = await listPriceOutlooks(30);
            bags.push(...outlooks);
          } catch {
            /* ignore */
          }
        }
        // Dedupe
        const seen = new Set<string>();
        const uniq = bags.filter((p) => {
          const k = p.id || p.slug || p.title;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
        const mine = uniq.filter((p) => {
          const resolved = resolveAuthorFromPost(p);
          if (resolved?.slug === author.slug) return true;
          const a = String(p.author || '').toLowerCase();
          return author.aliases.some((x) => x.toLowerCase() === a);
        });
        mine.sort(
          (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
        );
        if (!cancelled) setPosts(mine.slice(0, 40));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [author]);

  const canonical = `${typeof window !== 'undefined' ? window.location.origin : SITE_URL}${authorPath(author.slug)}`;

  const postHref = (p: BlogPost) => {
    if (p.outlook?.coinId || (p.slug || '').startsWith('price-outlook-')) {
      const id = p.outlook?.coinId || String(p.slug).replace(/^price-outlook-/, '');
      return `/prediction/${id}`;
    }
    return getBlogUrl(p);
  };

  return (
    <div className="au-page">
      <Helmet>
        <title>
          {author.name} — {author.role} | CoinsClarity
        </title>
        <meta name="description" content={author.bio.slice(0, 160)} />
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content={`${author.name} | CoinsClarity`} />
        <meta property="og:description" content={author.bio.slice(0, 160)} />
        <meta property="og:url" content={canonical} />
      </Helmet>
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: author.name,
            jobTitle: author.role,
            description: author.bio,
            url: canonical,
            worksFor: { '@type': 'Organization', name: 'CoinsClarity' },
          },
          breadcrumbList([
            { name: 'Home', url: SITE_URL },
            { name: 'Authors', url: `${SITE_URL}/authors` },
            { name: author.name, url: canonical },
          ]),
        ]}
      />
      <CoinsNavbar />
      <main className="au-main">
        <Link to="/authors" className="lv-back">
          <ArrowLeft size={16} /> All authors
        </Link>

        <header className="au-hero">
          <div className="au-avatar" style={{ background: author.accent }}>
            {author.initials}
          </div>
          <div>
            <h1>{author.name}</h1>
            <p className="au-role">
              {author.role} · {author.desk}
            </p>
            <p className="au-bio">{author.bio}</p>
            <div className="au-focus">
              {author.focus.map((f) => (
                <span key={f} className="au-chip">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </header>

        <h2 style={{ fontSize: '1.15rem', marginBottom: '0.85rem', letterSpacing: '-0.02em' }}>
          Latest filings
        </h2>
        {loading && <p className="lv-muted">Loading…</p>}
        {!loading && posts.length === 0 && (
          <p className="lv-muted">No filings matched yet — check back after the next desk cycle.</p>
        )}
        <ul className="au-grid">
          {posts.map((p) => (
            <li key={p.id || p.slug}>
              <Link to={postHref(p)} className="au-card">
                <div className="au-card__meta">
                  {p.date
                    ? new Date(p.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : ''}
                </div>
                <h2>{p.title}</h2>
                <p>{(p.excerpt || stripTags(p.content)).slice(0, 140)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
};

const AuthorPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const author = useMemo(() => (slug ? getAuthorBySlug(slug) : undefined), [slug]);

  // /authors index when no slug (route handles separately) — this component used for /author/:slug
  if (!slug) return <AuthorIndex />;
  if (!author) {
    return (
      <div className="au-page">
        <CoinsNavbar />
        <main className="au-main">
          <p className="lv-muted">Author not found.</p>
          <Link to="/authors">Back to desk</Link>
        </main>
        <Footer />
      </div>
    );
  }
  return <AuthorProfile author={author} />;
};

export { AuthorIndex };
export default AuthorPage;
