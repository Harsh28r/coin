import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageCircle, ThumbsDown, ThumbsUp } from 'lucide-react';
import { buildRssBackendBasesFromEnv, joinBackendPath } from '../utils/rssBackendBases';
import './NewsArticleComments.css';

export type ThreadCommentRow = {
  id: string;
  articleId?: string;
  targetKind?: string;
  targetKey?: string;
  author: string;
  body: string;
  likes: number;
  dislikes: number;
  myVote: number;
  createdAt: string;
};

type Props = {
  targetKind: 'news' | 'blog';
  targetKey: string | undefined;
};

const VOTER_LS_KEY = 'clarity_thread_voter_id';

function getOrCreateVoterId(): string {
  try {
    let v = localStorage.getItem(VOTER_LS_KEY);
    if (v && v.length >= 8) return v;
    v =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().replace(/-/g, '')
        : `${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
    localStorage.setItem(VOTER_LS_KEY, v);
    return v;
  } catch {
    return `anon_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  }
}

const safeJson = async (res: Response) => {
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t.slice(0, 160) || `HTTP ${res.status}`);
  }
  if (!ct.includes('application/json')) {
    const t = await res.text();
    throw new Error(t.slice(0, 120));
  }
  return res.json();
};

async function fetchWithBases(path: string, init?: RequestInit): Promise<Response> {
  const bases = buildRssBackendBasesFromEnv();
  let last: Error | null = null;
  for (const base of bases) {
    const url = joinBackendPath(base, path);
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(12000) });
      if (res.ok) return res;
      if (res.status !== 404) last = new Error(`HTTP ${res.status}`);
    } catch (e: any) {
      last = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw last || new Error('Network error');
}

async function postToFirstReachable(path: string, body: object): Promise<Response> {
  const bases = buildRssBackendBasesFromEnv();
  let lastErr: Error | null = null;
  for (const base of bases) {
    const url = joinBackendPath(base, path);
    try {
      return await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });
    } catch (e: any) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr || new Error('Network error');
}

const formatTime = (iso: string) => {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

const NewsArticleComments: React.FC<Props> = ({ targetKind, targetKey }) => {
  const voterId = useMemo(() => getOrCreateVoterId(), []);
  const [items, setItems] = useState<ThreadCommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [author, setAuthor] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [voteBusy, setVoteBusy] = useState<string | null>(null);

  const listQuery = useCallback(() => {
    const q = new URLSearchParams({ limit: '80', voterId });
    if (targetKind === 'news' && targetKey) {
      q.set('articleId', targetKey);
    } else if (targetKey) {
      q.set('targetKind', targetKind);
      q.set('targetKey', targetKey);
    }
    return q.toString();
  }, [targetKind, targetKey, voterId]);

  const load = useCallback(async () => {
    if (!targetKey) return;
    setLoading(true);
    setLoadErr(null);
    try {
      const res = await fetchWithBases(`/api/news-comments/list?${listQuery()}`);
      const data = await safeJson(res);
      const rows = (data.data || []) as ThreadCommentRow[];
      setItems(
        rows.map((r) => ({
          ...r,
          likes: typeof r.likes === 'number' ? r.likes : 0,
          dislikes: typeof r.dislikes === 'number' ? r.dislikes : 0,
          myVote: typeof r.myVote === 'number' ? r.myVote : 0,
        })),
      );
    } catch (e: any) {
      setLoadErr(e?.message || 'Could not load comments.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [targetKey, listQuery]);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetKey) return;
    const b = body.trim();
    if (b.length < 2) {
      setFormMsg({ type: 'err', text: 'Write at least a couple of characters.' });
      return;
    }
    setSubmitting(true);
    setFormMsg(null);
    try {
      const payload =
        targetKind === 'news'
          ? { articleId: targetKey, author: author.trim() || 'Reader', body: b }
          : { targetKind: 'blog', targetKey, author: author.trim() || 'Reader', body: b };
      const res = await postToFirstReachable('/api/news-comments', payload);
      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error('Invalid server response');
      }
      if (!res.ok) {
        throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
      }
      if (!data.success) throw new Error(data.error || 'Post failed');
      setBody('');
      setFormMsg({ type: 'ok', text: 'Posted — thanks for weighing in.' });
      if (data.comment) {
        const c = data.comment as ThreadCommentRow;
        setItems((prev) => [
          {
            ...c,
            likes: c.likes ?? 0,
            dislikes: c.dislikes ?? 0,
            myVote: c.myVote ?? 0,
          },
          ...prev,
        ]);
      } else {
        await load();
      }
    } catch (e: any) {
      setFormMsg({ type: 'err', text: e?.message || 'Could not post.' });
    } finally {
      setSubmitting(false);
    }
  };

  const sendVote = async (commentId: string, value: 1 | -1 | 0) => {
    setVoteBusy(commentId);
    try {
      const res = await postToFirstReachable('/api/news-comments/vote', {
        commentId,
        voterId,
        value,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      if (!data.success) throw new Error(data.error || 'Vote failed');
      setItems((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                likes: data.likes ?? c.likes,
                dislikes: data.dislikes ?? c.dislikes,
                myVote: typeof data.myVote === 'number' ? data.myVote : c.myVote,
              }
            : c,
        ),
      );
    } catch {
      /* silent — optional toast */
    } finally {
      setVoteBusy(null);
    }
  };

  if (!targetKey) return null;

  const isNews = targetKind === 'news';

  return (
    <section className="nc-root" aria-label="Reader comments">
      <header className="nc-head">
        <span className="nc-kicker">Community</span>
        <h2 className="nc-title">Reader discussion</h2>
        <p className="nc-sub">
          {isNews
            ? 'Public thread for this story — be respectful; plain text only.'
            : 'Thoughts on this piece — same thread for everyone reading this post.'}{' '}
          You can upvote or downvote each comment once (stored on this device).
        </p>
      </header>

      <form className="nc-form" onSubmit={onSubmit}>
        <div className="nc-form__row">
          <div className="nc-input-wrap">
            <label className="nc-label" htmlFor="nc-author">
              Display name
            </label>
            <input
              id="nc-author"
              className="nc-input"
              maxLength={48}
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Anonymous ok"
              autoComplete="nickname"
            />
          </div>
          <div className="nc-input-wrap" style={{ flex: 1 }}>
            <label className="nc-label" htmlFor="nc-body">
              Your take
            </label>
            <textarea
              id="nc-body"
              className="nc-textarea"
              maxLength={2000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Thoughts, context, or questions for other readers…"
              required
            />
          </div>
        </div>
        <div className="nc-actions">
          <button type="submit" className="nc-btn" disabled={submitting}>
            <MessageCircle size={16} strokeWidth={2.25} />
            {submitting ? 'Posting…' : 'Post comment'}
          </button>
          <span className="nc-hint">{body.length} / 2000</span>
        </div>
        {formMsg && (
          <p className={`nc-msg ${formMsg.type === 'err' ? 'nc-msg--err' : 'nc-msg--ok'}`}>{formMsg.text}</p>
        )}
      </form>

      {loading && <p className="nc-loading">Loading comments…</p>}
      {loadErr && !loading && <p className="nc-msg nc-msg--err">{loadErr}</p>}

      {!loading && !loadErr && items.length === 0 && (
        <div className="nc-empty">No comments yet — start the thread.</div>
      )}

      {!loading && items.length > 0 && (
        <ul className="nc-list">
          {items.map((c) => (
            <li key={c.id} className="nc-card">
              <div className="nc-card__meta">
                <span className="nc-card__author">{c.author || 'Reader'}</span>
                <time className="nc-card__time" dateTime={c.createdAt}>
                  {formatTime(c.createdAt)}
                </time>
              </div>
              <p className="nc-card__body">{c.body}</p>
              <div className="nc-card__votes">
                <button
                  type="button"
                  className={`nc-vote nc-vote--up ${c.myVote === 1 ? 'is-active' : ''}`}
                  disabled={voteBusy === c.id}
                  onClick={() => void sendVote(c.id, c.myVote === 1 ? 0 : 1)}
                  aria-pressed={c.myVote === 1}
                  aria-label={c.myVote === 1 ? 'Remove upvote' : 'Upvote'}
                >
                  <ThumbsUp size={15} strokeWidth={2.25} />
                  <span>{c.likes}</span>
                </button>
                <button
                  type="button"
                  className={`nc-vote nc-vote--down ${c.myVote === -1 ? 'is-active' : ''}`}
                  disabled={voteBusy === c.id}
                  onClick={() => void sendVote(c.id, c.myVote === -1 ? 0 : -1)}
                  aria-pressed={c.myVote === -1}
                  aria-label={c.myVote === -1 ? 'Remove downvote' : 'Downvote'}
                >
                  <ThumbsDown size={15} strokeWidth={2.25} />
                  <span>{c.dislikes}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default NewsArticleComments;
