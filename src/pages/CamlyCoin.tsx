import { PhilosophyComparison } from "@/components/camly/PhilosophyComparison";
import { TokenomicsSection } from "@/components/camly/TokenomicsSection";
import { CamlyStorySection } from "@/components/camly/CamlyStorySection";
import { GoldQuoteCard } from "@/components/camly/GoldQuoteCard";
import { RewardsWalletCard } from "@/components/rewards/RewardsWalletCard";

export default function CamlyCoin() {
  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-heading font-bold gold-text">
          CAMLY Coin
        </h1>
        <p className="text-muted-foreground mt-2 font-body">
          Love of Value — A Token of Pure Love Energy
        </p>
      </header>

      {/* Main Quote */}
      <div className="my-12">
        <GoldQuoteCard
          quote="Love of Value — Not just Store of Value. CAMLY represents the spiritual and financial prosperity of pure love energy."
          author="CAMLY Vision"
        />
      </div>

      {/* Philosophy Comparison */}
      <PhilosophyComparison />

      {/* Rewards Wallet - Transaction History */}
      <div className="my-12">
        <div className="mb-4">
          <h2 className="text-2xl font-heading font-bold gold-text">Lịch sử giao dịch ví Rewards</h2>
          <p className="text-sm text-muted-foreground mt-1">Hoạt động của Ví Phần thưởng CAMLY</p>
        </div>
        <RewardsWalletCard />
      </div>

      {/* Tokenomics */}
      <TokenomicsSection />

      {/* Story Section */}
      <CamlyStorySection />
    </div>
  );
}
