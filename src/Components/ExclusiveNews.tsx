// src/components/ExclusiveNews.tsx
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'; // Import skeleton CSS
import { useLanguage } from '../context/LanguageContext';
import { useNewsTranslation } from '../hooks/useNewsTranslation';

interface NewsItem {
  article_id?: string;
  title: string;
  description: string;
  creator: string[];
  pubDate: string;
  image_url: string;
  link: string;
}

// Utility function to decode HTML entities
const decodeHtml = (html: string): string => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

const ExclusiveNews: React.FC = () => {
  const { t } = useLanguage();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Initialize as true
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Use the translation hook
  const { displayItems, isTranslating, currentLanguage } = useNewsTranslation(newsItems);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-1.onrender.com';
  const MOCK_API_BASE_URL = 'http://localhost:5000'; // For db.json

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Try fetching from db.json first
        try {
          const response = await fetch(`${MOCK_API_BASE_URL}/news`);
          if (!response.ok) {
            throw new Error(`db.json fetch failed: ${response.status} ${response.statusText}`);
          }
          const data = await response.json();
          const formattedNews = data.map((item: any) => ({
            title: item.title || 'Untitled',
            description: item.description || 'No description available',
            creator: [item.author || 'Unknown'],
            pubDate: item.pubDate || new Date().toISOString(),
            image_url: item.image || 'https://via.placeholder.com/300x200?text=No+Image',
            link: item.link || '#',
          }));
          setNewsItems(formattedNews.slice(0, 6));
          console.log('Fetched news from db.json:', formattedNews);
          setIsLoading(false);
          return;
        } catch (error) {
          console.warn('Failed to fetch from db.json, falling back to API:', error);
        }

        // Fetch from /fetch-rss
        const response = await fetch(`${API_BASE_URL}/fetch-decrypt-rss`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (Array.isArray(data.data)) {
          setNewsItems(data.data.slice(0, 6));
          console.log('Fetched news from API:', data.data);
        } else {
          throw new Error('Fetched data is not an array');
        }
      } catch (error: any) {
        console.error('Error fetching news:', error);
        // Fallback to sample news data for demonstration
        const sampleNews = [
          {
            title: 'Bitcoin Reaches New All-Time High as Institutional Adoption Grows',
            description: 'Bitcoin has surged to unprecedented levels, driven by increasing institutional investment and growing mainstream acceptance of cryptocurrency as a legitimate asset class.',
            creator: ['Crypto Analyst'],
            pubDate: new Date().toISOString(),
            image_url: '/image.png?height=300&width=200&text=Bitcoin',
            link: '#',
          },
          {
            title: 'Ethereum 2.0 Upgrade Shows Promising Results for DeFi Ecosystem',
            description: 'The transition to proof-of-stake consensus mechanism is demonstrating improved scalability and reduced energy consumption, benefiting the entire DeFi ecosystem.',
            creator: ['Blockchain Reporter'],
            pubDate: new Date(Date.now() - 86400000).toISOString(),
            image_url: '/tr3.png?height=300&width=200&text=Ethereum',
            link: '#',
          },
          {
            title: 'NFT Market Sees Explosive Growth with Major Brands Entering Space',
            description: 'Traditional companies are increasingly adopting NFT technology, creating new opportunities for digital collectibles and blockchain-based loyalty programs.',
            creator: ['Digital Asset Expert'],
            pubDate: new Date(Date.now() - 172800000).toISOString(),
            image_url: '/web3.png?height=300&width=200&text=NFT',
            link: '#',
          },
          {
            title: 'DeFi Protocols Continue Innovation with Cross-Chain Solutions',
            description: 'Decentralized finance platforms are developing interoperability solutions that allow users to access services across multiple blockchain networks seamlessly.',
            creator: ['DeFi Researcher'],
            pubDate: new Date(Date.now() - 259200000).toISOString(),
            image_url: '/web3_1.png?height=300&width=200&text=DeFi',
            link: '#',
          }
        ];
        setNewsItems(sampleNews);
        console.log('Using sample news data for demonstration');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, []);

  // Fallback image URLs for different cards
  const getFallbackImage = (index: number): string => {
    const images = [
      '/image.png?height=300&width=200&text=Bitcoin',
      '/tr3.png?height=300&width=200&text=Ethereum',
      '/web3.png?height=300&width=200&text=Crypto',
      '/web3_1.png?height=300&width=200&text=Blockchain',
      '/web3_2.png?height=300&width=200&text=DeFi',
      '/web3_3.png?height=300&width=200&text=NFT'
    ];
    return images[index % images.length];
  };

  // Format date consistently
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Unknown Date';
    }
  };

  return (
    <Container fluid className="mt-5 skeleton-container" style={{ width: '92%' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="m-0" style={{ fontWeight: 'bold', letterSpacing: '0.05em' }}>
            {t('news.exclusiveTitle')}
          </h4>
          {isTranslating && (
            <small className="text-muted">
              🔄 Translating news content to {currentLanguage === 'hi' ? 'Hindi' : 
                currentLanguage === 'es' ? 'Spanish' :
                currentLanguage === 'fr' ? 'French' :
                currentLanguage === 'de' ? 'German' :
                currentLanguage === 'zh' ? 'Chinese' :
                currentLanguage === 'ja' ? 'Japanese' :
                currentLanguage === 'ko' ? 'Korean' :
                currentLanguage === 'ar' ? 'Arabic' : currentLanguage}...
            </small>
          )}
        </div>
        <Button
          variant="link"
          className="text-warning text-decoration-none"
          onClick={() => navigate('/exclusive-news')}
          aria-label="View all news"
        >
          {t('news.viewAll')}
          <ChevronRight className="ms-2" size={16} />
        </Button>
      </div>

      {error && <p className="text-danger">{error}</p>}
             {isLoading ? (
                  <Row xs={1} md={2} lg={3} className="g-4">
           {Array.from({ length: 6 }).map((_, index) => (
                         <Col key={index}>
               <Card className="h-100 border-0 shadow-sm rounded-4">
                 <img 
                   src={getFallbackImage(index)} 
                   alt={`Loading card ${index + 1}`}
                   className="img-fluid rounded-4"
                   style={{ height: '200px', width: '100%', objectFit: 'cover' }}
                 />
                <Card.Body className="d-flex flex-column">
                  <Skeleton width="80%" height={20} baseColor="#e0e0e0" highlightColor="#f5f5f5" />
                  <Skeleton count={2} width="90%" height={16} baseColor="#e0e0e0" highlightColor="#f5f5f5" className="mt-2" />
                  <div className="mt-auto d-flex justify-content-between">
                    <Skeleton width={100} height={14} baseColor="#e0e0e0" highlightColor="#f5f5f5" />
                    <Skeleton width={80} height={14} baseColor="#e0e0e0" highlightColor="#f5f5f5" />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : displayItems.length === 0 && !error ? (
        <p>No news available.</p>
      ) : (
                 <Row xs={1} md={2} lg={4} className="g-4">
           {displayItems.slice(0, 4).map((item, index) => (
            <Col key={item.link}>
              <Card className="h-100 border-0 shadow-sm rounded-4">
                                 <Card.Img
                   variant="top"
                   className="rounded-4"
                   src={item.image_url || getFallbackImage(index)}
                   alt={item.title}
                   onError={(e) => {
                     e.currentTarget.src = getFallbackImage(index);
                   }}
                 />
                <Card.Body className="d-flex flex-column">
                  <Card.Title
                    className="fs-6 mb-3 text-start custom-text"
                    style={{
                      fontWeight: 'bold',
                      color: 'black',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 2,
                      maxHeight: '3em',
                    }}
                  >
                                         <a
                       href={`/news/${item.article_id || encodeURIComponent(item.title)}`}
                       className="text-black text-decoration-none"
                       aria-label={item.title}
                       style={{ cursor: 'pointer' }}
                     >
                       {decodeHtml(item.title)}
                     </a>
                  </Card.Title>
                  <Card.Text
                    className="text-muted small flex-grow-1 text-start custom-text fs-7"
                    style={{
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 2,
                      maxHeight: '3em',
                    }}
                  >
                    {decodeHtml(item.description)}
                  </Card.Text>
                  <div className="mt-auto d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-muted">By </small>
                      <small className="text-warning">
                        {item.creator?.[0] || 'Unknown Author'}
                      </small>
                    </div>
                    <div className="ms-auto text-end">
                      <small className="text-muted">{formatDate(item.pubDate)}</small>
                    </div>
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

export default ExclusiveNews;