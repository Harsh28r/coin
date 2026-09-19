/**
 * Same-origin arXiv proxy — works on Vercel without camify redeploy.
 * GET /api/ai-papers?limit=20&q=optional
 */

const DEFAULT_QUERY =
  '(cat:cs.AI OR cat:cs.LG OR cat:cs.CL OR cat:cs.CV OR cat:cs.CR OR all:blockchain OR all:cryptocurrency OR all:bitcoin)';

function strip(s) {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tagText(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? strip(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')) : '';
}

function parseArxivAtom(xml) {
  const papers = [];
  const entries = String(xml || '').split(/<entry[\s>]/i).slice(1);
  for (const raw of entries) {
    const block = raw.split(/<\/entry>/i)[0] || '';
    const idRaw = tagText(block, 'id');
    const absMatch = idRaw.match(/arxiv\.org\/abs\/([0-9.]+)(v\d+)?/i);
    const arxivId = absMatch
      ? absMatch[1]
      : (idRaw.split('/').pop() || '').replace(/v\d+$/, '');
    if (!arxivId) continue;

    const title = tagText(block, 'title');
    const abstract = tagText(block, 'summary');
    const published = tagText(block, 'published');
    const updated = tagText(block, 'updated');

    const authors = [];
    const authorBlocks = block.split(/<author[\s>]/i).slice(1);
    for (const a of authorBlocks) {
      const name = tagText(a.split(/<\/author>/i)[0] || '', 'name');
      if (name) authors.push(name);
    }

    const categories = [];
    const catRe = /<category[^>]*\bterm=["']([^"']+)["']/gi;
    let cm;
    while ((cm = catRe.exec(block)) && categories.length < 8) {
      categories.push(cm[1]);
    }

    papers.push({
      id: arxivId,
      title,
      authors,
      abstract,
      published,
      updated,
      categories,
      absUrl: `https://arxiv.org/abs/${arxivId}`,
      pdfUrl: `https://arxiv.org/pdf/${arxivId}.pdf`,
      htmlUrl: `https://arxiv.org/abs/${arxivId}`,
      source: 'arXiv',
    });
  }
  return papers;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'GET only' });

  try {
    const limit = Math.min(40, Math.max(1, Number(req.query.limit || 20)));
    const q = req.query.q ? String(req.query.q).trim() : '';
    const query = q || DEFAULT_QUERY;
    const url =
      `https://export.arxiv.org/api/query` +
      `?search_query=${encodeURIComponent(query)}` +
      `&sortBy=submittedDate&sortOrder=descending&start=0&max_results=${limit}`;

    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'CoinsClarity/1.0 (ai-papers; https://www.coinsclarity.com)',
        Accept: 'application/atom+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(18000),
    });
    if (!upstream.ok) {
      return res.status(502).json({
        success: false,
        error: `arXiv HTTP ${upstream.status}`,
      });
    }
    const xml = await upstream.text();
    const papers = parseArxivAtom(xml);

    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json({
      success: true,
      source: 'arxiv',
      query,
      count: papers.length,
      papers,
    });
  } catch (e) {
    console.error('[api/ai-papers]', e.message || e);
    return res.status(502).json({
      success: false,
      error: 'arXiv unavailable',
      detail: e.message || String(e),
    });
  }
};
