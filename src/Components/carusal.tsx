'use client'

import React from 'react'
import { Carousel, Badge, Container } from 'react-bootstrap'

interface NewsItem {
  id: number
  category: string
  author: string
  date: string
  title: string
  description: string
  image: string
}

const newsItems: NewsItem[] = [
  {
    id: 1,
    category: "Exclusive News",
    author: "By John Isige",
    date: "April 29, 2022",
    title: "Bitcoin Price Forecast: Is The BTC Post-Halving Bottom Beckoning, Teasing $100K?",
    description: "Bitcoin price forecast: Mundane trading engulfs the crypto market, as BTC settles in for a ranging motion ahead of a post-halving bull run.",
    image: "/market.png?height=80&width=120?height=600&width=1200"
  },
  {
    id: 2,
    category: "Market Analysis",
    author: "By Tracy D'souza",
    date: "April 27, 2024",
    title: "How To Avoid Going Bust In Crypto In 2024",
    description: "In the midst of a booming market, safeguarding investments becomes paramount as traders navigate volatile conditions.",
    image: "/market.png?height=80&width=120?height=600&width=1200"
  },
  {
    id: 3,
    category: "Regulation",
    author: "By Tracy D'souza",
    date: "April 27, 2024",
    title: "Russian State Duma Contemplates Bill On Mining Cryptocurrencies",
    description: "A bill on mining cryptocurrencies is being currently held in the Russian state of Duma for consideration.",
    image: "/market.png?height=80&width=120?height=600&width=1200"
  }
]

export default function NewsCarousel() {
  return (
    <Container fluid className="p-0">
      <Carousel 
        controls={true}
        indicators={false}
        interval={5000}
        className="news-carousel"
      >
        {newsItems.map((item) => (
          <Carousel.Item key={item.id}>
            <div className="position-relative" style={{ height: '600px' }}>
              <img
                src={item.image}
                alt={item.title}
                className="w-100 h-100 object-fit-cover"
                style={{ objectPosition: 'center' }}
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
                    {item.category}
                  </Badge>
                  <div className="text-white opacity-75">
                    <span className="me-3">{item.author}</span>
                    <span>{item.date}</span>
                  </div>
                </div>
                <h2 className="display-5 fw-bold text-white mb-3">
                  {item.title}
                </h2>
                <p className="lead text-white mb-0">
                  {item.description}
                </p>
              </div>
            </div>
          </Carousel.Item>
        ))}
      </Carousel>
    </Container>
  )
}

