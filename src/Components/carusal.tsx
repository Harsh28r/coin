'use client'

import React, { useEffect, useState } from 'react'
import { Carousel, Badge, Container } from 'react-bootstrap'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useLanguage } from '../context/LanguageContext';
import { useNewsTranslation } from '../hooks/useNewsTranslation';

interface NewsItem {
  article_id?: string
  title: string
  description: string
  creator: string[]
  pubDate: string
  image_url: string
  link: string
  source?: string
  category?: string[]
}

// Utility function to decode HTML entities
const decodeHtml = (html: string): string => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

// Fallback static data (in case API fails)
const fallbackNewsItems = [
  {
    title: "Bitcoin Price Forecast: Is The BTC Post-Halving Bottom Beckoning, Teasing $100K?",
    description: "Bitcoin price forecast: Mundane trading engulfs the crypto market, as BTC settles in for a ranging motion ahead of a post-halving bull run.",
    creator: ["John Isige"],
    pubDate: new Date().toISOString(),
    image_url: "/market.png?height=600&width=1200",
    link: "#",
    category: ["Exclusive News"]
  },
  {
    title: "How To Avoid Going Bust In Crypto In 2024",
    description: "In the midst of a booming market, safeguarding investments becomes paramount as traders navigate volatile conditions.",
    creator: ["Tracy D'souza"],
    pubDate: new Date().toISOString(),
    image_url: "/market.png?height=600&width=1200",
    link: "#",
    category: ["Market Analysis"]
  },
  {
    title: "Russian State Duma Contemplates Bill On Mining Cryptocurrencies",
    description: "A bill on mining cryptocurrencies is being currently held in the Russian state of Duma for consideration.",
    creator: ["Tracy D'souza"],
    pubDate: new Date().toISOString(),
    image_url: "/market.png?height=600&width=1200",
    link: "#",
    category: ["Regulation"]
  }
]

export default function NewsCarousel() {
  const { t } = useLanguage();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTranslationIndicator, setShowTranslationIndicator] = useState(false);

  // Use the translation hook
  const { displayItems, isTranslating, currentLanguage } = useNewsTranslation(newsItems);
  
  // Ensure displayItems have the correct structure and handle type safety
  const typedDisplayItems: NewsItem[] = displayItems.map(item => ({
    article_id: item.article_id,
    title: item.title || '',
    description: item.description || '',
    creator: Array.isArray(item.creator) ? item.creator : [item.creator || 'Unknown'],
    pubDate: item.pubDate || new Date().toISOString(),
    image_url: item.image_url || '/market.png?height=600&width=1200',
    link: item.link || '#',
    source: item.source || 'Crypto News',
    category: Array.isArray(item.category) ? item.category : [item.category || 'Crypto News']
  }));
  
  // Control translation indicator display to prevent flickering
  useEffect(() => {
    if (isTranslating && currentLanguage !== 'en') {
      setShowTranslationIndicator(true);
    } else {
      setShowTranslationIndicator(false);
    }
  }, [isTranslating, currentLanguage]);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-1.onrender.com';
  const LOCAL_API_URL = 'http://localhost:5000';

  useEffect(() => {
    const fetchCarouselNews = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Try the new unified RSS endpoint first
        let response;
        try {
          response = await fetch(`${API_BASE_URL}/fetch-all-rss?limit=5`);
          if (!response.ok) throw new Error('Failed to fetch from unified endpoint');
        } catch (error) {
          console.warn('Unified endpoint failed, trying trending news:', error);
          response = await fetch(`${API_BASE_URL}/trending-news`);
          if (!response.ok) throw new Error('Failed to fetch trending news');
        }

        const data = await response.json();
        
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          // Take the first 3-5 items for carousel
          const carouselItems = data.data.slice(0, 3).map((item: any) => ({
            title: item.title || 'Untitled',
            description: item.description || 'No description available',
            creator: Array.isArray(item.creator) ? item.creator : [item.creator || 'Unknown'],
            pubDate: item.pubDate || new Date().toISOString(),
            image_url: item.image_url || '/market.png?height=600&width=1200',
            link: item.link || '#',
            source: 'Crypto News',
            category: item.category || ['Crypto News']
          }));
          
          setNewsItems(carouselItems);
          console.log('Fetched carousel news:', carouselItems);
        } else {
          throw new Error('No valid news data received');
        }
      } catch (error: any) {
        console.error('Error fetching carousel news:', error);
        setError('Failed to load latest news. Showing fallback content.');
        // Use fallback data
        setNewsItems(fallbackNewsItems);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCarouselNews();
  }, []);

  // Format date consistently
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Recent';
    }
  };

  // Get category display name
  const getCategoryDisplay = (item: NewsItem): string => {
    if (Array.isArray(item.category) && item.category.length > 0) {
      return item.category[0];
    }
    return item.source || 'Crypto News';
  };

  if (isLoading) {
    return (
      <Container fluid className="p-0">
        <div className="position-relative" style={{ height: '600px' }}>
          <Skeleton height="100%" width="100%" baseColor="#e0e0e0" highlightColor="#f5f5f5" />
          <div 
            className="position-absolute bottom-0 start-0 w-100 p-4"
            style={{
              background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
              minHeight: '50%'
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Skeleton width={120} height={24} baseColor="#e0e0e0" highlightColor="#f5f5f5" />
              <Skeleton width={200} height={16} baseColor="#e0e0e0" highlightColor="#f5f5f5" />
            </div>
            <Skeleton width="80%" height={40} baseColor="#e0e0e0" highlightColor="#f5f5f5" className="mb-3" />
            <Skeleton count={2} width="90%" height={20} baseColor="#e0e0e0" highlightColor="#f5f5f5" />
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="p-0">
      {error && (
        <div className="alert alert-warning alert-dismissible fade show" role="alert">
          {error}
        </div>
      )}
      
      {/* Translation indicator - only show when actively translating */}
      {showTranslationIndicator && (
        <div className="alert alert-info alert-dismissible fade show" role="alert" style={{ margin: '10px' }}>
          🔄 Translating carousel news to {currentLanguage === 'hi' ? 'Hindi' : 
            currentLanguage === 'es' ? 'Spanish' :
            currentLanguage === 'fr' ? 'French' :
            currentLanguage === 'de' ? 'German' :
            currentLanguage === 'zh' ? 'Chinese' :
            currentLanguage === 'ja' ? 'Japanese' :
            currentLanguage === 'ko' ? 'Korean' :
            currentLanguage === 'ar' ? 'Arabic' : currentLanguage}...
        </div>
      )}
      
      <Carousel 
        controls={true}
        indicators={false}
        interval={5000}
        className="news-carousel"
      >
        {typedDisplayItems.map((item, index) => (
          <Carousel.Item key={item.article_id || index}>
            <div className="position-relative" style={{ height: '600px' }}>
              <img
                src={item.image_url}
                alt={item.title}
                className="w-100 h-100 object-fit-cover"
                style={{ objectPosition: 'center' }}
                onError={(e) => {
                  e.currentTarget.src = '/market.png?height=600&width=1200';
                }}
              />
              <div 
                className="position-absolute bottom-0 start-0 w-100 p-4"
                style={{
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                  minHeight: '50%'
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <Badge bg="primary" className="fs-6">
                    {getCategoryDisplay(item)}
                  </Badge>
                  <div className="text-white opacity-75">
                    <span className="me-3">By {item.creator[0] || 'Unknown'}</span>
                    <span>{formatDate(item.pubDate)}</span>
                  </div>
                </div>
                <h2 className="display-5 fw-bold text-white mb-3">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white text-decoration-none"
                    style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
                  >
                    {decodeHtml(item.title)}
                  </a>
                </h2>
                <p className="lead text-white mb-0" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                  {decodeHtml(item.description.length > 150 
                    ? item.description.substring(0, 150) + '...' 
                    : item.description)}
                </p>
              </div>
            </div>
          </Carousel.Item>
        ))}
      </Carousel>
    </Container>
  )
}

