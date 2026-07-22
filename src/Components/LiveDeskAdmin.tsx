import React, { useCallback, useEffect, useState } from 'react';
import { Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { DEFAULT_ADMIN_SECRET } from '../config/adminDefaults';
import {
  adminAppendLiveUpdate,
  adminCreateLiveThread,
  adminPatchLiveThread,
  adminSeedLiveDemo,
  listLiveThreads,
  type LiveThread,
} from '../services/liveApi';

const SECRET_KEY = 'cc_digest_admin_secret';

const LiveDeskAdmin: React.FC = () => {
  const [secret, setSecret] = useState(() => {
    try {
      return sessionStorage.getItem(SECRET_KEY) || DEFAULT_ADMIN_SECRET;
    } catch {
      return DEFAULT_ADMIN_SECRET;
    }
  });
  const [threads, setThreads] = useState<LiveThread[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [status, setStatus] = useState<'upcoming' | 'live' | 'ended'>('upcoming');

  const [activeSlug, setActiveSlug] = useState('');
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateHtml, setUpdateHtml] = useState('');
  const [updateKind, setUpdateKind] = useState('update');

  const persistSecret = () => {
    try {
      if (secret.trim()) sessionStorage.setItem(SECRET_KEY, secret.trim());
    } catch {}
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listLiveThreads({ limit: 50 });
      setThreads(list);
      if (!activeSlug && list[0]?.slug) setActiveSlug(list[0].slug);
    } catch (e: any) {
      setMsg({ type: 'err', text: e?.message || 'Failed to list threads' });
    } finally {
      setLoading(false);
    }
  }, [activeSlug]);

  useEffect(() => {
    refresh();
  }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    persistSecret();
    if (!title.trim()) {
      setMsg({ type: 'err', text: 'Title required' });
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const t = await adminCreateLiveThread(secret.trim(), {
        title: title.trim(),
        slug: slug.trim() || undefined,
        summary: summary.trim(),
        status,
        authorSlug: 'elena-vasquez',
        authorName: 'Elena Vasquez',
      });
      setMsg({ type: 'ok', text: `Created /live/${t.slug}` });
      setTitle('');
      setSlug('');
      setSummary('');
      setActiveSlug(t.slug);
      await refresh();
    } catch (e: any) {
      setMsg({ type: 'err', text: e?.response?.data?.error || e?.message || 'Create failed' });
    } finally {
      setLoading(false);
    }
  };

  const onAppend = async (e: React.FormEvent) => {
    e.preventDefault();
    persistSecret();
    if (!activeSlug || !updateTitle.trim()) {
      setMsg({ type: 'err', text: 'Pick a thread and write an update title' });
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      await adminAppendLiveUpdate(secret.trim(), activeSlug, {
        title: updateTitle.trim(),
        html: updateHtml.trim() || undefined,
        kind: updateKind,
      });
      setMsg({ type: 'ok', text: `Update posted on /live/${activeSlug}` });
      setUpdateTitle('');
      setUpdateHtml('');
      await refresh();
    } catch (e: any) {
      setMsg({ type: 'err', text: e?.response?.data?.error || e?.message || 'Append failed' });
    } finally {
      setLoading(false);
    }
  };

  const onStatus = async (s: 'live' | 'ended' | 'upcoming') => {
    if (!activeSlug) return;
    persistSecret();
    setLoading(true);
    try {
      await adminPatchLiveThread(secret.trim(), activeSlug, { status: s });
      setMsg({ type: 'ok', text: `Status → ${s}` });
      await refresh();
    } catch (e: any) {
      setMsg({ type: 'err', text: e?.message || 'Status update failed' });
    } finally {
      setLoading(false);
    }
  };

  const onSeed = async () => {
    persistSecret();
    setLoading(true);
    setMsg(null);
    try {
      const t = await adminSeedLiveDemo(secret.trim(), false);
      setMsg({ type: 'ok', text: t ? `Demo ready: /live/${t.slug}` : 'Seeded' });
      if (t?.slug) setActiveSlug(t.slug);
      await refresh();
    } catch (e: any) {
      setMsg({ type: 'err', text: e?.response?.data?.error || e?.message || 'Seed failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column gap-3">
      <Card>
        <Card.Body>
          <Card.Title className="d-flex align-items-center justify-content-between">
            <span>Live Desk</span>
            {loading && <Spinner size="sm" animation="border" />}
          </Card.Title>
          <p className="text-muted small mb-3">
            Coinpedia-style LIVE threads. Create a thread, then append timestamped updates. Public:
            <code className="ms-1">/live</code>
          </p>
          {msg && (
            <Alert variant={msg.type === 'ok' ? 'success' : 'danger'} className="py-2">
              {msg.text}
            </Alert>
          )}
          <Form.Group className="mb-3">
            <Form.Label>Admin secret</Form.Label>
            <Form.Control
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              onBlur={persistSecret}
            />
          </Form.Group>
          <Button variant="outline-secondary" size="sm" onClick={onSeed} className="me-2">
            Seed Fed demo thread
          </Button>
          <Button variant="outline-primary" size="sm" onClick={refresh}>
            Refresh list
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <Card.Title>Create thread</Card.Title>
          <Form onSubmit={onCreate}>
            <Form.Group className="mb-2">
              <Form.Label>Title</Form.Label>
              <Form.Control value={title} onChange={(e) => setTitle(e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Slug (optional)</Form.Label>
              <Form.Control
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="fomc-june-2026-live"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Summary</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
              >
                <option value="upcoming">upcoming</option>
                <option value="live">live</option>
                <option value="ended">ended</option>
              </Form.Select>
            </Form.Group>
            <Button type="submit" variant="dark" disabled={loading}>
              Create
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <Card.Title>Append update</Card.Title>
          <Form.Group className="mb-2">
            <Form.Label>Thread</Form.Label>
            <Form.Select value={activeSlug} onChange={(e) => setActiveSlug(e.target.value)}>
              <option value="">Select…</option>
              {threads.map((t) => (
                <option key={t.slug} value={t.slug}>
                  [{t.status}] {t.title} ({t.updateCount || 0})
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          {activeSlug && (
            <div className="mb-3 d-flex gap-2 flex-wrap">
              <Button size="sm" variant="danger" onClick={() => onStatus('live')}>
                Mark LIVE
              </Button>
              <Button size="sm" variant="secondary" onClick={() => onStatus('ended')}>
                End thread
              </Button>
              <Badge bg="light" text="dark" className="align-self-center">
                /live/{activeSlug}
              </Badge>
            </div>
          )}
          <Form onSubmit={onAppend}>
            <Form.Group className="mb-2">
              <Form.Label>Update headline</Form.Label>
              <Form.Control
                value={updateTitle}
                onChange={(e) => setUpdateTitle(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>HTML body (optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={updateHtml}
                onChange={(e) => setUpdateHtml(e.target.value)}
                placeholder="<p>What just happened…</p>"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Kind</Form.Label>
              <Form.Select value={updateKind} onChange={(e) => setUpdateKind(e.target.value)}>
                <option value="update">update</option>
                <option value="alert">alert</option>
                <option value="summary">summary</option>
              </Form.Select>
            </Form.Group>
            <Button type="submit" variant="danger" disabled={loading || !activeSlug}>
              Post update
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default LiveDeskAdmin;
