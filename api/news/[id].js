// Vercel Serverless Function for news article OG tags
// Route: /api/news/:id

export default async function handler(req, res) {
  const { id } = req.query;
  const userAgent = req.headers['user-agent'] || '';
  
  // Crawler detection
  const crawlers = ['facebookexternalhit', 'Twitterbot', 'WhatsApp', 'LinkedInBot', 
                    'Slackbot', 'TelegramBot', 'Discordbot', 'Pinterest', 'Googlebot'];
  const isCrawler = crawlers.some(bot => userAgent.toLowerCase().includes(bot.toLowerCase()));

  // If not a crawler, redirect to the SPA
  if (!isCrawler) {
    return res.redirect(307, `/news/${id}`);
  }

  try {
    const CAMIFY_BASE = 'https://camify.fun.coinsclarity.com';
    const endpoints = [
      '/fetch-cryptoslate-rss?limit=50',
      '/fetch-cointelegraph-rss?limit=50',
      '/fetch-all-rss?limit=100',
      '/posts',
    ];

    let article = null;

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${CAMIFY_BASE}${endpoint}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            article = data.data.find(item => 
              item.article_id === id || item._id === id
            );
            if (article) break;
          }
        }
      } catch (e) {}
    }

    const title = article?.title || 'CoinsClarity – Crypto News';
    const description = (article?.description || article?.content?.substring(0, 160) || 
                        'Real-time crypto news, listings, and market data.').replace(/<[^>]*>/g, '');
    const image = article?.image_url || article?.imageUrl || 'https://coinsclarity.com/logo3.png';
    const url = `https://coinsclarity.com/news/${id}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escape(title)} | CoinsClarity</title>
  <meta name="description" content="${escape(description)}">
  <link rel="icon" href="https://coinsclarity.com/logo3.png">
  
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="CoinsClarity">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:image" content="${escape(image)}">
  <meta property="og:url" content="${url}">
  
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@coinsclarity">
  <meta name="twitter:title" content="${escape(title)}">
  <meta name="twitter:description" content="${escape(description)}">
  <meta name="twitter:image" content="${escape(image)}">
  
  <script>window.location.href = "/news/${id}";</script>
</head>
<body>
  <p>Loading article...</p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (error) {
    res.redirect(307, `/news/${id}`);
  }
}

function escape(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


