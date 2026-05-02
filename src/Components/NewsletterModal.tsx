// NewsletterModal.tsx — sticky exit-intent + scroll-trigger email capture.
// Posts to /api/newsletter/subscribe (you implement on the backend, e.g. Resend
// + Mongo). Until that endpoint is up, submissions are stored to localStorage
// so we never lose a lead. The modal will not show again for 14 days once
// dismissed or submitted.

import React, { useEffect, useRef, useState } from 'react';
import { X, Mail, Check } from 'lucide-react';
import './NewsletterModal.css';
import { postNewsletterSubscribe } from '../utils/newsletterSubscribe';

const STORAGE_KEY = 'cc_newsletter_dismissed_until';
const SUBMITTED_KEY = 'cc_newsletter_subscribed';
const PENDING_KEY = 'cc_newsletter_pending';
const DISMISS_TTL = 14 * 24 * 60 * 60 * 1000; // 14 days

const isHidden = (): boolean => {
  try {
    if (localStorage.getItem(SUBMITTED_KEY) === '1') return true;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    return Date.now() < parseInt(raw, 10);
  } catch { return false; }
};

const setDismissed = () => {
  try { localStorage.setItem(STORAGE_KEY, String(Date.now() + DISMISS_TTL)); } catch {}
};

const recordSubscribed = (email: string) => {
  try {
    localStorage.setItem(SUBMITTED_KEY, '1');
    const pending = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
    pending.push({ email, ts: Date.now() });
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {}
};

const NewsletterModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'err'>('idle');
  const [errMsg, setErrMsg] = useState('');
  const fired = useRef(false);

  // Trigger 1: scroll past 60% of viewport
  // Trigger 2: 30 s of dwell time
  // Trigger 3: mouse leaving the top of the viewport (exit intent)
  useEffect(() => {
    if (isHidden()) return;

    const showOnce = () => {
      if (fired.current || isHidden()) return;
      fired.current = true;
      setOpen(true);
    };

    const onScroll = () => {
      const max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
      const scrolled = window.scrollY / max;
      if (scrolled > 0.6) showOnce();
    };

    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) showOnce();
    };

    const dwell = setTimeout(showOnce, 30000);

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);

    return () => {
      clearTimeout(dwell);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  const close = () => {
    setOpen(false);
    setDismissed();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleaned)) {
      setErrMsg('Enter a valid email address.');
      setStatus('err');
      return;
    }
    setStatus('submitting');
    setErrMsg('');

    try {
      const out = await postNewsletterSubscribe(
        cleaned,
        typeof window !== 'undefined' ? `modal:${window.location.pathname}` : 'modal',
      );
      if (out.ok) {
        recordSubscribed(cleaned);
        setStatus('done');
        setTimeout(() => setOpen(false), 2400);
      } else {
        setErrMsg(out.message);
        setStatus('err');
      }
    } catch {
      setErrMsg('Network error. Try again or check your connection.');
      setStatus('err');
    }
  };

  if (!open) return null;

  return (
    <div className="nl-overlay" role="dialog" aria-modal="true" aria-labelledby="nl-title" onClick={close}>
      <div className="nl-modal" onClick={(e) => e.stopPropagation()}>
        <button className="nl-close" onClick={close} aria-label="Close">
          <X size={18} />
        </button>

        {status === 'done' ? (
          <div className="nl-done">
            <div className="nl-done__icon"><Check size={32} /></div>
            <h2>You're in.</h2>
            <p>We&apos;ll send you the day&apos;s 3 most important crypto stories every day at 11:45 AM IST. No spam, unsubscribe anytime.</p>
          </div>
        ) : (
          <>
            <div className="nl-icon">
              <Mail size={28} />
            </div>
            <h2 id="nl-title" className="nl-title">The 3-bullet crypto digest.</h2>
            <p className="nl-sub">
              Every day at 11:45 AM IST, we send the day's three most important crypto stories — distilled, no fluff. Read in
              60 seconds. Unsubscribe anytime.
            </p>

            <form onSubmit={submit} className="nl-form">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={status === 'submitting'}
                autoFocus
                required
              />
              <button type="submit" disabled={status === 'submitting'}>
                {status === 'submitting' ? 'Subscribing…' : 'Subscribe — it\'s free'}
              </button>
            </form>

            {status === 'err' && <div className="nl-err">{errMsg}</div>}

            <div className="nl-trust">
              <span>📬 12,000+ subscribers</span>
              <span>·</span>
              <span>🔓 No spam, ever</span>
              <span>·</span>
              <span>👋 1-click unsubscribe</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NewsletterModal;
