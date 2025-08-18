import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { extractListingNews, ListingItem } from '../utils/listings';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useNewsTranslation } from '../hooks/useNewsTranslation';
import { Helmet } from 'react-helmet-async';

const Listings: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAll, setShowAll] = useState<boolean>(false);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-2.onrender.com';
  const { displayItems: displayListings, isTranslating, currentLanguage } = useNewsTranslation(items as any);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const sources = [
          'fetch-dailycoin-rss?limit=60',
          'fetch-cryptobriefing-rss?limit=60',
          'fetch-dailyhodl-rss?limit=60',
          'fetch-ambcrypto-rss?limit=60',
          'fetch-beincrypto-rss?limit=60',
          'fetch-cryptopotato-rss?limit=60',
          'fetch-utoday-rss?limit=60',
          'fetch-bitcoinmagazine-rss?limit=60',
          'fetch-coindesk-rss?limit=60',
        ];
        const results = await Promise.allSettled(sources.map(s => fetch(`${API_BASE_URL}/${s}`).then(r => r.json()).catch(() => null)));
        let merged: any[] = [];
        for (const r of results) {
          if ((r as any)?.status === 'fulfilled' && (r as any).value?.success && Array.isArray((r as any).value.data)) {
            merged.push(...(r as any).value.data);
          }
        }
        const listings = extractListingNews(merged);
        setItems(listings);
      } catch {}
      finally { setLoading(false); }
    };
    run();
  }, [API_BASE_URL]);

  const openDetail = (li: ListingItem) => {
    const id = encodeURIComponent((li.article_id || li.link || li.title).toString());
    const stateItem = {
      article_id: li.article_id || id,
      title: li.title,
      description: li.description || '',
      creator: [],
      pubDate: li.pubDate || new Date().toISOString(),
      image_url: (li as any).image_url,
      link: li.link || '',
      content: li.content || li.description || '',
      source_name: li.source_name || 'RSS',
      keywords: li.coins,
    } as any;
    navigate(`/news/${id}`, { state: { item: stateItem } });
  };

  const effectiveItems: ListingItem[] = useMemo(() => (displayListings && (displayListings as any).length ? (displayListings as any) : items), [displayListings, items]);

  const grouped = useMemo(() => {
    const today = new Date();
    const dayKey = (d?: string) => {
      const t = d ? new Date(d) : today; return `${t.getFullYear()}-${t.getMonth()+1}-${t.getDate()}`;
    };
    const map = new Map<string, ListingItem[]>();
    for (const it of effectiveItems) {
      const k = dayKey(it.pubDate);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(it);
    }
    return Array.from(map.entries()).sort((a,b) => Date.parse(b[0]) - Date.parse(a[0]));
  }, [effectiveItems]);

  const flat = useMemo(() => effectiveItems.slice(0), [effectiveItems]);
  const orangeBtnStyle: React.CSSProperties = { backgroundColor: '#ff7a00', borderColor: '#ff7a00', color: '#fff' };

  return (
    <Container className="mt-4">
      <Helmet>
        <title>CoinsClarity | Crypto News</title>
        <meta name="description" content="Discover the latest crypto news, exchange listings, new token pairs, markets, and trading venues updated daily. Track coins across Binance, Coinbase, and more." />
        <link rel="canonical" href={`${window.location.origin}/listings`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="CoinsClarity | Crypto News" />
        <meta property="og:description" content="Discover the latest crypto news, exchange listings, new token pairs, markets, and trading venues updated daily." />
        <meta property="og:url" content={`${window.location.origin}/listings`} />
        <meta name="twitter:card" content="summary_large_image" />
        {/* Hreflang alternates */}
        <link rel="alternate" hrefLang="x-default" href={`${window.location.origin}/listings`} />
        <link rel="alternate" hrefLang="en" href={`${window.location.origin}/listings`} />
        <link rel="alternate" hrefLang="es" href={`${window.location.origin}/listings`} />
        <link rel="alternate" hrefLang="fr" href={`${window.location.origin}/listings`} />
        <link rel="alternate" hrefLang="de" href={`${window.location.origin}/listings`} />
        {/* Structured data: CollectionPage */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Crypto Exchange Listings & New Token Pairs',
            url: `${window.location.origin}/listings`,
            description: 'Latest crypto exchange listings and new token pairs updated daily.'
          })}
        </script>
      </Helmet>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="m-0" style={{ fontSize: '1.5rem' }}>Crypto Exchange Listings & New Token Pairs</h1>
        <div className="d-flex align-items-center gap-2">
          <Badge bg="dark" className="me-2">{effectiveItems.length} items</Badge>
          {items.length > 6 && (
            <Button
              size="sm"
              variant="link"
              className="text-warning text-decoration-none"
              style={{ fontWeight: 600 }}
              onClick={() => navigate('/listings/all')}
            >
              View All <ChevronRight size={20} />
            </Button>
          )}
        </div>
      </div>
      {isTranslating && (
        <small className="text-muted d-block mb-2">
          🔄 Translating listings to {currentLanguage === 'hi' ? 'Hindi' :
            currentLanguage === 'es' ? 'Spanish' :
            currentLanguage === 'fr' ? 'French' :
            currentLanguage === 'de' ? 'German' :
            currentLanguage === 'zh' ? 'Chinese' :
            currentLanguage === 'ja' ? 'Japanese' :
            currentLanguage === 'ko' ? 'Korean' :
            currentLanguage === 'ar' ? 'Arabic' : currentLanguage}...
        </small>
      )}
      {loading ? (
        <Row xs={1} md={2} lg={3} className="g-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Col key={i}>
              <Card className="h-100 border-0 shadow-sm rounded-4">
                <Skeleton height={160} />
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex flex-wrap gap-2">
                      <Skeleton width={60} height={20} />
                      <Skeleton width={60} height={20} />
                    </div>
                    <Skeleton width={70} height={20} />
                  </div>
                  <Skeleton width={'85%'} height={18} />
                  <div className="mt-3 d-flex justify-content-between align-items-center">
                    <Skeleton width={100} height={14} />
                    <Skeleton width={64} height={30} />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : items.length === 0 ? (
        <p>No recent listing updates found.</p>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-3">
          {flat.slice(0, 6).map((li, i) => (
            <Col key={`${li.title}-${i}`}>
              <Card className="h-100 border-0 shadow-sm rounded-4">
                {li.image_url && (
                  <div style={{ width: '100%', height: 160, overflow: 'hidden', background: '#0b0b0b' }}>
                    <img src={li.image_url} alt={li.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e: any) => { e.currentTarget.style.display = 'none'; }} />
                  </div>
                )}
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex flex-wrap gap-2">
                      {li.coins.slice(0, 4).map(c => (
                        <Badge bg="light" text="dark" key={c}>{c}</Badge>
                      ))}
                    </div>
                    {li.exchange && <Badge bg="warning" text="dark">{li.exchange}</Badge>}
                  </div>
                  <Card.Title style={{ fontSize: '1rem' }}>{li.title}</Card.Title>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <small className="text-muted">{li.source_name}</small>
                    <Button size="sm" variant="primary" style={orangeBtnStyle} onClick={() => openDetail(li)}>Read</Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default Listings;


