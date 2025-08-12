import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Alert, Modal } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

interface Subscriber {
  _id: string;
  email: string;
  name: string;
  subscribedAt: string;
  isActive: boolean;
  lastEmailSent: string | null;
}

const NewsletterAdmin: React.FC = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewsletterModal, setShowNewsletterModal] = useState(false);
  const [newsletterForm, setNewsletterForm] = useState({
    subject: '',
    content: '',
    template: 'newsletter'
  });
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [newsletterResult, setNewsletterResult] = useState<any>(null);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/subscribers`);
      const data = await response.json();
      
      if (data.success) {
        setSubscribers(data.data);
      } else {
        setError(data.message || 'Failed to fetch subscribers');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newsletterForm.subject.trim() || !newsletterForm.content.trim()) {
      setError('Subject and content are required');
      return;
    }

    try {
      setSendingNewsletter(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/send-newsletter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newsletterForm),
      });

      const data = await response.json();
      
      if (data.success) {
        setNewsletterResult(data);
        setNewsletterForm({ subject: '', content: '', template: 'newsletter' });
        setShowNewsletterModal(false);
        // Refresh subscribers list to update lastEmailSent
        fetchSubscribers();
      } else {
        setError(data.message || 'Failed to send newsletter');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setSendingNewsletter(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActiveSubscribersCount = () => {
    return subscribers.filter(sub => sub.isActive).length;
  };

  const getInactiveSubscribersCount = () => {
    return subscribers.filter(sub => !sub.isActive).length;
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2>Newsletter Administration</h2>
          <p className="text-muted">Manage subscribers and send newsletters</p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {newsletterResult && (
        <Alert variant="success" dismissible onClose={() => setNewsletterResult(null)}>
          <h6>Newsletter Sent Successfully!</h6>
          <p className="mb-0">
            Sent to {newsletterResult.sentCount} subscribers. 
            {newsletterResult.failedEmails.length > 0 && (
              <span className="text-warning"> {newsletterResult.failedEmails.length} emails failed to send.</span>
            )}
          </p>
        </Alert>
      )}

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-primary">{subscribers.length}</h3>
              <Card.Title>Total Subscribers</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-success">{getActiveSubscribersCount()}</h3>
              <Card.Title>Active Subscribers</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-warning">{getInactiveSubscribersCount()}</h3>
              <Card.Title>Inactive Subscribers</Card.Title>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Action Buttons */}
      <Row className="mb-4">
        <Col>
          <Button 
            variant="primary" 
            onClick={() => setShowNewsletterModal(true)}
            disabled={getActiveSubscribersCount() === 0}
          >
            <i className="bi bi-envelope-fill me-2"></i>
            Send Newsletter
          </Button>
          <Button 
            variant="outline-secondary" 
            onClick={fetchSubscribers}
            className="ms-2"
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Refresh
          </Button>
        </Col>
      </Row>

      {/* Subscribers Table */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Subscribers List</h5>
        </Card.Header>
        <Card.Body>
          {subscribers.length === 0 ? (
            <p className="text-muted text-center">No subscribers found.</p>
          ) : (
            <div className="table-responsive">
              <Table striped hover>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Subscribed</th>
                    <th>Status</th>
                    <th>Last Email</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((subscriber) => (
                    <tr key={subscriber._id}>
                      <td>{subscriber.email}</td>
                      <td>{subscriber.name || '-'}</td>
                      <td>{formatDate(subscriber.subscribedAt)}</td>
                      <td>
                        <span className={`badge ${subscriber.isActive ? 'bg-success' : 'bg-secondary'}`}>
                          {subscriber.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        {subscriber.lastEmailSent 
                          ? formatDate(subscriber.lastEmailSent)
                          : 'Never'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Newsletter Modal */}
      <Modal show={showNewsletterModal} onHide={() => setShowNewsletterModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Send Newsletter</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleNewsletterSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Subject *</Form.Label>
              <Form.Control
                type="text"
                value={newsletterForm.subject}
                onChange={(e) => setNewsletterForm({...newsletterForm, subject: e.target.value})}
                placeholder="Enter newsletter subject"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Content *</Form.Label>
              <Form.Control
                as="textarea"
                rows={8}
                value={newsletterForm.content}
                onChange={(e) => setNewsletterForm({...newsletterForm, content: e.target.value})}
                placeholder="Enter newsletter content (HTML supported)"
                required
              />
              <Form.Text className="text-muted">
                You can use HTML tags for formatting. The content will be wrapped in our newsletter template.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Template</Form.Label>
              <Form.Select
                value={newsletterForm.template}
                onChange={(e) => setNewsletterForm({...newsletterForm, template: e.target.value})}
              >
                <option value="newsletter">Newsletter Template</option>
                <option value="custom">Custom HTML</option>
              </Form.Select>
            </Form.Group>

            <Alert variant="info">
              <strong>Note:</strong> This newsletter will be sent to {getActiveSubscribersCount()} active subscribers.
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowNewsletterModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={sendingNewsletter}
            >
              {sendingNewsletter ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Sending...
                </>
              ) : (
                'Send Newsletter'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default NewsletterAdmin;
