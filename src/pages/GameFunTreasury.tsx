import { useMemo } from 'react';
import Transactions from './Transactions';
import { useWallets } from '@/hooks/useWallets';
import { useTransactionNotifications } from '@/hooks/useTransactionNotifications';
import { Loader2 } from 'lucide-react';

const GAME_ADDRESSES = new Set([
  '0x032269c811a2e58683df9514d3bf6ce70d1d09bb',
  'bc1q05nm7esjp4d96jyaypgc4499lfnclf2g4f787n',
]);

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
    <Transactions
      restrictedWalletIds={gameWalletIds}
      titleOverride="🎮 GAME FUN TREASURY"
      subtitleOverride="Toàn bộ giao dịch on-chain gửi vào & chuyển ra — tự động cập nhật"
    />
  );
};

export default GameFunTreasuryPage;
