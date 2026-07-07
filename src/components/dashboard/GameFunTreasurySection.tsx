import { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ExternalLink, Gamepad2, Loader2, RefreshCw } from 'lucide-react';
import { useWallets } from '@/hooks/useWallets';
import { useTransactions } from '@/hooks/useTransactions';
import { useAddressLabels } from '@/hooks/useAddressLabels';
import { WalletCard } from './WalletCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCurrency, shortenAddress } from '@/lib/formatUtils';
import { formatNumber } from '@/lib/formatNumber';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useViewMode } from '@/contexts/ViewModeContext';

const GAME_WALLET_ADDRESSES = new Set([
  '0x032269c811a2e58683df9514d3bf6ce70d1d09bb',
  'bc1q05nm7esjp4d96jyaypgc4499lfnclf2g4f787n',
]);

const PAGE_SIZE = 20;

export function GameFunTreasurySection() {
  const { data: allWallets } = useWallets();
  const { data: allTxs, isLoading: txLoading } = useTransactions();
  const { getLabel } = useAddressLabels();
  const { isViewOnly } = useViewMode();
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [chainFilter, setChainFilter] = useState<'ALL' | 'BNB' | 'BTC'>('ALL');
  const [isSyncing, setIsSyncing] = useState(false);

  const gameWallets = useMemo(
    () =>
      (allWallets || []).filter((w) =>
        GAME_WALLET_ADDRESSES.has(w.address.toLowerCase())
      ),
    [allWallets]
  );

  const gameWalletIds = useMemo(
    () => new Set(gameWallets.map((w) => w.id)),
    [gameWallets]
  );

  const filteredTxs = useMemo(() => {
    if (!allTxs) return [];
    return allTxs.filter((tx) => {
      if (!gameWalletIds.has(tx.wallet_id)) return false;
      if (chainFilter === 'ALL') return true;
      const w = gameWallets.find((gw) => gw.id === tx.wallet_id);
      return w?.chain === chainFilter;
    });
  }, [allTxs, gameWalletIds, gameWallets, chainFilter]);

  const displayed = filteredTxs.slice(0, visible);

  const totalBalance = gameWallets.reduce((s, w) => s + w.totalBalance, 0);

  const handleSyncGameWallets = async () => {
    setIsSyncing(true);
    toast.loading('🔄 Đang đồng bộ ví GAME FUN TREASURY...', { id: 'game-sync' });
    try {
      const results = await Promise.all(
        gameWallets.map((w) =>
          supabase.functions.invoke('sync-transactions', {
            body: { wallet_id: w.id, force_full_sync: true },
          })
        )
      );
      const totalNew = results.reduce(
        (s, r: any) => s + (r?.data?.newTxCount || r?.data?.totalNewTransactions || 0),
        0
      );
      toast.success(`✅ Đã đồng bộ ${totalNew} giao dịch mới`, { id: 'game-sync', duration: 5000 });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets-raw'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-summary-raw'] });
    } catch (e) {
      toast.error('❌ Đồng bộ thất bại', { id: 'game-sync' });
    } finally {
      setIsSyncing(false);
    }
  };

  if (gameWallets.length === 0) return null;

  return (
    <section className="mb-6 md:mb-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-treasury-gold/25 to-treasury-gold/10 border border-treasury-gold/40 flex items-center justify-center shadow-sm">
            <Gamepad2 className="w-6 h-6 text-treasury-gold" />
          </div>
          <div>
            <h2 className="font-heading text-xl md:text-2xl font-semibold text-foreground tracking-wide">
              GAME <span className="gold-text">FUN TREASURY</span>
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              Tổng số dư: <span className="font-mono text-treasury-gold font-semibold">{formatCurrency(totalBalance)}</span>
              {' · '}{filteredTxs.length} giao dịch on-chain
            </p>
          </div>
        </div>
        {!isViewOnly && (
          <Button
            onClick={handleSyncGameWallets}
            disabled={isSyncing}
            variant="outline"
            className="gap-2 border-treasury-gold/50 text-treasury-gold hover:bg-treasury-gold/10"
          >
            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Đồng bộ toàn bộ
          </Button>
        )}
      </div>

      {/* Wallet Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {gameWallets.map((w, i) => (
          <WalletCard key={w.id} wallet={w} index={i} />
        ))}
      </div>

      {/* Transactions table */}
      <div className="treasury-card">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground">
              Lịch sử giao dịch on-chain
            </h3>
            <p className="text-xs text-muted-foreground">
              Tất cả token gửi vào và chuyển ra của GAME FUN TREASURY
            </p>
          </div>
          <div className="flex items-center bg-secondary/80 border border-border/60 rounded-lg p-1">
            {(['ALL', 'BNB', 'BTC'] as const).map((c) => (
              <button
                key={c}
                onClick={() => {
                  setChainFilter(c);
                  setVisible(PAGE_SIZE);
                }}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                  chainFilter === c
                    ? 'bg-treasury-gold text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {c === 'ALL' ? 'Tất cả' : c}
              </button>
            ))}
          </div>
        </div>

        {txLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-treasury-gold" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground">
            Chưa có giao dịch nào. Nhấn "Đồng bộ toàn bộ" để tải lịch sử on-chain.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="text-left py-2 px-2 font-semibold">Thời gian</th>
                    <th className="text-left py-2 px-2 font-semibold">Hướng</th>
                    <th className="text-left py-2 px-2 font-semibold">Token</th>
                    <th className="text-right py-2 px-2 font-semibold">Số lượng</th>
                    <th className="text-right py-2 px-2 font-semibold">USD</th>
                    <th className="text-left py-2 px-2 font-semibold">Từ / Đến</th>
                    <th className="text-center py-2 px-2 font-semibold">Tx</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((tx) => {
                    const isIn = tx.direction === 'IN';
                    const counterparty = isIn ? tx.from_address : tx.to_address;
                    const { label, isLabeled } = getLabel(counterparty);
                    const wallet = gameWallets.find((w) => w.id === tx.wallet_id);
                    const explorer =
                      wallet?.chain === 'BTC'
                        ? `https://mempool.space/tx/${tx.tx_hash}`
                        : `https://bscscan.com/tx/${tx.tx_hash}`;
                    return (
                      <tr
                        key={tx.id}
                        className="border-b border-border/30 hover:bg-secondary/40 transition-colors"
                      >
                        <td className="py-2.5 px-2 text-xs text-muted-foreground whitespace-nowrap">
                          {format(tx.timestamp, 'dd/MM/yy HH:mm', { locale: vi })}
                        </td>
                        <td className="py-2.5 px-2">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold',
                              isIn
                                ? 'bg-inflow/10 text-inflow border border-inflow/30'
                                : 'bg-outflow/10 text-outflow border border-outflow/30'
                            )}
                          >
                            {isIn ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {isIn ? 'IN' : 'OUT'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-heading font-semibold">{tx.token_symbol}</td>
                        <td
                          className={cn(
                            'py-2.5 px-2 text-right font-mono font-semibold whitespace-nowrap',
                            isIn ? 'text-inflow' : 'text-outflow'
                          )}
                        >
                          {isIn ? '+' : '-'}
                          {formatNumber(tx.amount, { maxDecimals: 6 })}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {formatCurrency(tx.usd_value)}
                        </td>
                        <td className="py-2.5 px-2">
                          <span
                            className={cn(
                              'text-xs',
                              isLabeled
                                ? 'text-treasury-gold font-semibold'
                                : 'font-mono text-muted-foreground'
                            )}
                            title={counterparty}
                          >
                            {isLabeled ? label : shortenAddress(counterparty)}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <a
                            href={explorer}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex text-muted-foreground hover:text-treasury-gold"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {visible < filteredTxs.length && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="border-treasury-gold/40 text-treasury-gold hover:bg-treasury-gold/10"
                >
                  Xem thêm ({filteredTxs.length - visible})
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
