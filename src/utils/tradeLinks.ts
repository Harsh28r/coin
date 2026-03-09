/**
 * Affiliate / referral trade links. Override in .env:
 * REACT_APP_BINANCE_REF=your_ref_id
 * REACT_APP_COINBASE_REF=https://www.coinbase.com/join/xxx
 */

const BINANCE_REF = process.env.REACT_APP_BINANCE_REF?.trim() || 'GRO_28502_WCKBP';
const COINBASE_REF = process.env.REACT_APP_COINBASE_REF?.trim() || '';
const COINDCX_INVITE = process.env.REACT_APP_COINDCX_INVITE?.trim() || 'https://invite.coindcx.com/99949721';

export const tradeLinks = {
  binance: {
    signup: BINANCE_REF
      ? `https://www.binance.com/en/register?ref=${BINANCE_REF}`
      : 'https://www.binance.com/en/register',
    trade: (pair: string) =>
      BINANCE_REF
        ? `https://www.binance.com/en/trade/${pair}?ref=${BINANCE_REF}`
        : `https://www.binance.com/en/trade/${pair}`,
    label: 'Binance',
  },
  coinbase: {
    signup: COINBASE_REF || 'https://www.coinbase.com/join',
    label: 'Coinbase',
  },
  coindcx: {
    signup: COINDCX_INVITE,
    label: 'CoinDCX',
  },
};
