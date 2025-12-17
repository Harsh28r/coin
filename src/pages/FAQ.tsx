import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Navbar from '../Components/navbar';
import Footer from '../Components/footer';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  // General
  {
    category: 'General',
    question: 'What is CoinsClarity?',
    answer: 'CoinsClarity is a comprehensive cryptocurrency news and information platform. We provide real-time crypto news, market data, coin listings, and educational content to help you stay informed about the digital asset space.'
  },
  {
    category: 'General',
    question: 'Is CoinsClarity free to use?',
    answer: 'Yes! CoinsClarity is completely free to use. You can access all our news articles, market data, coin information, and educational content without any subscription fees.'
  },
  {
    category: 'General',
    question: 'How often is the content updated?',
    answer: 'Our news content is updated continuously throughout the day. Market data and coin prices are refreshed in real-time or near real-time to ensure you have the latest information.'
  },
  // Account & Features
  {
    category: 'Account & Features',
    question: 'Do I need an account to use CoinsClarity?',
    answer: 'No account is required to browse our content. However, creating a free account allows you to use features like the Watchlist to track your favorite cryptocurrencies and receive personalized newsletter updates.'
  },
  {
    category: 'Account & Features',
    question: 'What is the Watchlist feature?',
    answer: 'The Watchlist allows you to save and track your favorite cryptocurrencies in one place. You can quickly access price updates, news, and information about the coins you\'re most interested in.'
  },
  {
    category: 'Account & Features',
    question: 'How do I subscribe to the newsletter?',
    answer: 'You can subscribe to our newsletter by entering your email address in the subscription form at the bottom of any page. You\'ll receive curated crypto news and updates directly in your inbox.'
  },
  // News & Content
  {
    category: 'News & Content',
    question: 'What types of news do you cover?',
    answer: 'We cover a wide range of crypto news including: Breaking news, Exclusive stories, Press releases, In-depth analysis (Beyond the Headlines), AI-curated news, and trending topics across the cryptocurrency ecosystem.'
  },
  {
    category: 'News & Content',
    question: 'What are Press Releases?',
    answer: 'Press Releases are official announcements from cryptocurrency projects, exchanges, and blockchain companies. We publish these to keep you informed about new developments, partnerships, and product launches.'
  },
  {
    category: 'News & Content',
    question: 'What is "Beyond the Headlines"?',
    answer: 'Beyond the Headlines is our in-depth analysis section where we dive deeper into important crypto stories, providing context, expert opinions, and comprehensive coverage of significant events in the industry.'
  },
  // Market Data
  {
    category: 'Market Data',
    question: 'Where does your market data come from?',
    answer: 'Our market data is aggregated from multiple reliable sources including major cryptocurrency exchanges and data providers like CoinGecko to ensure accuracy and reliability.'
  },
  {
    category: 'Market Data',
    question: 'Can I view prices in different currencies?',
    answer: 'Yes! CoinsClarity supports multiple fiat currencies. You can switch between currencies using the currency selector to view prices in your preferred currency.'
  },
  {
    category: 'Market Data',
    question: 'What information is available for each coin?',
    answer: 'For each cryptocurrency, we provide: Current price, 24h change, Market cap, Trading volume, Price charts, Related news, and detailed project information when available.'
  },
  // Privacy & Security
  {
    category: 'Privacy & Security',
    question: 'How do you protect my data?',
    answer: 'We implement industry-standard security measures to protect your personal information. We use encryption, secure servers, and follow best practices for data protection. See our Privacy Policy for full details.'
  },
  {
    category: 'Privacy & Security',
    question: 'Do you sell my data to third parties?',
    answer: 'No, we do not sell your personal data. We only share information with service providers necessary to operate our platform (like email services for newsletters) and as described in our Privacy Policy.'
  },
  {
    category: 'Privacy & Security',
    question: 'What cookies do you use?',
    answer: 'We use essential cookies for website functionality, analytics cookies (Google Analytics) to understand user behavior, and advertising cookies (Google AdSense) to display relevant ads. Users in the EU can manage their cookie preferences through our consent manager.'
  },
  // Technical
  {
    category: 'Technical',
    question: 'Which browsers are supported?',
    answer: 'CoinsClarity works on all modern browsers including Chrome, Firefox, Safari, Edge, and their mobile versions. We recommend keeping your browser updated for the best experience.'
  },
  {
    category: 'Technical',
    question: 'Is there a mobile app?',
    answer: 'Currently, we don\'t have a dedicated mobile app, but our website is fully responsive and works great on mobile devices. You can add it to your home screen for quick access.'
  },
  {
    category: 'Technical',
    question: 'The website isn\'t loading properly. What should I do?',
    answer: 'Try these steps: 1) Clear your browser cache and cookies, 2) Disable browser extensions, 3) Try a different browser, 4) Check your internet connection. If issues persist, contact us.'
  }
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(faqData.map(item => item.category)))];
  const filteredFAQs = activeCategory === 'All' 
    ? faqData 
    : faqData.filter(item => item.category === activeCategory);

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      <Navbar />
      <div style={{ backgroundColor: '#111827', minHeight: '100vh', paddingTop: '100px' }}>
        <Container style={{ maxWidth: '900px', padding: '40px 20px' }}>
          <h1 style={{ color: '#f97316', marginBottom: '15px', fontSize: '2.5rem' }}>
            Frequently Asked Questions
          </h1>
          <p style={{ color: '#9ca3af', marginBottom: '30px', fontSize: '1.1rem' }}>
            Find answers to common questions about CoinsClarity
          </p>

          {/* Category Filter */}
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '10px', 
            marginBottom: '30px' 
          }}>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  setOpenIndex(null);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: activeCategory === category ? '#f97316' : '#374151',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease'
                }}
              >
                {category}
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredFAQs.map((item, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: '#1f2937',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: openIndex === index ? '1px solid #f97316' : '1px solid transparent',
                  transition: 'border-color 0.2s ease'
                }}
              >
                <button
                  onClick={() => toggleQuestion(index)}
                  style={{
                    width: '100%',
                    padding: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ 
                    color: '#fff', 
                    fontSize: '1.05rem', 
                    fontWeight: 500,
                    paddingRight: '15px'
                  }}>
                    {item.question}
                  </span>
                  {openIndex === index ? (
                    <ChevronUp size={22} color="#f97316" />
                  ) : (
                    <ChevronDown size={22} color="#9ca3af" />
                  )}
                </button>
                
                {openIndex === index && (
                  <div style={{
                    padding: '0 20px 20px 20px',
                    color: '#d1d5db',
                    lineHeight: '1.7',
                    fontSize: '0.95rem'
                  }}>
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div style={{
            marginTop: '50px',
            padding: '30px',
            backgroundColor: '#1f2937',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#fff', marginBottom: '10px' }}>Still have questions?</h3>
            <p style={{ color: '#9ca3af', marginBottom: '20px' }}>
              Can't find what you're looking for? Reach out to us!
            </p>
            <a
              href="mailto:support@coinsclarity.com"
              style={{
                display: 'inline-block',
                padding: '12px 30px',
                backgroundColor: '#f97316',
                color: '#fff',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'transform 0.2s ease'
              }}
            >
              Contact Support
            </a>
          </div>
        </Container>
      </div>
      <Footer />
    </>
  );
};

export default FAQ;

