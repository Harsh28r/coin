import React from 'react';
import { Container } from 'react-bootstrap';
import { AlertTriangle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import Navbar from '../Components/navbar';
import Footer from '../Components/footer';

const Disclaimer: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Disclaimer | CoinsClarity - Important Legal Information</title>
        <meta name="description" content="Important disclaimer: CoinsClarity provides informational content only, not financial advice. Cryptocurrency investments are highly volatile and risky. Always do your own research (DYOR)." />
        <link rel="canonical" href={`${window.location.origin}/disclaimer`} />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Disclaimer | CoinsClarity" />
        <meta property="og:description" content="Important legal disclaimer: CoinsClarity content is for informational purposes only, not financial advice. Cryptocurrency investments carry significant risk." />
        <meta property="og:url" content={`${window.location.origin}/disclaimer`} />
        <meta property="og:image" content={`${window.location.origin}/logo3.png`} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Disclaimer | CoinsClarity" />
        <meta name="twitter:description" content="Important legal disclaimer: Not financial advice. Always DYOR." />
        
        {/* Additional SEO */}
        <meta name="keywords" content="crypto disclaimer, cryptocurrency disclaimer, not financial advice, DYOR, crypto risk warning, investment disclaimer" />
        <meta name="robots" content="index, follow" />
        
        {/* Structured Data */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Disclaimer - CoinsClarity",
          "description": "Legal disclaimer for CoinsClarity cryptocurrency news and information platform. Important information about content usage, financial advice, and investment risks.",
          "url": `${window.location.origin}/disclaimer`,
          "datePublished": "2024-12-17",
          "dateModified": "2024-12-17",
          "publisher": {
            "@type": "Organization",
            "name": "CoinsClarity",
            "url": "https://coinsclarity.com",
            "logo": {
              "@type": "ImageObject",
              "url": "https://coinsclarity.com/logo3.png"
            }
          }
        })}</script>
      </Helmet>
      <Navbar />
      <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', paddingTop: '100px', color: '#1f2937' }}>
        <Container style={{ maxWidth: '900px', padding: '40px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
            <AlertTriangle size={40} color="#f97316" />
            <h1 style={{ color: '#f97316', fontSize: '2.5rem', margin: 0 }}>Disclaimer</h1>
          </div>
          <p style={{ color: '#6b7280', marginBottom: '30px' }}>Last updated: December 17, 2024</p>
          
          <div style={{ color: '#374151', lineHeight: '1.8' }}>
            {/* Important Notice Box */}
            <div style={{ 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fca5a5',
              borderRadius: '12px', 
              padding: '25px', 
              marginBottom: '35px' 
            }}>
              <h2 style={{ color: '#dc2626', fontSize: '1.3rem', marginBottom: '15px' }}>
                ⚠️ Important Notice
              </h2>
              <p style={{ color: '#991b1b', marginBottom: 0 }}>
                <strong>Cryptocurrency investments are highly volatile and risky.</strong> The value of 
                cryptocurrencies can fluctuate significantly, and you may lose some or all of your invested 
                capital. Never invest money you cannot afford to lose.
              </p>
            </div>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#1f2937', fontSize: '1.5rem', marginBottom: '15px' }}>No Financial Advice</h2>
              <p>
                The information provided on CoinsClarity is for <strong>general informational and educational 
                purposes only</strong>. It is not intended to be and should not be construed as:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '15px' }}>
                <li>Financial advice</li>
                <li>Investment advice</li>
                <li>Trading advice</li>
                <li>Legal advice</li>
                <li>Tax advice</li>
                <li>Any other professional advice</li>
              </ul>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#1f2937', fontSize: '1.5rem', marginBottom: '15px' }}>Do Your Own Research (DYOR)</h2>
              <p>
                Before making any investment decisions, you should:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '15px' }}>
                <li>Conduct your own thorough research</li>
                <li>Consult with qualified financial advisors</li>
                <li>Understand the risks involved in cryptocurrency investments</li>
                <li>Only invest what you can afford to lose</li>
                <li>Consider your own financial situation and risk tolerance</li>
              </ul>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#1f2937', fontSize: '1.5rem', marginBottom: '15px' }}>No Guarantees</h2>
              <p>
                CoinsClarity makes no representations or warranties of any kind, express or implied, about:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '15px' }}>
                <li>The completeness, accuracy, reliability, or suitability of any information</li>
                <li>The profitability or outcome of any investment decisions</li>
                <li>The performance of any cryptocurrency or digital asset</li>
                <li>The security or legitimacy of any project mentioned</li>
              </ul>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#1f2937', fontSize: '1.5rem', marginBottom: '15px' }}>Third-Party Content</h2>
              <p>
                Our website may feature news, opinions, and information from third-party sources. We do not 
                endorse, verify, or guarantee the accuracy of third-party content. Any views expressed by 
                third parties are their own and do not necessarily reflect the views of CoinsClarity.
              </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#1f2937', fontSize: '1.5rem', marginBottom: '15px' }}>Market Data Accuracy</h2>
              <p>
                Cryptocurrency prices, market data, and statistics displayed on our website are sourced from 
                third-party providers and may be:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '15px' }}>
                <li>Delayed or not in real-time</li>
                <li>Subject to inaccuracies or errors</li>
                <li>Different from data shown on exchanges</li>
              </ul>
              <p style={{ marginTop: '15px' }}>
                Always verify prices and data on official exchange platforms before making any trading decisions.
              </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#1f2937', fontSize: '1.5rem', marginBottom: '15px' }}>Affiliate Links & Advertising</h2>
              <p>
                CoinsClarity may contain affiliate links and advertisements. We may receive compensation if 
                you click on these links or engage with advertisers. This compensation does not influence our 
                editorial content, but you should be aware of this relationship. Always conduct independent 
                research before engaging with any advertised products or services.
              </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#1f2937', fontSize: '1.5rem', marginBottom: '15px' }}>Regulatory Compliance</h2>
              <p>
                Cryptocurrency regulations vary by country and jurisdiction. It is your responsibility to 
                ensure that your activities comply with applicable laws and regulations in your jurisdiction. 
                CoinsClarity does not provide guidance on legal compliance matters.
              </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#1f2937', fontSize: '1.5rem', marginBottom: '15px' }}>Limitation of Liability</h2>
              <p>
                Under no circumstances shall CoinsClarity, its owners, employees, or affiliates be liable for 
                any direct, indirect, incidental, special, or consequential damages arising from:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '15px' }}>
                <li>Your use of information on this website</li>
                <li>Any investment decisions you make</li>
                <li>Financial losses incurred from trading or investing</li>
                <li>Reliance on any content published on this website</li>
              </ul>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#1f2937', fontSize: '1.5rem', marginBottom: '15px' }}>Updates to This Disclaimer</h2>
              <p>
                This disclaimer may be updated periodically. We encourage you to review this page regularly. 
                Continued use of our website after changes constitutes acceptance of the updated disclaimer.
              </p>
            </section>

            {/* Acknowledgment Box */}
            <div style={{ 
              backgroundColor: '#f9fafb', 
              borderRadius: '12px', 
              padding: '25px',
              borderLeft: '4px solid #f97316'
            }}>
              <h3 style={{ color: '#1f2937', fontSize: '1.1rem', marginBottom: '10px' }}>
                By using CoinsClarity, you acknowledge that:
              </h3>
              <ul style={{ paddingLeft: '20px', marginBottom: 0, color: '#4b5563' }}>
                <li>You have read and understood this disclaimer</li>
                <li>You accept full responsibility for your investment decisions</li>
                <li>You understand the risks associated with cryptocurrency</li>
                <li>CoinsClarity is not liable for any losses you may incur</li>
              </ul>
            </div>
          </div>
        </Container>
      </div>
      <Footer />
    </>
  );
};

export default Disclaimer;

