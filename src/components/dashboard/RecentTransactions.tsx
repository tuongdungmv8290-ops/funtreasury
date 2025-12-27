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
          className="text-sm text-treasury-gold hover:text-treasury-gold-glow transition-colors flex items-center gap-1"
        >
          View all
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {recentTxs.map((tx, index) => (
          <div
            key={tx.id}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/30",
              "hover:bg-secondary/50 transition-colors group"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  tx.direction === 'IN'
                    ? "bg-inflow/10 border border-inflow/20"
                    : "bg-outflow/10 border border-outflow/20"
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
                  <span className="font-medium text-foreground">{tx.tokenSymbol}</span>
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
                  "font-mono font-medium",
                  tx.direction === 'IN' ? "inflow-text" : "outflow-text"
                )}
              >
                {tx.direction === 'IN' ? '+' : '-'}{tx.amount.toLocaleString()} {tx.tokenSymbol}
              </p>
              <p className="text-xs text-muted-foreground">{formatCurrency(tx.usdValue)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
