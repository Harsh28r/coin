import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { extractListingNews, ListingItem } from '../utils/listings';
import { useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useNewsTranslation } from '../hooks/useNewsTranslation';
import { Helmet } from 'react-helmet-async';

const ListingsAll: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-2.onrender.com';
  const { displayItems: displayListings, isTranslating, currentLanguage } = useNewsTranslation(items as any);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const sources = [
          'fetch-dailycoin-rss?limit=120',
          'fetch-cryptobriefing-rss?limit=120',
          'fetch-dailyhodl-rss?limit=120',
          'fetch-ambcrypto-rss?limit=120',
          'fetch-beincrypto-rss?limit=120',
          'fetch-cryptopotato-rss?limit=120',
          'fetch-utoday-rss?limit=120',
          'fetch-bitcoinmagazine-rss?limit=120',
          'fetch-coindesk-rss?limit=120',
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

  const orangeBtnStyle: React.CSSProperties = { backgroundColor: '#ff7a00', borderColor: '#ff7a00', color: '#fff' };

  return (
    <Container fluid className="mt-4" style={{ width: '92%' }}>
      <Helmet>
        <title>All Listings | CoinsCapture</title>
        <meta name="description" content="All recent crypto exchange listings and pair updates in one place." />
        <link rel="canonical" href={`${window.location.origin}/listings/all`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="All Listings | CoinsCapture" />
        <meta property="og:description" content="All recent crypto exchange listings and pair updates." />
        <meta property="og:url" content={`${window.location.origin}/listings/all`} />
        <meta name="twitter:card" content="summary" />
      </Helmet>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4
            className="m-0"
            style={{ fontWeight: 'bold', letterSpacing: '0.05em', borderBottom: '2px solid orange', marginBottom: '0.35rem' }}
          >
            All Listings
          </h4>
          <small style={{ color: '#6b7280' }}>Every recent exchange listing and pair update</small>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Badge bg="dark" className="me-2">{items.length} items</Badge>
          <Button size="sm" variant="primary" style={orangeBtnStyle} onClick={() => navigate('/listings')}>Back</Button>
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
        <Row>
          <Col lg={12}>
            <Row xs={1} md={2} lg={3} className="g-3">
              {Array.from({ length: 9 }).map((_, i) => (
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
          </Col>
        </Row>
      ) : items.length === 0 ? (
        <p>No recent listing updates found.</p>
      ) : (
        grouped.map(([date, arr]) => (
          <div key={date} className="mb-4">
            <h6 className="text-muted mb-2">{new Date(date).toDateString()}</h6>
            <Row xs={1} md={2} lg={4} className="g-3">
              {arr.map((li, i) => (
                <Col key={`${li.title}-${i}`}>
                  <Card
                    className="h-100 border-0 shadow-sm rounded-4"
                    style={{ transition: 'all 0.25s ease' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 24px rgba(0,0,0,0.10)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
                    }}
                  >
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
          </div>
        ))
      )}
    </Container>
  );
};

export default ListingsAll;


