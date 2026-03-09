'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Container } from 'react-bootstrap'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useNewsTranslation } from '../hooks/useNewsTranslation'
import { generateArticleId } from '../utils/articleId'

interface NewsItem {
  article_id?: string
  title: string
  description: string
  creator: string[]
  pubDate: string
  image_url: string
  link: string
  source?: string
  source_name?: string
  category?: string[]
  content?: string
}

const decodeHtml = (html: string): string => {
  const txt = document.createElement('textarea')
  txt.innerHTML = html
  return txt.value
}

const stripHtml = (html: string): string =>
  html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()

const fallbackNewsItems: NewsItem[] = [
  {
    title: 'Bitcoin Breaks New Highs as Institutional Demand Surges',
    description: 'Bitcoin continues its historic rally with unprecedented institutional inflows and ETF demand driving prices higher.',
    creator: ['CoinsClarity'],
    pubDate: new Date().toISOString(),
    image_url: '/market.png',
    link: '#',
    category: ['Bitcoin']
  },
  {
    title: 'Ethereum Layer 2 Ecosystem Hits Record Activity',
    description: 'Ethereum L2 solutions see record transaction volumes as DeFi and gaming activity accelerates across rollups.',
    creator: ['CoinsClarity'],
    pubDate: new Date().toISOString(),
    image_url: '/market.png',
    link: '#',
    category: ['Ethereum']
  },
  {
    title: 'Global Crypto Regulation Framework Takes Shape',
    description: 'Major economies move towards unified crypto regulation as the industry matures and institutional adoption grows.',
    creator: ['CoinsClarity'],
    pubDate: new Date().toISOString(),
    image_url: '/market.png',
    link: '#',
    category: ['Regulation']
  }
]

export default function NewsCarousel() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const { displayItems, isTranslating, currentLanguage } = useNewsTranslation(newsItems)

  const items: NewsItem[] = (displayItems.length ? displayItems : newsItems).map((item: any) => ({
    article_id: item.article_id,
    title: item.title || '',
    description: item.description || '',
    creator: Array.isArray(item.creator) ? item.creator : [item.creator || 'Unknown'],
    pubDate: item.pubDate || new Date().toISOString(),
    image_url: item.image_url || '/market.png',
    link: item.link || '#',
    source: item.source_name || item.source || 'Crypto News',
    source_name: item.source_name || item.source || 'Crypto News',
    category: Array.isArray(item.category) ? item.category : [item.category || 'Crypto News'],
    content: item.content || item.description || ''
  }))

  // Fetch news
  useEffect(() => {
    const CAMIFY = 'https://camify.fun.coinsclarity.com'
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-2.onrender.com'

    const tryFetch = async (url: string): Promise<NewsItem[]> => {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      const arr = Array.isArray(data?.data) ? data.data : Array.isArray(data?.items) ? data.items : []
      if (!arr.length) throw new Error('empty')
      return arr.slice(0, 5).map((item: any) => ({
        article_id: item.article_id || generateArticleId(item.link || item.title),
        title: decodeHtml(item.title || 'Untitled'),
        description: stripHtml(item.description || item.content || 'No description available'),
        creator: Array.isArray(item.creator) ? item.creator : [item.creator || item.author || 'Unknown'],
        pubDate: item.pubDate || new Date().toISOString(),
        image_url: item.image_url || '/market.png',
        link: item.link || '#',
        source: item.source_name || 'Crypto News',
        source_name: item.source_name || 'Crypto News',
        category: Array.isArray(item.category) ? item.category : [item.category || 'Crypto News'],
        content: item.content || item.description || ''
      }))
    }

    const run = async () => {
      setIsLoading(true)
      const urls = [
        `${CAMIFY}/fetch-all-rss?limit=5`,
        `${CAMIFY}/fetch-cointelegraph-rss?limit=5`,
        `${CAMIFY}/fetch-coindesk-rss?limit=5`,
        `${API_BASE_URL}/fetch-all-rss?limit=5`,
      ]
      for (const url of urls) {
        try {
          const result = await tryFetch(url)
          if (result.length) {
            setNewsItems(result)
            setIsLoading(false)
            return
          }
        } catch {}
      }
      // All failed — use fallback
      setNewsItems(fallbackNewsItems)
      setIsLoading(false)
    }

    run()
  }, [])

  // Auto-rotate
  useEffect(() => {
    if (isPaused || items.length <= 1) return
    const timer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % items.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [isPaused, items.length])

  const goTo = useCallback((idx: number) => {
    setActiveIndex(idx)
  }, [])

  const goPrev = useCallback(() => {
    setActiveIndex(prev => (prev === 0 ? items.length - 1 : prev - 1))
  }, [items.length])

  const goNext = useCallback(() => {
    setActiveIndex(prev => (prev + 1) % items.length)
  }, [items.length])

  const openArticle = (item: NewsItem) => {
    const id = encodeURIComponent(item.article_id || generateArticleId(item.link || item.title))
    navigate(`/news/${id}`, { state: { item } })
  }

  const formatDate = (dateString: string): string => {
    try {
      const d = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      const diffH = Math.floor(diffMs / 3600000)
      if (diffH < 1) return 'Just now'
      if (diffH < 24) return `${diffH}h ago`
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return 'Recent'
    }
  }

  if (isLoading) {
    return (
      <Container fluid className="p-0">
        <div style={{ position: 'relative', height: '520px', background: '#111' }}>
          <Skeleton height="100%" width="100%" baseColor="#222" highlightColor="#333" />
        </div>
      </Container>
    )
  }

  const current = items[activeIndex] || items[0]
  if (!current) return null

  return (
    <Container fluid className="p-0">
      <div
        style={{ position: 'relative', height: '520px', overflow: 'hidden', background: '#0a0a0a' }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Background image */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${current.image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'background-image 0.6s ease-in-out',
          filter: 'brightness(0.5)',
        }} />

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.2) 70%, transparent 100%)',
        }} />

        {/* Content */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '40px 48px',
          zIndex: 2,
        }}>
          {/* Category badge + time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={{
              background: '#f7931a',
              color: '#000',
              padding: '4px 14px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              CoinsClarity
            </span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
              {formatDate(current.pubDate)}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>• CoinsClarity</span>
          </div>

          {/* Title */}
          <h2
            onClick={() => openArticle(current)}
            style={{
              color: '#fff',
              fontSize: 'clamp(1.4rem, 3vw, 2.2rem)',
              fontWeight: 800,
              lineHeight: 1.25,
              marginBottom: '12px',
              cursor: 'pointer',
              maxWidth: '800px',
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f7931a')}
            onMouseLeave={e => (e.currentTarget.style.color = '#fff')}
          >
            {current.title}
          </h2>

          {/* Description */}
          <p style={{
            color: 'rgba(255,255,255,0.75)',
            fontSize: '15px',
            lineHeight: 1.6,
            maxWidth: '700px',
            marginBottom: '20px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as any,
            overflow: 'hidden',
          }}>
            {current.description.slice(0, 200)}{current.description.length > 200 ? '…' : ''}
          </p>

          {/* Read article button */}
          <button
            onClick={() => openArticle(current)}
            style={{
              background: '#f7931a',
              color: '#000',
              border: 'none',
              padding: '10px 28px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#fff'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#f7931a'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Read Full Article →
          </button>

          {/* Dot indicators */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                style={{
                  width: idx === activeIndex ? '32px' : '10px',
                  height: '10px',
                  borderRadius: '5px',
                  border: 'none',
                  background: idx === activeIndex ? '#f7931a' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  padding: 0,
                }}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Prev / Next arrows */}
        <button
          onClick={goPrev}
          style={{
            position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', fontSize: '20px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s', zIndex: 3, backdropFilter: 'blur(4px)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(247,147,26,0.8)'; e.currentTarget.style.borderColor = '#f7931a' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
          aria-label="Previous"
        >
          ‹
        </button>
        <button
          onClick={goNext}
          style={{
            position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', fontSize: '20px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s', zIndex: 3, backdropFilter: 'blur(4px)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(247,147,26,0.8)'; e.currentTarget.style.borderColor = '#f7931a' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
          aria-label="Next"
        >
          ›
        </button>

        {/* Slide counter */}
        <div style={{
          position: 'absolute', top: '20px', right: '20px',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          padding: '6px 14px', borderRadius: '20px',
          color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: 600,
          zIndex: 3,
        }}>
          {activeIndex + 1} / {items.length}
        </div>
      </div>
    </Container>
  )
}
