import { useState } from "react";
import { DollarSign, ArrowLeftRight, Send, Download, Wallet, TrendingUp, TrendingDown, Loader2, Copy, Check, ExternalLink, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCamlyPrice } from "@/hooks/useCamlyPrice";
import { useCamlyWallet } from "@/hooks/useCamlyWallet";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { formatNumber, formatUSD } from "@/lib/formatNumber";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import camlyLogo from "@/assets/camly-coin-gold-logo.png";

import { CamlyPriceChart } from "./CamlyPriceChart";
import { CamlyTransactionHistory } from "./CamlyTransactionHistory";
import { CamlyQuickSwap } from "./CamlyQuickSwap";
import { CamlyBuyModal } from "./modals/CamlyBuyModal";
import { CamlySwapModal } from "./modals/CamlySwapModal";
import { CamlySendModal } from "./modals/CamlySendModal";
import { CamlyReceiveModal } from "./modals/CamlyReceiveModal";

export function CamlyWalletPanel() {
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: priceData, isLoading: priceLoading } = useCamlyPrice();
  const { data: cryptoPrices } = useCryptoPrices();
  const wallet = useCamlyWallet();

  const price = priceData?.price_usd ?? 0;
  const bnbPrice = cryptoPrices?.find(c => c.symbol.toLowerCase() === 'bnb')?.current_price ?? 710;
  const change24h = priceData?.change_24h ?? 0;
  const isPositive = change24h >= 0;

  const userBalanceUSD = wallet.camlyBalance * price;

  const handleCopyAddress = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      toast.success("Đã sao chép địa chỉ ví!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <Card className={cn(
        "overflow-hidden",
        "border-2 border-primary/30",
        "bg-gradient-to-br from-card via-card to-primary/5",
        "shadow-[0_0_40px_rgba(212,175,55,0.15)]"
      )}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            {/* Logo & Name */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/50">
                  <img
                    src={camlyLogo}
                    alt="CAMLY"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-[10px] font-bold text-white">
                  BSC
                </div>
              </div>
              <div>
                <CardTitle className="text-xl font-heading gold-text">
                  CAMLY COIN
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  BNB Smart Chain
                </p>
              </div>
            </div>

            {/* Connect Wallet Button */}
            {!wallet.isConnected ? (
              <Button
                onClick={wallet.connectWallet}
                disabled={wallet.isConnecting}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {wallet.isConnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wallet className="w-4 h-4" />
                )}
                Kết nối ví
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Đã kết nối</p>
                  <p className="text-sm font-mono text-primary">
                    {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
                  </p>
                </div>
                {/* Copy Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleCopyAddress}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-inflow" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground hover:text-primary" />
                  )}
                </Button>
                {/* BscScan Link */}
                <a
                  href={`https://bscscan.com/address/${wallet.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                  </Button>
                </a>
                {/* Disconnect Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={wallet.disconnectWallet}
                >
                  <LogOut className="w-4 h-4 text-muted-foreground hover:text-outflow" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Price Display */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Giá hiện tại</p>
            {priceLoading ? (
              <div className="h-10 w-40 bg-muted animate-pulse rounded" />
            ) : (
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-3xl font-bold text-foreground">
                  ${formatNumber(price, { minDecimals: 6, maxDecimals: 8 })}
                </span>
                <span className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  isPositive ? "text-inflow" : "text-outflow"
                )}>
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {isPositive ? "+" : ""}{change24h.toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          {/* Price Chart */}
          <CamlyPriceChart />

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-3">
            <Button
              variant="outline"
              onClick={() => setBuyModalOpen(true)}
              className="flex flex-col items-center gap-1 h-auto py-3 hover:border-primary hover:bg-primary/5"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-medium">Mua</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => setSwapModalOpen(true)}
              className="flex flex-col items-center gap-1 h-auto py-3 hover:border-primary hover:bg-primary/5"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ArrowLeftRight className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-medium">Hoán đổi</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => setSendModalOpen(true)}
              className="flex flex-col items-center gap-1 h-auto py-3 hover:border-primary hover:bg-primary/5"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Send className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-medium">Gửi</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => setReceiveModalOpen(true)}
              className="flex flex-col items-center gap-1 h-auto py-3 hover:border-primary hover:bg-primary/5"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-medium">Nhận</span>
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

              {/* Quick Swap */}
              <Separator />
              <CamlyQuickSwap
                camlyPrice={price}
                bnbPrice={bnbPrice}
                camlyBalance={wallet.camlyBalance}
                bnbBalance={wallet.bnbBalance}
                isConnected={wallet.isConnected}
              />
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
              connectedAddress={wallet.isConnected ? wallet.address : null}
            />
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <CamlyBuyModal open={buyModalOpen} onOpenChange={setBuyModalOpen} />
      <CamlySwapModal open={swapModalOpen} onOpenChange={setSwapModalOpen} />
      <CamlySendModal open={sendModalOpen} onOpenChange={setSendModalOpen} />
      <CamlyReceiveModal open={receiveModalOpen} onOpenChange={setReceiveModalOpen} />
    </>
  );
}
