# CoinsCapture — RSS / API map (REA + live inspect)

Evidence sources: REA CDP target on `https://coinscapture.com/`, public `/feeds` + `/news-feeds` HTML, first-party JS string scan, and live HTTP probes (Oct 2026).

## Ideology (how they think about content)

1. **No public data API for consumers**  
   FAQ: *“Do you offer an API for your information? No, currently we do not offer API.”*  
   They still run **private first-party JSON endpoints** for their own UI (market stats, FX, locale).

2. **Two news layers**
   - **Owned / editorial** → published as their own RSS (`feed/*.xml`) for Feedly / partners / SEO.
   - **Syndicated wire** → third-party RSS scraped server-side, shown on `/news-feeds` with **Source:** attribution and links that open the **publisher site** (nofollow). They do not rewrite those stories.

3. **Markets are bot-polled, not “API product”**  
   FAQ: bots update time-sensitive metrics ~every **5 minutes**; slower metrics daily. Rankings by **Market Cap = Price × Circulating Supply**. Images/CDN point at **CoinGecko**. Fear & Greed links to **alternative.me**.

4. **Homepage composition**
   - Top pulse: cryptocurrencies / market cap / BTC dominance (+ sentiment meters).
   - Exclusive / press / events as first-party content.
   - Syndicated wire as a separate “convenience” stream with disclaimer.

---

## A) Public RSS they publish (subscribe / redistribute of *their* content)

| Feed | URL | Notes |
|------|-----|--------|
| All News (combined) | `https://coinscapture.com/feed.xml` | Exclusive + PR + analysis mix |
| Exclusive News | `https://coinscapture.com/feed/exclusive.xml` | Original CC desk |
| Press Releases | `https://coinscapture.com/feed/press-release.xml` | Partner / industry PR |
| Blog | `https://coinscapture.com/feed/blog.xml` | Long-form / guides |
| Prediction Markets | `https://coinscapture.com/feed/prediction-markets.xml` | Extra vertical (linked from `/feeds`) |

Hub page: `https://coinscapture.com/feeds`

> Do **not** republish their exclusive XML on CoinsClarity (copyright). Mirror the *pattern*: own exclusive RSS + syndicated wire.

---

## B) Syndicated publishers seen on `/news-feeds` (Source labels)

Observed **Source:** labels and matching outbound origins:

| Source label on UI | Publisher origin | Working RSS (probed) |
|--------------------|------------------|----------------------|
| Bitcoin News | `https://news.bitcoin.com` | `https://news.bitcoin.com/feed/` ✅ |
| Blockchain News - All | `https://Blockchain.News` | `https://blockchain.news/feed` ✅ |
| CryptoNews | `https://cryptonews.com` | `https://cryptonews.com/news/feed/` ✅ |
| CryptoNewsZ | `https://www.cryptonewsz.com` | `https://www.cryptonewsz.com/feed/` ✅ |
| Decrypt | `https://decrypt.co` | `https://decrypt.co/feed` ✅ |

Live / merged UI: `https://coinscapture.com/news-feeds` and `?mode=live`  
Disclaimer on page: aggregated for convenience; each item opens the original publisher.

---

## C) First-party JSON APIs (UI only — not a public product)

From homepage / JS string scan + live GET:

| Endpoint | Role |
|----------|------|
| `https://coinscapture.com/api/home/market-stats` | Homepage market pulse (cap, spark, etc.) |
| `https://coinscapture.com/api/stats` | Stats (requires `currency` query) |
| `https://coinscapture.com/api/currencies` | FX / currency list + rates |
| `https://coinscapture.com/api/currency/change` | Switch display currency |
| `https://coinscapture.com/api/locale/detect` | Locale detect |
| `https://coinscapture.com/api/locale/set` | Set locale |
| `https://coinscapture.com/api/locale/strings` | UI string pack |
| `https://coinscapture.com/api/locale/translate` | Translation |
| `https://coinscapture.com/api/locale/dismiss` | Dismiss locale prompt |
| `https://coinscapture.com/api/newsletter/request-to-subscribe` | Newsletter |
| `https://coinscapture.com/api/ad/events` | Ad tracking |

---

## D) Third-party market / sentiment (not “their RSS”)

| Provider | Usage |
|----------|--------|
| CoinGecko CDN | `https://coin-images.coingecko.com/...` coin logos / market imagery |
| alternative.me | Fear & Greed index page / data |

---

## E) Full article body (CoinsCapture vs CoinsClarity)

CoinsCapture **exclusive** posts are written in-CMS and served as full HTML (their own `feed/*.xml`).
Syndicated `/news-feeds` items **do not** host full text — they bounce to the publisher.

CoinsClarity pattern (cleaner than bounce):

1. RSS → title / link / excerpt / `content:encoded` when present  
2. On `/news/:id`, if body looks truncated → `GET /fetch-full-article?url=`  
3. Scrape with `@extractus/article-extractor` (readability) → cheerio fallback  
4. Strip publisher chrome (related / subscribe / disclaimer markers)  
5. Render on-platform; credit Source on the article page  

Code: `back/coin-backend/fullArticleScrape.js` + `NewsDetail.tsx` enrich path.

## F) Implementation pattern (for CoinsClarity)

```
┌─────────────────────────────────────────────┐
│ Homepage                                    │
│  1. market-stats API (or CoinGecko proxy)   │
│  2. Exclusive / PR (own CMS → own RSS)      │
│  3. Events                                  │
│  4. Syndicated wire (multi-RSS merge)       │
│     - fetch each publisher RSS server-side  │
│     - normalize title/link/date/image       │
│     - show Source + open publisher URL      │
└─────────────────────────────────────────────┘
```

CoinsClarity mapping already started:

- Own desk → ExclusiveNews / EditorialHero  
- Wire → `LandingWireStrip` + `/fetch-bitcoincom-rss` (and CoinDesk / CT / NewsBTC)  
- Markets → CoinGecko via `coingeckoV3Url` + Fear & Greed (`alternative.me`)

Wired into CoinsClarity (`LandingWireStrip` + `/live` + backend):

- Shared util: `src/utils/syndicatedWire.ts` (`fetchSyndicatedWire`, `mode: 'live' | 'interleave'`)
- Homepage wire → `LandingWireStrip` (interleave)
- `/live` hub → Live wire section sorted by recency (CoinsCapture `?mode=live`)
- `/fetch-bitcoincom-rss` → `https://news.bitcoin.com/feed/`
- `/fetch-blockchainnews-rss` → `https://blockchain.news/feed`
- `/fetch-cryptonews-rss` → `https://cryptonews.com/news/feed/`
- `/fetch-cryptonewsz-rss` → `https://www.cryptonewsz.com/feed/`
- `/fetch-decrypt-rss` → `https://decrypt.co/feed`
- Fallbacks via `/fetch-rss?url=…` until camify deploys the new routes
