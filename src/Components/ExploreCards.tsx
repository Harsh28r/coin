import React, { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Card, Nav, Button, Carousel, Badge, ProgressBar } from 'react-bootstrap';
import { ChevronLeft, ChevronRight, Sparkles, Zap, Brain, Lightbulb, Target, Trophy, Star, Heart, Share2, Bookmark, Eye } from 'lucide-react';
import QuizSection from './QuizSection';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import './ExploreCards.css';
import { useLanguage } from '../context/LanguageContext';
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
}

const ExploreSection: React.FC = () => {
  const { t } = useLanguage();
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
  const [showTranslationIndicator, setShowTranslationIndicator] = useState(false);
  const [lastTranslationTime, setLastTranslationTime] = useState(0);
  
  // Stable reference for translation indicator to prevent unnecessary re-renders
  const translationIndicatorRef = React.useRef<HTMLDivElement>(null);

  // Memoized language display text to prevent unnecessary recalculations
  const languageDisplayText = React.useMemo(() => {
    switch (currentLanguage) {
      case 'hi': return 'Hindi';
      case 'es': return 'Spanish';
      case 'fr': return 'French';
      case 'de': return 'German';
      case 'zh': return 'Chinese';
      case 'ja': return 'Japanese';
      case 'ko': return 'Korean';
      case 'ar': return 'Arabic';
      default: return currentLanguage;
    }
  }, [currentLanguage]);

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

  // Use the translation hook for explore cards - only when language changes or cards change
  const newsItemsForTranslation = React.useMemo(() => exploreCards.map(card => ({
    title: card.text,
    description: card.text,
    creator: ['Unknown'],
    pubDate: new Date().toISOString(),
    image_url: card.image,
    link: card.link || '#',
    source: card.source || 'Crypto News'
  })), [exploreCards]);
  
  const { displayItems: displayExploreCards, isTranslating: isTranslatingCards, currentLanguage: exploreCurrentLanguage } = useNewsTranslation(newsItemsForTranslation);

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
  
  const { displayItems: displayTrendingNews, isTranslating: isTranslatingNews, currentLanguage: trendingCurrentLanguage } = useNewsTranslation(trendingNewsForTranslation);
  
  // Use the primary language from explore cards for consistency
  const currentLanguage = exploreCurrentLanguage;

  // Control translation indicator display to prevent flickering - with debouncing
  useEffect(() => {
    const now = Date.now();
    const shouldShow = (isTranslatingCards || isTranslatingNews) && currentLanguage !== 'en';
    
    // Only update if there's a significant change or enough time has passed
    if (shouldShow !== showTranslationIndicator || (now - lastTranslationTime) > 1000) {
      setShowTranslationIndicator(shouldShow);
      if (shouldShow) {
        setLastTranslationTime(now);
      }
    }
  }, [isTranslatingCards, isTranslatingNews, currentLanguage, showTranslationIndicator, lastTranslationTime]);

  useEffect(() => {
    const fetchExploreContent = async () => {
      if (activeTab !== 'did-you-know') return;
      
      // Prevent multiple simultaneous fetches
      if (isLoading) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch from multiple RSS sources to get diverse content
        const [rssResponse, anotherRssResponse, allRssResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/fetch-rss`),
          fetch(`${API_BASE_URL}/fetch-another-rss`),
          fetch(`${API_BASE_URL}/fetch-all-rss?limit=10`)
        ]);
        
        let allNews = [];
        
        // Process first RSS source (Exclusive News)
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
              source: item.source_name || 'Exclusive News'
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
              source: item.source_name || 'Press Release'
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
              source: item.source_name || 'Crypto News'
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
        ).slice(0, 6);
        
        if (uniqueNews.length >= 4) {
          setExploreCards(uniqueNews);
          console.log('Successfully fetched RSS news:', uniqueNews);
        } else {
          console.warn('Not enough RSS content, using fallback');
          throw new Error('Insufficient RSS content');
        }
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
  }, [activeTab, isLoading]);

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
                  <Button variant="outline-primary" size="sm" className="action-btn">
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
                {(displayExploreCards.length > 0 ? displayExploreCards : exploreCards).map((card, index) => (
                  <Col key={card.article_id || card.id || index}>
                    <Card 
                      className={`h-10 border-0 shadow-sm rounded-4 position-relative overflow-hidden interactive-card ${
                        hoveredCard === index ? 'card-hovered' : ''
                      }`} 
                      style={{ height: '300px' }}
                      onMouseEnter={() => setHoveredCard(index)}
                      onMouseLeave={() => setHoveredCard(null)}
                      onClick={() => handleCardView(card.id || index)}
                    >
                      <Card.Img 
                        variant="top" 
                        src={card.image} 
                        alt={card.title || `Explore card ${index + 1}`}
                        className="rounded-4 card-image-interactive" 
                        style={{ height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          // Better fallback image with source name
                          const fallbackImage = `/web3_${(index % 4) + 1}.png?height=300&width=200&text=${encodeURIComponent(card.source || 'Crypto')}`;
                          e.currentTarget.src = fallbackImage;
                          console.log(`Image failed to load for card ${index}, using fallback: ${fallbackImage}`);
                        }}
                      />
                      
                      {/* Interactive Overlay */}
                      <Card.ImgOverlay className="d-flex flex-column justify-content-between p-3 card-overlay-interactive">
                        {/* Top Actions */}
                        <div className="top-actions">
                          <Badge bg="warning" className="source-badge">
                            {card.source}
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
                            {card.link ? (
                              <a
                                href={card.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white text-decoration-none"
                              >
                                <small className="fw-bold content-text" style={{ fontSize: '0.9rem', lineHeight: '1.3' }}>
                                  {card.text}
                                </small>
                              </a>
                            ) : (
                              <small className="fw-bold content-text" style={{ fontSize: '0.9rem', lineHeight: '1.3' }}>
                                {card.text}
                              </small>
                            )}
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
                ))}
              </Row>
            )}
          </div>
        );
        
      case 'learn-a-little':
        return (
          <Row className="mt-3 mx-auto" style={{ width: '97%' }}>
            <Col lg={7}>
              <Carousel className="bg-dark text-white rounded-5 enhanced-carousel" style={{ height: '600px', marginBottom: '20px' }} indicators={false} controls={false}>
                {(displayExploreCards.length > 0 ? displayExploreCards : (exploreCards.length > 0 ? exploreCards : fallbackExploreCards)).slice(0, 6).map((card, index) => (
                  <Carousel.Item key={card.article_id || card.id || index} className="custom-carousel-item" style={{ height: '600px' }}>
                    <Card.Img 
                      src={card.image} 
                      alt={card.title || `Explore card ${index + 1}`} 
                      className="rounded-4" 
                      style={{ height: '100%', objectFit: 'cover', width: '100%' }}
                      onError={(e) => {
                        // Better fallback image with source name
                        const fallbackImage = `/web3_${(index % 4) + 1}.png?height=600&width=800&text=${encodeURIComponent(card.source || 'Crypto')}`;
                        e.currentTarget.src = fallbackImage;
                        console.log(`Carousel image failed to load for card ${index}, using fallback: ${fallbackImage}`);
                      }}
                    />
                    <Card.ImgOverlay className="d-flex flex-column justify-content-end" style={{ padding: '1rem' }}>
                      <div className="bg-dark bg-opacity-75 p-4 rounded enhanced-overlay">
                        <h4 className="text-white mb-2">{card.text}</h4>
                        {card.source && (
                          <div className="d-flex align-items-center gap-2">
                            <Badge bg="warning" className="source-badge-large">
                              {card.source}
                            </Badge>
                            <Button variant="outline-light" size="sm">
                              <Share2 size={16} className="me-1" />
                              Share
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card.ImgOverlay>
                  </Carousel.Item>
                ))}
              </Carousel>
            </Col>
            <Col lg={5} className="d-flex justify-content-center">
              <Card className="border-top-0 border-bottom-0 enhanced-trending-card" style={{ width: '200%', borderColor: 'transparent', borderLeft: '2px solid orange', marginTop: '20px' }}>
                <Card.Body className="trending-news-body" style={{ width: '100%' }}>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center gap-2">
                      <h5 className="m-0 trending-news-title">
                        <Zap size={20} className="me-2 text-warning" />
                        Trending News
                      </h5>
                    </div>
                    <Button variant="outline-warning" className="text-decoration-none p-0 view-all-btn">
                      View All <ChevronRight size={16} />
                    </Button>
                  </div>
                  
                  <div className="trending-stats mb-3">
                    <div className="stat-item">
                      <span className="stat-label">Total Views</span>
                      <span className="stat-value">2.4M</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Engagement</span>
                      <span className="stat-value">89%</span>
                    </div>
                  </div>
                  
                  <div
                    ref={scrollableRef}
                    onMouseDown={handleMouseDown}
                    style={{ 
                      maxHeight: '500px', 
                      overflow: 'hidden', 
                      width: '100%', 
                      margin: '0 auto', 
                      cursor: 'grab' 
                    }}
                  >
                    <div className="scrollable-container" style={{ 
                      height: '700px', 
                      width: '100%', 
                      cursor: 'pointer' 
                    }}>
                      <div className="trending-news-container">
                        {(displayTrendingNews.length > 0 ? displayTrendingNews : trendingNews).map((news, index) => (
                          <Row key={index} className="mb-4 trending-news-item">
                            <Col xs={8}>
                              <h6 
                                className="mb-2 trending-news-title-enhanced" 
                                style={{ cursor: 'pointer' }}
                                onClick={() => window.location.href = `/news/${news.article_id || encodeURIComponent(news.title)}`}
                              >
                                {news.title}
                              </h6>
                              <p className="small text-muted mb-2 trending-news-excerpt">{news.excerpt}</p>
                              <div className="trending-news-meta">
                                <div className="author-section">
                                  <small className="text-muted">
                                    By 
                                  </small>
                                  <small className="text-warning author-name">
                                    {news.author}
                                  </small>
                                </div>
                                <div className="time-section">
                                  <small className="text-muted">{news.date}</small>
                                </div>
                              </div>
                            </Col>
                            <Col xs={4}>
                              <img 
                                src={news.image} 
                                alt={news.title} 
                                className="img-fluid rounded trending-news-image" 
                                style={{ height: '120px', objectFit: 'cover' }} 
                              />
                            </Col>
                          </Row>
                        ))}
                      </div>
                    </div>
                  </div>
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
      {/* Subtle translation indicator at the top - only show when actively translating */}
      {showTranslationIndicator && (
        <div 
          ref={translationIndicatorRef}
          className="text-center mb-2" 
          key={`translation-${currentLanguage}`}
        >
          <small className="text-muted">
            🔄 Translating to {languageDisplayText}
          </small>
        </div>
      )}
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