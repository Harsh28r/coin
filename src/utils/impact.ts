export type ImpactLevel = 'High' | 'Medium' | 'Low';

const COIN_TICKERS = [
	'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'TRX', 'TON',
	'MATIC', 'DOT', 'LTC', 'LINK', 'ATOM', 'UNI', 'XLM', 'APT', 'ARB', 'OP',
	'SHIB', 'USDT', 'USDC', 'DAI'
];

const HIGH_KEYWORDS = [
	'hack', 'exploit', 'breach', 'attack', 'stolen', 'drain', 'rug', 'phishing',
	'etf', 'approval', 'spot etf', 'sec approves', 'sec approval', 'lawsuit', 'ban',
	'listing', 'delist', 'suspension', 'halt', 'investigation', 'sanction', 'insolvency', 'bankruptcy',
	'fomc', 'rate hike', 'rate cut', 'cpi', 'inflation', 'recession'
];

const MEDIUM_KEYWORDS = [
	'partnership', 'acquisition', 'upgrade', 'fork', 'hard fork', 'mainnet', 'airdrop',
	'funding', 'raise', 'series a', 'series b', 'tokenomics', 'buyback'
];

export interface ImpactResult {
	level: ImpactLevel;
	affectedCoins: string[];
}

export function computeImpactLevel(input?: { title?: string; description?: string; content?: string }): ImpactResult {
	const text = `${input?.title || ''} ${input?.description || ''} ${input?.content || ''}`.toLowerCase();
	const affected: string[] = [];
	for (const t of COIN_TICKERS) {
		const re = new RegExp(`\\b${t}\\b`, 'i');
		if (re.test(text)) affected.push(t);
	}
	const hasHigh = HIGH_KEYWORDS.some((k) => text.includes(k));
	const hasMedium = MEDIUM_KEYWORDS.some((k) => text.includes(k));
	let level: ImpactLevel = 'Low';
	if (hasHigh) level = 'High';
	else if (hasMedium) level = 'Medium';
	return { level, affectedCoins: Array.from(new Set(affected)).slice(0, 5) };
}


