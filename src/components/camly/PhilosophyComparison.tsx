import { Heart, Coins, Sparkles, Shield, Users, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhilosophyItemProps {
  icon: React.ReactNode;
  text: string;
}

function PhilosophyItem({ icon, text }: PhilosophyItemProps) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="font-body text-foreground/90">{text}</span>
    </li>
  );
}

export function PhilosophyComparison() {
  return (
    <section className="py-12">
      <h2 className="text-2xl md:text-3xl font-heading font-bold text-center mb-4">
        Philosophy Comparison
      </h2>
      <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto font-body">
        Understanding the fundamental difference between CAMLY and traditional cryptocurrencies
      </p>

      <div className="grid md:grid-cols-2 gap-6 md:gap-8">
        {/* CAMLY Card */}
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl p-8",
            "border-2 border-primary/60",
            "bg-gradient-to-br from-primary/10 via-background to-primary/5",
            "shadow-[0_0_40px_rgba(212,175,55,0.2)]"
          )}
        >
          {/* Glow effect */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/30 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-bold gold-text">CAMLY</h3>
                <p className="text-sm text-primary/80 font-medium">Love of Value</p>
              </div>
            </div>

            <ul className="space-y-4">
              <PhilosophyItem
                icon={<Sparkles className="w-5 h-5 text-primary" />}
                text="Spiritual & Financial Value Combined"
              />
              <PhilosophyItem
                icon={<Heart className="w-5 h-5 text-primary" />}
                text="Pure Love Energy from the Universe"
              />
              <PhilosophyItem
                icon={<Users className="w-5 h-5 text-primary" />}
                text="Community-Driven Growth"
              />
              <PhilosophyItem
                icon={<Sparkles className="w-5 h-5 text-primary" />}
                text="Transparency & Freedom"
              />
            </ul>

            <div className="mt-8 pt-6 border-t border-primary/30">
              <p className="font-story italic text-lg text-foreground/90">
                "Trao Tặng Năng Lượng Yêu Thương Thuần Khiết"
              </p>
            </div>
          </div>
        </div>

        {/* Bitcoin Card */}
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl p-8",
            "border border-border/60",
            "bg-gradient-to-br from-muted/50 via-background to-muted/30"
          )}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Coins className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-bold text-foreground">Bitcoin</h3>
                <p className="text-sm text-muted-foreground font-medium">Store of Value</p>
              </div>
            </div>

            <ul className="space-y-4">
              <PhilosophyItem
                icon={<Shield className="w-5 h-5 text-muted-foreground" />}
                text="Digital Gold & Hedge Against Inflation"
              />
              <PhilosophyItem
                icon={<Lock className="w-5 h-5 text-muted-foreground" />}
                text="Scarcity-Driven Value (21M Supply)"
              />
              <PhilosophyItem
                icon={<Users className="w-5 h-5 text-muted-foreground" />}
                text="Decentralized Network"
              />
              <PhilosophyItem
                icon={<Shield className="w-5 h-5 text-muted-foreground" />}
                text="Proof of Work Security"
              />
            </ul>

            <div className="mt-8 pt-6 border-t border-border/50">
              <p className="font-body italic text-lg text-muted-foreground">
                "Digital Gold for the Modern Era"
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
