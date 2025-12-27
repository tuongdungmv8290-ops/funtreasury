import { ArrowUpRight, ArrowDownLeft, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockTransactions, formatCurrency, shortenAddress, formatDate } from '@/lib/mockData';
import { Link } from 'react-router-dom';

export function RecentTransactions() {
  const recentTxs = mockTransactions.slice(0, 5);

  return (
    <div className="treasury-card animate-fade-in" style={{ animationDelay: '500ms' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
          <p className="text-sm text-muted-foreground">Latest activity across all wallets</p>
        </div>
        <Link
          to="/transactions"
          className="text-sm font-medium text-treasury-gold hover:text-treasury-gold-glow transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg bg-treasury-gold/10 border border-treasury-gold/30 hover:bg-treasury-gold/20"
        >
          View all
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-2">
        {recentTxs.map((tx) => (
          <div
            key={tx.id}
            className={cn(
              "flex items-center justify-between p-3.5 rounded-xl bg-secondary/50 border border-border/50",
              "hover:bg-secondary/80 hover:border-border transition-all group"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  tx.direction === 'IN'
                    ? "bg-inflow/10 border border-inflow/30"
                    : "bg-outflow/10 border border-outflow/30"
                )}
              >
                {tx.direction === 'IN' ? (
                  <ArrowDownLeft className="w-5 h-5 text-inflow" />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-outflow" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{tx.tokenSymbol}</span>
                  <span className="text-xs text-muted-foreground">
                    {tx.direction === 'IN' ? 'from' : 'to'} {shortenAddress(tx.direction === 'IN' ? tx.fromAddress : tx.toAddress)}
                  </span>
                  <a
                    href={`https://bscscan.com/tx/${tx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-treasury-gold" />
                  </a>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDate(tx.timestamp)}</p>
              </div>
            </div>
            <div className="text-right">
              <p
                className={cn(
                  "font-mono font-semibold",
                  tx.direction === 'IN' ? "inflow-text" : "outflow-text"
                )}
              >
                {tx.direction === 'IN' ? '+' : '-'}{tx.amount.toLocaleString()} {tx.tokenSymbol}
              </p>
              <p className="text-xs text-muted-foreground font-medium">{formatCurrency(tx.usdValue)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
