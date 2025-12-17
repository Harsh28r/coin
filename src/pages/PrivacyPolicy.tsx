import React from 'react';
import { Container } from 'react-bootstrap';
import Navbar from '../Components/navbar';
import Footer from '../Components/footer';

const PrivacyPolicy: React.FC = () => {
  return (
    <>
      <Navbar />
      <div style={{ backgroundColor: '#111827', minHeight: '100vh', paddingTop: '100px' }}>
        <Container style={{ maxWidth: '900px', padding: '40px 20px' }}>
          <h1 style={{ color: '#f97316', marginBottom: '30px', fontSize: '2.5rem' }}>Privacy Policy</h1>
          <p style={{ color: '#9ca3af', marginBottom: '20px' }}>Last updated: December 17, 2024</p>
          
          <div style={{ color: '#e5e7eb', lineHeight: '1.8' }}>
            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>1. Introduction</h2>
              <p>
                Welcome to CoinsClarity ("we," "our," or "us"). We are committed to protecting your privacy 
                and personal information. This Privacy Policy explains how we collect, use, disclose, and 
                safeguard your information when you visit our website coinsclarity.com.
              </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>2. Information We Collect</h2>
              <h3 style={{ color: '#d1d5db', fontSize: '1.2rem', marginBottom: '10px' }}>Personal Information</h3>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Email address (when you subscribe to our newsletter)</li>
                <li>Name (optional, for newsletter personalization)</li>
                <li>Account credentials (if you create an account)</li>
              </ul>
              
              <h3 style={{ color: '#d1d5db', fontSize: '1.2rem', marginBottom: '10px', marginTop: '15px' }}>Automatically Collected Information</h3>
              <ul style={{ paddingLeft: '20px' }}>
                <li>IP address and location data</li>
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>Pages visited and time spent</li>
                <li>Referring website</li>
              </ul>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>3. Cookies and Tracking Technologies</h2>
              <p>
                We use cookies and similar tracking technologies to enhance your experience. These include:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                <li><strong>Essential cookies:</strong> Required for the website to function properly</li>
                <li><strong>Analytics cookies:</strong> Help us understand how visitors interact with our website (Google Analytics)</li>
                <li><strong>Advertising cookies:</strong> Used by Google AdSense to display relevant advertisements</li>
              </ul>
              <p style={{ marginTop: '15px' }}>
                For users in the European Economic Area (EEA), UK, and Switzerland, we obtain consent before 
                placing non-essential cookies through our consent management platform.
              </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>4. Google AdSense</h2>
              <p>
                We use Google AdSense to display advertisements on our website. Google AdSense uses cookies 
                to serve ads based on your prior visits to our website or other websites. You can opt out of 
                personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={{ color: '#f97316' }}>Google Ads Settings</a>.
              </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>5. How We Use Your Information</h2>
              <ul style={{ paddingLeft: '20px' }}>
                <li>To provide and maintain our services</li>
                <li>To send newsletters and updates (with your consent)</li>
                <li>To analyze website usage and improve user experience</li>
                <li>To display relevant advertisements</li>
                <li>To detect and prevent fraud or abuse</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>6. Data Sharing</h2>
              <p>We may share your information with:</p>
              <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                <li><strong>Service providers:</strong> Third parties that help us operate our website</li>
                <li><strong>Analytics partners:</strong> Google Analytics for website analytics</li>
                <li><strong>Advertising partners:</strong> Google AdSense for ad delivery</li>
                <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
              </ul>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>7. Your Rights (GDPR)</h2>
              <p>If you are in the EEA, UK, or Switzerland, you have the right to:</p>
              <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                <li>Access your personal data</li>
                <li>Rectify inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to data processing</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>8. Data Retention</h2>
              <p>
                We retain your personal information only for as long as necessary to fulfill the purposes 
                outlined in this policy, unless a longer retention period is required by law.
              </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>9. Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal 
                information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>10. Children's Privacy</h2>
              <p>
                Our website is not intended for children under 13 years of age. We do not knowingly collect 
                personal information from children under 13.
              </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>11. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by 
                posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>12. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '10px', listStyle: 'none' }}>
                {/* <li>Email: <a href="mailto:harshgupta0028@gmail.com" style={{ color: '#f97316' }}>harshgupta0028@gmail.com</a></li> */}
                <li>Website: <a href="https://coinsclarity.com" style={{ color: '#f97316' }}>coinsclarity.com</a></li>
              </ul>
            </section>
          </div>
        </Container>
      </div>
      <Footer />
    </>
  );
};

export default PrivacyPolicy;

