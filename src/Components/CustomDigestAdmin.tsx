import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { DEFAULT_ADMIN_SECRET } from '../config/adminDefaults';

const SECRET_KEY = 'cc_digest_admin_secret';

type FetchJson = (path: string, init?: RequestInit) => Promise<any>;

type Props = { fetchJson: FetchJson };

const CustomDigestAdmin: React.FC<Props> = ({ fetchJson }) => {
  const [secret, setSecret] = useState(() => {
    try {
      return sessionStorage.getItem(SECRET_KEY) || DEFAULT_ADMIN_SECRET;
    } catch {
      return DEFAULT_ADMIN_SECRET;
    }
  });
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [text, setText] = useState('');
  const [telegramMessage, setTelegramMessage] = useState('');
  const [blogTitle, setBlogTitle] = useState('');
  const [blogHtml, setBlogHtml] = useState('');
  const [useDigestTemplate, setUseDigestTemplate] = useState(true);
  const [pendingMeta, setPendingMeta] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [bulkRaw, setBulkRaw] = useState('');
  const [bulkWelcome, setBulkWelcome] = useState(false);

  const persistSecret = () => {
    try {
      if (secret.trim()) sessionStorage.setItem(SECRET_KEY, secret.trim());
    } catch {}
  };

  const headers = useCallback(() => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (secret.trim()) h['x-admin-secret'] = secret.trim();
    return h;
  }, [secret]);

  const loadPending = useCallback(async () => {
    if (!secret.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      const data = await fetchJson('/api/digest/admin/custom-pending', { headers: headers() });
      if (data?.pending) {
        setSubject(data.pending.subject || '');
        setHtml(data.pending.html || '');
        setText(data.pending.text || '');
        setTelegramMessage(data.pending.telegramMessage || '');
        setBlogTitle(data.pending.blogTitle || '');
        setBlogHtml(data.pending.blogHtml || '');
        setUseDigestTemplate(data.pending.useDigestTemplate !== false);
        setPendingMeta(data.pending.updatedAt ? `Updated ${new Date(data.pending.updatedAt).toLocaleString()}` : 'Queued');
      } else {
        setPendingMeta(null);
      }
    } catch (e: any) {
      setMsg({ type: 'err', text: e?.message || 'Failed to load pending' });
    } finally {
      setLoading(false);
    }
  }, [fetchJson, headers, secret]);

  useEffect(() => {
    if (!secret.trim()) return;
    loadPending();
  }, [secret, loadPending]);

  const onSaveQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    persistSecret();
    if (!secret.trim()) {
      setMsg({ type: 'err', text: 'Set admin secret (same as backend ADMIN_SECRET).' });
      return;
    }
    if (!subject.trim() || !html.trim()) {
      setMsg({ type: 'err', text: 'Subject and HTML required.' });
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const data = await fetchJson('/api/digest/admin/custom-pending', {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({
          subject: subject.trim(),
          html,
          text,
          telegramMessage,
          blogTitle,
          blogHtml,
          useDigestTemplate,
        }),
      });
      setMsg({ type: 'ok', text: data?.message || 'Saved for next scheduled digest.' });
      await loadPending();
    } catch (e: any) {
      setMsg({ type: 'err', text: e?.message || 'Save failed' });
    } finally {
      setLoading(false);
    }
  };

  const onSendNow = async () => {
    persistSecret();
    if (!secret.trim()) {
      setMsg({ type: 'err', text: 'Set admin secret first.' });
      return;
    }
    if (!subject.trim() || !html.trim()) {
      setMsg({ type: 'err', text: 'Subject and HTML required.' });
      return;
    }
    if (!window.confirm('Send this HTML to all active newsletter subscribers now?')) return;
    setLoading(true);
    setMsg(null);
    try {
      const data = await fetchJson('/api/digest/admin/send-custom-now', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          subject: subject.trim(),
          html,
          text,
          telegramMessage,
          blogTitle,
          blogHtml,
          clearPending: false,
          useDigestTemplate,
        }),
      });
      const n = data?.newsletter;
      setMsg({
        type: 'ok',
        text: `Sent. Newsletter ok: ${n?.sent ?? 0}, errors: ${n?.errors ?? 0}. Telegram: ${data?.telegram?.sent ?? 0}. Blog: ${data?.blogPostId || '—'}`,
      });
    } catch (e: any) {
      setMsg({ type: 'err', text: e?.message || 'Send failed' });
    } finally {
      setLoading(false);
    }
  };

  const onClear = async () => {
    persistSecret();
    if (!secret.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      await fetchJson('/api/digest/admin/custom-pending', { method: 'DELETE', headers: headers() });
      setPendingMeta(null);
      setMsg({ type: 'ok', text: 'Cleared queued custom digest.' });
    } catch (e: any) {
      setMsg({ type: 'err', text: e?.message || 'Clear failed' });
    } finally {
      setLoading(false);
    }
  };

  const onBulkImport = async () => {
    persistSecret();
    if (!secret.trim()) {
      setMsg({ type: 'err', text: 'Set admin secret first.' });
      return;
    }
    if (!bulkRaw.trim()) {
      setMsg({ type: 'err', text: 'Paste at least one email.' });
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const data = await fetchJson('/api/newsletter/admin/bulk-import', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ raw: bulkRaw, sendWelcome: bulkWelcome }),
      });
      setMsg({
        type: 'ok',
        text: `Imported ${data?.imported ?? 0} addresses (${data?.invalid ?? 0} invalid). They will receive custom digest / daily ~12:00 PM IST sends like other subscribers.`,
      });
      setBulkRaw('');
    } catch (e: any) {
      setMsg({ type: 'err', text: e?.message || 'Bulk import failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-4 border-primary">
      <Card.Header>
        <strong>Daily digest — custom HTML</strong>
        <div className="small text-muted mt-1">
          Sends to everyone in <code>NewsletterSubscriber</code> (site signups + addresses you bulk-import below). Use <code>{'{EMAIL}'}</code> in links if you need per-recipient unsubscribe encoding; otherwise a footer is appended automatically.
        </div>
      </Card.Header>
      <Card.Body>
        {msg && (
          <Alert variant={msg.type === 'ok' ? 'success' : 'danger'} dismissible onClose={() => setMsg(null)}>
            {msg.text}
          </Alert>
        )}
        <Form.Group className="mb-3">
          <Form.Label>Backend admin secret</Form.Label>
          <Form.Control
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onBlur={persistSecret}
            placeholder="ADMIN_SECRET (stored in session only)"
            autoComplete="off"
          />
          <Form.Text className="text-muted">Must match server env ADMIN_SECRET. Not the blog login.</Form.Text>
        </Form.Group>

        {pendingMeta && (
          <Alert variant="info" className="py-2">
            Queued: {pendingMeta}
          </Alert>
        )}

        <Form onSubmit={onSaveQueue}>
          <Form.Group className="mb-2">
            <Form.Label>Subject</Form.Label>
            <Form.Control value={subject} onChange={(e) => setSubject(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>HTML body</Form.Label>
            <Form.Control as="textarea" rows={10} value={html} onChange={(e) => setHtml(e.target.value)} required />
          </Form.Group>
          <Form.Check
            type="checkbox"
            id="use-digest-template"
            className="mb-3"
            checked={useDigestTemplate}
            onChange={(e) => setUseDigestTemplate(e.target.checked)}
            label="Wrap in Daily digest email template (CoinsClarity header, date, tools strip, unsubscribe — matches auto digest look)"
          />
          <Form.Group className="mb-2">
            <Form.Label>Plain text (optional)</Form.Label>
            <Form.Control as="textarea" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Telegram message (optional, Markdown)</Form.Label>
            <Form.Control as="textarea" rows={3} value={telegramMessage} onChange={(e) => setTelegramMessage(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Optional blog title</Form.Label>
            <Form.Control value={blogTitle} onChange={(e) => setBlogTitle(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Optional blog HTML</Form.Label>
            <Form.Control as="textarea" rows={4} value={blogHtml} onChange={(e) => setBlogHtml(e.target.value)} />
          </Form.Group>
          <div className="d-flex flex-wrap gap-2">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
              Save for next cron / run-now
            </Button>
            <Button type="button" variant="success" disabled={loading} onClick={onSendNow}>
              Send now
            </Button>
            <Button type="button" variant="outline-secondary" disabled={loading} onClick={loadPending}>
              Reload pending
            </Button>
            <Button type="button" variant="outline-danger" disabled={loading} onClick={onClear}>
              Clear queue
            </Button>
          </div>
        </Form>

        <hr className="my-4" />
        <h6 className="mb-2">Bulk-add newsletter recipients</h6>
        <p className="small text-muted">
          One email per line (or comma-separated). They are merged into the same list as the daily digest — then use <strong>Send now</strong> or <strong>Save for next cron</strong> above. Only import opted-in addresses.
        </p>
        <Form.Group className="mb-2">
          <Form.Label>Email list</Form.Label>
          <Form.Control
            as="textarea"
            rows={6}
            value={bulkRaw}
            onChange={(e) => setBulkRaw(e.target.value)}
            placeholder={'a@x.com\nb@y.com'}
          />
        </Form.Group>
        <Form.Check
          type="checkbox"
          id="bulk-welcome"
          className="mb-3"
          checked={bulkWelcome}
          onChange={(e) => setBulkWelcome(e.target.checked)}
          label="Send welcome email to each new address (off recommended for large lists)"
        />
        <Button type="button" variant="outline-primary" disabled={loading} onClick={onBulkImport}>
          Import into subscriber list
        </Button>
      </Card.Body>
    </Card>
  );
};

export default CustomDigestAdmin;
