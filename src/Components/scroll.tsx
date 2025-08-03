import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { CryptoStat as CryptoStatComponent } from './CryptoStats';
import { Nav, NavDropdown } from 'react-bootstrap';
import React from 'react';
import 'font-awesome/css/font-awesome.min.css';
import axios from 'axios';
// Import Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';

// Initialize Firebase (replace with your config)
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

// Update the CryptoStatComponent prop type to accept React.ReactNode for symbol
interface CryptoStatProps {
  price: number;
  change: number;
  symbol: React.ReactNode;
}

export const ScrollingStats = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrollingStats, setScrollingStats] = useState<CryptoData[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const itemsToShow = 15;

  const fetchCryptoData = useCallback(async () => {
    try {
      const response = await axios.get<ApiResponse>('https://api.coincap.io/v2/assets/');
      const data = response.data.data.map((item) => ({
        symbol: item.symbol,
        priceUsd: item.priceUsd,
        changePercent24Hr: item.changePercent24Hr,
      }));
      setScrollingStats(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, []);

  useEffect(() => {
    fetchCryptoData();

    const timer = setInterval(() => {
      if (scrollingStats.length > 0) {
        setCurrentIndex((prev) => (prev + 1) % scrollingStats.length);
      }
    }, 11000);

    return () => clearInterval(timer);
  }, [fetchCryptoData, scrollingStats.length]);

  const handleUserClick = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      setUser(user);
      console.log('User signed in:', user);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setShowProfileCard(false);
      console.log('User signed out');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleProfileCard = () => {
    setShowProfileCard((prev) => !prev);
  };

  return (
    <div style={{ width: '92%', margin: '0 auto' }} className="relative h-12 bg-gray-50 rounded-lg overflow-hidden flex justify-between items-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ x: '100%', opacity: 1 }}
          animate={{ x: '-100%', opacity: 1 }}
          transition={{ duration: 20, ease: 'linear' }}
          className="d-flex flex-row"
        >
          {scrollingStats.concat(scrollingStats).slice(currentIndex, currentIndex + itemsToShow).map((stat: CryptoData, index) => (
            <div className="flex-shrink-0 mx-2 fw-bold text-dark" key={index}>
              <CryptoStatComponent 
                price={parseFloat(stat.priceUsd)}
                change={parseFloat(stat.changePercent24Hr)}
                symbol={stat.symbol}
              />
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
      <div className="absolute flex items-center">
        <Nav className="flex-nowrap items-center justify-content-end">
          {/* <NavDropdown title={<span className="text-black" style={{ fontSize: '1em' }}>En</span>} id="language-dropdown" >
            <NavDropdown.Item>English</NavDropdown.Item>
            <NavDropdown.Item>Español</NavDropdown.Item>
            <NavDropdown.Item>Français</NavDropdown.Item>
            <NavDropdown.Item>Deutsch</NavDropdown.Item>
          </NavDropdown> */}
          <NavDropdown title={<span className="text-black" style={{ fontSize: '1em' }}>USD</span>} id="currency-dropdown" >
            <NavDropdown.Item>USD</NavDropdown.Item>
            <NavDropdown.Item>EUR</NavDropdown.Item>
            <NavDropdown.Item>GBP</NavDropdown.Item>
            <NavDropdown.Item>JPY</NavDropdown.Item>
          </NavDropdown>
          
          {!user ? (
            <i className="fa fa-user mt-2 " aria-hidden="true" style={{ fontSize: '1.7em' }} onClick={handleUserClick}></i>
          ) : (
            <li className="nav-item dropdown hdr-dropdown mt-0 signList" onMouseEnter={toggleProfileCard} onMouseLeave={() => setShowProfileCard(false)}>
              <a className="nav-link darkmodeText dropdown-toggle" href="" id="navbarDropdownMenuLink" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true" title={user.displayName || 'User'}>
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
