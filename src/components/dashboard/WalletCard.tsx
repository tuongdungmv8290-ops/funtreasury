import { Wallet as WalletIcon, Copy, ExternalLink, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatCurrency, shortenAddress } from '@/lib/mockData';
import type { Wallet } from '@/hooks/useWallets';

interface WalletCardProps {
  wallet: Wallet;
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
        "treasury-card-gold group relative overflow-hidden",
        "animate-fade-in"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Decorative background orbs */}
      <div className="absolute -top-8 -right-8 w-40 h-40 bg-gradient-to-br from-treasury-gold/15 to-transparent rounded-full blur-3xl" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-tr from-treasury-gold/10 to-transparent rounded-full blur-2xl" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-treasury-gold/25 to-treasury-gold/10 border border-treasury-gold/40 flex items-center justify-center shadow-sm">
              <WalletIcon className="w-6 h-6 text-treasury-gold" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-lg">{wallet.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground font-mono bg-secondary/60 px-2 py-0.5 rounded">
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
          <span className="px-2.5 py-1 rounded-lg bg-treasury-gold/10 border border-treasury-gold/30 text-xs font-semibold text-treasury-gold">
            {wallet.chain}
          </span>
        </div>

        {/* Balance */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-treasury-gold/5 to-transparent border border-treasury-gold/20">
          <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
          <p className="stat-value-gold">{formatCurrency(wallet.totalBalance)}</p>
        </div>

        {/* Token Balances */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Token Holdings</p>
          <div className="grid grid-cols-2 gap-2">
            {wallet.tokens.slice(0, 4).map((token) => (
              <div
                key={token.id}
                className="px-3 py-2.5 rounded-xl bg-secondary/70 border border-border/60 hover:border-treasury-gold/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">{token.symbol}</span>
                  <span className="text-xs text-muted-foreground font-medium">
                    {formatCurrency(token.usd_value)}
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
