import { useMemo } from 'react';
import Transactions from './Transactions';
import { useWallets } from '@/hooks/useWallets';
import { useTransactionNotifications } from '@/hooks/useTransactionNotifications';
import { Loader2, ExternalLink, Gamepad2 } from 'lucide-react';

const GAME_ADDRESSES = new Set([
  '0x032269c811a2e58683df9514d3bf6ce70d1d09bb',
  'bc1q05nm7esjp4d96jyaypgc4499lfnclf2g4f787n',
]);

export const GAME_FUN_RICH_URL = 'https://fun.rich/game_funtreasury';

const GameFunTreasuryPage = () => {
  useTransactionNotifications();
  const { data: wallets, isLoading } = useWallets();

  const gameWalletIds = useMemo(
    () =>
      (wallets || [])
        .filter((w) => GAME_ADDRESSES.has(w.address.toLowerCase()))
        .map((w) => w.id),
    [wallets]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-treasury-gold" />
      </div>
    );
  }

  return (
    <div>
      {/* fun.rich link banner */}
      <div className="px-4 md:px-6 pt-4">
        <a
          href={GAME_FUN_RICH_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 rounded-xl border border-treasury-gold/40 bg-gradient-to-r from-amber-50/80 to-yellow-50/80 dark:from-amber-950/30 dark:to-yellow-950/30 px-4 py-3 shadow-sm hover:shadow-md hover:border-treasury-gold transition-all"
          title="Mở trang fun.rich của GAME FUN TREASURY"
        >
          <div className="w-10 h-10 rounded-lg bg-treasury-gold/20 flex items-center justify-center shrink-0">
            <Gamepad2 className="w-5 h-5 text-treasury-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-heading font-bold text-foreground">
              GAME FUN TREASURY trên fun.rich
            </div>
            <div className="font-mono text-xs text-muted-foreground truncate">
              {GAME_FUN_RICH_URL}
            </div>
          </div>
          <ExternalLink className="w-5 h-5 text-treasury-gold group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
        </a>
      </div>

      <Transactions
        restrictedWalletIds={gameWalletIds}
        titleOverride="🎮 GAME FUN TREASURY"
        subtitleOverride="Toàn bộ giao dịch on-chain gửi vào & chuyển ra — tự động cập nhật"
      />
    </div>
  );
};

export default GameFunTreasuryPage;
