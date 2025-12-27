import { Wallet, Copy, ExternalLink, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatCurrency, shortenAddress, type Wallet as WalletType } from '@/lib/mockData';

interface WalletCardProps {
  wallet: WalletType;
  index: number;
}

export function WalletCard({ wallet, index }: WalletCardProps) {
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    await navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className={cn(
        "treasury-card group relative overflow-hidden",
        "animate-fade-in"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-treasury-gold/5 to-transparent rounded-full blur-2xl" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-treasury-gold/20 to-treasury-gold/5 border border-treasury-gold/20 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-treasury-gold" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{wallet.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground font-mono">
                  {shortenAddress(wallet.address)}
                </span>
                <button
                  onClick={copyAddress}
                  className="text-muted-foreground hover:text-treasury-gold transition-colors"
                >
                  {copied ? (
                    <CheckCircle className="w-3.5 h-3.5 text-inflow" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <a
                  href={`https://bscscan.com/address/${wallet.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-treasury-gold transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
          <span className="px-2 py-1 rounded-md bg-secondary text-xs font-medium text-muted-foreground">
            {wallet.chain}
          </span>
        </div>

        {/* Balance */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
          <p className="stat-value-gold">{formatCurrency(wallet.balance)}</p>
        </div>

        {/* Token Balances */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Token Holdings</p>
          <div className="grid grid-cols-2 gap-2">
            {wallet.tokenBalances.slice(0, 4).map((token) => (
              <div
                key={token.symbol}
                className="px-3 py-2 rounded-lg bg-secondary/50 border border-border/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{token.symbol}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(token.usdValue)}
                  </span>
                </div>
                <p className="text-sm font-mono text-muted-foreground mt-1">
                  {token.balance.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
