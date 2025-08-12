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
// Import Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';

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
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
      const response = await axios.get<BackendApiResponse>(`${API_BASE_URL}/crypto-prices?limit=20`);
      
      if (response.data.success && Array.isArray(response.data.data)) {
      const data = response.data.data.map((item) => ({
          symbol: item.symbol.toUpperCase(),
          priceUsd: item.current_price.toString(),
          changePercent24Hr: item.price_change_percentage_24h.toString(),
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

  // Independent ticker timer (do not re-create on every render)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const len = Math.max(scrollingStats.length, 1);
        return (prev + 1) % len;
      });
    }, 70000);
    return () => clearInterval(timer);
  }, [scrollingStats.length]);

  const handleUserClick = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      setUser(user);
    } catch (error) {
      // no-op
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setShowProfileCard(false);
    } catch (error) {
      // no-op
    }
  };

  const toggleProfileCard = () => {
    setShowProfileCard((prev) => !prev);
  };

  return (
    <div style={{ width: '92%', margin: '0 auto' }} className="relative h-12 bg-white rounded-lg overflow-hidden d-flex align-items-center">
      {/* Edge fades */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '60px',
        background: 'linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)', zIndex: 2
      }} />
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: '60px',
        background: 'linear-gradient(270deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)', zIndex: 2
      }} />

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="d-flex flex-row"
            style={{ paddingLeft: '70px', paddingRight: '70px' }}
          >
            {Array.from({ length: itemsToShow }).map((_, index) => (
              <div className="flex-shrink-0 mx-2" key={index}>
                <Skeleton width={140} height={28} baseColor="#eee" highlightColor="#f8f8f8" />
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key={currentIndex}
            initial={{ x: '100%', opacity: 1 }}
            animate={{ x: '-100%', opacity: 1 }}
            transition={{ duration: 70, ease: 'linear' }}
            className="d-flex flex-row"
            style={{ paddingLeft: '70px', paddingRight: '70px' }}
          >
            {scrollingStats.concat(scrollingStats).slice(currentIndex, currentIndex + itemsToShow).map((stat: CryptoData, index) => {
              const isUp = Number(stat.changePercent24Hr) >= 0;
              return (
                <div className="flex-shrink-0 mx-2" key={index}>
                  <div
                    className="d-flex align-items-center"
                    style={{
                      gap: '10px',
                      padding: '6px 10px',
                      borderRadius: '999px',
                      background: '#f8f9fa',
                      border: '1px solid #eee',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                    }}
                  >
                    <span style={{ fontWeight: 700, letterSpacing: '0.02em', minWidth: 42 }}>{stat.symbol}</span>
                    <span style={{ color: '#111' }}>{formatPrice(stat.priceUsd)}</span>
                    <span
                      className={`badge ${isUp ? 'bg-success' : 'bg-danger'}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: '999px' }}
                    >
                      <i className={`fa ${isUp ? 'fa-caret-up' : 'fa-caret-down'}`}></i>
                      {formatChange(stat.changePercent24Hr)}
                    </span>
                  </div>
              </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="position-absolute end-0 d-flex align-items-center" style={{ zIndex: 3 }}>
        <Nav className="flex-nowrap align-items-center justify-content-end">
          <NavDropdown title={<span className="text-black" style={{ fontSize: '1em' }}>USD</span>} id="currency-dropdown">
            <NavDropdown.Item>USD</NavDropdown.Item>
            <NavDropdown.Item>EUR</NavDropdown.Item>
            <NavDropdown.Item>GBP</NavDropdown.Item>
            <NavDropdown.Item>JPY</NavDropdown.Item>
          </NavDropdown>
          {!user ? (
            <i className="fa fa-user mt-2" aria-hidden="true" style={{ fontSize: '1.7em' }} onClick={handleUserClick}></i>
          ) : (
            <li className="nav-item dropdown hdr-dropdown mt-0 signList" onMouseEnter={toggleProfileCard} onMouseLeave={() => setShowProfileCard(false)}>
              <a className="nav-link darkmodeText dropdown-toggle" href="#" id="navbarDropdownMenuLink" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true" title={user.displayName || 'User'}>
                <img src={user.photoURL ?? ''} alt="User Profile" style={{ borderRadius: '60%', width: '22px' }} />
              </a>
              {showProfileCard && (
                <div className="profile-card shadow" style={{ width: '150px', top: '100%', left: '0' }} onMouseEnter={() => setShowProfileCard(true)} onMouseLeave={() => setShowProfileCard(false)}>
                  <div className="profile-name" style={{ fontSize: '0.7em' }} onMouseEnter={(e) => e.currentTarget.classList.add('bg-warning')} onMouseLeave={(e) => e.currentTarget.classList.remove('bg-warning')}>
                    {user.displayName || 'User'}
                  </div>
                  <a className="dropdown-item" style={{ fontSize: '0.7em' }} onMouseEnter={(e) => e.currentTarget.classList.add('bg-warning')} onMouseLeave={(e) => e.currentTarget.classList.remove('bg-warning')} onClick={handleLogout}>
                    SignOut
                  </a>
                </div>
              )}
            </li>
          )}
        </Nav>
      </div>
    </div>
  );
};