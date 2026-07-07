import { GameFunTreasurySection } from '@/components/dashboard/GameFunTreasurySection';
import { useTransactionNotifications } from '@/hooks/useTransactionNotifications';

const GameFunTreasuryPage = () => {
  // Realtime toast notifications for new transactions
  useTransactionNotifications();

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-6 md:py-8">
        <div className="mb-6">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-1 tracking-wide">
            GAME <span className="gold-text">FUN TREASURY</span>
          </h1>
          <p className="font-body text-sm md:text-base text-muted-foreground">
            Số dư và toàn bộ lịch sử giao dịch on-chain gửi vào / chuyển ra — tự động cập nhật khi có giao dịch mới.
          </p>
        </div>

        <GameFunTreasurySection />
      </main>
    </div>
  );
};

export default GameFunTreasuryPage;
