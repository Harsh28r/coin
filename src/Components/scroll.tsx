import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { CryptoStat as CryptoStatComponent } from './CryptoStats';
import { Nav, NavDropdown } from 'react-bootstrap';
import React from 'react';
import 'font-awesome/css/font-awesome.min.css';


export const scrollingStats = [
  { symbol: 'COMP', price: 56.54, change: 1.15 },
  { symbol: 'ETH', price: 3245.67, change: 2.34 },
  { symbol: 'BTC', price: 52341.89, change: -0.75 },
  { symbol: 'SOL', price: 123.45, change: 3.21 },
  { symbol: 'DOT', price: 18.67, change: -1.23 },
];

interface CryptoStatProps {
  symbol: string;
  price: number;
  change: number;
}

const CryptoStat: React.FC<CryptoStatProps> = ({ symbol, price, change }) => {
  const changeColor = change > 0 ? 'text-green-500' : 'text-red-500';
  const priceColor = change > 0 ? 'text-green-500' : 'text-red-500';

  return (
    <div className={`crypto-stat ${changeColor}`} style={{ fontSize: '0.75em' }}>
      <span>{symbol}</span>: <span className={priceColor}>{price.toFixed(2)}</span> <span>{change.toFixed(2)}%</span>
    </div>
  );
};

export const ScrollingStats = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsToShow = 9;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % scrollingStats.length);
    }, 11000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ width: '92%', margin: '0 auto' }} className="relative h-12 bg-gray-50 rounded-lg overflow-hidden flex justify-between items-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ x: '100%', opacity: 1 }}
          animate={{ x: '-100%', opacity: 1 }}
        //   exit={{ x: '100%', opacity: 0 }}
          transition={{ duration: 20, ease: 'linear' }}
          className="d-flex flex-row"
        >
          {scrollingStats.concat(scrollingStats).slice(currentIndex, currentIndex + itemsToShow).map((stat, index) => (
            <div className="flex-shrink-0 mx-2 fw-bold text-dark" key={index}>
              <CryptoStatComponent {...stat} />
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
      <div className="absolute right-0 flex justify-end">
       
        <Nav className="flex-row-reverse flex-nowrap items-center">
            <i className="fa fa-user mt-1" aria-hidden="true" style={{ fontSize: '1.7em' }}></i>
            <NavDropdown title={<span className="text-black"  style={{ fontSize: '1em' }}>USD</span>} id="currency-dropdown" align="end">
              <NavDropdown.Item>USD</NavDropdown.Item>
              <NavDropdown.Item>EUR</NavDropdown.Item>
              <NavDropdown.Item>GBP</NavDropdown.Item>
              <NavDropdown.Item>JPY</NavDropdown.Item>
            </NavDropdown>
            <NavDropdown title={<span className="text-black"  style={{ fontSize: '1em' }}>En</span>} id="language-dropdown" align="end">
              <NavDropdown.Item>English</NavDropdown.Item>
              <NavDropdown.Item>Español</NavDropdown.Item>
              <NavDropdown.Item>Français</NavDropdown.Item>
              <NavDropdown.Item>Deutsch</NavDropdown.Item>
            </NavDropdown>
          </Nav>
      </div>
    </div>
  );
};