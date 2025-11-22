import React from 'react';
import { Button } from 'react-bootstrap';
import { Star, StarOff } from 'lucide-react';
import { useWatchlist, WatchlistCoin } from '../context/WatchlistContext';

interface WatchlistButtonProps {
  coin: Omit<WatchlistCoin, 'addedAt'>;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const WatchlistButton: React.FC<WatchlistButtonProps> = ({
  coin,
  variant = 'icon',
  size = 'md',
  showText = false
}) => {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const isWatched = isInWatchlist(coin.id);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (isWatched) {
      removeFromWatchlist(coin.id);
    } else {
      addToWatchlist(coin);
    }
  };

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        className="watchlist-btn"
        title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
        aria-label={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
        style={{
          background: 'none',
          border: 'none',
          padding: '4px',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          color: isWatched ? '#f97316' : '#9ca3af',
          transition: 'all 0.2s ease',
        }}
      >
        {isWatched ? (
          <Star size={iconSize} fill="#f97316" />
        ) : (
          <Star size={iconSize} />
        )}
        {showText && (
          <span style={{ fontSize: size === 'sm' ? '0.75rem' : '0.875rem' }}>
            {isWatched ? 'Watching' : 'Watch'}
          </span>
        )}
      </button>
    );
  }

  return (
    <Button
      variant={isWatched ? 'warning' : 'outline-warning'}
      size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : undefined}
      onClick={handleClick}
      className="d-flex align-items-center gap-2"
      style={{
        backgroundColor: isWatched ? '#f97316' : 'transparent',
        borderColor: '#f97316',
        color: isWatched ? 'white' : '#f97316',
      }}
    >
      {isWatched ? (
        <>
          <StarOff size={iconSize} />
          Remove from Watchlist
        </>
      ) : (
        <>
          <Star size={iconSize} />
          Add to Watchlist
        </>
      )}
    </Button>
  );
};

export default WatchlistButton;
