import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

interface NewsItem {
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

const PresNews: React.FC = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null); // Track expanded item
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/fetch-another-rss`)
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
      <ul className="list-unstyled">
        {newsItems.map((item, index) => (
          <li key={index} className="mb-4">
            <img 
              src={item.image_url} 
              alt={item.title} 
              className="img-fluid mb-2" 
              style={{ maxWidth: '1300px', width: '100%', height: 'auto' }}
            />
            <div className="text-start">
              <small className="text-muted">By </small>
              <small className="text-warning">{item.creator[0]}</small>
              <br />
              <small className="text-muted">{new Date(item.pubDate).toLocaleDateString()}</small>
            </div>
            <h5 className="text-black text-start" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-black text-decoration-none">
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

export default PresNews;
