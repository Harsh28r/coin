import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Mail, Megaphone, Layout, Newspaper, Sparkles, ChevronDown } from 'lucide-react';
import Navbar from './navbar';
import Footer from './footer';
import './advertise.css';

const PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'From $299',
    blurb: 'Test the channel. One focused placement, clear disclosure.',
    items: ['1 homepage or in-feed display week', 'Creative review + go-live', 'Basic delivery note'],
  },
  {
    id: 'launch',
    name: 'Launch',
    price: 'From $999',
    featured: true,
    blurb: 'Product or listing pushes that need reach + narrative.',
    items: [
      'Sponsored editorial (disclosed)',
      'Display flight (home + news)',
      'Newsletter or Telegram mention',
      'Wrap-up with delivery summary',
    ],
  },
  {
    id: 'always',
    name: 'Always-on',
    price: 'Custom',
    blurb: 'Retainer for brands that want recurring presence.',
    items: ['Monthly package mix', 'Priority calendar slots', 'Shared performance notes', 'Direct desk line'],
  },
] as const;

const FAQS = [
  {
    q: 'Do you run token / exchange ads?',
    a: 'Yes — exchanges, wallets, tools, and infrastructure. We skip scams, guaranteed-return pitches, and anything that fails a basic legitimacy check.',
  },
  {
    q: 'Is sponsored content disclosed?',
    a: 'Always. Sponsored stories are labeled. We won’t publish claims we can’t stand behind editorially.',
  },
  {
    q: 'What’s typical lead time?',
    a: 'Display can go live in a few days. Sponsored editorial usually needs 5–10 business days for brief, draft, and approval.',
  },
  {
    q: 'What creative specs do you need?',
    a: 'Display: 728×90, 300×250, 320×50. Native: 600–900 words, logo SVG/PNG, 1–2 CTAs, tracking links. We’ll send a full spec sheet after the brief.',
  },
  {
    q: 'How do payments work?',
    a: 'Invoice before go-live (crypto or fiat). Custom terms available on Always-on retainers.',
  },
] as const;

type Brief = {
  name: string;
  email: string;
  company: string;
  url: string;
  goal: string;
  budget: string;
  dates: string;
  packageId: string;
  message: string;
};

const emptyBrief: Brief = {
  name: '',
  email: '',
  company: '',
  url: '',
  goal: 'brand',
  budget: '',
  dates: '',
  packageId: 'launch',
  message: '',
};

const Advertise: React.FC = () => {
  const [brief, setBrief] = useState<Brief>(emptyBrief);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [formNote, setFormNote] = useState<string | null>(null);

  const set = (key: keyof Brief) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setBrief((b) => ({ ...b, [key]: e.target.value }));
  };

  const submitBrief = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brief.name.trim() || !brief.email.trim()) {
      setFormNote('Name and email are required.');
      return;
    }
    const pkg = PACKAGES.find((p) => p.id === brief.packageId)?.name || brief.packageId;
    const body = [
      `Name: ${brief.name}`,
      `Email: ${brief.email}`,
      `Company: ${brief.company || '—'}`,
      `URL: ${brief.url || '—'}`,
      `Goal: ${brief.goal}`,
      `Package interest: ${pkg}`,
      `Budget range: ${brief.budget || '—'}`,
      `Dates: ${brief.dates || '—'}`,
      '',
      'Brief:',
      brief.message || '—',
    ].join('\n');

    const href = `mailto:advertise@coinsclarity.com?subject=${encodeURIComponent(
      `Ad brief — ${brief.company || brief.name} (${pkg})`
    )}&body=${encodeURIComponent(body)}`;

    setFormNote('Opening your email client…');
    window.location.href = href;
  };

  return (
    <>
      <Helmet>
        <title>Advertise with CoinsClarity | Crypto Media Partnerships</title>
        <meta
          name="description"
          content="Rate card and media brief for CoinsClarity. Sponsored editorial, display, newsletter. Contact advertise@coinsclarity.com."
        />
        <link rel="canonical" href={`${window.location.origin}/advertise`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Advertise with CoinsClarity" />
        <meta
          property="og:description"
          content="Partner with CoinsClarity — editorial crypto media for traders and builders."
        />
        <meta property="og:url" content={`${window.location.origin}/advertise`} />
        <meta property="og:image" content={`${window.location.origin}/logo3.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={`${window.location.origin}/logo3.png`} />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <Navbar />

      <main className="cc-ad">
        <section className="cc-ad__hero">
          <div className="cc-ad__hero-bg" aria-hidden />
          <div className="cc-ad__hero-grid" aria-hidden />
          <div className="cc-ad__hero-inner">
            <h1 className="cc-ad__brand">
              Coins<span>Clarity</span>
            </h1>
            <p className="cc-ad__headline">Put your brand where crypto readers already decide.</p>
            <p className="cc-ad__sub">
              Sponsored stories, display, newsletter, and homepage placements. Clear rates. Fast replies.
            </p>
            <div className="cc-ad__cta-row">
              <a className="cc-ad__btn cc-ad__btn--primary" href="#brief">
                <Megaphone size={18} />
                Send a brief
              </a>
              <a className="cc-ad__btn cc-ad__btn--ghost" href="#rates">
                View rate card
              </a>
            </div>
          </div>
        </section>

        <section className="cc-ad__section">
          <span className="cc-ad__kicker">Audience</span>
          <h2 className="cc-ad__h2">Built for crypto attention</h2>
          <p className="cc-ad__lead">
            Traders, researchers, and builders who come for news, listings, and market tools — not scroll filler.
            Ask for live GA / newsletter numbers on request.
          </p>
          <div className="cc-ad__stats">
            <div className="cc-ad__stat">
              <strong>5k+</strong>
              <span>Newsletter subscribers (The Edge)</span>
            </div>
            <div className="cc-ad__stat">
              <strong>Daily</strong>
              <span>Editorial desk + market coverage</span>
            </div>
            <div className="cc-ad__stat">
              <strong>Global</strong>
              <span>EN site + India daily desk</span>
            </div>
            <div className="cc-ad__stat">
              <strong>Intent</strong>
              <span>News, tools, predictions, listings</span>
            </div>
          </div>
        </section>

        <section className="cc-ad__section">
          <span className="cc-ad__kicker">Formats</span>
          <h2 className="cc-ad__h2">Where your campaign can live</h2>
          <p className="cc-ad__lead">
            Pick one placement or a full flight. We’ll match format to awareness, launches, or conversions.
          </p>
          <div className="cc-ad__formats">
            <article className="cc-ad__format">
              <div className="cc-ad__format-icon">
                <Newspaper size={20} />
              </div>
              <h3>Sponsored editorial</h3>
              <p>Native stories that read like our desk — clear disclosure, sharp packaging, lasting SEO value.</p>
            </article>
            <article className="cc-ad__format">
              <div className="cc-ad__format-icon">
                <Layout size={20} />
              </div>
              <h3>Display & homepage</h3>
              <p>Leaderboard and in-feed on home, news, coin pages, tools. Specs: 728×90, 300×250, 320×50.</p>
            </article>
            <article className="cc-ad__format">
              <div className="cc-ad__format-icon">
                <Sparkles size={20} />
              </div>
              <h3>Newsletter & social</h3>
              <p>The Edge daily brief plus Telegram / X amplification for launches and time-bound campaigns.</p>
            </article>
          </div>
        </section>

        <section className="cc-ad__section" id="rates">
          <span className="cc-ad__kicker">Rate card</span>
          <h2 className="cc-ad__h2">Packages that close faster</h2>
          <p className="cc-ad__lead">
            Starting points — not a hard ceiling. Custom mixes welcome. All prices USD; crypto accepted.
          </p>
          <div className="cc-ad__packages">
            {PACKAGES.map((pkg) => (
              <article
                key={pkg.id}
                className={`cc-ad__package${pkg.featured ? ' cc-ad__package--featured' : ''}`}
              >
                {pkg.featured ? <span className="cc-ad__package-badge">Most booked</span> : null}
                <h3>{pkg.name}</h3>
                <p className="cc-ad__package-price">{pkg.price}</p>
                <p className="cc-ad__package-blurb">{pkg.blurb}</p>
                <ul>
                  {pkg.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <a className="cc-ad__btn cc-ad__btn--ghost cc-ad__package-cta" href={`#brief`} onClick={() => setBrief((b) => ({ ...b, packageId: pkg.id }))}>
                  Choose {pkg.name}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="cc-ad__section">
          <span className="cc-ad__kicker">Process</span>
          <h2 className="cc-ad__h2">Simple from brief to live</h2>
          <p className="cc-ad__lead">No agency theater. Fast answers, clear rates, clean creative.</p>
          <div className="cc-ad__steps">
            <div className="cc-ad__step">
              <h3>Tell us the goal</h3>
              <p>Launch, brand, listings, or product — include budget range and timeline.</p>
            </div>
            <div className="cc-ad__step">
              <h3>We propose a flight</h3>
              <p>Formats, dates, and creative specs tailored to your audience and KPI.</p>
            </div>
            <div className="cc-ad__step">
              <h3>Ship & report</h3>
              <p>We go live, monitor delivery, and send a clean wrap with what moved.</p>
            </div>
          </div>
        </section>

        <section className="cc-ad__section" id="brief">
          <span className="cc-ad__kicker">Brief</span>
          <h2 className="cc-ad__h2">Send a campaign brief</h2>
          <p className="cc-ad__lead">
            Opens your mail client to <strong style={{ color: '#fff' }}>advertise@coinsclarity.com</strong> with
            everything filled in. We usually reply within 1–2 business days.
          </p>

          <form className="cc-ad__form" onSubmit={submitBrief}>
            <div className="cc-ad__form-grid">
              <label>
                <span>Name *</span>
                <input required value={brief.name} onChange={set('name')} placeholder="Your name" autoComplete="name" />
              </label>
              <label>
                <span>Work email *</span>
                <input
                  required
                  type="email"
                  value={brief.email}
                  onChange={set('email')}
                  placeholder="you@company.com"
                  autoComplete="email"
                />
              </label>
              <label>
                <span>Company</span>
                <input value={brief.company} onChange={set('company')} placeholder="Brand / protocol" />
              </label>
              <label>
                <span>Website / product URL</span>
                <input value={brief.url} onChange={set('url')} placeholder="https://" inputMode="url" />
              </label>
              <label>
                <span>Goal</span>
                <select value={brief.goal} onChange={set('goal')}>
                  <option value="brand">Brand awareness</option>
                  <option value="launch">Product / token launch</option>
                  <option value="listing">Exchange / listing push</option>
                  <option value="leads">Signups / conversions</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>
                <span>Package</span>
                <select value={brief.packageId} onChange={set('packageId')}>
                  {PACKAGES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.price}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Budget range</span>
                <input value={brief.budget} onChange={set('budget')} placeholder="e.g. $500–1500" />
              </label>
              <label>
                <span>Target dates</span>
                <input value={brief.dates} onChange={set('dates')} placeholder="e.g. week of Aug 10" />
              </label>
            </div>
            <label className="cc-ad__form-full">
              <span>Anything else</span>
              <textarea
                rows={4}
                value={brief.message}
                onChange={set('message')}
                placeholder="Markets, creative assets, tracking needs…"
              />
            </label>
            {formNote ? <p className="cc-ad__form-note">{formNote}</p> : null}
            <button type="submit" className="cc-ad__btn cc-ad__btn--primary">
              <Mail size={18} />
              Open email brief
            </button>
          </form>
        </section>

        <section className="cc-ad__section">
          <span className="cc-ad__kicker">FAQ</span>
          <h2 className="cc-ad__h2">Straight answers</h2>
          <div className="cc-ad__faq">
            {FAQS.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={item.q} className={`cc-ad__faq-item${open ? ' is-open' : ''}`}>
                  <button
                    type="button"
                    className="cc-ad__faq-q"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? null : i)}
                  >
                    {item.q}
                    <ChevronDown size={18} />
                  </button>
                  {open ? <p className="cc-ad__faq-a">{item.a}</p> : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="cc-ad__close">
          <h2>Prefer to talk direct?</h2>
          <p>Skip the form — email the desk. Same inbox either way.</p>
          <div className="cc-ad__cta-row">
            <a
              className="cc-ad__btn cc-ad__btn--primary"
              href="mailto:advertise@coinsclarity.com?subject=Advertising%20Enquiry"
            >
              <Mail size={18} />
              advertise@coinsclarity.com
            </a>
            <a className="cc-ad__btn cc-ad__btn--ghost" href="/contact">
              Contact page
            </a>
          </div>
          <div className="cc-ad__mails">
            <a href="mailto:hello@coinsclarity.com">hello@coinsclarity.com</a>
            <a href="mailto:support@coinsclarity.com">support@coinsclarity.com</a>
            <a href="mailto:advertise@coinsclarity.com">advertise@coinsclarity.com</a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default Advertise;
