import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CoinsNavbar from '../Components/navbar';
import Footer from '../Components/footer';
import SeoHead from '../Components/SeoHead';
import JsonLd from '../Components/JsonLd';
import InternalLinksBlock from '../Components/InternalLinksBlock';
import { extractEvents, type EventItem } from '../utils/events';
import { eventHubMeta } from '../utils/seoMetadata';
import { breadcrumbList, collectionPage, faqPage, SITE_URL } from '../utils/jsonLd';
import { buildInternalLinks } from '../utils/internalLinks';
import { buildRssBackendBasesFromEnv } from '../utils/rssBackendBases';
import { detectCoinsInText } from '../utils/coinRegistry';
import './SeoProgrammatic.css';

const KIND_MAP: Record<string, { kind: EventItem['kind']; label: string }> = {
  listing: { kind: 'Listing', label: 'Exchange Listings' },
  etf: { kind: 'ETF', label: 'ETF & SEC' },
  unlock: { kind: 'Unlock', label: 'Token Unlocks' },
  upgrade: { kind: 'Upgrade', label: 'Network Upgrades' },
  fork: { kind: 'Fork', label: 'Hard Forks' },
  mainnet: { kind: 'Mainnet', label: 'Mainnet Launches' },
  court: { kind: 'Court', label: 'Legal & Court' },
  delisting: { kind: 'Delisting', label: 'Delistings' },
};

const RSS_FEEDS = [
  '/fetch-dailycoin-rss?limit=50',
  '/fetch-cryptobriefing-rss?limit=50',
  '/fetch-beincrypto-rss?limit=50',
  '/fetch-coingape-rss?limit=50',
  '/fetch-blockworks-rss?limit=50',
];

const EventKindHub: React.FC = () => {
  const { kind = 'listing' } = useParams<{ kind: string }>();
  const config = KIND_MAP[kind.toLowerCase()] || KIND_MAP.listing;
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const meta = useMemo(() => eventHubMeta(kind, config.label), [kind, config.label]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const bases = buildRssBackendBasesFromEnv();
      let items: any[] = [];
      for (const base of bases) {
        const results = await Promise.allSettled(
          RSS_FEEDS.map((p) =>
            fetch(`${base.replace(/\/$/, '')}${p}`, { signal: AbortSignal.timeout(12000) })
              .then((r) => r.json())
              .catch(() => null),
          ),
        );
        for (const r of results) {
          if (r.status !== 'fulfilled' || !r.value) continue;
          const arr = Array.isArray(r.value.data)
            ? r.value.data
            : Array.isArray(r.value.items)
              ? r.value.items
              : [];
          items.push(...arr);
        }
        if (items.length > 30) break;
      }
      if (!cancelled) {
        const all = extractEvents(items);
        setEvents(all.filter((e) => e.kind === config.kind).slice(0, 40));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kind, config.kind]);

  const internalLinks = useMemo(
    () =>
      buildInternalLinks({
        text: events.map((e) => e.title).join(' '),
        limit: 12,
      }),
    [events],
  );

  const faq = [
    {
      question: `What ${config.label.toLowerCase()} events are coming in crypto?`,
      answer: events[0]
        ? `Next tracked item: ${events[0].title} (${events[0].date}). This hub refreshes from live crypto news feeds.`
        : `No ${config.label.toLowerCase()} events detected right now — check back or browse the main events calendar.`,
    },
  ];

  return (
    <div className="seo-page">
      <SeoHead meta={meta} />
      <JsonLd
        data={[
          collectionPage({
            name: `${config.label} — Crypto Events`,
            description: meta.description,
            url: `${SITE_URL}/events/${kind}`,
          }),
          breadcrumbList([
            { name: 'Home', url: SITE_URL },
            { name: 'Events', url: `${SITE_URL}/events` },
            { name: config.label, url: `${SITE_URL}/events/${kind}` },
          ]),
          faqPage(faq),
        ]}
      />
      <CoinsNavbar />
      <main className="seo-main">
        <div className="seo-top">
          <Link to="/events" className="seo-back">
            <ArrowLeft size={16} /> All events
          </Link>
        </div>

        <header>
          <div className="seo-hero__eyebrow">Events hub · {config.kind}</div>
          <h1 className="seo-hero__title">{config.label} — Coins Affected & Dates</h1>
          <p className="seo-hero__standfirst">
            Programmatic tracker for {config.label.toLowerCase()} pulled from live crypto headlines.
            Use with coin news hubs and price charts.
          </p>
        </header>

        <section className="seo-section">
          <h2>Upcoming & recent {config.label.toLowerCase()}</h2>
          {loading && <p className="seo-loading">Scanning feeds…</p>}
          {!loading && events.length === 0 && (
            <p className="seo-loading">No events in this category right now.</p>
          )}
          <ul className="seo-news-list">
            {events.map((evt, i) => {
              const coins = detectCoinsInText(evt.title, 3);
              return (
                <li key={`${evt.title}-${i}`} className="seo-news-item">
                  {evt.link ? (
                    <a href={evt.link} target="_blank" rel="noopener noreferrer">
                      {evt.title}
                    </a>
                  ) : (
                    <strong>{evt.title}</strong>
                  )}
                  <p>
                    {evt.date} · {evt.kind}
                    {coins.length > 0 && (
                      <>
                        {' '}
                        · Coins:{' '}
                        {coins.map((c) => (
                          <Link key={c.id} to={`/coin/${c.id}/news`}>
                            {c.symbol}
                          </Link>
                        ))}
                      </>
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="seo-section">
          <h2>More event hubs</h2>
          <div className="seo-hub-grid">
            {Object.entries(KIND_MAP).map(([slug, c]) => (
              <Link key={slug} to={`/events/${slug}`} className="seo-hub-card">
                <strong>{c.label}</strong>
                <span>{c.kind} events</span>
              </Link>
            ))}
          </div>
        </section>

        <InternalLinksBlock links={internalLinks} />
      </main>
      <Footer />
    </div>
  );
};

export default EventKindHub;
