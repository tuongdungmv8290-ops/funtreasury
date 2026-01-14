import { CamlyHeroSection } from "@/components/camly/CamlyHeroSection";
import { PhilosophyComparison } from "@/components/camly/PhilosophyComparison";
import { TokenomicsSection } from "@/components/camly/TokenomicsSection";
import { CamlyStorySection } from "@/components/camly/CamlyStorySection";
import { GoldQuoteCard } from "@/components/camly/GoldQuoteCard";

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

      {/* Hero Section */}
      <CamlyHeroSection />

      {/* Main Quote */}
      <div className="my-12">
        <GoldQuoteCard
          quote="Love of Value — Not just Store of Value. CAMLY represents the spiritual and financial prosperity of pure love energy."
          author="CAMLY Vision"
        />
      </div>

      {/* Philosophy Comparison */}
      <PhilosophyComparison />

      {/* Tokenomics */}
      <TokenomicsSection />

      {/* Story Section */}
      <CamlyStorySection />
    </div>
  );
}
