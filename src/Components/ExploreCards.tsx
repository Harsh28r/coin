import React, { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Card, Nav, Button, Carousel, Badge, ProgressBar, Form, Alert, InputGroup } from 'react-bootstrap';
import { ChevronLeft, ChevronRight, Sparkles, Zap, Brain, Lightbulb, Target, Trophy, Star, Heart, Share2, Bookmark, Eye } from 'lucide-react';
import QuizSection from './QuizSection';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import './ExploreCards.css';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useNewsTranslation } from '../hooks/useNewsTranslation';

interface TrendingNewsItem {
  article_id?: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  image: string;
}

interface ExploreCard {
  id?: number;
  article_id?: string;
  image: string;
  text: string;
  title?: string;
  link?: string;
  source?: string;
  content?: string;
}

const ExploreSection: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('did-you-know');
  const scrollableRef = useRef<HTMLDivElement>(null);
  const [exploreCards, setExploreCards] = useState<ExploreCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [likedCards, setLikedCards] = useState<Set<number>>(new Set());
  const [bookmarkedCards, setBookmarkedCards] = useState<Set<number>>(new Set());
  const [viewCounts, setViewCounts] = useState<Map<number, number>>(new Map());
  const [particleEffect, setParticleEffect] = useState(false);
  const [achievementUnlocked, setAchievementUnlocked] = useState<string | null>(null);
  const [subEmail, setSubEmail] = useState('');
  const [subName, setSubName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subMessage, setSubMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  



  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-1.onrender.com';

  // Fallback static explore cards with enhanced content (limited to 6)
  const fallbackExploreCards: ExploreCard[] = [
    { 
      id: 1, 
      image: '/web3.png?height=300&width=200&text=Crypto', 
      text: '🚀 In January of 2016, Chiasso, Switzerland started accepting taxes in Bitcoin! This marked a historic moment for crypto adoption.',
      title: 'Switzerland Bitcoin Tax Revolution',
      source: 'Crypto History'
    },
    { 
      id: 2, 
      image: '/web3_1.png?height=300&width=200&text=Bitcoin', 
      text: '💎 90% of all bitcoin addresses have less than 0.1 BTC - showing the concentration of wealth in the crypto space.',
      title: 'Bitcoin Wealth Distribution',
      source: 'Crypto Analytics'
    },
    { 
      id: 3, 
      image: '/web3_2.png?height=300&width=200&text=Cryptocurrencies', 
      text: '🌍 There are over 10,000 cryptocurrencies in the market today! The crypto ecosystem is exploding with innovation.',
      title: 'Crypto Market Explosion',
      source: 'Market Research'
    },
    { 
      id: 4, 
      image: '/web3_3.png?height=300&width=200&text=Bitcoin Pizza', 
      text: '🍕 Bitcoin Pizza Day: On May 22, 2010 two pizzas cost 10,000 BTC - worth over $400 million today!',
      title: 'The Most Expensive Pizza Ever',
      source: 'Crypto Legends'
    },
    { 
      id: 5, 
      image: '/trd1.png?height=300&width=200&text=Blockchain', 
      text: '🔗 The first blockchain was conceptualized in 2008 by Satoshi Nakamoto, revolutionizing digital trust forever.',
      title: 'Birth of Blockchain',
      source: 'Tech History'
    },
    { 
      id: 6, 
      image: '/trd2.png?height=300&width=200&text=Security', 
      text: '🛡️ Blockchain technology could revolutionize cybersecurity with its immutable and transparent nature.',
      title: 'Future of Security',
      source: 'Tech Innovation'
    }
  ];

  // Enhanced trending news with better content
  const trendingNews: TrendingNewsItem[] = [
    {
      title: "🚀 AI Revolution: ChatGPT-5 Breaks All Records",
      excerpt: "OpenAI's latest breakthrough shatters previous AI benchmarks, opening new possibilities for human-AI collaboration...",
      author: "Dr. Sarah Chen",
      date: "2 hours ago",
      image: "/image.png"
    },
    {
      title: "💎 Bitcoin Surges Past $50K: What's Next?",
      excerpt: "The king of crypto makes a spectacular comeback, with analysts predicting even higher gains in the coming weeks...",
      author: "Mike Rodriguez",
      date: "4 hours ago",
      image: "/web3_1.png"
    },
    {
      title: "🌱 Green Energy Breakthrough: Solar Efficiency Hits 50%",
      excerpt: "Revolutionary solar panel technology could make renewable energy the dominant power source worldwide...",
      author: "Dr. Emily Watson",
      date: "6 hours ago",
      image: "/web3_2.png"
    },
    {
      title: "🎮 Metaverse Gaming: The Future of Entertainment",
      excerpt: "Virtual reality gaming platforms are attracting billions in investment, reshaping how we play and socialize...",
      author: "Alex Thompson",
      date: "8 hours ago",
      image: "/web3.png"
    },
    {
      title: "🔬 Quantum Computing: Google's New Milestone",
      excerpt: "Quantum supremacy achieved again as Google demonstrates unprecedented computational power...",
      author: "Dr. James Wilson",
      date: "10 hours ago",
      image: "/image.png"
    },
    {
      title: "🌍 Climate Tech: Carbon Capture Innovation",
      excerpt: "Startup develops revolutionary technology to remove CO2 from atmosphere at scale...",
      author: "Lisa Park",
      date: "12 hours ago",
      image: "/image.png"
    },
  ];

  // Carousel state for Learn a Little
  const [carouselIndex, setCarouselIndex] = useState(0);
  const handleCarouselSelect = (selectedIndex: number) => setCarouselIndex(selectedIndex);

  // Lightweight learning modules for "Learn a Little"
  const educationalModules = [
    {
      icon: '🔗',
      title: 'What is Blockchain?',
      points: [
        'A distributed database shared across a network',
        'Blocks store transactions; each block links to the previous',
        'Immutability provides tamper resistance'
      ],
      link: 'https://www.binance.com/en/academy/articles/what-is-blockchain'
    },
    {
      icon: '🪙',
      title: 'Coins vs Tokens',
      points: [
        'Coins run on their own chain (e.g., BTC, ETH)',
        'Tokens run on existing chains (e.g., ERC-20 on Ethereum)',
        'Utility vs governance vs stable tokens'
      ],
      link: 'https://www.coinbase.com/learn/crypto-basics/what-is-a-token'
    },
    {
      icon: '🔐',
      title: 'Wallets & Seed Phrases',
      points: [
        'Custodial vs self-custody (you vs exchange controls keys)',
        'Your seed phrase = your master key — never share it',
        'Use hardware wallets for long-term storage'
      ],
      link: 'https://www.ledger.com/academy/security/what-is-a-seed-phrase'
    },
    {
      icon: '⛽',
      title: 'Gas Fees & Transactions',
      points: [
        'Fees compensate validators for network security',
        'Higher fees = faster inclusion, especially during congestion',
        'Layer 2s reduce fees while inheriting L1 security'
      ],
      link: 'https://ethereum.org/en/developers/docs/gas/'
    },
    {
      icon: '🏦',
      title: 'DeFi: Lending, DEXes, Yield',
      points: [
        'Permissionless protocols replace intermediaries',
        'DEXes use AMMs; liquidity providers earn fees',
        'Understand impermanent loss before providing liquidity'
      ],
      link: 'https://www.coindesk.com/learn/what-is-defi/'
    },
    {
      icon: '🛡️',
      title: 'Security Basics',
      points: [
        'Never sign blind; read approvals carefully',
        'Beware phishing — verify URLs and contracts',
        'Use unique passwords + 2FA; split funds by use'
      ],
      link: 'https://www.binance.com/en/academy/t/crypto-security'
    }
  ];

  // Quick quiz for an interactive carousel slide
  const quiz = {
    question: 'Which statement about seed phrases is TRUE?',
    options: [
      { label: 'It is safe to share your seed with support if asked', correct: false },
      { label: 'Your seed phrase gives full control of your funds', correct: true },
      { label: 'You can regenerate the same seed phrase later from memory', correct: false },
    ],
    explanation: 'Anyone with your seed phrase can spend your funds. Never share it; store it securely offline.'
  };

  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<'correct' | 'wrong' | null>(null);
  const onQuizSelect = (idx: number) => {
    if (quizSelected !== null) return;
    setQuizSelected(idx);
    const correct = quiz.options[idx].correct;
    setQuizResult(correct ? 'correct' : 'wrong');
    if (correct) {
      setParticleEffect(true);
      setTimeout(() => setParticleEffect(false), 800);
    }
  };

  // Use the translation hook for explore cards - only when language changes or cards change
  const newsItemsForTranslation = React.useMemo(() => exploreCards.map(card => ({
    article_id: card.article_id || (card.id !== undefined ? String(card.id) : undefined),
    title: card.text,
    description: card.text,
    creator: ['Unknown'],
    pubDate: new Date().toISOString(),
    image_url: card.image,
    link: card.link || '#',
    source: card.source || 'Crypto News'
  })), [exploreCards]);
  
	const { displayItems: displayExploreCards } = useNewsTranslation(newsItemsForTranslation);

  // Use the translation hook for trending news - only when language changes or news change
  const trendingNewsForTranslation = React.useMemo(() => trendingNews.map(news => ({
    title: news.title,
    description: news.excerpt,
    creator: [news.author],
    pubDate: news.date,
    image_url: news.image,
    link: '#',
    source: 'Trending News'
  })), [trendingNews]);
  
	const { displayItems: displayTrendingNews } = useNewsTranslation(trendingNewsForTranslation);

  useEffect(() => {
    const fetchExploreContent = async () => {
      if (activeTab !== 'did-you-know') return;
      
      // Prevent multiple simultaneous fetches
      if (isLoading) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch from CryptoSlate and other RSS sources to get diverse content
        const [cryptoSlateResponse, rssResponse, anotherRssResponse, allRssResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/fetch-cryptoslate-rss?limit=10`),
          fetch(`${API_BASE_URL}/fetch-rss`),
          fetch(`${API_BASE_URL}/fetch-another-rss`),
          fetch(`${API_BASE_URL}/fetch-all-rss?limit=10`)
        ]);
        
        let allNews = [];
        
        // Prefer CryptoSlate content
        if (cryptoSlateResponse.ok) {
          const csData = await cryptoSlateResponse.json();
          console.log('CryptoSlate RSS response:', csData);
          if (csData.success && Array.isArray(csData.data)) {
            const mappedNews = csData.data.map((item: any) => ({
              article_id: item.article_id || `cs-${Date.now()}-${Math.random()}`,
              image: item.image_url || `/web3_${Math.floor(Math.random() * 4) + 1}.png?height=300&width=200&text=${item.source_name || 'CryptoSlate'}`,
              text: item.title || 'Crypto News',
              title: item.title,
              link: item.link,
              source: 'Crypto News',
              content: item.content || ''
            }));
            allNews.push(...mappedNews);
            console.log(`Added ${mappedNews.length} items from CryptoSlate RSS source`);
          }
        }

        // Process CoinTelegraph RSS source
        if (rssResponse.ok) {
          const rssData = await rssResponse.json();
          console.log('First RSS response:', rssData);
          if (rssData.success && Array.isArray(rssData.data)) {
            const mappedNews = rssData.data.map((item: any) => ({
              article_id: item.article_id || `rss-${Date.now()}-${Math.random()}`,
              image: item.image_url || `/web3_${Math.floor(Math.random() * 4) + 1}.png?height=300&width=200&text=${item.source_name || 'Crypto'}`,
              text: item.title || 'Crypto News',
              title: item.title,
              link: item.link,
              source: 'Crypto News',
              content: item.content || ''
            }));
            allNews.push(...mappedNews);
            console.log(`Added ${mappedNews.length} items from first RSS source`);
          }
        }
        
        // Process second RSS source (Press Release)
        if (anotherRssResponse.ok) {
          const anotherRssData = await anotherRssResponse.json();
          console.log('Second RSS response:', anotherRssData);
          if (anotherRssData.success && Array.isArray(anotherRssData.data)) {
            const mappedNews = anotherRssData.data.map((item: any) => ({
              article_id: item.article_id || `another-rss-${Date.now()}-${Math.random()}`,
              image: item.image_url || `/web3_${Math.floor(Math.random() * 4) + 1}.png?height=300&width=200&text=${item.source_name || 'Press'}`,
              text: item.title || 'Crypto News',
              title: item.title,
              link: item.link,
              source: item.source_name || 'Press Release',
              content: item.content || ''
            }));
            allNews.push(...mappedNews);
            console.log(`Added ${mappedNews.length} items from second RSS source`);
          }
        }
        
        // Process third RSS source (All RSS - for variety)
        if (allRssResponse.ok) {
          const allRssData = await allRssResponse.json();
          console.log('Third RSS response:', allRssData);
          if (allRssData.success && Array.isArray(allRssData.data)) {
            const mappedNews = allRssData.data.map((item: any) => ({
              article_id: item.article_id || `all-rss-${Date.now()}-${Math.random()}`,
              image: item.image_url || `/web3_${Math.floor(Math.random() * 4) + 1}.png?height=300&width=200&text=${item.source_name || 'News'}`,
              text: item.title || 'Crypto News',
              title: item.title,
              link: item.link,
              source: item.source_name || 'Crypto News',
              content: item.content || ''
            }));
            allNews.push(...mappedNews);
            console.log(`Added ${mappedNews.length} items from third RSS source`);
          }
        }
        
        // Filter out items with missing or invalid data
        const validNews = allNews.filter(item => 
          item.title && 
          item.title.trim() !== '' && 
          item.title !== 'Crypto News' &&
          item.image && 
          item.image.trim() !== ''
        );
        
        // Remove duplicates based on title and limit to exactly 6 unique cards
        const uniqueNews = Array.from(
          new Map(validNews.map(item => [item.title.toLowerCase().trim(), item])).values()
        ).slice(0, 8);
        
        // Ensure exactly 6 cards by topping up with fallbacks if needed
        let finalNews = uniqueNews;
        if (finalNews.length < 8) {
          const needed = 8 - finalNews.length;
          const fallbackToAdd = fallbackExploreCards.filter(fb => !finalNews.some(n => (n.title || '').toLowerCase().trim() === (fb.title || '').toLowerCase().trim())).slice(0, needed);
          finalNews = [...finalNews, ...fallbackToAdd];
        }

        setExploreCards(finalNews.slice(0, 8));
        console.log('Successfully fetched RSS news:', finalNews.slice(0, 8));
      } catch (error: any) {
        console.error('Error fetching explore content:', error);
        setError('Using enhanced fallback content');
        // Use exactly 6 fallback cards
        setExploreCards(fallbackExploreCards);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExploreContent();
    
    // Cleanup function to prevent memory leaks
    return () => {
      // Cancel any pending operations if component unmounts
    };
  }, [activeTab, API_BASE_URL]);

  // Interactive functions
  const handleCardLike = (cardId: number) => {
    setLikedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
        triggerParticleEffect();
        checkAchievements();
      }
      return newSet;
    });
  };

  const handleCardBookmark = (cardId: number) => {
    setBookmarkedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
        triggerParticleEffect();
      }
      return newSet;
    });
  };

  const handleCardView = (cardId: number) => {
    setViewCounts(prev => {
      const newMap = new Map(prev);
      newMap.set(cardId, (newMap.get(cardId) || 0) + 1);
      return newMap;
    });
  };

  const triggerParticleEffect = () => {
    setParticleEffect(true);
    setTimeout(() => setParticleEffect(false), 1000);
  };

  const checkAchievements = () => {
    if (likedCards.size === 5) {
      setAchievementUnlocked('🎉 Like Master! You\'ve liked 5 cards!');
      setTimeout(() => setAchievementUnlocked(null), 3000);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subEmail.trim()) {
      setSubMessage({ type: 'error', text: 'Please enter your email address' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(subEmail)) {
      setSubMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }
    setSubmitting(true);
    setSubMessage(null);
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-2.onrender.com';
    try {
      const resp = await fetch(`${ API_BASE_URL || 'http://localhost:5000'}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subEmail.trim(), name: subName.trim() }),
      });
      const data = await resp.json();
      if (data.success) {
        setSubMessage({ type: 'success', text: data.message || 'Subscribed successfully!' });
        setSubEmail('');
        setSubName('');
      } else {
        setSubMessage({ type: 'error', text: data.message || 'Subscription failed. Please try again.' });
      }
    } catch (_) {
      setSubMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const scrollable = scrollableRef.current;
    if (scrollable) {
      const startY = e.clientY;
      const scrollTop = scrollable.scrollTop;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const newY = moveEvent.clientY;
        const scroll = scrollTop + (startY - newY);
        scrollable.scrollTop = scroll;
      };

      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
  };

  const renderTrendingNews = () => {
    return (
      <Row xs={1} sm={2} md={3} lg={4} className="g-4">
        {trendingNews.map((newsItem, index) => (
          <Col key={index}>
            <Card className="h-100 border-0 shadow-sm rounded-4 news-card-interactive">
              <Card.Img variant="top" src={newsItem.image} alt={newsItem.title} className="rounded-5" />
              <Card.Body>
                <Card.Title className="news-title-interactive">{newsItem.title}</Card.Title>
                <Card.Text className="news-excerpt-interactive">{newsItem.excerpt}</Card.Text>
                <Card.Text className="text-muted news-meta-interactive">
                  <span className="author-badge">{newsItem.author}</span> - {newsItem.date}
                </Card.Text>
                <div className="news-actions-interactive">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="action-btn"
                    onClick={() => {
                      const id = newsItem.article_id || encodeURIComponent(newsItem.title);
                      navigate(`/news/${id}`, {
                        state: {
                          item: {
                            article_id: id,
                            title: newsItem.title,
                            description: newsItem.excerpt,
                            creator: [newsItem.author],
                            pubDate: newsItem.date,
                            image_url: newsItem.image,
                            link: '#',
                            source_name: 'Trending News',
                            content: newsItem.excerpt,
                          },
                        },
                      });
                    }}
                  >
                    <Eye size={16} className="me-1" />
                    Read
                  </Button>
                  <Button variant="outline-warning" size="sm" className="action-btn">
                    <Bookmark size={16} className="me-1" />
                    Save
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'did-you-know':
        return (
          <div className="position-relative">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="d-flex align-items-center gap-3">
                <Badge bg="warning" className="trending-badge">
                  <Sparkles size={16} className="me-1" />
                  Trending Facts
                </Badge>
                <span className="text-muted">Discover amazing crypto insights!</span>
              </div>
              <Button variant="outline-warning" className="view-more-btn">
                View More <ChevronRight size={16} />
              </Button>
            </div>
            
            {error && (
              <div className="alert alert-info alert-dismissible fade show" role="alert">
                <small>{error}</small>
              </div>
            )}
            
            {isLoading ? (
              <Row xs={1} sm={2} md={3} lg={4} className="g-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Col key={index}>
                    <Card className="h-10 border-0 shadow-sm rounded-4 skeleton-card">
                      <Skeleton height={250} width="100%" baseColor="#e0e0e0" highlightColor="#f5f5f5" />
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <Row xs={1} sm={2} md={3} lg={4} className="g-4">
                {(displayExploreCards.length > 0 ? displayExploreCards : exploreCards).map((card: any, index) => {
                  const imgSrc = card.image || card.image_url || `/web3_${(index % 4) + 1}.png`;
                  const titleText = card.title || card.text || card.description || `Explore card ${index + 1}`;
                  const usedSource = card.source || card.source_name || 'Crypto';
                  const linkHref = card.link || '#';
                  return (
                  <Col key={card.article_id || card.id || index}>
                    <Card 
                      className={`h-10 border-0 shadow-sm rounded-4 position-relative overflow-hidden interactive-card ${
                        hoveredCard === index ? 'card-hovered' : ''
                      }`} 
                      style={{ height: '300px' }}
                      onMouseEnter={() => setHoveredCard(index)}
                      onMouseLeave={() => setHoveredCard(null)}
                      onClick={() => {
                        handleCardView(card.id || index);
                        const targetId = card.article_id || encodeURIComponent(card.link || titleText);
                        navigate(`/news/${targetId}`, { state: { item: {
                          article_id: card.article_id || String(card.id || targetId),
                          title: titleText,
                          description: card.text || card.title || card.description || '',
                          creator: ['Unknown'],
                          pubDate: new Date().toISOString(),
                          image_url: imgSrc,
                          link: card.link || '#',
                          source_name: card.source || card.source_name || 'Crypto',
                          content: card.content || ''
                        } } });
                      }}
                    >
                      <Card.Img 
                        variant="top" 
                        src={imgSrc} 
                        alt={titleText}
                        className="rounded-4 card-image-interactive" 
                        style={{ height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          // Better fallback image with source name
                          const fallbackImage = `/web3_${(index % 4) + 1}.png?height=300&width=200&text=${encodeURIComponent(usedSource)}`;
                          e.currentTarget.src = fallbackImage;
                          console.log(`Image failed to load for card ${index}, using fallback: ${fallbackImage}`);
                        }}
                      />
                      
                      {/* Interactive Overlay */}
                      <Card.ImgOverlay className="d-flex flex-column justify-content-between p-3 card-overlay-interactive">
                        {/* Top Actions */}
                        <div className="top-actions">
                          <Badge bg="warning" className="source-badge">
                            {usedSource}
                          </Badge>
                          <div className="action-buttons">
                            <Button
                              variant={likedCards.has(card.id || index) ? "danger" : "outline-light"}
                              size="sm"
                              className="action-btn-small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCardLike(card.id || index);
                              }}
                            >
                              <Heart size={14} fill={likedCards.has(card.id || index) ? "currentColor" : "none"} />
                            </Button>
                            <Button
                              variant={bookmarkedCards.has(card.id || index) ? "warning" : "outline-light"}
                              size="sm"
                              className="action-btn-small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCardBookmark(card.id || index);
                              }}
                            >
                              <Bookmark size={14} fill={bookmarkedCards.has(card.id || index) ? "currentColor" : "none"} />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="content-section">
                          <div 
                            className="bg-dark bg-opacity-85 text-white p-3 rounded content-box"
                            style={{ backdropFilter: 'blur(10px)' }}
                          >
                            <a
                              href={`/news/${card.article_id || encodeURIComponent(card.link || titleText)}`}
                              className="text-white text-decoration-none"
                              onClick={(e) => { e.stopPropagation(); const targetId = card.article_id || encodeURIComponent(card.link || titleText); navigate(`/news/${targetId}`, { state: { item: {
                                article_id: card.article_id || String(card.id || targetId),
                                title: titleText,
                                description: card.text || card.title || card.description || '',
                                creator: ['Unknown'],
                                pubDate: new Date().toISOString(),
                                image_url: imgSrc,
                                link: card.link || '#',
                                source_name: card.source || card.source_name || 'Crypto',
                                content: card.content || ''
                              } } }); }}
                            >
                              <small className="fw-bold content-text" style={{ fontSize: '0.9rem', lineHeight: '1.3' }}>
                                {titleText}
                              </small>
                            </a>
                          </div>
                        </div>
                        
                        {/* Bottom Stats */}
                        <div className="bottom-stats">
                          <div className="stats-row">
                            <small className="text-light">
                              <Eye size={12} className="me-1" />
                              {viewCounts.get(card.id || index) || 0}
                            </small>
                            <small className="text-light">
                              <Heart size={12} className="me-1" />
                              {likedCards.has(card.id || index) ? 1 : 0}
                            </small>
                            <small className="text-light">
                              <Bookmark size={12} className="me-1" />
                              {bookmarkedCards.has(card.id || index) ? 1 : 0}
                            </small>
                          </div>
                        </div>
                      </Card.ImgOverlay>
                    </Card>
                  </Col>
                );})}
              </Row>
            )}
          </div>
        );
        
      case 'learn-a-little':
        return (
          <Row className="mt-3 mx-auto" style={{ width: '97%' }}>
            <Col lg={7}>
              <Carousel
                className="rounded-5 enhanced-carousel"
                style={{ height: '600px', marginBottom: '20px', background: 'linear-gradient(135deg,#0f172a 0%, #111827 100%)' }}
                activeIndex={carouselIndex}
                onSelect={handleCarouselSelect}
                interval={6000}
                pause="hover"
                indicators
                controls
                keyboard
                fade
              >
                {educationalModules.map((mod, index) => (
                  <Carousel.Item key={`edu-${index}`} className="custom-carousel-item" style={{ height: '600px' }}>
                    <div className="d-flex flex-column justify-content-between rounded-4 h-100" style={{
                      padding: '1.5rem',
                      color: '#e5e7eb',
                      background:
                        'radial-gradient(1200px 300px at 10% 10%, rgba(251,146,60,0.12), rgba(17,24,39,0) 60%), radial-gradient(1200px 300px at 90% 90%, rgba(59,130,246,0.12), rgba(17,24,39,0) 60%)'
                    }}>
                      <div>
                        <Badge bg="warning" text="dark" className="mb-3">Learn a Little</Badge>
                        <h3 className="mb-3" style={{ fontWeight: 800, color: '#fff' }}>{mod.icon} {mod.title}</h3>
                        <ul className="mb-4" style={{ maxWidth: 720 }}>
                          {mod.points.map((p, i) => (
                            <li key={i} style={{ marginBottom: 8 }}>
                              <span style={{ color: '#f59e0b' }}>• </span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="flex-grow-1 me-3" style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 999 }}>
                          <div style={{ width: `${((carouselIndex + 1) / educationalModules.length) * 100}%`, height: '100%', background: '#f59e0b', borderRadius: 999 }} />
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <small className="text-muted">{carouselIndex + 1} / {educationalModules.length}</small>
                          {mod.link && (
                            <a href={mod.link} target="_blank" rel="noopener noreferrer" className="btn btn-outline-warning btn-sm">
                              Learn more
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </Carousel.Item>
                ))}
                {/* Interactive Quiz Slide */}
                <Carousel.Item key="quiz" className="custom-carousel-item" style={{ height: '600px' }}>
                  <div className="d-flex flex-column justify-content-between rounded-4 h-100" style={{
                    padding: '1.5rem',
                    color: '#e5e7eb',
                    background:
                      'radial-gradient(1200px 300px at 10% 10%, rgba(34,197,94,0.12), rgba(17,24,39,0) 60%), radial-gradient(1200px 300px at 90% 90%, rgba(251,146,60,0.12), rgba(17,24,39,0) 60%)'
                  }}>
                    <div>
                      <Badge bg="success" className="mb-3">Quick Quiz</Badge>
                      <h3 className="mb-3" style={{ fontWeight: 800, color: '#fff' }}>{quiz.question}</h3>
                      <div className="d-grid gap-2" style={{ maxWidth: 680 }}>
                        {quiz.options.map((opt, idx) => (
                          <Button
                            key={idx}
                            variant={quizSelected === null ? 'outline-light' : (idx === quizSelected && quizResult === 'correct') ? 'success' : (idx === quizSelected ? 'danger' : 'outline-secondary')}
                            onClick={() => onQuizSelect(idx)}
                            disabled={quizSelected !== null}
                            className="text-start"
                          >
                            {opt.label}
                          </Button>
                        ))}
                      </div>
                      {quizSelected !== null && (
                        <div className={`mt-3 alert ${quizResult === 'correct' ? 'alert-success' : 'alert-warning'}`} role="alert" style={{ maxWidth: 680 }}>
                          {quiz.explanation}
                        </div>
                      )}
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="flex-grow-1 me-3" style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 999 }}>
                        <div style={{ width: '100%', height: '100%', background: quizResult === 'correct' ? '#22c55e' : '#f59e0b', borderRadius: 999 }} />
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        {quizSelected !== null && (
                          <Button size="sm" variant="outline-light" onClick={() => { setQuizSelected(null); setQuizResult(null); }}>
                            Try again
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Carousel.Item>
              </Carousel>
            </Col>
            <Col lg={5} className="d-flex justify-content-center">
              <Card className="border-top-0 border-bottom-0 enhanced-trending-card" style={{ width: '200%', borderColor: 'transparent', borderLeft: '2px solid orange', marginTop: '20px' }}>
                <Card.Body style={{ width: '100%' }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <h5 className="m-0">
                        <Lightbulb size={20} className="me-2 text-warning" />
                        Crypto 101
                      </h5>
                    </div>
                  </div>

                  {/* Concept of the day */}
                  <div className="p-3 mb-3 rounded" style={{ background: 'rgba(251, 146, 60, 0.08)', border: '1px solid rgba(251, 146, 60, 0.25)' }}>
                    <small className="text-warning fw-bold d-block mb-1">Concept of the day</small>
                    <div className="d-flex align-items-start gap-2">
                      <span className="badge bg-warning text-dark">TPS</span>
                      <small className="text-muted">Throughput (transactions per second) indicates network capacity. Higher TPS is helpful, but security and decentralization also matter.</small>
                    </div>
                  </div>

                  {/* Modules */}
                  <div style={{ maxHeight: '460px', overflow: 'auto' }}>
                    {educationalModules.map((mod, idx) => (
                      <Card key={idx} className="mb-3 border-0" style={{ boxShadow: '0 6px 16px rgba(0,0,0,0.06)' }}>
                        <Card.Body className="p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="m-0 fw-bold">{mod.title}</h6>
                            {mod.link && (
                              <a href={mod.link} target="_blank" rel="noopener noreferrer" className="btn btn-outline-warning btn-sm">Learn more</a>
                            )}
                          </div>
                          <ul className="mb-0" style={{ paddingLeft: '1rem' }}>
                            {mod.points.map((p, i) => (
                              <li key={i} className="small text-muted" style={{ marginBottom: 4 }}>{p}</li>
                            ))}
                          </ul>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                  {/* Subscribe CTA */}
                  <Card className="mt-3 border-0" style={{ boxShadow: '0 6px 16px rgba(0,0,0,0.06)' }}>
                    <Card.Body>
                      <h6 className="fw-bold mb-2">Stay Updated</h6>
                      <div className="text-muted small mb-2">Get weekly crypto learning tips and curated news</div>
                      {subMessage && (
                        <Alert variant={subMessage.type === 'success' ? 'success' : 'danger'} className="py-2">
                          <small>{subMessage.text}</small>
                        </Alert>
                      )}
                      <Form onSubmit={handleSubscribe}>
                        <InputGroup className="mb-2">
                          <Form.Control 
                            type="text" 
                            placeholder="Your name (optional)" 
                            value={subName}
                            onChange={(e) => setSubName(e.target.value)}
                          />
                        </InputGroup>
                        <InputGroup>
                          <Form.Control 
                            type="email" 
                            placeholder="Enter your email" 
                            value={subEmail}
                            onChange={(e) => setSubEmail(e.target.value)}
                            required
                          />
                          <Button type="submit" variant="warning" disabled={submitting}>
                            {submitting ? 'Subscribing...' : 'Subscribe'}
                          </Button>
                        </InputGroup>
                      </Form>
                    </Card.Body>
                  </Card>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        );
        
      case 'test-your-knowledge':
        return (
          <div className="quiz-section-enhanced">
            <Card className="rounded-5 quiz-card-enhanced" style={{ width: '100%', minHeight: '620px', border: 0 }}>
              <Card.Header className="quiz-header">
                <div className="d-flex align-items-center gap-3">
                  <Brain size={24} className="text-warning" />
                  <h5 className="mb-0">Test Your Crypto Knowledge</h5>
                  <Badge bg="success">Level {Math.floor((likedCards.size + bookmarkedCards.size) / 3) + 1}</Badge>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                <QuizSection />
              </Card.Body>
            </Card>
          </div>
        );
        
      case 'trending-news':
        return renderTrendingNews();
        
      default:
        return null;
    }
  };

  return (
    <>
      
      <Container fluid className="mt-5 rounded-5 explore-container" style={{ width: '92%' }}>
        {/* Achievement Notification */}
      {achievementUnlocked && (
        <div className="achievement-notification">
          <div className="achievement-content">
            <Trophy size={24} className="me-2" />
            {achievementUnlocked}
          </div>
        </div>
      )}
      
      {/* Particle Effect */}
      {particleEffect && (
        <div className="particle-container">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="particle" style={{
              '--delay': `${i * 0.1}s`,
              '--x': `${Math.random() * 100}%`,
              '--y': `${Math.random() * 100}%`
            } as React.CSSProperties} />
          ))}
        </div>
      )}
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <h4 className="m-0 font-inter explore-title">
            <Lightbulb size={24} className="me-2 text-warning" />
            Explore & Discover
          </h4>
          <Badge bg="info" className="explore-badge">
            <Target size={16} className="me-1" />
            Interactive
          </Badge>
        </div>
        
        {/* Progress Bar */}
        <div className="progress-section">
          <small className="text-muted me-2">Progress</small>
          <ProgressBar 
            now={Math.min((likedCards.size + bookmarkedCards.size) * 10, 100)} 
            className="progress-bar-custom"
            style={{ width: '100px' }}
          />
        </div>
      </div>
      
      <Card className="shadow rounded-5 font-inter explore-main-card">
        <Card.Body>
          <Nav variant="tabs" className="mb-4 justify-content-center enhanced-tabs" activeKey={activeTab} onSelect={(k) => k && setActiveTab(k)} style={{ borderBottom: 'none' }}>
            <Nav.Item>
              <Nav.Link 
                eventKey="did-you-know" 
                className={`enhanced-tab ${activeTab === 'did-you-know' ? 'active' : ''}`}
              >
                <Sparkles size={18} className="me-2" />
                {t('explore.didYouKnow') || 'Did You Know?'}
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                eventKey="learn-a-little" 
                className={`enhanced-tab ${activeTab === 'learn-a-little' ? 'active' : ''}`}
              >
                <Bookmark size={18} className="me-2" />
                {t('explore.learnALittle') || 'Learn a Little'}
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                eventKey="test-your-knowledge" 
                className={`enhanced-tab ${activeTab === 'test-your-knowledge' ? 'active' : ''}`}
              >
                <Brain size={18} className="me-2" />
                {t('explore.testKnowledge') || 'Test Knowledge'}
              </Nav.Link>
            </Nav.Item>
          </Nav>
          
          {renderContent()}
          
          {activeTab !== 'learn-a-little' && activeTab !== 'test-your-knowledge' && (
            <div className="d-flex justify-content-center mt-4 gap-3">
              <Button variant="outline-warning" size="lg" className="rounded-circle navigation-btn">
                <ChevronLeft size={24} />
              </Button>
              <Button variant="outline-warning" size="lg" className="rounded-circle navigation-btn">
                <ChevronRight size={24} />
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
    </>
  );
};

export default ExploreSection;