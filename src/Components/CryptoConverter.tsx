import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, InputGroup } from 'react-bootstrap';
import { ArrowLeftRight, Calculator, TrendingUp } from 'lucide-react';

interface Coin {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
}

const CryptoConverter: React.FC = () => {
  const [amount, setAmount] = useState<number>(1);
  const [fromCoin, setFromCoin] = useState<string>('bitcoin');
  const [toCoin, setToCoin] = useState<string>('ethereum');
  const [coins, setCoins] = useState<Coin[]>([]);
  const [result, setResult] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const MOCK_COINS: Coin[] = [
    { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 67500 },
    { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 3450 },
    { id: 'tether', symbol: 'usdt', name: 'Tether', current_price: 1 },
    { id: 'binancecoin', symbol: 'bnb', name: 'BNB', current_price: 585 },
    { id: 'solana', symbol: 'sol', name: 'Solana', current_price: 178 },
    { id: 'usd-coin', symbol: 'usdc', name: 'USDC', current_price: 1 },
    { id: 'ripple', symbol: 'xrp', name: 'XRP', current_price: 0.52 },
    { id: 'cardano', symbol: 'ada', name: 'Cardano', current_price: 0.48 },
    { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', current_price: 0.14 },
    { id: 'avalanche-2', symbol: 'avax', name: 'Avalanche', current_price: 38 },
    { id: 'chainlink', symbol: 'link', name: 'Chainlink', current_price: 18 },
    { id: 'polkadot', symbol: 'dot', name: 'Polkadot', current_price: 8 },
    { id: 'litecoin', symbol: 'ltc', name: 'Litecoin', current_price: 70 },
    { id: 'polygon', symbol: 'matic', name: 'Polygon', current_price: 0.42 },
    { id: 'uniswap', symbol: 'uni', name: 'Uniswap', current_price: 12 },
    { id: 'stellar', symbol: 'xlm', name: 'Stellar', current_price: 0.11 },
    { id: 'cosmos', symbol: 'atom', name: 'Cosmos', current_price: 9 },
    { id: 'monero', symbol: 'xmr', name: 'Monero', current_price: 165 },
    { id: 'ethereum-classic', symbol: 'etc', name: 'Ethereum Classic', current_price: 28 },
    { id: 'internet-computer', symbol: 'icp', name: 'Internet Computer', current_price: 12 },
  ];

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false'
        );
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length) setCoins(data);
          else setCoins(MOCK_COINS);
        } else {
          setCoins(MOCK_COINS);
        }
      } catch {
        setCoins(MOCK_COINS);
      } finally {
        setLoading(false);
      }
    };

    fetchCoins();
  }, []);

  useEffect(() => {
    if (coins.length > 0) {
      const from = coins.find(c => c.id === fromCoin);
      const to = coins.find(c => c.id === toCoin);
      
      if (from && to && from.current_price > 0 && to.current_price > 0) {
        const converted = (amount * from.current_price) / to.current_price;
        setResult(converted);
      } else {
        setResult(0);
      }
    } else {
      setResult(0);
    }
  }, [amount, fromCoin, toCoin, coins]);

  const fromCoinData = coins.find(c => c.id === fromCoin);
  const toCoinData = coins.find(c => c.id === toCoin);

  // Set default coins if not found
  useEffect(() => {
    if (coins.length > 0 && (!fromCoinData || !toCoinData)) {
      if (!fromCoinData) setFromCoin(coins[0]?.id || 'bitcoin');
      if (!toCoinData) setToCoin(coins[1]?.id || 'ethereum');
    }
  }, [coins, fromCoinData, toCoinData]);

  if (loading) {
    return (
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '3rem 20px' }}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p style={{ color: '#64748b', marginTop: '1rem' }}>Loading converter...</p>
        </div>
      </section>
    );
  }

  return (
    <section style={{ maxWidth: 1280, margin: '0 auto', padding: '3rem 20px', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', borderRadius: '20px' }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #f97316, #fb923c)', marginBottom: 16 }}>
          <Calculator size={28} color="#fff" />
        </div>
        <h2 style={{ color: '#1e293b', fontWeight: 800, fontSize: '1.75rem', marginBottom: 8 }}>
          Crypto Converter
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Instantly convert between cryptocurrencies
        </p>
      </div>

      <Card className="border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <Card.Body style={{ padding: '2rem' }}>
          <Row className="align-items-center g-4">
            <Col md={5}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '8px', display: 'block' }}>
                  From
                </label>
                <InputGroup style={{ marginBottom: '1rem' }}>
                  <Form.Control
                    type="number"
                    min="0"
                    step="any"
                    value={amount}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setAmount(isNaN(val) || val < 0 ? 0 : val);
                    }}
                    style={{
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px 0 0 12px',
                      padding: '14px 18px',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                    }}
                  />
                  <Form.Select
                    value={fromCoin}
                    onChange={(e) => setFromCoin(e.target.value)}
                    style={{
                      border: '2px solid #e2e8f0',
                      borderLeft: 'none',
                      borderRadius: '0 12px 12px 0',
                      padding: '14px',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                    }}
                  >
                    {coins.length > 0 ? (
                      coins.map(coin => (
                        <option key={coin.id} value={coin.id}>
                          {coin.symbol.toUpperCase()} - {coin.name}
                        </option>
                      ))
                    ) : (
                      <option value="bitcoin">BTC - Bitcoin</option>
                    )}
                  </Form.Select>
                </InputGroup>
                {fromCoinData && fromCoinData.current_price > 0 && (
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    ≈ ${fromCoinData.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                )}
              </div>
            </Col>

            <Col md={2} className="text-center">
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f97316, #fb923c)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'rotate(180deg) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
              }}
              onClick={() => {
                const temp = fromCoin;
                setFromCoin(toCoin);
                setToCoin(temp);
                // Also swap the amount with the result
                if (result > 0) {
                  setAmount(result);
                }
              }}
              >
                <ArrowLeftRight size={20} />
              </div>
            </Col>

            <Col md={5}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '8px', display: 'block' }}>
                  To
                </label>
                <InputGroup style={{ marginBottom: '1rem' }}>
                  <Form.Control
                    type="text"
                    value={result.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                    readOnly
                    style={{
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px 0 0 12px',
                      padding: '14px 18px',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      background: '#f8fafc',
                    }}
                  />
                  <Form.Select
                    value={toCoin}
                    onChange={(e) => setToCoin(e.target.value)}
                    style={{
                      border: '2px solid #e2e8f0',
                      borderLeft: 'none',
                      borderRadius: '0 12px 12px 0',
                      padding: '14px',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                    }}
                  >
                    {coins.length > 0 ? (
                      coins.map(coin => (
                        <option key={coin.id} value={coin.id}>
                          {coin.symbol.toUpperCase()} - {coin.name}
                        </option>
                      ))
                    ) : (
                      <option value="ethereum">ETH - Ethereum</option>
                    )}
                  </Form.Select>
                </InputGroup>
                {toCoinData && toCoinData.current_price > 0 && result > 0 && (
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    ≈ ${(result * toCoinData.current_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                )}
              </div>
            </Col>
          </Row>

          {fromCoinData && toCoinData && fromCoinData.current_price > 0 && toCoinData.current_price > 0 && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              borderRadius: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: 600 }}>
                1 {fromCoinData.symbol.toUpperCase()} = {(fromCoinData.current_price / toCoinData.current_price).toLocaleString(undefined, { maximumFractionDigits: 8 })} {toCoinData.symbol.toUpperCase()}
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    </section>
  );
};

export default CryptoConverter;

