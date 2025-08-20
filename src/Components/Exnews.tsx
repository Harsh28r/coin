import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

interface NewsItem {
  article_id?: string;
  title: string;
  description: string;
  creator: string[];
  pubDate: string;
  image_url: string;
  link: string;
  content: string;
}

// Utility function to decode HTML entities
const decodeHtml = (html: string) => {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};

const AllNews: React.FC = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null); // Track expanded item
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-1.onrender.com';

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/fetch-rss`);
        const data = await response.json();
        if (Array.isArray(data.data)) {
          setNewsItems(data.data);
        } else {
          console.error('Fetched data is not an array:', data);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
      }
    };

    fetchNews();
  }, []);

  const toggleContent = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index); // Toggle expanded state
  };

  return (
    <Container fluid className="mt-5" style={{ width: '50%' }}>
      <h1 className="mb-4 text-center" style={{ 
        fontSize: '2.5rem', 
        fontWeight: 'bold', 
        color: '#1f2937',
        borderBottom: '3px solid #f59e0b',
        paddingBottom: '1rem'
      }}>
        All Exclusive News
      </h1>
      
      {/* Enhanced introduction section for better text-to-HTML ratio */}
      <div className="mb-5 p-4" style={{ 
        backgroundColor: '#f8f9fa', 
        borderRadius: '12px', 
        border: '1px solid #e9ecef' 
      }}>
        <h2 className="h4 mb-3" style={{ color: '#495057', fontWeight: '600' }}>
          Stay Ahead with Exclusive Crypto Insights
        </h2>
        <p className="mb-3" style={{ color: '#6c757d', lineHeight: '1.6' }}>
          Discover the most important cryptocurrency news and developments that shape the digital asset landscape. 
          Our exclusive news section brings you in-depth analysis, breaking stories, and expert insights from 
          trusted sources across the crypto industry.
        </p>
        <p className="mb-0" style={{ color: '#6c757d', lineHeight: '1.6' }}>
          From market movements and regulatory updates to technological breakthroughs and institutional adoption, 
          we curate the stories that matter most to crypto enthusiasts, investors, and professionals.
        </p>
      </div>

      {/* News count and filtering info */}
      <div className="mb-4 p-3" style={{ 
        backgroundColor: '#fff3cd', 
        borderRadius: '8px', 
        border: '1px solid #ffeaa7' 
      }}>
        <div className="d-flex justify-content-between align-items-center">
          <span className="text-dark">
            <strong>{newsItems.length}</strong> exclusive articles available
          </span>
          <small className="text-muted">
            Updated daily • Curated from premium sources
          </small>
        </div>
      </div>

      <ul className="list-unstyled">
        {newsItems.map((item, index) => (
          <li key={index} className="mb-4">
            <img 
              src={item.image_url} 
              alt={item.title} 
              className="img-fluid mb-2" 
              style={{ maxWidth: '800px', height: 'auto' }}
            />
            <div className="text-start">
              <small className="text-muted">By </small>
              <small className="text-warning">{item.creator[0]}</small>
              <br />
              <small className="text-muted">{new Date(item.pubDate).toLocaleDateString()}</small>
            </div>
            <h5 className="text-black text-start" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              <a 
                href={`/news/${item.article_id || encodeURIComponent(item.title)}`} 
                className="text-black text-decoration-none"
                style={{ cursor: 'pointer' }}
                onClick={(e) => { e.preventDefault(); const targetId = item.article_id || encodeURIComponent(item.title); navigate(`/news/${targetId}`, { state: { item: { ...item } } }); }}
              >
                {item.title}
              </a>
            </h5>
           
            <p className="text-muted" style={{ maxHeight: expandedIndex === index ? 'none' : '200px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: expandedIndex === index ? 'none' : 3, WebkitBoxOrient: 'vertical', textAlign: 'left' }}>
              {decodeHtml(item.content)}
            </p>
            <div className="d-flex justify-content-between align-items-center">
              <button 
                onClick={() => toggleContent(index)} 
                className="btn btn-link" 
                style={{ color: 'black' }}
              >
                {expandedIndex === index ? 'Read Less' : 'Read More'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Container>
  );
};

export default AllNews;
