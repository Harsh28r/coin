// src/components/pages/SearchPage.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { Container, Spinner, Alert, Card, Button, Row, Col, Badge, ButtonGroup, Placeholder } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import _ from 'lodash';
import { CircleDollarSign, Landmark, Newspaper, Layers, Image as ImageIcon } from 'lucide-react';

interface SearchResult {
  type: 'news' | 'coins' | 'exchanges' | 'nfts';
  title?: string;
  name?: string;
  description?: string;
  image_url?: string;
  image?: string;
  link?: string;
  exchangeUrl?: string;
  priceUsd?: string;
  symbol?: string;
  volumeUsd24Hr?: string;
  collection?: { slug: string };
}

const SearchPage: React.FC = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'coins' | 'exchanges' | 'news' | 'nfts'>('all');
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search).get('query') || '';

  const COINGECKO_API_BASE_URL = 'https://api.coingecko.com/api/v3';
  const OPENSEA_API_BASE_URL = 'https://api.opensea.io/api/v2';
  const POLYGON_API_BASE_URL = 'https://api.polygon.io/v2';
  const MOCK_API_BASE_URL = 'http://localhost:5000';
  const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY || 'your-openai-api-key';
  const OPENSEA_API_KEY = process.env.REACT_APP_OPENSEA_API_KEY || 'your-opensea-api-key';
  const POLYGON_API_KEY = process.env.REACT_APP_POLYGON_API_KEY || 'your-polygon-api-key';

  // Mock data fallback
  const mockResults: SearchResult[] = [
    {
      type: 'coins',
      name: 'Bitcoin',
      symbol: 'BTC',
      image: 'https://bitcoin.org/img/icons/logotop.svg',
      priceUsd: 'N/A',
      link: 'https://www.coingecko.com/en/coins/bitcoin',
    },
    {
      type: 'coins',
      name: 'BNB',
      symbol: 'BNB',
      image: 'https://binance.com/bnb-logo.png',
      priceUsd: 'N/A',
      link: 'https://www.coingecko.com/en/coins/bnb',
    },
    {
      type: 'exchanges',
      name: 'Binance',
      volumeUsd24Hr: '178935729599.40',
      image: 'https://binance.com/logo.png',
      exchangeUrl: 'https://www.binance.com',
    },
    {
      type: 'nfts',
      name: 'Bored Ape Yacht Club',
      collection: { slug: 'bored-ape-yacht-club' },
      image: 'https://opensea.io/bayc.jpg',
      link: 'https://opensea.io/collection/bored-ape-yacht-club',
    },
    {
      type: 'news',
      title: 'Binance Trade Volume',
      description: 'Binance offers competitive fees...',
      image: 'https://coinmarketcap.com/binance-article.jpg',
      link: 'https://coinmarketcap.com/exchanges/binance',
    },
  ];

  const fetchResults = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    setResults([]);

    const endpoints = [
      {
        type: 'coins' as const,
        url: `${COINGECKO_API_BASE_URL}/search`,
        params: { query },
        process: async (data: any) =>
          data.coins?.map((item: any) => ({
            type: 'coins' as const,
            name: item.name,
            symbol: item.symbol,
            image: item.large,
            priceUsd: 'N/A',
            link: `https://www.coingecko.com/en/coins/${item.id}`,
          })) || [],
      },
      {
        type: 'exchanges' as const,
        url: `${COINGECKO_API_BASE_URL}/exchanges`,
        params: {},
        process: async (data: any) =>
          data
            ?.filter((item: any) => item.name.toLowerCase().includes(query.toLowerCase()))
            ?.map((item: any) => ({
              type: 'exchanges' as const,
              name: item.name,
              volumeUsd24Hr: (item.trade_volume_24h_btc * 60000).toString(),
              image: item.image,
              exchangeUrl: item.url,
            })) || [],
      },
      {
        type: 'nfts' as const,
        url: `${OPENSEA_API_BASE_URL}/collections`,
        params: { search: query },
        headers: { 'X-API-KEY': OPENSEA_API_KEY },
        process: async (data: any) =>
          data.collections?.map((item: any) => ({
            type: 'nfts' as const,
            name: item.name,
            collection: { slug: item.slug },
            image: item.image_url,
            link: `https://opensea.io/collection/${item.slug}`,
          })) || [],
      },
      {
        type: 'news' as const,
        url: `${POLYGON_API_BASE_URL}/reference/news`,
        params: { keywords: query, apiKey: POLYGON_API_KEY }, // Changed to 'keywords'
        process: async (data: any) => {
          const articles = data.results?.slice(0, 5) || [];
          if (articles.length === 0) {
            console.log('No news articles found for query:', query);
            return mockResults.filter((item) => item.type === 'news' && item.title?.toLowerCase().includes(query.toLowerCase()));
          }
          const summaries = await Promise.all(
            articles.map(async (article: any) => {
              try {
                if (OPENAI_API_KEY === 'your-openai-api-key') {
                  console.warn('OpenAI API key missing, using raw description');
                  return {
                    type: 'news' as const,
                    title: article.title,
                    description: article.description?.substring(0, 100) + '...' || 'No description available',
                    image: article.image_url || 'https://placehold.co/300x200?text=News',
                    link: article.article_url,
                  };
                }
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                  },
                  body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                      {
                        role: 'user',
                        content: `Summarize this article in 50 words or less: ${article.description || article.title}`,
                      },
                    ],
                    max_tokens: 60,
                  }),
                });
                if (!response.ok) {
                  throw new Error(`OpenAI request failed: ${response.statusText}`);
                }
                const result = await response.json();
                return {
                  type: 'news' as const,
                  title: article.title,
                  description: result.choices[0]?.message?.content || article.description?.substring(0, 100) + '...' || 'No description available',
                  image: article.image_url || 'https://placehold.co/300x200?text=News',
                  link: article.article_url,
                };
              } catch (error) {
                console.error('OpenAI summarization error:', error);
                return {
                  type: 'news' as const,
                  title: article.title,
                  description: article.description?.substring(0, 100) + '...' || 'No description available',
                  image: article.image_url || 'https://placehold.co/300x200?text=News',
                  link: article.article_url,
                };
              }
            })
          );
          return summaries.filter((item): item is SearchResult => item !== null);
        },
      },
    ];

    try {
      const responses = await Promise.all(
        endpoints.map(async ({ type, url, params, headers, process }) => {
          try {
            const validParams = Object.fromEntries(
              Object.entries(params).filter(([_, value]) => value !== undefined) as [string, string][]
            );
            const response = await fetch(`${url}?${new URLSearchParams(validParams).toString()}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                ...headers,
              },
            });
            if (!response.ok) {
              throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            const data = await response.json();
            console.log(`Response for ${type}:`, data);
            return { type, results: await process(data) };
          } catch (error: any) {
            console.error(`Error fetching ${type} results:`, error);
            return {
              type,
              results: mockResults.filter((item) => item.type === type && (item.name || item.title)?.toLowerCase().includes(query.toLowerCase())),
              error: `Failed to fetch ${type} results`,
            };
          }
        })
      );

      const priority: Record<SearchResult['type'], number> = {
        coins: 1,
        exchanges: 2,
        news: 3,
        nfts: 4,
      };

      const allResults: SearchResult[] = responses
        .flatMap((response) => response.results)
        .sort((a: SearchResult, b: SearchResult) => {
          if (query.length <= 2) {
            return priority[a.type] - priority[b.type];
          }
          return 0;
        });

      const errors = responses.filter((response) => response.error).map((response) => response.error);

      if (allResults.length === 0 && errors.length > 0) {
        setError('No results found. Some searches failed: ' + errors.join(', '));
      } else if (allResults.length === 0) {
        setError('No results found for your query.');
      } else {
        setResults(allResults);
      }
    } catch (error: any) {
      console.error('Error during unified search:', error);
      setError('An error occurred while searching. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults(query);
  }, [query]);

  const filteredResults = useMemo(() => {
    if (filter === 'all') return results;
    return results.filter((r) => r.type === filter);
  }, [results, filter]);

  const compactCurrency = (value: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 }).format(value);

  const renderTypeBadge = (type: SearchResult['type']) => {
    const map: Record<SearchResult['type'], { variant: string; label: string; Icon: any }> = {
      coins: { variant: 'warning', label: 'Coin', Icon: CircleDollarSign },
      exchanges: { variant: 'info', label: 'Exchange', Icon: Landmark },
      news: { variant: 'secondary', label: 'News', Icon: Newspaper },
      nfts: { variant: 'primary', label: 'NFT', Icon: Layers },
    };
    const cfg = map[type];
    const IconComp = cfg.Icon;
    return (
      <Badge bg={cfg.variant} className="d-inline-flex align-items-center gap-1" style={{ fontWeight: 600 }}>
        <IconComp size={14} /> {cfg.label}
      </Badge>
    );
  };

  const handleInternalNavigate = (item: SearchResult) => {
    if (item.type === 'coins') {
      navigate(`/search?query=${encodeURIComponent(item.name || item.symbol || '')}`);
      return;
    }
    if (item.type === 'exchanges') {
      navigate(`/search?query=${encodeURIComponent(item.name || '')}`);
      return;
    }
    if (item.type === 'nfts') {
      navigate(`/search?query=${encodeURIComponent(item.collection?.slug || item.name || '')}`);
      return;
    }
    // news: route to in-app search using title keywords to keep SPA
    navigate(`/search?query=${encodeURIComponent(item.title || '')}`);
  };

  const renderCard = (item: SearchResult, index: number) => {
    return (
      <Col key={`${item.type}-${index}`} xs={12} sm={6} md={4} lg={3} className="d-flex">
        <Card className="mb-3 shadow-sm border-0 rounded-4 flex-fill" style={{ overflow: 'hidden', cursor: 'pointer' }} onClick={() => handleInternalNavigate(item)}>
          <div style={{ position: 'relative', paddingTop: '56%', backgroundColor: '#f8f9fa' }}>
            {item.image_url || item.image ? (
              <img
                src={item.image_url || item.image || ''}
                alt={item.name || item.title || 'Untitled'}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.onerror = null;
                  img.src = 'https://placehold.co/600x400?text=Image';
                }}
              />
            ) : (
              <div className="d-flex align-items-center justify-content-center text-muted" style={{ position: 'absolute', inset: 0 }}>
                <ImageIcon size={24} className="me-2" /> No image
              </div>
            )}
            <div style={{ position: 'absolute', top: 8, left: 8 }}>{renderTypeBadge(item.type)}</div>
          </div>
          <Card.Body className="d-flex flex-column">
            <Card.Title className="fs-6 fw-bold" style={{ minHeight: '2.5rem' }}>
              {item.name || item.title || 'Untitled'}
            </Card.Title>
            <Card.Text className="text-muted" style={{ flexGrow: 1 }}>
              {item.type === 'coins' && (
                <>
                  <div>Symbol: <strong>{item.symbol || 'N/A'}</strong></div>
                  <div>Price: <strong>{item.priceUsd && item.priceUsd !== 'N/A' ? `$${item.priceUsd}` : 'N/A'}</strong></div>
                </>
              )}
              {item.type === 'exchanges' && (
                <>
                  <div>
                    24h Volume: <strong>{item.volumeUsd24Hr ? compactCurrency(parseFloat(item.volumeUsd24Hr)) : 'N/A'}</strong>
                  </div>
                  <div className="text-truncate" title={item.exchangeUrl || ''}>{item.exchangeUrl || ''}</div>
                </>
              )}
              {item.type === 'nfts' && (
                <>
                  <div>Collection: <strong>{item.collection?.slug || 'Unknown'}</strong></div>
                </>
              )}
              {item.type === 'news' && (
                <>
                  <div className="text-truncate" title={item.description || ''}>{item.description || 'No description available'}</div>
                </>
              )}
            </Card.Text>
            <div className="d-flex">
              <Button
                variant="outline-dark"
                className="w-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleInternalNavigate(item);
                }}
              >
                View Details
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Col>
    );
  };

  const renderResults = () => {
    if (loading) {
      return (
        <Container className="my-4">
          <Row className="g-3">
            {Array.from({ length: 8 }).map((_, idx) => (
              <Col key={idx} xs={12} sm={6} md={4} lg={3}>
                <Card className="shadow-sm border-0 rounded-4">
                  <Placeholder as={Card.Img} variant="top" style={{ height: 160 }} />
                  <Card.Body>
                    <Placeholder as={Card.Title} animation="glow">
                      <Placeholder xs={8} />
                    </Placeholder>
                    <Placeholder as={Card.Text} animation="glow">
                      <Placeholder xs={6} /> <Placeholder xs={4} />
                    </Placeholder>
                    <Placeholder.Button variant="secondary" xs={6} />
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      );
    }
    if (error) {
      return <Alert variant="danger" className="my-4">{error}</Alert>;
    }
    if (results.length === 0) {
      return (
        <div className="my-5 text-center">
          <div className="mb-2">
            <img src="/logo2.png" alt="Logo" style={{ height: 40, opacity: 0.6 }} />
          </div>
          <h5 className="fw-bold mb-2">No results found</h5>
          <div className="text-muted">We couldn't find anything for "{query}". Try different keywords.</div>
        </div>
      );
    }

    return (
      <Container className="my-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
          <h5 className="m-0">Search Results for "{query}"</h5>
          <div className="d-flex align-items-center gap-2">
            <small className="text-muted">{filteredResults.length} of {results.length}</small>
            <ButtonGroup>
              {(['all','coins','exchanges','news','nfts'] as const).map((t) => (
                <Button key={t} variant={filter === t ? 'dark' : 'outline-secondary'} size="sm" onClick={() => setFilter(t)}>
                  {t.toUpperCase()}
                </Button>
              ))}
            </ButtonGroup>
          </div>
        </div>
        <Row className="g-3">
          {filteredResults.map((item, index) => renderCard(item, index))}
        </Row>
      </Container>
    );
  };

  return (
    <Container className="my-5">
      <h2>Search</h2>
      {renderResults()}
    </Container>
  );
};

export default SearchPage;