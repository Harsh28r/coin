import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Button } from 'react-bootstrap';
import { ArrowLeft, Calendar, Gift } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import CoinsNavbar from '../Components/navbar';
import Footer from '../Components/footer';
import type { AirdropItem } from '../Components/AirdropSection';
import TradeExchangesCard from '../Components/TradeExchangesCard';
import { getCryptoFallbackImage, handleImageError } from '../utils/cryptoImages';

const RSS_API = 'https://api.rss2json.com/v1/api.json';
const AIRDROP_FEED_URL = 'https://airdropalert.com/feed/rssfeed';

/** Basic sanitize: remove script/iframe/on* and javascript: to avoid XSS. */
function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript:\s*/gi, '');
}

function formatDate(raw: string): string {
  if (!raw) return '';
  try {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? raw : d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return raw;
  }
}

const AirdropDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const stateAirdrop = (location.state as { airdrop?: AirdropItem })?.airdrop;

  const [item, setItem] = useState<AirdropItem | null>(stateAirdrop || null);
  const [loading, setLoading] = useState(!stateAirdrop);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (stateAirdrop && stateAirdrop.guid === id) {
      setItem(stateAirdrop);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const guid = decodeURIComponent(id || '');
    const fetchByGuid = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${RSS_API}?rss_url=${encodeURIComponent(AIRDROP_FEED_URL)}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
        if (!res.ok) throw new Error('Feed failed');
        const data = await res.json();
        if (cancelled) return;
        if (data.status !== 'ok' || !Array.isArray(data.items)) {
          setError('Airdrop not found.');
          setItem(null);
          return;
        }
        const found = data.items.find((it: any) => (it.guid || '').toString() === guid);
        if (!found) {
          setError('Airdrop not found.');
          setItem(null);
          return;
        }
        const rawDesc = found.description || found.content || '';
        let imgSrc = found.thumbnail || (rawDesc.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] || '');
        if (imgSrc && !/^https?:\/\//i.test(imgSrc))
          imgSrc = imgSrc.startsWith('//') ? 'https:' + imgSrc : 'https://airdropalert.com' + (imgSrc.startsWith('/') ? imgSrc : '/' + imgSrc);
        setItem({
          guid: found.guid,
          title: found.title || 'Airdrop',
          link: found.link || '#',
          pubDate: found.pubDate || '',
          description: rawDesc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
          descriptionShort: '',
          imageUrl: imgSrc,
          contentHtml: rawDesc,
        });
      } catch (e) {
        if (!cancelled) {
          setError('Failed to load airdrop.');
          setItem(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchByGuid();
    return () => { cancelled = true; };
  }, [id, stateAirdrop]);

  const displayItem = item;
  const imageUrl = displayItem?.imageUrl || getCryptoFallbackImage(displayItem?.title, 'airdrop');

  if (loading) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        <CoinsNavbar />
        <Container className="py-5">
          <div className="d-flex align-items-center justify-content-center py-5">
            <div className="spinner-border text-warning" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </Container>
        <Footer />
      </div>
    );
  }

  if (error || !displayItem) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        <CoinsNavbar />
        <Container className="py-5">
          <Button variant="outline-secondary" className="mb-3" onClick={() => navigate(-1)}>
            <ArrowLeft className="me-2" size={16} /> Back
          </Button>
          <div className="text-center py-5">
            <h2 className="h4 mb-2" style={{ color: 'var(--text)' }}>Airdrop not found</h2>
            <p className="text-muted mb-3">{error || 'This airdrop may have been removed.'}</p>
            <Button variant="primary" style={{ backgroundColor: 'var(--cc-orange)', border: 'none' }} onClick={() => navigate('/')}>
              Go to home
            </Button>
          </div>
        </Container>
        <Footer />
      </div>
    );
  }

  return (
    <div className="airdrop-detail-page" style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <CoinsNavbar />
      <Helmet>
        <title>{displayItem.title} | Airdrop | CoinsClarity</title>
        <meta name="description" content={(displayItem.description || displayItem.title).slice(0, 160)} />
        <link rel="canonical" href={window.location.href} />
        <meta property="og:title" content={`${displayItem.title} | CoinsClarity`} />
        <meta property="og:description" content={displayItem.description?.slice(0, 200) || displayItem.title} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:url" content={window.location.href} />
      </Helmet>
      <Container className="py-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="airdrop-detail-back btn btn-link text-decoration-none p-0 mb-4 d-inline-flex align-items-center gap-2"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={18} /> Back
        </button>

        <article className="airdrop-detail-article">
          <header className="airdrop-detail-header mb-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="airdrop-detail-badge d-inline-flex align-items-center gap-2 px-2 py-1 rounded">
                <Gift size={16} />
                <span className="small text-uppercase fw-semibold">Airdrop</span>
              </span>
              <span className="airdrop-detail-date d-flex align-items-center gap-1 small">
                <Calendar size={14} /> {formatDate(displayItem.pubDate)}
              </span>
            </div>
            <h1 className="airdrop-detail-title mb-0">
              {displayItem.title}
            </h1>
          </header>

          {imageUrl && (
            <div className="airdrop-detail-hero mb-4 rounded-3 overflow-hidden shadow-sm">
              <img
                src={imageUrl}
                alt=""
                className="w-100"
                style={{ objectFit: 'cover', maxHeight: 380 }}
                onError={(e) => handleImageError(e, displayItem.title, 'airdrop')}
              />
            </div>
          )}

          <div
            className="airdrop-detail-content"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(displayItem.contentHtml || '') }}
          />

          <div className="mt-4 pt-4" style={{ maxWidth: 720, margin: '0 auto' }}>
            <TradeExchangesCard />
          </div>
        </article>
      </Container>
      <Footer />
    </div>
  );
};

export default AirdropDetail;
