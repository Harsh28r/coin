// Crypto-themed fallback images utility with diverse themes
export const getCryptoFallbackImage = (title?: string, type: 'news' | 'blog' | 'nft' | 'coin' = 'news'): string => {
  // Use diverse crypto-themed placeholder service with unique colors and text
  const cryptoThemes = {
    news: [
      'https://placehold.co/400x250/0a0a0a/ff6b35?text=Bitcoin+Revolution',
      'https://placehold.co/400x250/1a1a2e/00d4aa?text=Ethereum+Ecosystem',
      'https://placehold.co/400x250/2d1b69/ffd700?text=DeFi+Protocols',
      'https://placehold.co/400x250/0d1117/ff4757?text=Altcoin+Season',
      'https://placehold.co/400x250/1e3a8a/10b981?text=Smart+Contracts',
      'https://placehold.co/400x250/7c2d12/fbbf24?text=Yield+Farming',
      'https://placehold.co/400x250/581c87/ec4899?text=Cross+Chain',
      'https://placehold.co/400x250/064e3b/34d399?text=Staking+Rewards',
      'https://placehold.co/400x250/7c2d12/f59e0b?text=Liquidity+Pools',
      'https://placehold.co/400x250/1e40af/60a5fa?text=Layer+2+Solutions',
      'https://placehold.co/400x250/be123c/fda4af?text=DAO+Governance',
      'https://placehold.co/400x250/4338ca/a78bfa?text=Metaverse+Economy'
    ],
    blog: [
      'https://placehold.co/400x250/0a0a0a/ff6b35?text=Crypto+Education',
      'https://placehold.co/400x250/1a1a2e/00d4aa?text=Trading+Strategies',
      'https://placehold.co/400x250/2d1b69/ffd700?text=Technical+Analysis',
      'https://placehold.co/400x250/0d1117/ff4757?text=Market+Insights',
      'https://placehold.co/400x250/1e3a8a/10b981?text=Blockchain+Basics'
    ],
    nft: [
      'https://placehold.co/400x400/0a0a0a/ff6b35?text=Digital+Collectibles',
      'https://placehold.co/400x400/1a1a2e/00d4aa?text=Generative+Art',
      'https://placehold.co/400x400/2d1b69/ffd700?text=Virtual+Real Estate',
      'https://placehold.co/400x400/0d1117/ff4757?text=Play+to+Earn',
      'https://placehold.co/400x400/1e3a8a/10b981?text=Avatar+Collections'
    ],
    coin: [
      'https://placehold.co/200x200/0a0a0a/ff6b35?text=BTC',
      'https://placehold.co/200x200/1a1a2e/00d4aa?text=ETH',
      'https://placehold.co/200x200/2d1b69/ffd700?text=BNB',
      'https://placehold.co/200x200/0d1117/ff4757?text=ADA',
      'https://placehold.co/200x200/1e3a8a/10b981?text=SOL'
    ]
  };

  const images = cryptoThemes[type];
  
  // Use title hash to consistently select the same image for the same title
  const hash = title ? title.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0) : Math.floor(Math.random() * 1000);
  
  const index = Math.abs(hash) % images.length;
  return images[index];
};

// Helper function for image error handling
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackTitle?: string, type: 'news' | 'blog' | 'nft' | 'coin' = 'news') => {
  const target = e.currentTarget as HTMLImageElement;
  target.src = getCryptoFallbackImage(fallbackTitle, type);
};
