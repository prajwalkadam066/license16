import { formatCurrency } from '../utils/currency';

interface SimpleCurrencyDisplayProps {
  inrAmount: number;
  originalAmount?: number;
  originalCurrency?: string;
  className?: string;
}

export default function SimpleCurrencyDisplay({ 
  inrAmount,
  originalAmount,
  originalCurrency,
  className = ''
}: SimpleCurrencyDisplayProps) {
  const showOriginal = originalCurrency && originalCurrency !== 'INR' && originalAmount !== undefined;

  return (
    <div className={className}>
      <div className="text-lg font-bold text-gray-900 dark:text-white">
        {formatCurrency(inrAmount, 'INR')}
      </div>
      {showOriginal && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {formatCurrency(originalAmount, originalCurrency)}
        </div>
      )}
    </div>
  );
}
