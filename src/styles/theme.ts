// Centralized Design Tokens for CoinsClarity (Editorial)
// Mirrors CSS variables in src/index.css. Prefer var(--token) in CSS;
// use these JS values only when CSS vars aren't accessible (e.g. inline charts).

export const colors = {
  // Primary brand — editorial orange
  primary: {
    main: '#e85d2c',
    light: '#f9a06b',
    dark: '#c44820',
    hover: '#c44820',
  },

  // Neutral colors (warm, magazine paper)
  neutral: {
    white: '#ffffff',
    paper: '#faf8f5',
    sand: '#f3efe9',
    gray50: '#f5f4f1',
    gray100: '#efece6',
    gray200: '#e7e3dc',
    gray300: '#d6d1c7',
    gray400: '#a3a3a3',
    gray500: '#737373',
    gray600: '#525252',
    gray700: '#404040',
    gray800: '#262626',
    gray900: '#0a0a0a',
    black: '#000000',
  },

  // Semantic colors
  success: { main: '#15803d', light: '#22c55e', dark: '#14532d' },
  error: { main: '#b91c1c', light: '#ef4444', dark: '#991b1b' },
  warning: { main: '#b45309', light: '#f59e0b', dark: '#92400e' },
  info: { main: '#1d4ed8', light: '#3b82f6', dark: '#1e3a8a' },

  // Crypto-specific colors
  crypto: {
    up: '#15803d',
    down: '#b91c1c',
    bitcoin: '#f7931a',
    ethereum: '#627eea',
  },

  // Backgrounds
  background: {
    primary: '#faf8f5',
    elevated: '#ffffff',
    subtle: '#f3efe9',
    dark: '#0a0a0a',
    overlay: 'rgba(10, 10, 10, 0.55)',
  },

  // Text
  text: {
    primary: '#0a0a0a',
    secondary: '#404040',
    muted: '#737373',
    tertiary: '#a3a3a3',
    inverse: '#fafafa',
    link: '#e85d2c',
  },

  // Editorial accents
  accents: {
    deepGreen: '#0f5132',
    highlightYellow: '#f5d27a',
    breakingRed: '#c2261c',
  },
};

export const typography = {
  fontFamily: {
    display: "'Fraunces', 'Source Serif Pro', Georgia, serif",
    primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  },

  fontSize: {
    xs: '0.75rem',
    sm: '0.8125rem',
    base: '0.9375rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.375rem',
    '2xl': '1.75rem',
    '3xl': '2.25rem',
    '4xl': '3rem',
    '5xl': '3.75rem',
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  lineHeight: {
    tight: 1.15,
    snug: 1.3,
    normal: 1.5,
    relaxed: 1.7,
  },

  letterSpacing: {
    tighter: '-0.025em',
    tight: '-0.015em',
    normal: '0',
    wide: '0.04em',
    wider: '0.08em',
    widest: '0.16em',
  },
};

export const spacing = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem', // 40px
  12: '3rem',   // 48px
  16: '4rem',   // 64px
  20: '5rem',   // 80px
};

export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
};

export const shadows = {
  xs: '0 1px 2px rgba(10, 10, 10, 0.04)',
  sm: '0 1px 3px rgba(10, 10, 10, 0.05), 0 1px 2px rgba(10, 10, 10, 0.03)',
  md: '0 4px 14px rgba(10, 10, 10, 0.06)',
  lg: '0 12px 30px rgba(10, 10, 10, 0.08)',
  xl: '0 20px 50px rgba(10, 10, 10, 0.12)',
  '2xl': '0 32px 70px rgba(10, 10, 10, 0.18)',
};

export const breakpoints = {
  xs: '480px',
  sm: '576px',
  md: '768px',
  lg: '992px',
  xl: '1200px',
  '2xl': '1400px',
};

export const transitions = {
  fast: '0.15s ease',
  normal: '0.3s ease',
  slow: '0.5s ease',
};

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
};

// CSS-in-JS helper for common styles
export const commonStyles = {
  cardHover: {
    transform: 'translateY(-1px)',
    boxShadow: shadows.md,
    borderColor: colors.neutral.gray300,
  },
  buttonBase: {
    fontWeight: typography.fontWeight.semibold,
    borderRadius: borderRadius.md,
    transition: transitions.normal,
    cursor: 'pointer',
    fontFamily: typography.fontFamily.primary,
  },
  linkBase: {
    color: colors.text.link,
    textDecoration: 'none',
    transition: transitions.fast,
  },
  display: {
    fontFamily: typography.fontFamily.display,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.tighter,
    lineHeight: typography.lineHeight.tight,
  },
  eyebrow: {
    fontFamily: typography.fontFamily.primary,
    fontSize: '11px',
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase' as const,
    color: colors.primary.main,
  },
  numeric: {
    fontFamily: typography.fontFamily.mono,
    fontFeatureSettings: '"tnum"',
    letterSpacing: '-0.01em',
  },
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
  transitions,
  zIndex,
  commonStyles,
};
