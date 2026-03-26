import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Gift, ExternalLink } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { getCryptoFallbackImage, handleImageError } from '../utils/cryptoImages';
import TradeExchangesCard from './TradeExchangesCard';

const RSS_API = 'https://api.rss2json.com/v1/api.json';
const AIRDROP_FEED_URL = 'https://airdropalert.com/feed/rssfeed';
const FEED_BASE_URL = 'https://airdropalert.com';
const DISPLAY_LIMIT = 8;

export interface AirdropItem {
  guid: string;
  title: string;
  link: string;
  pubDate: string;
  description: string;
  descriptionShort: string;
  imageUrl: string;
  contentHtml: string;
}

function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
}

/** Extract first img src from HTML; resolve relative URLs. */
function extractFirstImageUrl(html: string, baseUrl: string): string {
  if (!html || typeof html !== 'string') return '';
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (!match) return '';
  let src = match[1].trim();
  if (src.startsWith('//')) src = 'https:' + src;
  else if (src.startsWith('/')) src = baseUrl.replace(/\/?$/, '') + src;
  else if (!/^https?:\/\//i.test(src)) src = baseUrl.replace(/\/?$/, '') + '/' + src.replace(/^\//, '');
  return src;
}

function formatDate(raw: string): string {
  if (!raw) return '';
  try {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? raw : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return raw;
  }
}

const AirdropSection: React.FC = () => {
  const [items, setItems] = useState<AirdropItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchAirdrops = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${RSS_API}?rss_url=${encodeURIComponent(AIRDROP_FEED_URL)}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.status !== 'ok' || !Array.isArray(data.items)) {
          setItems([]);
          setError('Could not load airdrops.');
          return;
        }
        const list: AirdropItem[] = data.items.slice(0, DISPLAY_LIMIT).map((it: any, idx: number) => {
          const rawDesc = it.description || it.content || '';
          const stripped = stripHtml(rawDesc);
          const imageUrl = it.thumbnail || extractFirstImageUrl(rawDesc, FEED_BASE_URL) || '';
          return {
            guid: it.guid || `airdrop-${idx}-${(it.link || '').replace(/[^a-z0-9]/gi, '-')}`,
            title: it.title || 'Airdrop',
            link: it.link || '#',
            pubDate: it.pubDate || '',
            description: stripped,
            descriptionShort: stripped.slice(0, 120) + (stripped.length > 120 ? '…' : ''),
            imageUrl,
            contentHtml: rawDesc,
          };
        });
        setItems(list);
      } catch (e) {
        if (!cancelled) {
          setItems([]);
          setError('Airdrop feed temporarily unavailable.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAirdrops();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <section className="py-4 py-md-5" style={{ background: 'var(--bg)' }}>
        <Container>
          <div className="d-flex align-items-center gap-2 mb-4">
            <Gift size={24} style={{ color: 'var(--cc-orange)' }} />
            <h2 className="h4 mb-0 fw-bold" style={{ color: 'var(--text)' }}>New Airdrops</h2>
          </div>
          <Row>
            {[1, 2, 3, 4].map((i) => (
              <Col key={i} xs={12} sm={6} lg={3} className="mb-3">
                <Skeleton height={220} borderRadius={8} />
              </Col>
            ))}
          </Row>
        </Container>
      </section>
    );
  }

  if (error && items.length === 0) return null;

  return (
    <section className="py-4 py-md-5" style={{ background: 'var(--bg)' }}>
      <Container>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
          <div className="d-flex align-items-center gap-2">
            <Gift size={24} style={{ color: 'var(--cc-orange)' }} />
            <h2 className="h4 mb-0 fw-bold" style={{ color: 'var(--text)' }}>New Airdrops</h2>
          </div>
          <a
            href="https://airdropalert.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-decoration-none d-flex align-items-center gap-1"
            style={{ fontSize: '0.9rem', color: 'var(--cc-orange)' }}
          >
            More on Airdrop Alert <ExternalLink size={14} />
          </a>
        </div>
        <Row>
          {items.map((item) => (
            <Col key={item.guid} xs={12} sm={6} lg={3} className="mb-3">
              <Card
                className="h-100 border-0 shadow-sm overflow-hidden"
                style={{ background: 'var(--card-bg)', color: 'var(--text)' }}
              >
                <Link
                  to={`/airdrop/${encodeURIComponent(item.guid)}`}
                  state={{ airdrop: item }}
                  className="text-decoration-none d-block"
                  style={{ color: 'inherit' }}
                >
                  <div
                    className="bg-secondary"
                    style={{
                      height: 140,
                      overflow: 'hidden',
                      background: 'var(--card-bg)',
                    }}
                  >
                    <img
                      src={item.imageUrl || getCryptoFallbackImage(item.title, 'airdrop')}
                      alt=""
                      className="w-100 h-100 object-fit-cover"
                      style={{ objectFit: 'cover' }}
                      onError={(e) => handleImageError(e, item.title, 'airdrop')}
                    />
                  </div>
                  <Card.Body className="d-flex flex-column">
                    <Card.Title className="h6 mb-2" style={{ lineHeight: 1.3, color: 'var(--text)' }}>
                      {item.title}
                    </Card.Title>
                    {item.descriptionShort && (
                      <p className="small mb-2 flex-grow-1" style={{ color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {item.descriptionShort}
                      </p>
                    )}
                    {item.pubDate && (
                      <span className="small" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(item.pubDate)}
                      </span>
                    )}
                  </Card.Body>
                </Link>
                <Card.Footer className="border-0 bg-transparent pt-0">
                  <Link
                    to={`/airdrop/${encodeURIComponent(item.guid)}`}
                    state={{ airdrop: item }}
                    className="small text-decoration-none d-inline-flex align-items-center gap-1"
                    style={{ color: 'var(--cc-orange)' }}
                  >
                    Read on CoinsClarity <ExternalLink size={12} />
                  </Link>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
        <Row>
          <Col xs={12} className="mt-2">
            <TradeExchangesCard />
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default AirdropSection;
