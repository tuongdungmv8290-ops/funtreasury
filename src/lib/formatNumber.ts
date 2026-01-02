/**
 * Format number với comma cho phần nghìn và dot cho thập phân
 * Ví dụ: 1234567.89 → 1,234,567.89
 */
export function formatNumber(
  value: number, 
  options: { 
    minDecimals?: number; 
    maxDecimals?: number;
    compact?: boolean;
  } = {}
): string {
  const { minDecimals = 2, maxDecimals = 4, compact = false } = options;
  
  if (isNaN(value) || !isFinite(value)) return '0.00';
  
  // Handle very small numbers with scientific notation
  if (value > 0 && value < 0.000001) {
    return value.toExponential(2);
  }
  
  // Compact format for large numbers
  if (compact && value >= 1_000_000_000) {
    return (value / 1_000_000_000).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + 'B';
  }
  
  if (compact && value >= 1_000_000) {
    return (value / 1_000_000).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + 'M';
  }
  
  return value.toLocaleString('en-US', {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals
  });
}

/**
 * Format token amount với max 2-4 decimals
 * Ví dụ: 244137920.123456 → 244,137,920.12
 */
export function formatTokenAmount(value: number, symbol?: string): string {
  // Stablecoins hiển thị 2 decimals
  if (symbol && ['USDT', 'USDC', 'BUSD'].includes(symbol.toUpperCase())) {
    return formatNumber(value, { minDecimals: 2, maxDecimals: 2 });
  }
  
  // Token lớn (> 1M) hiển thị 2 decimals
  if (value >= 1_000_000) {
    return formatNumber(value, { minDecimals: 2, maxDecimals: 2 });
  }
  
  // Token nhỏ hơn 1 hiển thị nhiều decimals hơn
  if (value < 1 && value > 0) {
    return formatNumber(value, { minDecimals: 4, maxDecimals: 6 });
  }
  
  // Default: 2-4 decimals
  return formatNumber(value, { minDecimals: 2, maxDecimals: 4 });
}

/**
 * Format USD value với $ prefix và màu sắc
 * Ví dụ: 7966.45 → $7,966.45
 */
export function formatUSD(value: number): string {
  return '$' + formatNumber(value, { minDecimals: 2, maxDecimals: 2 });
}

/**
 * Format percentage change
 * Ví dụ: 5.23 → +5.23%
 */
export function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return sign + formatNumber(value, { minDecimals: 2, maxDecimals: 2 }) + '%';
}
