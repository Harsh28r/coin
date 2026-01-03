import React from 'react';
import { Container } from 'react-bootstrap';
import Navbar from '../Components/navbar';
import Footer from '../Components/footer';

const About: React.FC = () => {
  return (
    <>
      <Navbar />
      <div style={{ backgroundColor: '#111827', minHeight: '100vh', paddingTop: '100px' }}>
        <Container style={{ maxWidth: '900px', padding: '40px 20px' }}>
          <h1 style={{ color: '#f97316', marginBottom: '30px', fontSize: '2.5rem' }}>About CoinsClarity</h1>
          
          <div style={{ color: '#e5e7eb', lineHeight: '1.8' }}>
            <section style={{ marginBottom: '35px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>Our Mission</h2>
              <p>
                CoinsClarity was founded with a simple mission: to bring clarity to the cryptocurrency world. 
                In an industry often clouded by hype, misinformation, and complexity, we strive to deliver 
                accurate, timely, and accessible information to crypto enthusiasts, investors, and newcomers alike.
              </p>
            </section>

            <section style={{ marginBottom: '35px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>What We Do</h2>
              <p style={{ marginBottom: '15px' }}>
                We provide comprehensive cryptocurrency coverage including:
              </p>
              <ul style={{ paddingLeft: '20px' }}>
                <li><strong>Breaking News:</strong> Stay updated with the latest developments in the crypto space</li>
                <li><strong>In-Depth Analysis:</strong> Go beyond headlines with our detailed market analysis</li>
                <li><strong>Market Data:</strong> Real-time prices, charts, and statistics for thousands of cryptocurrencies</li>
                <li><strong>New Listings:</strong> Be the first to know about new token listings and launches</li>
                <li><strong>Educational Content:</strong> Learn about blockchain technology, DeFi, NFTs, and more</li>
                <li><strong>Event Coverage:</strong> Track important crypto events and conferences worldwide</li>
              </ul>
            </section>

            <section style={{ marginBottom: '35px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>Our Values</h2>
              <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
                <div style={{ backgroundColor: '#1f2937', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #f97316' }}>
                  <h3 style={{ color: '#f97316', fontSize: '1.1rem', marginBottom: '8px' }}>Accuracy</h3>
                  <p style={{ margin: 0, color: '#d1d5db' }}>We verify information before publishing. Trust is earned through accuracy.</p>
                </div>
                <div style={{ backgroundColor: '#1f2937', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #f97316' }}>
                  <h3 style={{ color: '#f97316', fontSize: '1.1rem', marginBottom: '8px' }}>Transparency</h3>
                  <p style={{ margin: 0, color: '#d1d5db' }}>We clearly distinguish news from opinion and disclose any potential conflicts.</p>
                </div>
                <div style={{ backgroundColor: '#1f2937', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #f97316' }}>
                  <h3 style={{ color: '#f97316', fontSize: '1.1rem', marginBottom: '8px' }}>Accessibility</h3>
                  <p style={{ margin: 0, color: '#d1d5db' }}>Crypto shouldn't be confusing. We explain complex topics in simple terms.</p>
                </div>
                <div style={{ backgroundColor: '#1f2937', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #f97316' }}>
                  <h3 style={{ color: '#f97316', fontSize: '1.1rem', marginBottom: '8px' }}>Independence</h3>
                  <p style={{ margin: 0, color: '#d1d5db' }}>Our editorial decisions are not influenced by advertisers or sponsors.</p>
                </div>
              </div>
            </section>

            <section style={{ marginBottom: '35px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>Our Team</h2>
              <p>
                CoinsClarity is powered by a team of crypto enthusiasts, journalists, and developers who are 
                passionate about blockchain technology and its potential to transform industries. Our diverse 
                backgrounds in finance, technology, and media enable us to cover the crypto space from multiple angles.
              </p>
            </section>

            <section style={{ marginBottom: '35px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>Connect With Us</h2>
              <p style={{ marginBottom: '15px' }}>
                Join our growing community across social platforms:
              </p>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <a href="https://x.com/coinsclarity" target="_blank" rel="noopener noreferrer" 
                   style={{ padding: '10px 20px', backgroundColor: '#1f2937', color: '#fff', borderRadius: '8px', textDecoration: 'none' }}>
                  𝕏 Twitter
                </a>
                <a href="https://www.instagram.com/coinsclarity" target="_blank" rel="noopener noreferrer"
                   style={{ padding: '10px 20px', backgroundColor: '#1f2937', color: '#fff', borderRadius: '8px', textDecoration: 'none' }}>
                  Instagram
                </a>
                <a href="https://t.me/coinsclarity" target="_blank" rel="noopener noreferrer"
                   style={{ padding: '10px 20px', backgroundColor: '#1f2937', color: '#fff', borderRadius: '8px', textDecoration: 'none' }}>
                  Telegram
                </a>
                <a href="https://www.youtube.com/@coinsclarity" target="_blank" rel="noopener noreferrer"
                   style={{ padding: '10px 20px', backgroundColor: '#1f2937', color: '#fff', borderRadius: '8px', textDecoration: 'none' }}>
                  YouTube
                </a>
              </div>
            </section>

            <section>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>Disclaimer</h2>
              <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                The information provided on CoinsClarity is for informational purposes only and should not be 
                considered financial advice. Cryptocurrency investments are volatile and risky. Always do your 
                own research (DYOR) and consult with a qualified financial advisor before making any investment decisions.
              </p>
            </section>
          </div>
        </Container>
      </div>
      <Footer />
    </>
  );
};

export default About;



