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
      <Footer />
    </div>
  );
};

export default CoinpediaPartnerPage;
