import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText } from 'lucide-react';
import { buildRssBackendBasesFromEnv } from '../utils/rssBackendBases';
import type { AiPaper } from '../pages/AiPapers';
import './LandingAiPapers.css';

function parseAtom(xml: string, limit = 4): AiPaper[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  return Array.from(doc.getElementsByTagName('entry'))
    .slice(0, limit)
    .map((el) => {
      const text = (tag: string) =>
        el.getElementsByTagName(tag)[0]?.textContent?.replace(/\s+/g, ' ').trim() || '';
      const idRaw = text('id');
      const m = idRaw.match(/arxiv\.org\/abs\/([0-9.]+)/i);
      const id = m?.[1] || '';
      return {
        id,
        title: text('title'),
        authors: Array.from(el.getElementsByTagName('author'))
          .map((a) => a.getElementsByTagName('name')[0]?.textContent?.trim() || '')
          .filter(Boolean),
        abstract: text('summary'),
        published: text('published'),
        categories: [],
        absUrl: `https://arxiv.org/abs/${id}`,
        pdfUrl: `https://arxiv.org/pdf/${id}.pdf`,
        source: 'arXiv',
      };
    })
    .filter((p) => p.id && p.title);
}

const LandingAiPapers: React.FC = () => {
  const [papers, setPapers] = useState<AiPaper[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const raw of buildRssBackendBasesFromEnv()) {
        if (raw.includes('c-back-seven.vercel.app')) continue;
        try {
          const res = await fetch(`${raw.replace(/\/$/, '')}/api/ai-papers?limit=4`, {
            signal: AbortSignal.timeout(10000),
          });
          if (!res.ok) continue;
          const json = await res.json();
          if (!cancelled && json?.success && Array.isArray(json.papers) && json.papers.length) {
            setPapers(json.papers.slice(0, 4));
            return;
          }
        } catch {
          /* next */
        }
      }
      try {
        const arxiv =
          'https://export.arxiv.org/api/query?search_query=' +
          encodeURIComponent('(cat:cs.AI OR cat:cs.LG OR cat:cs.CL OR cat:cs.CV)') +
          '&sortBy=submittedDate&sortOrder=descending&start=0&max_results=4';
        const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(arxiv)}`, {
          signal: AbortSignal.timeout(25000),
        });
        if (!res.ok || cancelled) return;
        const list = parseAtom(await res.text(), 4);
        if (!cancelled && list.length) setPapers(list);
      } catch {
        /* leave empty */
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
              <Link to="/ai-papers" className="lap-card">
                <span className="lap-id">{p.id}</span>
                <h3 className="lap-card-title">{p.title}</h3>
                <p className="lap-abs">
                  {p.abstract.slice(0, 140)}
                  {p.abstract.length > 140 ? '…' : ''}
                </p>
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
