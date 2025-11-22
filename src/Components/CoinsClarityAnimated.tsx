import React from 'react';
import '../styles/animations.css';

interface CoinsClarityAnimatedProps {
  variant?: 'gradient' | 'letters' | 'pulse' | 'shimmer';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const CoinsClarityAnimated: React.FC<CoinsClarityAnimatedProps> = ({ 
  variant = 'gradient', 
  size = 'md',
  className = '' 
}) => {
  const sizeClasses = {
    sm: '1.25rem',
    md: '1.75rem',
    lg: '2.5rem'
  };

  const text = 'CoinsClarity';
  
  if (variant === 'letters') {
    return (
      <span 
        className={`coinsclarity-letters ${className}`}
        style={{ fontSize: sizeClasses[size] }}
      >
        {text.split('').map((letter, index) => (
          <span key={index}>{letter === ' ' ? '\u00A0' : letter}</span>
        ))}
      </span>
    );
  }

  const variantClass = variant === 'pulse' 
    ? 'coinsclarity-animated coinsclarity-pulse' 
    : variant === 'shimmer'
    ? 'coinsclarity-animated coinsclarity-shimmer'
    : 'coinsclarity-animated';

  return (
    <span 
      className={`${variantClass} ${className}`}
      style={{ fontSize: sizeClasses[size] }}
    >
      {text}
    </span>
  );
};

export default CoinsClarityAnimated;


