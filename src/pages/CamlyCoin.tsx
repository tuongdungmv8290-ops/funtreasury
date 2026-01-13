import { CamlyHeroSection } from "@/components/camly/CamlyHeroSection";
import { PhilosophyComparison } from "@/components/camly/PhilosophyComparison";
import { TokenomicsSection } from "@/components/camly/TokenomicsSection";
import { CamlyStorySection } from "@/components/camly/CamlyStorySection";
import { GoldQuoteCard } from "@/components/camly/GoldQuoteCard";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const PANCAKESWAP_URL = "https://pancakeswap.finance/swap?outputCurrency=0x610b3b2b17603a7f6ddd9cca375b1f9ea52ada45";
const DEXSCREENER_URL = "https://dexscreener.com/bsc/0x610b3b2b17603a7f6ddd9cca375b1f9ea52ada45";

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

      {/* CTA Section */}
      <section className="py-12 mt-8 text-center">
        <div className="max-w-2xl mx-auto bg-gradient-to-br from-primary/10 via-background to-primary/5 rounded-2xl p-8 md:p-12 border border-primary/30 shadow-[0_0_40px_rgba(212,175,55,0.15)]">
          <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">
            Join the <span className="gold-text">CAMLY</span> Community
          </h2>
          <p className="text-muted-foreground font-body mb-8 max-w-lg mx-auto">
            Be part of a community that values love, transparency, and financial freedom.
            Start your journey with CAMLY today.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/30"
            >
              <a href={PANCAKESWAP_URL} target="_blank" rel="noopener noreferrer">
                Buy CAMLY on PancakeSwap
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary/50 text-primary hover:bg-primary/10"
            >
              <a href={DEXSCREENER_URL} target="_blank" rel="noopener noreferrer">
                View Chart
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
