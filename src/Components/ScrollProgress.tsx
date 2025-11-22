import React, { useState, useEffect } from 'react';

const ScrollProgress: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setProgress(scrollPercent);
    };

    window.addEventListener('scroll', updateProgress);
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${progress}%`,
        height: '3px',
        background: 'linear-gradient(90deg, #f97316, #fb923c)',
        zIndex: 9999,
        transition: 'width 0.1s ease',
        boxShadow: '0 0 10px rgba(249, 115, 22, 0.5)'
      }}
    />
  );
};

export default ScrollProgress;
