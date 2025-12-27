export interface Wallet {
  id: string;
  name: string;
  address: string;
  chain: string;
  balance: number;
  tokenBalances: TokenBalance[];
}

export interface TokenBalance {
  symbol: string;
  balance: number;
  usdValue: number;
}

export interface Transaction {
  id: string;
  txHash: string;
  timestamp: Date;
  walletId: string;
  walletName: string;
  direction: 'IN' | 'OUT';
  tokenSymbol: string;
  tokenAddress?: string;
  amount: number;
  usdValue: number;
  fromAddress: string;
  toAddress: string;
  gasFee: number;
  status: 'success' | 'failed' | 'pending';
  blockNumber: number;
  category?: string;
  note?: string;
  tags?: string[];
}

export const mockWallets: Wallet[] = [
  {
    id: 'wallet-1',
    name: 'Treasury Wallet 1',
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f1dE3A',
    chain: 'BNB',
    balance: 125420.50,
    tokenBalances: [
      { symbol: 'BNB', balance: 245.32, usdValue: 75123.45 },
      { symbol: 'FUN', balance: 1500000, usdValue: 32500.00 },
      { symbol: 'USDT', balance: 15000, usdValue: 15000.00 },
      { symbol: 'CAMLY', balance: 500000, usdValue: 2797.05 },
    ],
  },
  {
    id: 'wallet-2',
    name: 'Treasury Wallet 2',
    address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    chain: 'BNB',
    balance: 89750.25,
    tokenBalances: [
      { symbol: 'BNB', balance: 156.78, usdValue: 48000.00 },
      { symbol: 'FUN', balance: 800000, usdValue: 17333.33 },
      { symbol: 'USDC', balance: 22000, usdValue: 22000.00 },
      { symbol: 'CAMLY', balance: 250000, usdValue: 2416.92 },
    ],
  },
];

const generateRandomTx = (index: number): Transaction => {
  const wallets = mockWallets;
  const wallet = wallets[Math.floor(Math.random() * wallets.length)];
  const direction = Math.random() > 0.5 ? 'IN' : 'OUT';
  const tokens = ['BNB', 'FUN', 'USDT', 'USDC', 'CAMLY'];
  const token = tokens[Math.floor(Math.random() * tokens.length)];
  const categories = ['Team Payment', 'Marketing', 'Development', 'Partnership', 'Airdrop', 'Staking Reward', 'Investment'];
  
  const daysAgo = Math.floor(Math.random() * 30);
  const hoursAgo = Math.floor(Math.random() * 24);
  const timestamp = new Date();
  timestamp.setDate(timestamp.getDate() - daysAgo);
  timestamp.setHours(timestamp.getHours() - hoursAgo);

  const amount = token === 'BNB' 
    ? Math.random() * 50 + 1 
    : token === 'FUN' || token === 'CAMLY'
    ? Math.floor(Math.random() * 100000) + 1000
    : Math.floor(Math.random() * 5000) + 100;

  const usdValue = token === 'BNB' 
    ? amount * 306.5 
    : token === 'FUN' || token === 'CAMLY'
    ? amount * 0.02
    : amount;

  return {
    id: `tx-${index}`,
    txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
    timestamp,
    walletId: wallet.id,
    walletName: wallet.name,
    direction,
    tokenSymbol: token,
    amount,
    usdValue,
    fromAddress: direction === 'IN' 
      ? `0x${Math.random().toString(16).slice(2, 42)}`
      : wallet.address,
    toAddress: direction === 'OUT'
      ? `0x${Math.random().toString(16).slice(2, 42)}`
      : wallet.address,
    gasFee: Math.random() * 0.01,
    status: Math.random() > 0.05 ? 'success' : 'failed',
    blockNumber: 35000000 + Math.floor(Math.random() * 1000000),
    category: Math.random() > 0.3 ? categories[Math.floor(Math.random() * categories.length)] : undefined,
    note: Math.random() > 0.5 ? 'Transaction note example' : undefined,
    tags: Math.random() > 0.6 ? ['verified', 'important'] : undefined,
  };
};

export const mockTransactions: Transaction[] = Array.from({ length: 50 }, (_, i) => generateRandomTx(i))
  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

export const calculateStats = (transactions: Transaction[], days: number = 30) => {
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  
  const filteredTxs = transactions.filter(tx => tx.timestamp >= startDate && tx.status === 'success');
  
  const inflow = filteredTxs
    .filter(tx => tx.direction === 'IN')
    .reduce((sum, tx) => sum + tx.usdValue, 0);
  
  const outflow = filteredTxs
    .filter(tx => tx.direction === 'OUT')
    .reduce((sum, tx) => sum + tx.usdValue, 0);
  
  return {
    inflow,
    outflow,
    netflow: inflow - outflow,
    transactionCount: filteredTxs.length,
  };
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatNumber = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export const shortenAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
