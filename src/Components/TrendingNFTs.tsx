import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { Image, TrendingUp, Eye, Zap } from 'lucide-react';

interface NFTCollection {
  id: string;
  name: string;
  image_url: string;
  floor_price_usd?: number;
  floor_price_native?: number;
  native_currency?: string;
  volume_24h_usd?: number;
  volume_7d_usd?: number;
  floor_price_change_24h?: number;
  number_of_unique_addresses?: number;
  number_of_owners?: number;
  total_quantity?: number;
}

const TrendingNFTs: React.FC = () => {
  const [nftCollections, setNftCollections] = useState<NFTCollection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingNFTs = async () => {
      try {
        setLoading(true);
        // Try CoinGecko NFT API
        const response = await fetch(
          'https://api.coingecko.com/api/v3/nfts/list?per_page=20&page=1'
        );
        
        if (response.ok) {
          const data = await response.json();
          
          // Fetch detailed info for each collection
          const collectionIds = data.slice(0, 8).map((nft: any) => nft.id).join(',');
          const detailsResponse = await fetch(
            `https://api.coingecko.com/api/v3/nfts/${collectionIds}`
          );
          
          if (detailsResponse.ok) {
            const detailsData = await detailsResponse.json();
            const formatted = Array.isArray(detailsData) ? detailsData : [detailsData];
            
            setNftCollections(formatted.slice(0, 8).map((nft: any) => ({
              id: nft.id || nft.identifier || '',
              name: nft.name || nft.collection || 'Unnamed Collection',
              image_url: nft.image?.small || nft.image_url || '/image.png?height=300&width=300&text=NFT',
              floor_price_usd: nft.floor_price?.usd || 0,
              floor_price_native: nft.floor_price?.native_currency || 0,
              native_currency: nft.native_currency || 'ETH',
              volume_24h_usd: nft.volume_24h?.usd || 0,
              volume_7d_usd: nft.volume_7d?.usd || 0,
              floor_price_change_24h: nft.floor_price_in_usd_24h_percentage_change || 0,
              number_of_unique_addresses: nft.number_of_unique_addresses || 0,
              number_of_owners: nft.number_of_owners || 0,
              total_quantity: nft.total_quantity || 0,
            })));
          } else {
            // Fallback: use basic data
            setNftCollections(data.slice(0, 8).map((nft: any) => ({
              id: nft.id || nft.identifier || '',
              name: nft.name || nft.collection || 'Unnamed Collection',
              image_url: nft.image?.small || '/image.png?height=300&width=300&text=NFT',
              floor_price_usd: 0,
              floor_price_native: 0,
              native_currency: 'ETH',
              volume_24h_usd: 0,
              volume_7d_usd: 0,
              floor_price_change_24h: 0,
              number_of_unique_addresses: 0,
              number_of_owners: 0,
              total_quantity: 0,
            })));
          }
        } else {
          // Fallback collections
          setNftCollections([
            {
              id: 'bored-ape-yacht-club',
              name: 'Bored Ape Yacht Club',
              image_url: '/image.png?height=300&width=300&text=BAYC',
              floor_price_usd: 0,
              native_currency: 'ETH',
            },
            {
              id: 'cryptopunks',
              name: 'CryptoPunks',
              image_url: '/image.png?height=300&width=300&text=Punks',
              floor_price_usd: 0,
              native_currency: 'ETH',
            },
          ]);
        }
      } catch (error) {
        console.error('Error fetching NFTs:', error);
        // Fallback
        setNftCollections([
          {
            id: 'bored-ape-yacht-club',
            name: 'Bored Ape Yacht Club',
            image_url: '/image.png?height=300&width=300&text=BAYC',
            floor_price_usd: 0,
            native_currency: 'ETH',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingNFTs();
    const interval = setInterval(fetchTrendingNFTs, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) => {
    if (price === 0) return '—';
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatVolume = (volume: number) => {
    if (volume === 0) return '—';
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
    return `$${volume.toLocaleString()}`;
  };

  if (loading && nftCollections.length === 0) {
    return (
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '3rem 20px' }}>
        <div className="text-center">
          <p style={{ color: '#94a3b8' }}>Loading NFT collections...</p>
        </div>
      </section>
    );
  }

  return (
    <section style={{ maxWidth: 1280, margin: '0 auto', padding: '3rem 20px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h2 style={{ color: '#1e293b', fontWeight: 800, fontSize: '1.75rem', margin: 0 }}>
            Trending NFT Collections
          </h2>
          <Badge bg="primary" style={{ fontSize: '0.75rem', padding: '6px 12px', background: '#8b5cf6', border: 'none' }}>
            <Zap size={12} className="me-1" />
            Live Data
          </Badge>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
          Top NFT collections by volume and floor price
        </p>
      </div>

      <Row className="g-4">
        {nftCollections.map((nft, index) => {
          const isPositive = nft.floor_price_change_24h !== undefined && nft.floor_price_change_24h >= 0;
          const changeColor = isPositive ? '#10b981' : '#ef4444';
          
          return (
            <Col key={nft.id || index} xs={12} sm={6} md={4} lg={3}>
              <Card
                className="h-100 border-0 shadow-sm"
                style={{
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.15)';
                  e.currentTarget.style.borderColor = '#8b5cf6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
                onClick={() => window.open(`https://opensea.io/collection/${nft.id}`, '_blank')}
              >
                <div style={{ position: 'relative', width: '100%', paddingTop: '100%', background: '#f1f5f9', overflow: 'hidden' }}>
                  <img
                    src={nft.image_url}
                    alt={nft.name}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/image.png?height=300&width=300&text=NFT';
                    }}
                  />
                  {nft.floor_price_change_24h !== undefined && nft.floor_price_change_24h !== 0 && (
                    <Badge
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: isPositive ? '#10b981' : '#ef4444',
                        border: 'none',
                        fontSize: '0.7rem',
                        padding: '4px 8px',
                        fontWeight: 700,
                      }}
                    >
                      {isPositive ? '+' : ''}{nft.floor_price_change_24h.toFixed(2)}%
                    </Badge>
                  )}
                </div>
                
                <Card.Body style={{ padding: '1.25rem' }}>
                  <h5 style={{ 
                    fontSize: '1rem', 
                    fontWeight: 700, 
                    color: '#1e293b',
                    marginBottom: '0.75rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {nft.name}
                  </h5>

                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px', fontWeight: 500 }}>
                      Floor Price
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                      {formatPrice(nft.floor_price_usd || 0)}
                    </div>
                    {nft.floor_price_native && nft.floor_price_native > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                        {nft.floor_price_native.toFixed(4)} {nft.native_currency}
                      </div>
                    )}
                  </div>

                  <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '0.8rem' }}>
                    {nft.volume_24h_usd !== undefined && nft.volume_24h_usd > 0 && (
                      <div>
                        <div style={{ color: '#64748b', fontSize: '0.7rem' }}>24h Volume</div>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>
                          {formatVolume(nft.volume_24h_usd)}
                        </div>
                      </div>
                    )}
                    {nft.number_of_owners !== undefined && nft.number_of_owners > 0 && (
                      <div className="text-end">
                        <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Owners</div>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>
                          {nft.number_of_owners.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {nftCollections.length === 0 && !loading && (
        <div className="text-center py-5">
          <Image size={48} color="#94a3b8" className="mb-3" />
          <p style={{ color: '#94a3b8' }}>Unable to load NFT collections at the moment.</p>
        </div>
      )}
    </section>
  );
};

export default TrendingNFTs;

