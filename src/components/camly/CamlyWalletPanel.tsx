import { useState } from "react";
import { Send, Download, Wallet, TrendingUp, TrendingDown, Loader2, Copy, Check, ExternalLink, LogOut, LineChart, Info, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCamlyPrice } from "@/hooks/useCamlyPrice";
import { useCamlyWallet } from "@/hooks/useCamlyWallet";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { formatNumber, formatUSD } from "@/lib/formatNumber";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import camlyLogo from "@/assets/camly-coin-gold-logo.png";

import { CamlyPriceChart } from "./CamlyPriceChart";
import { CamlyDetailSection } from "./CamlyDetailSection";
import { CamlyTransactionHistory } from "./CamlyTransactionHistory";
import { UniversalSwap } from "./UniversalSwap";
import { SwapHistory } from "./SwapHistory";
import { CamlySendModal } from "./modals/CamlySendModal";
import { CamlyReceiveModal } from "./modals/CamlyReceiveModal";

const REWARDS_ADDRESS = '0xa4967da72d012151950627483285c3042957DA5d';

export function CamlyWalletPanel() {
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [useDefaultWallet, setUseDefaultWallet] = useState(true);

  const { data: priceData, isLoading: priceLoading } = useCamlyPrice();
  const { data: cryptoPrices } = useCryptoPrices();
  const wallet = useCamlyWallet();

  const price = priceData?.price_usd ?? 0;
  const bnbPrice = cryptoPrices?.find(c => c.symbol.toLowerCase() === 'bnb')?.current_price ?? 710;
  const change24h = priceData?.change_24h ?? 0;
  const isPositive = change24h >= 0;

  const userBalanceUSD = wallet.camlyBalance * price;

  // Display address: rewards wallet by default, or MetaMask wallet if connected
  const displayAddress = (!useDefaultWallet && wallet.isConnected) ? wallet.address : REWARDS_ADDRESS;

  const handleCopyAddress = () => {
    const addrToCopy = displayAddress;
    if (addrToCopy) {
      navigator.clipboard.writeText(addrToCopy);
      setCopied(true);
      toast.success("Đã sao chép địa chỉ ví!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEditWallet = async () => {
    await wallet.connectWallet();
    setUseDefaultWallet(false);
  };

  const handleDisconnect = () => {
    wallet.disconnectWallet();
    setUseDefaultWallet(true);
  };

  return (
    <>
      <Card className={cn(
        "overflow-hidden",
        "border-2 border-primary/30",
        "bg-gradient-to-br from-card via-card to-primary/5",
        "shadow-[0_0_40px_rgba(212,175,55,0.15)]"
      )}>
        {/* Large Logo Header - Center Layout */}
        <CardContent className="pt-8 pb-4">
          <div className="flex flex-col items-center text-center">
            {/* Large Logo with Glow Effect */}
            <div className="relative mb-4">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden ring-4 ring-primary/50 shadow-[0_0_50px_rgba(212,175,55,0.4)]">
                <img
                  src={camlyLogo}
                  alt="CAMLY"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* BSC Badge */}
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-sm font-bold text-white shadow-lg border-2 border-background">
                BSC
              </div>
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl -z-10" />
            </div>

            {/* Name & Slogan */}
            <h2 className="text-2xl md:text-3xl font-heading font-bold gold-text">
              CAMLY COIN
            </h2>
            <p className="text-muted-foreground text-sm mt-1">Love of Value</p>

            {/* Price Display - Large */}
            <div className="mt-6">
              {priceLoading ? (
                <div className="h-12 w-48 bg-muted animate-pulse rounded-lg mx-auto" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <span className="font-mono text-4xl md:text-5xl font-bold text-foreground">
                    ${formatNumber(price, { minDecimals: 6, maxDecimals: 8 })}
                  </span>
                  <span className={cn(
                    "flex items-center gap-1 text-lg font-medium px-3 py-1 rounded-full",
                    isPositive ? "text-inflow bg-inflow/10" : "text-outflow bg-outflow/10"
                  )}>
                    {isPositive ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                    {isPositive ? "+" : ""}{change24h.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>

            {/* Stats: Volume + Market Cap */}
            <div className="grid grid-cols-2 gap-4 mt-6 w-full max-w-sm">
              <div className="bg-card/50 dark:bg-card/30 rounded-xl p-3 border border-border/50">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">24H Volume</p>
                <p className="font-mono font-semibold text-foreground">
                  {formatUSD(priceData?.volume_24h ?? 0)}
                </p>
              </div>
              <div className="bg-card/50 dark:bg-card/30 rounded-xl p-3 border border-border/50">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Market Cap</p>
                <p className="font-mono font-semibold text-foreground">
                  {priceData?.market_cap ? formatUSD(priceData.market_cap) : "—"}
                </p>
              </div>
            </div>

            {/* Wallet Address Display */}
            <div className="mt-6 w-full max-w-sm">
              <div className="flex items-center justify-center gap-2 bg-primary/10 rounded-xl px-4 py-3">
                <div className="w-3 h-3 rounded-full bg-inflow animate-pulse" />
                <span className="text-sm font-mono text-primary">
                  {displayAddress?.slice(0, 6)}...{displayAddress?.slice(-4)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleCopyAddress}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-inflow" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground hover:text-primary" />
                  )}
                </Button>
                <a
                  href={`https://bscscan.com/address/${displayAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                  </Button>
                </a>
                {(!wallet.isConnected || useDefaultWallet) ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleEditWallet}
                    disabled={wallet.isConnecting}
                    title="Chỉnh sửa ví"
                  >
                    {wallet.isConnecting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Pencil className="w-4 h-4 text-muted-foreground hover:text-primary" />
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleDisconnect}
                    title="Ngắt kết nối"
                  >
                    <LogOut className="w-4 h-4 text-muted-foreground hover:text-outflow" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>

        <CardContent className="space-y-6 pt-0">

          {/* Tabs: Chart | Detail */}
          <Tabs defaultValue="chart" className="w-full">
            <TabsList className="grid grid-cols-2 w-full max-w-xs mx-auto mb-4">
              <TabsTrigger value="chart" className="gap-2">
                <LineChart className="w-4 h-4" />
                Báo giá
              </TabsTrigger>
              <TabsTrigger value="detail" className="gap-2">
                <Info className="w-4 h-4" />
                Chi tiết
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chart" className="mt-0">
              <CamlyPriceChart />
            </TabsContent>
            
            <TabsContent value="detail" className="mt-0">
              <CamlyDetailSection />
            </TabsContent>
          </Tabs>

          {/* Action Buttons - 2 buttons: Gửi & Nhận */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => setSendModalOpen(true)}
              className="flex flex-col items-center gap-2 h-auto py-4 hover:border-primary hover:bg-primary/5"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Send className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-semibold">Gửi</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => setReceiveModalOpen(true)}
              className="flex flex-col items-center gap-2 h-auto py-4 hover:border-primary hover:bg-primary/5"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Download className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-semibold">Nhận</span>
            </Button>
          </div>

          {/* User Balance (when connected) */}
          {wallet.isConnected && wallet.isCorrectChain && (
            <>
              <Separator />
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-2">Số dư của bạn</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      <img src={camlyLogo} alt="CAMLY" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-medium">CAMLY COIN</p>
                      <p className="text-xs text-muted-foreground">BEP-20</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-lg">
                      {formatNumber(wallet.camlyBalance, { compact: true })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ≈ {formatUSD(userBalanceUSD)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Universal Swap */}
              <Separator />
              <UniversalSwap
                walletAddress={wallet.address}
                isConnected={wallet.isConnected && wallet.isCorrectChain}
                onSwapComplete={wallet.refreshBalances}
              />

              {/* Swap History */}
              <Separator />
              <SwapHistory walletAddress={wallet.address} limit={5} />
            </>
          )}

          {/* Transaction History */}
          <Separator />
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">Lịch sử giao dịch CAMLY</h3>
            </div>
            <CamlyTransactionHistory 
              limit={5} 
              connectedAddress={displayAddress}
            />
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <CamlySendModal open={sendModalOpen} onOpenChange={setSendModalOpen} />
      <CamlyReceiveModal open={receiveModalOpen} onOpenChange={setReceiveModalOpen} />
    </>
  );
}
