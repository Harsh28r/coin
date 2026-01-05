import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export interface ArbitrageOpportunity {
  _id: string;
  symbol: string;
  buyExchange: string;
  buyPrice: number;
  sellExchange: string;
  sellPrice: number;
  profitPercent: number;
  netProfitPercent: number;
  profitAmount: number;
  volume24h: number;
  liquidity: 'low' | 'medium' | 'high';
  status: 'active' | 'expired';
  createdAt: string;
  expiresAt: string;
}

export interface ArbitrageStats {
  totalOpportunities: number;
  activeOpportunities: number;
  averageProfitPercent: string;
  maxProfitPercent: string;
  mostProfitablePair?: string;
  period: string;
}

export interface TriangularOpportunity {
  _id: string;
  exchange: string;
  baseCurrency: string;
  path: string; // e.g., "BTC → ETH → USDT → BTC"
  pairs: string[]; // e.g., ["BTCETH", "ETHUSDT", "USDTBTC"]
  step1: {
    pair: string;
    price: number;
    direction: string;
  };
  step2: {
    pair: string;
    price: number;
    direction: string;
  };
  step3: {
    pair: string;
    price: number;
    direction: string;
  };
  startAmount: number;
  endAmount: number;
  profitPercent: number;
  netProfitPercent: number;
  profitAmount: number;
  tradingFees: {
    step1Fee: number;
    step2Fee: number;
    step3Fee: number;
    totalFee: number;
  };
  status: 'active' | 'expired';
  createdAt: string;
  expiresAt: string;
}

export interface TriangularStats {
  totalOpportunities: number;
  activeOpportunities: number;
  averageProfitPercent: string;
  maxProfitPercent: string;
  period: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

/**
 * Fetch active arbitrage opportunities
 */
export const getOpportunities = async (limit: number = 20): Promise<ArbitrageOpportunity[]> => {
  try {
    const response = await axios.get<ApiResponse<ArbitrageOpportunity[]>>(
      `${API_BASE_URL}/arbitrage/opportunities?limit=${limit}`
    );
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    throw error;
  }
};

/**
 * Fetch arbitrage statistics
 */
export const getStats = async (days: number = 7): Promise<ArbitrageStats> => {
  try {
    const response = await axios.get<ApiResponse<ArbitrageStats>>(
      `${API_BASE_URL}/arbitrage/stats?days=${days}`
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
};

/**
 * Fetch opportunity history
 */
export const getHistory = async (days: number = 7, limit: number = 100): Promise<ArbitrageOpportunity[]> => {
  try {
    const response = await axios.get<ApiResponse<ArbitrageOpportunity[]>>(
      `${API_BASE_URL}/arbitrage/history?days=${days}&limit=${limit}`
    );
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching history:', error);
    throw error;
  }
};

/**
 * Get single opportunity by ID
 */
export const getOpportunityById = async (id: string): Promise<ArbitrageOpportunity> => {
  try {
    const response = await axios.get<ApiResponse<ArbitrageOpportunity>>(
      `${API_BASE_URL}/arbitrage/opportunity/${id}`
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    throw error;
  }
};

/**
 * Trigger manual scan (admin only)
 */
export const triggerScan = async (token: string): Promise<ArbitrageOpportunity[]> => {
  try {
    const response = await axios.get<ApiResponse<ArbitrageOpportunity[]>>(
      `${API_BASE_URL}/arbitrage/scan`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data.data || [];
  } catch (error) {
    console.error('Error triggering scan:', error);
    throw error;
  }
};

/**
 * Fetch active triangular arbitrage opportunities
 */
export const getTriangularOpportunities = async (limit: number = 20): Promise<TriangularOpportunity[]> => {
  try {
    const response = await axios.get<ApiResponse<TriangularOpportunity[]>>(
      `${API_BASE_URL}/triangular/opportunities?limit=${limit}`
    );
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching triangular opportunities:', error);
    throw error;
  }
};

/**
 * Fetch triangular arbitrage statistics
 */
export const getTriangularStats = async (days: number = 7): Promise<TriangularStats> => {
  try {
    const response = await axios.get<ApiResponse<TriangularStats>>(
      `${API_BASE_URL}/triangular/stats?days=${days}`
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching triangular stats:', error);
    throw error;
  }
};

/**
 * Trigger manual triangular scan (admin only)
 */
export const triggerTriangularScan = async (token: string): Promise<TriangularOpportunity[]> => {
  try {
    const response = await axios.get<ApiResponse<TriangularOpportunity[]>>(
      `${API_BASE_URL}/triangular/scan`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data.data || [];
  } catch (error) {
    console.error('Error triggering triangular scan:', error);
    throw error;
  }
};
