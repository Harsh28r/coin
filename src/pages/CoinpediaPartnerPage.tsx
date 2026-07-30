import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CoinsNavbar from '../Components/navbar';
import Footer from '../Components/footer';
import CoinpediaPartner from '../Components/CoinpediaPartner';
import '../Components/CoinpediaPartner.css';

const CoinpediaPartnerPage: React.FC = () => {
  return (
    <div className="cp-partner--page" style={{ background: 'var(--bg, #f7f5f2)' }}>
      <Helmet>
        <title>Coinpedia Partner Feed — CoinsClarity</title>
        <meta
          name="description"
          content="Official Coinpedia partnership wire on CoinsClarity. Stories attributed to Coinpedia and open on coinpedia.org."
        />
        {/* Aggregated partner content — do not compete for original SEO */}
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={`${window.location.origin}/partners/coinpedia`} />
      </Helmet>
      <CoinsNavbar />
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '1.25rem 20px 0' }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#64748b',
            textDecoration: 'none',
            marginBottom: 8,
          }}
        >
          <ArrowLeft size={16} /> Home
        </Link>
      </main>
      <CoinpediaPartner limit={18} />

      <section
        style={{
          maxWidth: 920,
          margin: '0 auto 3rem',
          padding: '0 20px',
        }}
      >
        <h2 style={{ fontSize: '1.15rem', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
          Embed widgets for Coinpedia
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 1rem' }}>
          Drop either iframe on coinpedia.org sidebars / story pages. Links back to CoinsClarity tools.
        </p>

        <p style={{ fontSize: '0.8rem', fontWeight: 700, margin: '0 0 0.35rem' }}>Fear & Greed</p>
        <pre
          style={{
            background: '#0f172a',
            color: '#e2e8f0',
            padding: '12px 14px',
            borderRadius: 8,
            fontSize: 12,
            overflow: 'auto',
            marginBottom: '1rem',
          }}
        >{`<iframe
  src="https://www.coinsclarity.com/embed/fear-greed"
  title="Fear & Greed — CoinsClarity"
  width="100%"
  height="220"
  style="border:0;border-radius:10px;overflow:hidden"
  loading="lazy"
></iframe>`}</pre>

        <p style={{ fontSize: '0.8rem', fontWeight: 700, margin: '0 0 0.35rem' }}>Live arbitrage</p>
        <pre
          style={{
            background: '#0f172a',
            color: '#e2e8f0',
            padding: '12px 14px',
            borderRadius: 8,
            fontSize: 12,
            overflow: 'auto',
          }}
        >{`<iframe
  src="https://www.coinsclarity.com/embed/arb"
  title="Arbitrage — CoinsClarity"
  width="100%"
  height="320"
  style="border:0;border-radius:10px;overflow:hidden"
  loading="lazy"
></iframe>`}</pre>
      </section>

      <Footer />
    </div>
  );
};

export default CoinpediaPartnerPage;
