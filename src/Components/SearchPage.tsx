// src/components/pages/SearchPage.tsx
import React, { useState, useEffect } from 'react';
import { Container, Spinner, Alert, Card, Button } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import _ from 'lodash';

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
  const location = useLocation();
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

  const renderResults = () => {
    if (loading) {
      return (
        <div className="text-center my-4">
          <Spinner animation="border" variant="primary" />
        </div>
      );
    }
    if (error) {
      return <Alert variant="danger" className="my-4">{error}</Alert>;
    }
    if (results.length === 0) {
      return <Alert variant="info" className="my-4">No results found for "{query}".</Alert>;
    }

    return (
      <Container className="my-4">
        <h5>Search Results for "{query}"</h5>
        <div className="d-flex flex-wrap gap-3">
          {results.map((item, index) => (
            <Card key={`${item.type}-${index}`} style={{ width: '18rem' }}>
              <Card.Img
                variant="top"
                src={item.image_url || item.image || 'https://placehold.co/300x200?text=Image'}
                alt={item.name || item.title || 'Untitled'}
              />
              <Card.Body>
                <Card.Title>
                  {item.name || item.title || 'Untitled'} <small>({item.type})</small>
                </Card.Title>
                <Card.Text>
                  {item.type === 'coins'
                    ? `Price: $${item.priceUsd || 'N/A'} | Symbol: ${item.symbol || 'N/A'}`
                    : item.type === 'exchanges'
                    ? `Volume (24h): $${parseFloat(item.volumeUsd24Hr || '0').toFixed(2)}`
                    : item.type === 'nfts'
                    ? `Collection: ${item.collection?.slug || 'Unknown'}`
                    : item.description?.substring(0, 100) + '...' || 'No description available'}
                </Card.Text>
                {(item.link || item.exchangeUrl) && (
                  <Button variant="primary" href={item.link || item.exchangeUrl} target="_blank">
                    View Details
                  </Button>
                )}
              </Card.Body>
            </Card>
          ))}
        </div>
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