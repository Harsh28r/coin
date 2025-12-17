import React, { useState } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import { Mail, MapPin, MessageSquare } from 'lucide-react';
import Navbar from '../Components/navbar';
import Footer from '../Components/footer';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission - replace with actual API call
    setTimeout(() => {
      setStatus({ type: 'success', text: 'Thank you for your message! We\'ll get back to you soon.' });
      setFormData({ name: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <>
      <Navbar />
      <div style={{ backgroundColor: '#111827', minHeight: '100vh', paddingTop: '100px' }}>
        <Container style={{ maxWidth: '1000px', padding: '40px 20px' }}>
          <h1 style={{ color: '#f97316', marginBottom: '15px', fontSize: '2.5rem' }}>Contact Us</h1>
          <p style={{ color: '#9ca3af', marginBottom: '40px', fontSize: '1.1rem' }}>
            Have questions, feedback, or business inquiries? We'd love to hear from you.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
            {/* Contact Form */}
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '20px' }}>Send us a message</h2>
              
              {status && (
                <Alert variant={status.type === 'success' ? 'success' : 'danger'} className="mb-3">
                  {status.text}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ color: '#d1d5db' }}>Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff' }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label style={{ color: '#d1d5db' }}>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    style={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff' }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label style={{ color: '#d1d5db' }}>Subject</Form.Label>
                  <Form.Select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    style={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff' }}
                  >
                    <option value="">Select a topic</option>
                    <option value="general">General Inquiry</option>
                    <option value="advertising">Advertising & Partnerships</option>
                    <option value="press">Press Release Submission</option>
                    <option value="feedback">Feedback & Suggestions</option>
                    <option value="bug">Bug Report</option>
                    <option value="other">Other</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label style={{ color: '#d1d5db' }}>Message</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    style={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff', resize: 'vertical' }}
                  />
                </Form.Group>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: '#f97316',
                    border: 'none',
                    padding: '12px 30px',
                    fontWeight: 600,
                    width: '100%'
                  }}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </Form>
            </div>

            {/* Contact Info */}
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '20px' }}>Get in touch</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                <div style={{ 
                  backgroundColor: '#1f2937', 
                  padding: '25px', 
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '15px'
                }}>
                  <Mail size={24} color="#f97316" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h3 style={{ color: '#fff', fontSize: '1rem', marginBottom: '5px' }}>Email Us</h3>
                    <a href="mailto:harshgupta0028@gmail.com" style={{ color: '#d1d5db', textDecoration: 'none' }}>
                      harshgupta0028@gmail.com
                    </a>
                    <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '5px', marginBottom: 0 }}>
                      We typically respond within 24-48 hours
                    </p>
                  </div>
                </div>

                <div style={{ 
                  backgroundColor: '#1f2937', 
                  padding: '25px', 
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '15px'
                }}>
                  <MessageSquare size={24} color="#f97316" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h3 style={{ color: '#fff', fontSize: '1rem', marginBottom: '5px' }}>Social Media</h3>
                    <p style={{ color: '#d1d5db', marginBottom: '10px' }}>Follow us for instant updates</p>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <a href="https://x.com/coinsclarity" target="_blank" rel="noopener noreferrer"
                         style={{ color: '#f97316', fontSize: '0.9rem' }}>Twitter</a>
                      <span style={{ color: '#4b5563' }}>•</span>
                      <a href="https://t.me/coinsclarity" target="_blank" rel="noopener noreferrer"
                         style={{ color: '#f97316', fontSize: '0.9rem' }}>Telegram</a>
                      <span style={{ color: '#4b5563' }}>•</span>
                      <a href="https://www.instagram.com/coinsclarity" target="_blank" rel="noopener noreferrer"
                         style={{ color: '#f97316', fontSize: '0.9rem' }}>Instagram</a>
                    </div>
                  </div>
                </div>

                <div style={{ 
                  backgroundColor: '#1f2937', 
                  padding: '25px', 
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '15px'
                }}>
                  <MapPin size={24} color="#f97316" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h3 style={{ color: '#fff', fontSize: '1rem', marginBottom: '5px' }}>Location</h3>
                    <p style={{ color: '#d1d5db', marginBottom: 0 }}>
                      We're a remote-first team serving a global audience
                    </p>
                  </div>
                </div>
              </div>

              {/* Business Inquiries */}
              <div style={{ 
                marginTop: '25px',
                padding: '25px',
                backgroundColor: '#1a1a2e',
                borderRadius: '12px',
                border: '1px solid #f9731633'
              }}>
                <h3 style={{ color: '#f97316', fontSize: '1rem', marginBottom: '10px' }}>Business Inquiries</h3>
                <p style={{ color: '#d1d5db', fontSize: '0.95rem', marginBottom: '10px' }}>
                  Interested in advertising, partnerships, or press release submissions?
                </p>
                <a href="/advertise" style={{ color: '#f97316', fontWeight: 600 }}>
                  Learn about our advertising options →
                </a>
              </div>
            </div>
          </div>
        </Container>
      </div>
      <Footer />
    </>
  );
};

export default Contact;

