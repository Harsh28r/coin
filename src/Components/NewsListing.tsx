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
        const CAMIFY = 'https://camify.fun.coinsclarity.com';
        const sources = [
          `${CAMIFY}/fetch-cryptobriefing-rss?limit=60`,
          `${CAMIFY}/fetch-beincrypto-rss?limit=60`,
          `${CAMIFY}/fetch-cryptopotato-rss?limit=60`,
          `${CAMIFY}/fetch-utoday-rss?limit=60`,
          `${CAMIFY}/fetch-coindesk-rss?limit=60`,
          `${CAMIFY}/fetch-cointelegraph-rss?limit=60`,
          `${CAMIFY}/fetch-decrypt-rss?limit=60`,
          `${CAMIFY}/fetch-blockworks-rss?limit=60`,
          `${CAMIFY}/fetch-bitcoinist-rss?limit=60`,
          `${CAMIFY}/fetch-coingape-rss?limit=60`,
          `${CAMIFY}/fetch-finbold-rss?limit=60`,
          `${CAMIFY}/fetch-protos-rss?limit=60`,
          `${CAMIFY}/fetch-unchained-rss?limit=60`,
          `${CAMIFY}/fetch-thecryptobasic-rss?limit=60`,
          `${CAMIFY}/fetch-blockonomi-rss?limit=60`,
          `${CAMIFY}/fetch-coincu-rss?limit=60`,
          `${API_BASE_URL}/fetch-all-rss?limit=100`,
        ];
        const results = await Promise.allSettled(sources.map(s => fetch(s, { signal: AbortSignal.timeout(12000) }).then(r => r.json()).catch(() => null)));
        let merged: any[] = [];
        for (const r of results) {
          if ((r as any)?.status === 'fulfilled' && (r as any).value?.success) {
            const arr = Array.isArray((r as any).value.data) ? (r as any).value.data : Array.isArray((r as any).value.items) ? (r as any).value.items : [];
            merged.push(...arr);
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


