# Trade / Affiliate Links — Setup Guide

You can’t execute trades on CoinsClarity (that needs a license). You **can** send users to exchanges with **your referral link** and earn when they sign up or trade.

---

## Step 1: Get your referral links

### Binance
1. Go to [Binance](https://www.binance.com) → sign in.
2. **Profile** (top right) → **Referral** (or go to [Binance Referral](https://www.binance.com/en/activity/referral-entry)).
3. Copy your **Referral ID** (e.g. `ABC123`).
4. Your link: `https://www.binance.com/en/register?ref=YOUR_REFERRAL_ID`
5. For a specific pair (e.g. BTC): `https://www.binance.com/en/trade/BTC_USDT?ref=YOUR_REFERRAL_ID`

### Coinbase
1. [Coinbase](https://www.coinbase.com) → **Profile** → **Referrals**.
2. Copy your referral link (looks like `https://www.coinbase.com/join/xxxxx`).

### Others (Bybit, Kraken, etc.)
- Each exchange has a “Referral” or “Affiliate” section in the account. Copy the **signup** or **trade** URL they give you.

---

## Step 2: Add links to the app (env vars)

So you can change links without editing code:

1. In the project root, create or edit **`.env`** (and `.env.production` for prod):

```env
# Binance ref is set in code (GRO_28502_WCKBP). Override here if you want a different one:
REACT_APP_BINANCE_REF=GRO_28502_WCKBP
REACT_APP_COINBASE_REF=https://www.coinbase.com/join/your_code
REACT_APP_COINDCX_INVITE=https://invite.coindcx.com/99949721
REACT_APP_BYBIT_REF=
```

2. Restart the dev server after changing `.env`: `npm start`

---

## Step 3: Where to show “Trade” / “Buy”

| Place | What to add |
|-------|-------------|
| **Navbar** | One “Trade” dropdown or link → Binance (with ref). |
| **Footer** | “Trade on Binance” / “Buy on Coinbase” with ref links. |
| **Coin detail page** | “Buy [BTC]” button → Binance trade URL for that pair. |
| **Arbitrage scanner** | “Trade on Binance” next to opportunities. |
| **Landing** | Small strip: “Start trading → Binance” with ref. |

---

## Step 4: Link format recap

- **Binance signup:** `https://www.binance.com/en/register?ref=REF_ID`
- **Binance trade (e.g. BTC/USDT):** `https://www.binance.com/en/trade/BTC_USDT?ref=REF_ID`
- **Coinbase:** use the exact referral URL they give you.

Use `target="_blank"` and `rel="noopener noreferrer"` on all these links.

---

## Step 5: Legal / disclosure

- In footer or near the buttons, add a short line: *“We may earn a commission when you sign up or trade via these links.”*
- Don’t promise returns or that trading is risk-free.

---

## Quick checklist

- [ ] Get Binance referral ID and build signup + trade URLs.
- [ ] (Optional) Get Coinbase referral URL.
- [ ] Add `REACT_APP_BINANCE_REF` (and others) to `.env`.
- [ ] Add “Trade” / “Buy” in navbar or footer using the shared link helper.
- [ ] Add disclosure text near the links.
- [ ] Restart app and test: click opens exchange in new tab with your ref.

Once you have your ref IDs/URLs, we can add the actual buttons and use these env vars in the code.
