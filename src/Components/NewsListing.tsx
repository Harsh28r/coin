import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { extractListingNews, ListingItem } from '../utils/listings';
import { useNavigate } from 'react-router-dom';

const NewsListing: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-2.onrender.com';

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
      source_name: 'Crypto News',
      keywords: li.coins,
    } as any;
    navigate(`/news/${id}`, { state: { item: stateItem } });
  };

  const grouped = useMemo(() => {
    const today = new Date();
    const dayKey = (d?: string) => {
      const t = d ? new Date(d) : today; return `${t.getFullYear()}-${t.getMonth()+1}-${t.getDate()}`;
    };
    const map = new Map<string, ListingItem[]>();
    for (const it of items) {
      const k = dayKey(it.pubDate);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(it);
    }
    return Array.from(map.entries()).sort((a,b) => Date.parse(b[0]) - Date.parse(a[0]));
  }, [items]);

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="m-0">New Listings</h4>
        <div>
          <Badge bg="dark" className="me-2">{items.length} items</Badge>
        </div>
      </div>
      {loading ? (
        <p>Loading listing news…</p>
      ) : items.length === 0 ? (
        <p>No recent listing updates found.</p>
      ) : (
        grouped.map(([date, arr]) => (
          <div key={date} className="mb-4">
            <h6 className="text-muted mb-2">{new Date(date).toDateString()}</h6>
            <Row xs={1} md={2} lg={3} className="g-3">
              {arr.map((li, i) => (
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
                        <Button size="sm" variant="outline-primary" onClick={() => openDetail(li)}>Read</Button>
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

export default NewsListing;


