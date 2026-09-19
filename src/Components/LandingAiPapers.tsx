import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText } from 'lucide-react';
import { buildRssBackendBasesFromEnv } from '../utils/rssBackendBases';
import type { AiPaper } from '../pages/AiPapers';
import './LandingAiPapers.css';

const LandingAiPapers: React.FC = () => {
  const [papers, setPapers] = useState<AiPaper[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const urls = [
        '/api/ai-papers?limit=4',
        ...buildRssBackendBasesFromEnv()
          .filter((b) => !b.includes('c-back-seven.vercel.app'))
          .map((b) => `${b.replace(/\/$/, '')}/api/ai-papers?limit=4`),
      ];
      for (const url of urls) {
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
          if (!res.ok) continue;
          const json = await res.json();
          if (!cancelled && json?.success && Array.isArray(json.papers)) {
            setPapers(json.papers.slice(0, 4));
            return;
          }
        } catch {
          /* next */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!papers.length) return null;

  return (
    <section className="lap" aria-labelledby="lap-heading">
      <div className="lap-inner">
        <header className="lap-head">
          <div>
            <span className="lap-eyebrow">Research</span>
            <h2 id="lap-heading" className="lap-title">
              Today&apos;s AI research papers
            </h2>
            <p className="lap-sub">
              Fresh arXiv drops — full abstract on site, PDF for the whole paper.
            </p>
          </div>
          <Link to="/ai-papers" className="lap-all">
            All papers <ArrowRight size={14} />
          </Link>
        </header>
        <ul className="lap-grid">
          {papers.map((p) => (
            <li key={p.id}>
              <Link to="/ai-papers" className="lap-card" state={{ focusId: p.id }}>
                <span className="lap-id">{p.id}</span>
                <h3 className="lap-card-title">{p.title}</h3>
                <p className="lap-abs">{p.abstract.slice(0, 140)}{p.abstract.length > 140 ? '…' : ''}</p>
                <span className="lap-pdf">
                  <FileText size={13} /> Full PDF on desk →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default LandingAiPapers;
