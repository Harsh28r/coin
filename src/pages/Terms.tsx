import React from 'react';
import { Container } from 'react-bootstrap';
import Navbar from '../Components/navbar';
import Footer from '../Components/footer';

const Terms: React.FC = () => {
  return (
    <>
      <Navbar />
      <div style={{ backgroundColor: '#111827', minHeight: '100vh', paddingTop: '100px' }}>
        <Container style={{ maxWidth: '900px', padding: '40px 20px' }}>
          <h1 style={{ color: '#f97316', marginBottom: '30px', fontSize: '2.5rem' }}>Terms of Service</h1>
          <p style={{ color: '#9ca3af', marginBottom: '20px' }}>Last updated: December 17, 2024</p>
          
          <div style={{ color: '#e5e7eb', lineHeight: '1.8' }}>
            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>1. Acceptance of Terms</h2>
              <p>
                By accessing and using CoinsClarity ("the Website"), you agree to be bound by these Terms of 
                Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>2. Description of Service</h2>
              <p>
                CoinsClarity provides cryptocurrency news, market data, educational content, and related 
                information services. Our services are provided "as is" and we reserve the right to modify, 
                suspend, or discontinue any part of the service at any time.
              </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>3. Not Financial Advice</h2>
              <p>
                <strong style={{ color: '#f97316' }}>Important:</strong> The content on CoinsClarity is for 
                informational purposes only and should NOT be considered as financial, investment, trading, 
                or any other type of advice. We do not recommend buying, selling, or holding any cryptocurrency 
                or financial instrument.
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '15px' }}>
                <li>Always do your own research (DYOR) before making investment decisions</li>
                <li>Consult with qualified financial advisors for personalized advice</li>
                <li>Cryptocurrency investments are highly volatile and risky</li>
                <li>You could lose some or all of your investment</li>
              </ul>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>4. User Conduct</h2>
              <p>You agree not to:</p>
              <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                <li>Use our services for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt our services</li>
                <li>Scrape, copy, or redistribute our content without permission</li>
                <li>Use automated systems to access our services excessively</li>
                <li>Impersonate others or provide false information</li>
                <li>Transmit malware or harmful code</li>
              </ul>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>5. Intellectual Property</h2>
              <p>
                All content on CoinsClarity, including text, graphics, logos, and software, is the property of 
                CoinsClarity or its content providers and is protected by intellectual property laws. You may 
                not reproduce, distribute, or create derivative works without our express written permission.
              </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>6. Third-Party Content</h2>
              <p>
                Our website may contain links to third-party websites, advertisements, and content. We do not 
                control or endorse third-party content and are not responsible for any damages arising from 
                your interaction with third parties.
              </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>7. Accuracy of Information</h2>
              <p>
                While we strive to provide accurate and up-to-date information, we make no warranties about 
                the completeness, reliability, or accuracy of any information on our website. Market data, 
                prices, and statistics may be delayed or inaccurate.
              </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>8. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, CoinsClarity and its affiliates shall not be liable 
                for any indirect, incidental, special, consequential, or punitive damages, including but not 
                limited to loss of profits, data, or other intangible losses resulting from:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                <li>Your use or inability to use our services</li>
                <li>Any investment decisions made based on our content</li>
                <li>Unauthorized access to your data</li>
                <li>Errors, mistakes, or inaccuracies in our content</li>
                <li>Any third-party conduct on our platform</li>
              </ul>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>9. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless CoinsClarity, its officers, directors, employees, 
                and agents from any claims, damages, losses, or expenses arising from your use of our services 
                or violation of these terms.
              </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>10. Newsletter & Communications</h2>
              <p>
                By subscribing to our newsletter, you consent to receive periodic emails about cryptocurrency 
                news and updates. You can unsubscribe at any time using the link provided in our emails.
              </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>11. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms of Service at any time. Changes will be effective 
                immediately upon posting. Your continued use of our services after changes constitutes 
                acceptance of the modified terms.
              </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>12. Governing Law</h2>
              <p>
                These Terms of Service shall be governed by and construed in accordance with applicable laws, 
                without regard to conflict of law principles.
              </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>13. Contact</h2>
              <p>
                For questions about these Terms of Service, please contact us at:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '10px', listStyle: 'none' }}>
                {/* <li>Email: legal@coinsclarity.com</li> */}
                <li>Email: <a href="mailto:harshgupta0028@gmail.com" style={{ color: '#f97316' }}>harshgupta0028@gmail.com</a></li>
                <li>Website: <a href="https://coinsclarity.com/contact" style={{ color: '#f97316' }}>coinsclarity.com/contact</a></li>
              </ul>
            </section>
          </div>
        </Container>
      </div>
      <Footer />
    </>
  );
};

export default Terms;

