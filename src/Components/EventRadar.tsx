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
      <h1 className="mb-4 text-center" style={{ 
        fontSize: '2.5rem', 
        fontWeight: 'bold', 
        color: '#1f2937',
        borderBottom: '3px solid #f59e0b',
        paddingBottom: '1rem'
      }}>
        Crypto Events & Conferences
      </h1>

      {/* Enhanced introduction section moved to the end for better user experience */}
      <div className="mb-5 p-5" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '20px',
        border: 'none',
        boxShadow: '0 20px 40px rgba(102, 126, 234, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          transform: 'rotate(45deg)'
        }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 className="h3 mb-4 text-white fw-bold" style={{ 
            fontSize: '2rem',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            letterSpacing: '0.5px'
          }}>
            Stay Connected with the Global Crypto Community
          </h2>
          <p className="mb-3 text-white-75" style={{ 
            fontSize: '1.1rem',
            lineHeight: '1.7',
            textShadow: '0 1px 5px rgba(0,0,0,0.2)'
          }}>
            Discover upcoming crypto events, conferences, and meetups that bring together industry leaders, developers, 
            investors, and enthusiasts from around the world. Our comprehensive crypto events calendar keeps you informed.
          </p>
          <p className="mb-3 text-white-75" style={{ 
            fontSize: '1.1rem',
            lineHeight: '1.7',
            textShadow: '0 1px 5px rgba(0,0,0,0.2)'
          }}>
            From major crypto industry conferences like Consensus and Bitcoin Miami to local meetups and virtual events, 
            track the most important gatherings that shape the future of blockchain technology and cryptocurrency adoption.
          </p>
          <p className="mb-0 text-white-75" style={{ 
            fontSize: '1.1rem',
            lineHeight: '1.7',
            textShadow: '0 1px 5px rgba(0,0,0,0.2)'
          }}>
            Network with crypto professionals, learn about the latest developments, and stay ahead of regulatory deadlines 
            and network upgrades that impact the broader crypto market and blockchain ecosystem.
          </p>
        </div>
      </div>

      {/* Additional informative content section */}
      <div className="mb-5 p-5" style={{ 
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        borderRadius: '20px',
        border: 'none',
        boxShadow: '0 20px 40px rgba(240, 147, 251, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.3
        }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h3 className="h4 mb-4 text-white fw-bold" style={{ 
            fontSize: '1.8rem',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}>
            Comprehensive Crypto Events Coverage & Networking
          </h3>
          <p className="mb-4 text-white-75" style={{ 
            fontSize: '1.1rem',
            lineHeight: '1.7',
            textShadow: '0 1px 5px rgba(0,0,0,0.2)'
          }}>
            Our crypto events platform provides comprehensive coverage of industry gatherings, helping you stay connected 
            with the global blockchain community and discover valuable networking opportunities.
          </p>
          <div className="row">
            <div className="col-md-6">
              <div className="p-4" style={{ 
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <h6 className="fw-bold text-white mb-3" style={{ fontSize: '1.1rem' }}>🎪 Event Types:</h6>
                <ul className="list-unstyled mb-0 text-white-75">
                  <li className="mb-2">• Major crypto conferences</li>
                  <li className="mb-2">• Industry meetups</li>
                  <li className="mb-2">• Virtual crypto events</li>
                  <li className="mb-0">• Regulatory workshops</li>
                </ul>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-4" style={{ 
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <h6 className="fw-bold text-white mb-3" style={{ fontSize: '1.1rem' }}>🌍 Global Coverage:</h6>
                <ul className="list-unstyled mb-0 text-white-75">
                  <li className="mb-2">• North America events</li>
                  <li className="mb-2">• European conferences</li>
                  <li className="mb-2">• Asian crypto meetups</li>
                  <li className="mb-0">• Online gatherings</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event categories and types */}
      <div className="mb-4 p-3" style={{ 
        backgroundColor: '#e7f3ff', 
        borderRadius: '8px', 
        border: '1px solid #b3d9ff' 
      }}>
        <div className="row text-center">
          <div className="col-md-4">
            <div className="p-2">
              <strong className="d-block text-primary">Conferences</strong>
              <small className="text-muted">Industry meetups & summits</small>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-2">
              <strong className="d-block text-primary">Network Events</strong>
              <small className="text-muted">Upgrades & hard forks</small>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-2">
              <strong className="d-block text-primary">Regulatory</strong>
              <small className="text-muted">Deadlines & compliance</small>
            </div>
          </div>
        </div>
      </div>

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


