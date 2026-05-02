import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Alert, Modal } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { DEFAULT_ADMIN_SECRET } from '../config/adminDefaults';

const SECRET_STORAGE = 'cc_newsletter_admin_secret';

interface Subscriber {
  _id: string;
  email: string;
  name: string;
  subscribedAt: string;
  isActive: boolean;
  lastEmailSent: string | null;
}

const NewsletterAdmin: React.FC = () => {
  const [adminSecret, setAdminSecret] = useState(() => {
    try {
      return sessionStorage.getItem(SECRET_STORAGE) || DEFAULT_ADMIN_SECRET;
    } catch {
      return DEFAULT_ADMIN_SECRET;
    }
  });
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewsletterModal, setShowNewsletterModal] = useState(false);
  const [newsletterForm, setNewsletterForm] = useState({
    subject: '',
    content: '',
    useDigestTemplate: true,
  });
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [newsletterResult, setNewsletterResult] = useState<any>(null);

  const [blastRaw, setBlastRaw] = useState('');
  const [blastSending, setBlastSending] = useState(false);

  const getBases = (): string[] => {
    const list: string[] = [];
    const env = (process.env.REACT_APP_API_BASE_URL as string) || '';
    if (env) list.push(env.replace(/\/$/, ''));
    if (typeof window !== 'undefined') {
      list.push(window.location.origin);
      list.push(`${window.location.origin}/api`);
    }
    list.push('http://localhost:5000');
    return Array.from(new Set(list.filter(Boolean)));
  };

  const persistSecret = () => {
    try {
      if (adminSecret.trim()) sessionStorage.setItem(SECRET_STORAGE, adminSecret.trim());
    } catch {}
  };

  const adminHeaders = useCallback((): HeadersInit => {
    const h: Record<string, string> = { Accept: 'application/json' };
    if (adminSecret.trim()) h['x-admin-secret'] = adminSecret.trim();
    return h;
  }, [adminSecret]);

  const safeJson = async (res: Response) => {
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      throw new Error(`Expected JSON, got: ${text.slice(0, 160)}`);
    }
    return res.json();
  };

  const fetchSubscribers = useCallback(async () => {
    if (!adminSecret.trim()) {
      setSubscribers([]);
      setLoading(false);
      setError('Paste your backend ADMIN_SECRET below, then Refresh.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      let data: any = null;
      let lastErr: any;
      for (const base of getBases()) {
        try {
          const response = await fetch(`${base}/api/newsletter/admin/subscribers`, {
            headers: adminHeaders(),
          });
          data = await safeJson(response);
          break;
        } catch (e) {
          lastErr = e;
        }
      }
      if (!data) throw lastErr || new Error('Failed to fetch');
      if (data.success) {
        setSubscribers(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch subscribers');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error.';
      setError(`${msg} (Need ADMIN_SECRET + REACT_APP_API_BASE_URL → backend with /api/newsletter)`);
    } finally {
      setLoading(false);
    }
  }, [adminSecret, adminHeaders]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    persistSecret();
    if (!adminSecret.trim()) {
      setError('Admin secret required');
      return;
    }
    if (!newsletterForm.subject.trim() || !newsletterForm.content.trim()) {
      setError('Subject and content are required');
      return;
    }
    try {
      setSendingNewsletter(true);
      setError(null);
      let data: any = null;
      let lastErr: any;
      for (const base of getBases()) {
        try {
          const response = await fetch(`${base}/api/newsletter/admin/broadcast-all`, {
            method: 'POST',
            headers: { ...adminHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subject: newsletterForm.subject.trim(),
              html: newsletterForm.content,
              text: '',
              useDigestTemplate: newsletterForm.useDigestTemplate,
            }),
          });
          data = await safeJson(response);
          break;
        } catch (e) {
          lastErr = e;
        }
      }
      if (!data) throw lastErr || new Error('Failed to send');
      if (data.success) {
        setNewsletterResult(data);
        setNewsletterForm({ subject: '', content: '', useDigestTemplate: true });
        setShowNewsletterModal(false);
        fetchSubscribers();
      } else {
        setError(data.message || 'Failed to send newsletter');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error.';
      setError(msg);
    } finally {
      setSendingNewsletter(false);
    }
  };

  const handleBlastToList = async (e: React.FormEvent) => {
    e.preventDefault();
    persistSecret();
    if (!adminSecret.trim()) {
      setError('Admin secret required');
      return;
    }
    if (!newsletterForm.subject.trim() || !newsletterForm.content.trim()) {
      setError('Subject and HTML body required (use fields below).');
      return;
    }
    if (!blastRaw.trim()) {
      setError('Paste or upload at least one email address.');
      return;
    }
    try {
      setBlastSending(true);
      setError(null);
      let data: any = null;
      let lastErr: any;
      for (const base of getBases()) {
        try {
          const response = await fetch(`${base}/api/newsletter/admin/send-to-list`, {
            method: 'POST',
            headers: { ...adminHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({
              raw: blastRaw,
              subject: newsletterForm.subject.trim(),
              html: newsletterForm.content,
              text: '',
              useDigestTemplate: newsletterForm.useDigestTemplate,
            }),
          });
          data = await safeJson(response);
          break;
        } catch (e) {
          lastErr = e;
        }
      }
      if (!data) throw lastErr || new Error('Failed to send');
      if (data.success) {
        setNewsletterResult(data);
        setBlastRaw('');
      } else {
        setError(data.message || 'Send failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error.');
    } finally {
      setBlastSending(false);
    }
  };

  const onPickFile = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const t = String(reader.result || '');
      setBlastRaw((prev) => (prev ? `${prev.trim()}\n${t}` : t));
    };
    reader.readAsText(f);
    ev.target.value = '';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActiveSubscribersCount = () => subscribers.filter((sub) => sub.isActive).length;

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
          <h2>Newsletter administration</h2>
          <p className="text-muted">
            Same list as daily digest (<code>NewsletterSubscriber</code>). Import addresses in the custom digest card
            above, or send a one-off story to a pasted list here.
          </p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {newsletterResult && (
        <Alert variant="success" dismissible onClose={() => setNewsletterResult(null)}>
          <h6 className="mb-1">Send finished</h6>
          <p className="mb-0 small">
            Sent: <strong>{newsletterResult.sentCount ?? 0}</strong>
            {(newsletterResult.failedEmails?.length ?? 0) > 0 && (
              <span className="text-warning">
                {' '}
                · Failed: {newsletterResult.failedEmails.length} (check provider quotas / invalid addresses)
              </span>
            )}
            {newsletterResult.totalRecipients != null && (
              <span> · Recipients in batch: {newsletterResult.totalRecipients}</span>
            )}
            {newsletterResult.totalSubscribers != null && (
              <span> · Active in DB: {newsletterResult.totalSubscribers}</span>
            )}
          </p>
        </Alert>
      )}

      <Card className="mb-4">
        <Card.Header>Backend access</Card.Header>
        <Card.Body>
          <Form.Group>
            <Form.Label>
              Admin secret <small className="text-muted">(same as ADMIN_SECRET on server)</small>
            </Form.Label>
            <Form.Control
              type="password"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              onBlur={persistSecret}
              placeholder="x-admin-secret"
              autoComplete="off"
            />
          </Form.Group>
          <Button variant="outline-secondary" size="sm" className="mt-2" onClick={() => fetchSubscribers()}>
            Reload subscribers
          </Button>
        </Card.Body>
      </Card>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-primary">{subscribers.length}</h3>
              <Card.Title>Total rows</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-success">{getActiveSubscribersCount()}</h3>
              <Card.Title>Active</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-secondary">{subscribers.length - getActiveSubscribersCount()}</h3>
              <Card.Title>Inactive</Card.Title>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col>
          <Button
            variant="primary"
            onClick={() => setShowNewsletterModal(true)}
            disabled={getActiveSubscribersCount() === 0 || !adminSecret.trim()}
          >
            Send story to all DB subscribers
          </Button>
        </Col>
      </Row>

      <Card className="mb-4 border-warning">
        <Card.Header>
          <strong>Direct send — pasted / uploaded list only</strong>
        </Card.Header>
        <Card.Body>
          <p className="small text-muted">
            Does <strong>not</strong> add addresses to the database. Only use for <strong>opt-in</strong> contacts. One
            address per line, or comma-separated. Optional: load a <code>.txt</code> / <code>.csv</code> file (first
            column or raw lines).
          </p>
          <Form onSubmit={handleBlastToList}>
            <Form.Group className="mb-2">
              <Form.Label>Recipient list</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                value={blastRaw}
                onChange={(e) => setBlastRaw(e.target.value)}
                placeholder={'reader1@example.com\nreader2@example.com'}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="me-2">Or upload file</Form.Label>
              <Form.Control type="file" accept=".txt,.csv,text/plain,text/csv" onChange={onPickFile} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Subject</Form.Label>
              <Form.Control
                value={newsletterForm.subject}
                onChange={(e) => setNewsletterForm({ ...newsletterForm, subject: e.target.value })}
                placeholder="Email subject line"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>HTML story</Form.Label>
              <Form.Control
                as="textarea"
                rows={10}
                value={newsletterForm.content}
                onChange={(e) => setNewsletterForm({ ...newsletterForm, content: e.target.value })}
                placeholder="<p>Your story HTML…</p>"
              />
            </Form.Group>
            <Form.Check
              type="checkbox"
              id="blast-digest-wrap"
              className="mb-3"
              checked={newsletterForm.useDigestTemplate}
              onChange={(e) => setNewsletterForm({ ...newsletterForm, useDigestTemplate: e.target.checked })}
              label="Wrap in CoinsClarity digest-style template (header, tools strip, unsubscribe)"
            />
            <Button type="submit" variant="warning" disabled={blastSending || !adminSecret.trim()}>
              {blastSending ? 'Sending…' : 'Send to pasted list now'}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h5 className="mb-0">Subscribers (Mongo)</h5>
        </Card.Header>
        <Card.Body>
          {subscribers.length === 0 ? (
            <p className="text-muted text-center mb-0">No rows — wrong secret, empty list, or DB unreachable.</p>
          ) : (
            <div className="table-responsive">
              <Table striped hover size="sm">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Subscribed</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((subscriber) => (
                    <tr key={subscriber._id}>
                      <td>{subscriber.email}</td>
                      <td>{formatDate(subscriber.subscribedAt)}</td>
                      <td>
                        <span className={`badge ${subscriber.isActive ? 'bg-success' : 'bg-secondary'}`}>
                          {subscriber.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={showNewsletterModal} onHide={() => setShowNewsletterModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Send story to all active DB subscribers</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleNewsletterSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Subject *</Form.Label>
              <Form.Control
                type="text"
                value={newsletterForm.subject}
                onChange={(e) => setNewsletterForm({ ...newsletterForm, subject: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>HTML body *</Form.Label>
              <Form.Control
                as="textarea"
                rows={10}
                value={newsletterForm.content}
                onChange={(e) => setNewsletterForm({ ...newsletterForm, content: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Check
              type="checkbox"
              id="modal-digest-wrap"
              className="mb-3"
              checked={newsletterForm.useDigestTemplate}
              onChange={(e) => setNewsletterForm({ ...newsletterForm, useDigestTemplate: e.target.checked })}
              label="Wrap in digest-style template"
            />
            <Alert variant="info" className="py-2 mb-0 small">
              Sends to <strong>{getActiveSubscribersCount()}</strong> active addresses via your configured mail
              providers (Brevo / MailerSend / Resend).
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowNewsletterModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={sendingNewsletter}>
              {sendingNewsletter ? 'Sending…' : 'Send'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default NewsletterAdmin;
