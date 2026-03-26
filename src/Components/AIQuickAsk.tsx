import React, { useMemo, useState } from 'react';

const getApiBases = (): string[] => {
  const envUrl = (process.env.REACT_APP_API_URL as string) || '';
  const envBase = (process.env.REACT_APP_API_BASE_URL as string) || '';
  const sameOrigin = typeof window !== 'undefined' ? `${window.location.origin}/api` : '';
  const camify = 'https://camify.fun.coinsclarity.com/api';
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const local = /localhost|127\.0\.0\.1/i.test(host) ? 'http://localhost:5000' : '';
  return Array.from(new Set([sameOrigin, envUrl, envBase, camify, local].filter(Boolean)));
};

const AIQuickAsk: React.FC = () => {
  const [question, setQuestion] = useState('Summarize BTC market trend in 3 bullets.');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canAsk = useMemo(() => question.trim().length > 0 && !loading, [question, loading]);

  const ask = async () => {
    if (!canAsk) return;
    setLoading(true);
    setError('');
    setAnswer('');

    let lastError = 'AI request failed';

    for (const base of getApiBases()) {
      const cleanBase = String(base).replace(/\/$/, '');
      const paths = [`${cleanBase}/ai/chat`, `${cleanBase}/chat`, `${cleanBase}/ai`];
      for (const endpoint of paths) {
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: question.trim(),
              max_tokens: 220,
              temperature: 0.4,
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            lastError = data?.message || `HTTP ${res.status}`;
            continue;
          }
          const text = data?.data?.text || data?.text || '';
          if (text) {
            setAnswer(String(text).trim());
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
    <section className="container my-4" style={{ maxWidth: 1200 }}>
      <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <h5 className="m-0 fw-bold">Ask CoinsClarity AI (Hugging Face)</h5>
            <span className="badge bg-warning text-dark">Free tier ready</span>
          </div>

          <div className="d-flex gap-2 flex-column flex-md-row">
            <input
              className="form-control"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about BTC, ETH, sentiment, regulation..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  ask();
                }
              }}
            />
            <button className="btn btn-dark px-4" onClick={ask} disabled={!canAsk}>
              {loading ? 'Thinking...' : 'Ask'}
            </button>
          </div>

          {error && <div className="alert alert-danger mt-3 py-2 mb-0">{error}</div>}

          {answer && (
            <div
              className="mt-3 p-3"
              style={{
                borderRadius: 12,
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
              }}
            >
              {answer}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AIQuickAsk;
