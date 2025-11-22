import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface WatchlistCoin {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  addedAt: number;
  priceAtAdd?: number;
}

interface WatchlistContextType {
  watchlist: WatchlistCoin[];
  addToWatchlist: (coin: Omit<WatchlistCoin, 'addedAt'>) => void;
  removeFromWatchlist: (coinId: string) => void;
  isInWatchlist: (coinId: string) => boolean;
  clearWatchlist: () => void;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

const WATCHLIST_KEY = 'coinsclarity_watchlist';

export const WatchlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [watchlist, setWatchlist] = useState<WatchlistCoin[]>([]);

  // Load watchlist from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(WATCHLIST_KEY);
      if (stored) {
        setWatchlist(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
    }
  }, []);

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
    } catch (error) {
      console.error('Error saving watchlist:', error);
    }
  }, [watchlist]);

  const addToWatchlist = (coin: Omit<WatchlistCoin, 'addedAt'>) => {
    setWatchlist(prev => {
      // Don't add if already exists
      if (prev.some(c => c.id === coin.id)) return prev;

      return [...prev, { ...coin, addedAt: Date.now() }];
    });
  };

  const removeFromWatchlist = (coinId: string) => {
    setWatchlist(prev => prev.filter(c => c.id !== coinId));
  };

  const isInWatchlist = (coinId: string): boolean => {
    return watchlist.some(c => c.id === coinId);
  };

  const clearWatchlist = () => {
    setWatchlist([]);
  };

  return (
    <WatchlistContext.Provider value={{
      watchlist,
      addToWatchlist,
      removeFromWatchlist,
      isInWatchlist,
      clearWatchlist
    }}>
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = (): WatchlistContextType => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
};

export default WatchlistContext;
