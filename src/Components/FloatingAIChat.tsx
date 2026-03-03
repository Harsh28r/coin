import React, { useMemo, useState } from 'react';
import { Bot, X } from 'lucide-react';

const getApiBases = (): string[] => {
  const envUrl = (process.env.REACT_APP_API_URL as string) || '';
  const envBase = (process.env.REACT_APP_API_BASE_URL as string) || '';
  const sameOrigin = typeof window !== 'undefined' ? `${window.location.origin}/api` : '';
  const camify = 'https://camify.fun.coinsclarity.com/api';
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const local = /localhost|127\.0\.0\.1/i.test(host) ? 'http://localhost:5000' : '';
  return Array.from(new Set([sameOrigin, envUrl, envBase, camify, local].filter(Boolean)));
};

const FloatingAIChat: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [lastQuestion, setLastQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const canAsk = useMemo(() => question.trim().length > 0 && !loading, [question, loading]);

  const ask = async () => {
    if (!canAsk) return;
    const q = question.trim();
    setLoading(true);
    setError('');
    setAnswer('');
    setLastQuestion(q);
    let lastError = 'AI request failed';

    for (const base of getApiBases()) {
      const clean = String(base).replace(/\/$/, '');
      const urls = [`${clean}/ai/chat`, `${clean}/chat`, `${clean}/ai`];
      for (const url of urls) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: q, max_tokens: 320, temperature: 0.4 }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            lastError = data?.message || `HTTP ${res.status}`;
            continue;
          }
          const text = data?.data?.text || data?.text || '';
          if (text) {
            setAnswer(String(text).trim());
            setQuestion('');
            setLoading(false);
            return;
          }
          lastError = 'Empty AI response';
        } catch (e: any) {
          lastError = e?.message || 'Network error';
        }
      }
    }

    setError(lastError);
    setLoading(false);
  };

  return (
    <>
      {open && (
        <div
          style={{
            position: 'fixed',
            right: 16,
            bottom: 88,
            width: 'min(88vw, 330px)',
            zIndex: 9998,
            background: '#ffffff',
            borderRadius: 16,
            boxShadow: '0 20px 45px rgba(0,0,0,0.18)',
            border: '1px solid #f5d0a9',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              background: 'linear-gradient(90deg, #f59e0b 0%, #fb923c 100%)',
              color: '#111827',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
              <Bot size={18} />
              <span>CoinsClarity AI</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ border: 0, background: 'transparent', cursor: 'pointer', color: '#111827' }}
              aria-label="Close AI chat"
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: 12 }}>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about BTC, ETH, market trends..."
              rows={2}
              style={{
                width: '100%',
                resize: 'none',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                padding: 9,
                fontSize: 13,
              }}
            />
            <button
              type="button"
              onClick={ask}
              disabled={!canAsk}
              style={{
                width: '100%',
                marginTop: 8,
                border: 0,
                borderRadius: 10,
                padding: '10px 12px',
                fontWeight: 700,
                color: '#fff',
                background: canAsk ? '#111827' : '#9ca3af',
                cursor: canAsk ? 'pointer' : 'not-allowed',
              }}
            >
              {loading ? 'Thinking...' : 'Ask AI'}
            </button>
            {error && <div style={{ marginTop: 8, fontSize: 12, color: '#dc2626' }}>{error}</div>}
            {answer && (
              <div
                style={{
                  marginTop: 10,
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: 10,
                  padding: 10,
                  whiteSpace: 'pre-wrap',
                  fontSize: 13,
                  lineHeight: 1.5,
                  maxHeight: 180,
                  overflowY: 'auto',
                }}
              >
                {lastQuestion && (
                  <div style={{ fontSize: 11, color: '#9a3412', marginBottom: 6 }}>
                    Q: {lastQuestion}
                  </div>
                )}
                {answer}
              </div>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open AI assistant"
        style={{
          position: 'fixed',
          right: 16,
          bottom: 24,
          width: 52,
          height: 52,
          borderRadius: '50%',
          border: 0,
          zIndex: 9999,
          cursor: 'pointer',
          background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
          color: '#fff',
          boxShadow: '0 12px 24px rgba(234,88,12,0.35)',
        }}
      >
        <Bot size={22} style={{ marginTop: 2 }} />
      </button>
    </>
  );
};

export default FloatingAIChat;
