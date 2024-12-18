import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CryptoStatProps {
  symbol: string;
  price: number;
  change: number;
}

export const CryptoStat = ({ symbol, price, change }: CryptoStatProps) => {
  const isPositive = change >= 0;

  return (
    <motion.div className="flex items-center space-x-3 px-6 py-2 w-[90%]">
      <span className="font-medium text-gray-900 min-w-[60px] text-sm">{symbol}</span>
      <span className="text-gray-700 min-w-[100px] text-sm">${price.toFixed(2)}</span>
      <span 
        className={`flex items-center min-w-[80px] text-sm ${
          isPositive ? 'text-green-500' : 'text-red-500'
        }`}
      >
        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        <span className="ml-1">{Math.abs(change)}%</span>
      </span>
    </motion.div>
  );
};