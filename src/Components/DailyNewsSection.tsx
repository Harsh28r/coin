import React, { useEffect, useState } from 'react';

const DAILY_BASE = 'https://daily.coinsclarity.com';

const defaultItems = [
  { title: 'India & world current affairs', slug: '', excerpt: 'Daily updates on politics, economy & more.' },
  { title: 'Today’s top headlines', slug: '', excerpt: 'Quick round-up of what’s in the news.' },
  { title: 'Editorial & analysis', slug: '', excerpt: 'In-depth takes on key stories.' },
  { title: 'Latest from Daily', slug: '', excerpt: 'Stay informed with our daily digest.' },
];

const DailyNewsSection: React.FC = () => {
  const [items, setItems] = useState<{ title: string; slug: string; excerpt: string }[]>(defaultItems);

  useEffect(() => {
    // Optional: fetch from daily.coinsclarity.com API when available
    const apiUrl = `${DAILY_BASE}/api/posts?limit=4`;
    fetch(apiUrl, { method: 'GET' })
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data: any) => {
        const list = data?.data ?? data?.posts ?? data;
        if (Array.isArray(list) && list.length > 0) {
          setItems(
            list.slice(0, 4).map((p: any) => ({
              title: p.title || p.name || 'Story',
              slug: p.slug || p.id || '',
              excerpt: p.excerpt || p.description || p.content?.slice(0, 80) + '…' || '',
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px' }}>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text, #111827)', margin: 0 }}>
          Latest from Daily
        </h2>
        <a
          href={DAILY_BASE}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f97316', textDecoration: 'none' }}
        >
          View all →
        </a>
      </div>
      <div className="row g-3">
        {items.map((item, i) => (
          <div key={i} className="col-12 col-sm-6 col-lg-3">
            <a
              href={item.slug ? `${DAILY_BASE}/post/${item.slug}` : DAILY_BASE}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'block',
                padding: '14px 16px',
                background: 'var(--card, #fff)',
                border: '1px solid var(--border, #e5e7eb)',
                borderRadius: 12,
                textDecoration: 'none',
                color: 'inherit',
                transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                e.currentTarget.style.borderColor = '#f97316';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '';
              }}
            >
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text, #111827)', marginBottom: 6, lineHeight: 1.35 }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted, #6b7280)', margin: 0, lineHeight: 1.4 }}>
                {item.excerpt}
              </p>
            </a>
          </div>
        ))}
      </div>
    </section>
  );
};

export default DailyNewsSection;
