// src/components/ScrollingStats.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, useRef } from 'react';
import { CryptoStat as CryptoStatComponent } from './CryptoStats';
import { Nav, NavDropdown } from 'react-bootstrap';
import React from 'react';
import 'font-awesome/css/font-awesome.min.css';
import axios from 'axios';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'; // Import skeleton CSS
import { useLanguage } from '../context/LanguageContext';
import CoinTicker from './CoinTicker';
// Import Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, User } from 'firebase/auth';

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBihukpSoBFphMnUD4bX6gWBC8zVu_76Bs",
  authDomain: "dazzling-being-395413.firebaseapp.com",
  projectId: "dazzling-being-395413",
  storageBucket: "dazzling-being-395413.firebasestorage.app",
  messagingSenderId: "1067678083591",
  appId: "1:1067678083591:web:8baf5d4979ce1dae09d8a2",
  measurementId: "G-GWNVGYWWYB"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Define the expected structure of the response data
interface CryptoData {
  symbol: string;
  priceUsd: string;
  changePercent24Hr: string;
}

interface ApiResponse {
  data: CryptoData[];
}

interface BackendApiResponse {
  success: boolean;
  data: {
    symbol: string;
    current_price: number;
    price_change_percentage_24h: number;
  }[];
  fallback?: boolean;
  message?: string;
  timestamp: string;
}

// Update the CryptoStatComponent prop type
interface CryptoStatProps {
  price: number;
  change: number;
  symbol: React.ReactNode;
}

export const ScrollingStats = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrollingStats, setScrollingStats] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true); // Add loading state
  const [user, setUser] = useState<User | null>(null);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const itemsToShow = 15;
  const didInitRef = useRef(false);
  const { currentLanguage, setLanguage } = useLanguage();
  const [isMobile, setIsMobile] = useState(false);

  const formatPrice = (p: string) => {
    const n = Number(p);
    if (Number.isNaN(n)) return p;
    return n >= 1 ? `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `$${n.toFixed(6)}`;
  };
  const formatChange = (c: string) => {
    const n = Number(c);
    if (Number.isNaN(n)) return c;
    return `${n.toFixed(2)}%`;
  };

  const fetchCryptoData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch directly from CoinGecko for real-time rates
      const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 20,
          page: 1,
          price_change_percentage: '24h'
        }
      });
      if (Array.isArray(response.data)) {
        const data: CryptoData[] = response.data.map((item: any) => ({
          symbol: String(item.symbol || '').toUpperCase(),
          priceUsd: String(item.current_price ?? ''),
          changePercent24Hr: String(item.price_change_percentage_24h ?? '0'),
        }));
        setScrollingStats(data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      // Fallback data for scrolling
      const fallbackData = [
        { symbol: 'BTC', priceUsd: '45000.00', changePercent24Hr: '2.5' },
        { symbol: 'ETH', priceUsd: '3200.00', changePercent24Hr: '1.8' },
        { symbol: 'BNB', priceUsd: '320.00', changePercent24Hr: '0.8' },
        { symbol: 'ADA', priceUsd: '0.48', changePercent24Hr: '-1.2' },
        { symbol: 'SOL', priceUsd: '24.50', changePercent24Hr: '3.2' },
        { symbol: 'DOT', priceUsd: '7.20', changePercent24Hr: '-0.5' },
        { symbol: 'DOGE', priceUsd: '0.085', changePercent24Hr: '4.1' },
        { symbol: 'AVAX', priceUsd: '15.30', changePercent24Hr: '2.8' },
        { symbol: 'MATIC', priceUsd: '0.92', changePercent24Hr: '1.5' },
        { symbol: 'LINK', priceUsd: '12.80', changePercent24Hr: '-0.8' }
      ];
      setScrollingStats(fallbackData);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch once on mount (guard StrictMode double-invoke)
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    fetchCryptoData();
  }, [fetchCryptoData]);

  // Detect mobile viewport for responsive sizing
  useEffect(() => {
    const check = () => {
      if (typeof window === 'undefined') return;
      setIsMobile(window.innerWidth <= 640);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Complete redirect-based sign-in if needed
  useEffect(() => {
    let mounted = true;
    getRedirectResult(auth)
      .then((result) => {
        if (!mounted || !result) return;
        if (result.user) setUser(result.user);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('getRedirectResult error', err);
      });
    return () => { mounted = false; };
  }, []);

  // Refresh data every 30s for real-time updates
  useEffect(() => {
    const id = setInterval(fetchCryptoData, 30000);
    return () => clearInterval(id);
  }, [fetchCryptoData]);

  // Independent ticker timer (do not re-create on every render)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const len = Math.max(scrollingStats.length, 1);
        return (prev + 1) % len;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, [scrollingStats.length]);

  const handleUserClick = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      setUser(user);
    } catch (error) {
      console.error('Firebase sign-in failed', error);
      const err: any = error || {};
      const code = err.code || 'unknown';
      const message = err.message || 'Sign-in failed. Please try again.';
      // If popups are blocked or environment doesn't support popups, try redirect flow
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr) {
          console.error('Firebase redirect sign-in failed', redirectErr);
        }
      }
      alert(`Sign-in error (${code}). If this happens only in production, ensure your deployed domain is added under Firebase Auth > Settings > Authorized domains and that the site uses HTTPS.\n\nDetails: ${message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setShowProfileCard(false);
    } catch (error) {
      console.error('Sign out failed', error);
    }
  };

  const toggleProfileCard = () => {
    setShowProfileCard((prev) => !prev);
  };

  const edgeWidth = isMobile ? 4 : 20;
  const reservedRight = isMobile ? '110px' : '80px';
  const languageFontSize = isMobile ? '0.9em' : '1em';
  const userIconSize = isMobile ? '1.4em' : '1.7em';

  return (
    <div style={{ width: '95%', margin: '0 auto' }} className="relative h-12 bg-white rounded-lg overflow-hidden d-flex align-items-center">
      {/* Edge fades */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: `${edgeWidth}px`,
        background: 'linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)', zIndex: 2
      }} />
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: `${edgeWidth}px`,
        background: 'linear-gradient(270deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)', zIndex: 2
      }} />

      {/* Full-width ticker area with slight left padding and space for right controls */}
      <div style={{ flex: 1, paddingLeft: `${edgeWidth}px`, paddingRight: reservedRight, overflow: 'hidden' }}>
        <CoinTicker fixed={false} height={48} perPage={20} />
      </div>

      <div className="position-absolute d-flex align-items-center" style={{ zIndex: 3, right: 16 }}>
        <Nav className="flex-nowrap align-items-center justify-content-end">
          <NavDropdown
            title={isMobile
              ? <i className="fa fa-globe" aria-hidden="true" style={{ fontSize: languageFontSize, color: '#111' }} />
              : <span className="text-black" style={{ fontSize: languageFontSize }}>{currentLanguage.toUpperCase()}</span>
            }
            id="language-dropdown-ticker"
            onSelect={(key) => {
              const k = (key || '').toString();
              const allowed = ['en','hi','es','fr','de','zh','ja','ko','ar'];
              if (allowed.includes(k)) setLanguage(k as any);
            }}
          >
            <NavDropdown.Item eventKey="en">English</NavDropdown.Item>
            <NavDropdown.Item eventKey="hi">हिंदी</NavDropdown.Item>
            <NavDropdown.Item eventKey="es">Español</NavDropdown.Item>
            <NavDropdown.Item eventKey="fr">Français</NavDropdown.Item>
            <NavDropdown.Item eventKey="de">Deutsch</NavDropdown.Item>
            <NavDropdown.Item eventKey="zh">中文</NavDropdown.Item>
            <NavDropdown.Item eventKey="ja">日本語</NavDropdown.Item>
            <NavDropdown.Item eventKey="ko">한국어</NavDropdown.Item>
            <NavDropdown.Item eventKey="ar">العربية</NavDropdown.Item>
          </NavDropdown>
          {!user ? (
            <i
              className="fa fa-user"
              aria-hidden="true"
              title="Sign in"
              onClick={handleUserClick}
              style={{ fontSize: userIconSize, cursor: 'pointer', color: '#111' }}
            />
          ) : (
            <li
              className="nav-item dropdown hdr-dropdown mt-0 signList"
              onMouseEnter={toggleProfileCard}
              onMouseLeave={() => setShowProfileCard(false)}
              style={{ position: 'relative' }}
            >
              <button
                className="nav-link darkmodeText dropdown-toggle"
                id="navbarDropdownMenuLink"
                aria-haspopup="true"
                aria-expanded={showProfileCard}
                title={user.displayName || 'User'}
                onClick={(e) => { e.preventDefault(); toggleProfileCard(); }}
                style={{ background: 'transparent', border: 'none', padding: 0, display: 'flex', alignItems: 'center' }}
              >
                <i className="fa fa-user-circle" aria-hidden="true" style={{ fontSize: isMobile ? '1.4em' : '1.6em', color: '#111' }} />
              </button>
              {showProfileCard && (
                <div
                  className="profile-card shadow"
                  style={{ width: isMobile ? '160px' : '180px', position: 'absolute', top: '100%', right: 0, left: 'auto', background: '#fff', borderRadius: 8 }}
                  onMouseEnter={() => setShowProfileCard(true)}
                  onMouseLeave={() => setShowProfileCard(false)}
                >
                  <div
                    className="profile-name px-3 py-2"
                    style={{ fontSize: '0.8em', fontWeight: 600, borderBottom: '1px solid #f2f2f2' }}
                  >
                    {user.displayName || 'User'}
                  </div>
                  <button
                    className="dropdown-item w-100 text-start px-3 py-2"
                    style={{ fontSize: '0.8em', background: 'transparent', border: 'none' }}
                    onClick={handleLogout}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </li>
          )}
        </Nav>
      </div>
    </div>
  );
};