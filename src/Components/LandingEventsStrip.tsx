import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { extractEvents, type EventItem, type RawItem } from '../utils/events';
import { defaultPublicBackend } from '../utils/rssBackendBases';
import './LandingEventsStrip.css';

type EventCard = EventItem & {
  description?: string;
  image_url?: string;
};

/** Compact crypto events teaser — dark theme, opens on CoinsClarity. */
const LandingEventsStrip: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventCard[]>([]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const base = defaultPublicBackend();
        const sources = [
          `${base}/fetch-dailycoin-rss?limit=25`,
          `${base}/fetch-beincrypto-rss?limit=25`,
          `${base}/fetch-cryptopotato-rss?limit=25`,
          `${base}/fetch-blockworks-rss?limit=25`,
        ];
        const results = await Promise.allSettled(
          sources.map((s) =>
            fetch(s, { signal: AbortSignal.timeout(10000) })
              .then((r) => r.json())
              .catch(() => null)
          )
        );
        const items: RawItem[] = [];
        for (const r of results) {
          if (r.status !== 'fulfilled' || !r.value?.success) continue;
          const arr = Array.isArray(r.value.data)
            ? r.value.data
            : Array.isArray(r.value.items)
              ? r.value.items
              : [];
          items.push(...arr);
        }
        const evts = extractEvents(items).slice(0, 6).map((e) => {
          const raw = items.find((it) => (it.title || '') === e.title);
          return {
            ...e,
            description: String(raw?.description || raw?.content || '').slice(0, 220),
            image_url: '',
          } as EventCard;
        });
        if (!cancelled) setEvents(evts);
      } catch {
        if (!cancelled) setEvents([]);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const openOnPlatform = (e: EventCard) => {
    const id = encodeURIComponent(e.link || e.title);
    navigate(`/news/${id}`, {
      state: {
        item: {
          article_id: e.link || e.title,
          title: e.title,
          description: e.description || `${e.kind} · ${e.date}`,
          creator: [e.source || 'Markets Desk'],
          pubDate: e.date || new Date().toISOString(),
          image_url: e.image_url || '',
          link: e.link || '#',
          content: e.description || '',
          source_name: e.source || e.kind,
          category: [e.kind],
        },
      },
    });
  };

  if (!events.length) return null;

  return (
    <section className="les" aria-label="Crypto events">
      <div className="les-inner">
        <header className="les-head">
          <div>
            <span className="les-eyebrow">Calendar</span>
            <h2 className="les-title">Crypto events radar</h2>
            <p className="les-dek">
              Listings, ETFs, unlocks, and upgrades — open on CoinsClarity. Source credited on the
              article page.
            </p>
          </div>
          <Link to="/events" className="les-all">
            All events →
          </Link>
        </header>
        <ul className="les-grid">
          {events.map((e, i) => (
            <li key={`${e.title}-${e.date}-${i}`}>
              <button type="button" className="les-card" onClick={() => openOnPlatform(e)}>
                <span className={`les-kind is-${e.kind.toLowerCase()}`}>{e.kind}</span>
                <strong>{e.title}</strong>
                <span className="les-meta">
                  {e.date}
                  {e.source ? ` · ${e.source}` : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default LandingEventsStrip;
