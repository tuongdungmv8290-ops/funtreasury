import { Copy, ExternalLink, Shield, Users, Droplets, Coins, Calendar, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCamlyPrice } from "@/hooks/useCamlyPrice";
import { useCamlyTrades } from "@/hooks/useCamlyTrades";
import { formatNumber, formatUSD } from "@/lib/formatNumber";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CAMLY_CONTRACT } from "@/hooks/useCamlyWallet";
import camlyLogo from "@/assets/camly-coin-gold-logo.png";

// Format supply with B/M suffix
function formatSupply(value: number): string {
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(2) + 'B';
  }
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(2) + 'M';
  }
  return formatNumber(value, { maxDecimals: 0 });
}

interface DetailRowProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  valueClassName?: string;
}

function DetailRow({ label, value, icon, valueClassName }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon && <span className="w-4 h-4">{icon}</span>}
        <span className="text-sm">{label}</span>
      </div>
      <span className={cn("font-mono text-sm font-medium text-foreground", valueClassName)}>
        {value}
      </span>
    </div>
  );
}

export function CamlyDetailSection() {
  const { data: priceData } = useCamlyPrice();
  const { data: tradesPages } = useCamlyTrades();

  // Extract data from API
  const marketCap = priceData?.market_cap ?? 21930000;
  const fdv = marketCap; // FDV = Market Cap for fully circulating tokens
  
  // Token constants
  const circulatingSupply = 999990000000; // ~1 trillion CAMLY
  const maxSupply = 999990000000;
  const creationDate = "2022-09-11 01:39:52";
  
  // Get top holders data from trades query
  const firstPage = tradesPages?.pages?.[0];
  const topHolders = firstPage?.topHolders ?? [];
  const stats = firstPage?.stats;
  
  // Calculate top 10 holders percentage
  const top10Percentage = topHolders.slice(0, 10).reduce((sum, h) => sum + (h.percentage || 0), 0);
  const top10Count = topHolders.length > 0 ? topHolders.length : 10;
  
  // Liquidity from stats or fallback
  const liquidity = 22550; // Default PancakeSwap pool liquidity

  const handleCopyContract = () => {
    navigator.clipboard.writeText(CAMLY_CONTRACT);
    toast.success("Đã sao chép địa chỉ contract!");
  };

  return (
    <div className="space-y-4">
      {/* Important Data Section */}
      <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
        <CardContent className="pt-4 pb-2">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">Dữ liệu quan trọng</h3>
          </div>
          
          <div className="space-y-0.5">
            <DetailRow 
              label="Vốn hóa thị trường" 
              value={formatUSD(marketCap)}
              icon={<Coins className="w-4 h-4" />}
            />
            <Separator className="opacity-30" />
            <DetailRow 
              label="FDV (Định giá pha loãng)" 
              value={formatUSD(fdv)}
              icon={<Coins className="w-4 h-4" />}
            />
            <Separator className="opacity-30" />
            <DetailRow 
              label="% Top 10 Holders" 
              value={`${top10Percentage.toFixed(2)}% (${formatNumber(top10Count, { maxDecimals: 0 })})`}
              icon={<Users className="w-4 h-4" />}
              valueClassName={top10Percentage > 50 ? "text-amber-500" : "text-inflow"}
            />
            <Separator className="opacity-30" />
            <DetailRow 
              label="Tổng thanh khoản" 
              value={formatUSD(liquidity)}
              icon={<Droplets className="w-4 h-4" />}
            />
            <Separator className="opacity-30" />
            <DetailRow 
              label="Nguồn cung lưu hành" 
              value={formatSupply(circulatingSupply)}
              icon={<Coins className="w-4 h-4" />}
            />
            <Separator className="opacity-30" />
            <DetailRow 
              label="Nguồn cung tối đa" 
              value={formatSupply(maxSupply)}
              icon={<Coins className="w-4 h-4" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Basic Info Section */}
      <Card className="border-border/50">
        <CardContent className="pt-4 pb-2">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">Thông tin cơ bản</h3>
          </div>
          
          {/* Mainnet & Coin Name */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Mainnet</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">B</span>
                </div>
                <span className="font-medium text-foreground">BNB Chain</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tên coin</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full overflow-hidden">
                  <img src={camlyLogo} alt="CAMLY" className="w-full h-full object-cover" />
                </div>
                <span className="font-medium text-foreground">CAMLY COIN</span>
              </div>
            </div>
          </div>

          <Separator className="opacity-30 mb-3" />

          {/* Creation Time */}
          <div className="mb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Thời gian tạo</span>
            </div>
            <p className="font-mono text-sm font-medium text-foreground pl-6">
              {creationDate}
            </p>
          </div>

          <Separator className="opacity-30 mb-3" />

          {/* Contract Address */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Địa chỉ Contract</p>
            <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-2">
              <span className="font-mono text-xs text-foreground flex-1 truncate">
                {CAMLY_CONTRACT}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={handleCopyContract}
              >
                <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
              </Button>
              <a
                href={`https://bscscan.com/token/${CAMLY_CONTRACT}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About CAMLY Section */}
      <Card className="border-border/50">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full overflow-hidden">
              <img src={camlyLogo} alt="CAMLY" className="w-full h-full object-cover" />
            </div>
            <h3 className="font-semibold text-foreground">Thông tin CAMLY</h3>
          </div>
          
          <p className="text-sm text-muted-foreground leading-relaxed">
            CAMLY coin is primarily used for rewarding, known as a <span className="text-primary font-medium">Utility Token</span>, 
            for millions and eventually billions of people. The token operates on the BNB Smart Chain (BSC) 
            with a total supply of approximately 1 trillion tokens.
          </p>
          
          <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-primary font-medium italic text-center">
              "Love of Value — A Token of Pure Love Energy"
            </p>
          </div>

          {/* Trading Stats */}
          {stats && (
            <>
              <Separator className="my-4 opacity-30" />
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted/30 rounded-lg p-2">
                  <p className="text-xs text-muted-foreground mb-0.5">Mua 24h</p>
                  <p className="font-mono text-sm font-semibold text-inflow">{stats.buys24h}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-2">
                  <p className="text-xs text-muted-foreground mb-0.5">Bán 24h</p>
                  <p className="font-mono text-sm font-semibold text-outflow">{stats.sells24h}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-2">
                  <p className="text-xs text-muted-foreground mb-0.5">Volume 24h</p>
                  <p className="font-mono text-sm font-semibold">{formatUSD(stats.volume24h)}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
