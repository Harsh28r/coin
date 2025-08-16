import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { extractEvents, EventItem } from '../utils/events';

const EventRadar: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-2.onrender.com';

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const sources = [
          'fetch-dailycoin-rss?limit=40',
          'fetch-cryptobriefing-rss?limit=40',
          'fetch-dailyhodl-rss?limit=40',
          'fetch-ambcrypto-rss?limit=40',
          'fetch-beincrypto-rss?limit=40',
          'fetch-cryptopotato-rss?limit=40',
          'fetch-utoday-rss?limit=40',
        ];
        const results = await Promise.allSettled(sources.map(s => fetch(`${API_BASE_URL}/${s}`).then(r => r.json()).catch(() => null)));
        let items: any[] = [];
        for (const r of results) {
          if ((r as any)?.status === 'fulfilled' && (r as any).value?.success && Array.isArray((r as any).value.data)) {
            items.push(...(r as any).value.data);
          }
        }
        const evts = extractEvents(items);
        setEvents(evts);
      } catch {}
      finally { setLoading(false); }
    };
    run();
  }, [API_BASE_URL]);

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="m-0">Event Radar</h4>
      </div>
      {loading ? (
        <p>Loading events…</p>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-3">
          {events.map((e, i) => (
            <Col key={`${e.title}-${i}`}>
              <Card className="h-100 border-0 shadow-sm rounded-4">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <Badge bg="light" text="dark">{e.kind}</Badge>
                    <small className="text-muted">{e.date}</small>
                  </div>
                  <Card.Title style={{ fontSize: '1rem' }}>{e.title}</Card.Title>
                  {e.source && <small className="text-muted">{e.source}</small>}
                  {e.link && (
                    <div className="mt-2">
                      <a className="btn btn-sm btn-outline-primary" href={e.link} target="_blank" rel="noreferrer">Source</a>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default EventRadar;


