import { useState, useMemo } from "react";
import { CryptoPrice } from "@/hooks/useCryptoPrices";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, ArrowUpDown, ChevronUp, ChevronDown, ExternalLink, Copy, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { toast } from "@/hooks/use-toast";

interface CryptoPriceTableProps {
  data: CryptoPrice[];
  isLoading?: boolean;
}

type SortKey = 'price' | 'change' | 'volume' | 'marketCap' | 'supply';
type SortOrder = 'asc' | 'desc';

interface SortableHeaderProps {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  currentOrder: SortOrder;
  onSort: (key: SortKey) => void;
}

function SortableHeader({ label, sortKey, currentKey, currentOrder, onSort }: SortableHeaderProps) {
  const isActive = sortKey === currentKey;
  
  return (
    <TableHead 
      className={cn(
        "text-right text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors select-none group",
        isActive && "text-primary"
      )}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center justify-end gap-1">
        {label}
        {isActive ? (
          currentOrder === 'desc' ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-40 group-hover:opacity-70 transition-opacity" />
        )}
      </div>
    </TableHead>
  );
}

function formatPrice(price: number | null | undefined, symbol: string): string {
  if (price === null || price === undefined) return 'N/A';
  // Use more decimals for low-value coins like CAMLY
  if (price < 0.01) {
    return `$${price.toFixed(8)}`;
  } else if (price < 1) {
    return `$${price.toFixed(6)}`;
  } else if (price < 100) {
    return `$${price.toFixed(4)}`;
  }
  return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  } else if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

function formatSupply(value: number | null | undefined, symbol: string): string {
  if (value === null || value === undefined) return 'N/A';
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B ${symbol.toUpperCase()}`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M ${symbol.toUpperCase()}`;
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K ${symbol.toUpperCase()}`;
  }
  return `${value.toFixed(2)} ${symbol.toUpperCase()}`;
}

function getTradeUrl(symbol: string, id: string): string {
  const sym = symbol.toUpperCase();
  
  // CAMLY - PancakeSwap V3 với chain=bsc để đảm bảo hoạt động mượt mà
  if (sym === 'CAMLY') {
    return 'https://pancakeswap.finance/swap?chain=bsc&outputCurrency=0x0910320181889fefde0bb1ca63962b0a8882e413&inputCurrency=BNB';
  }
  
  // Binance trading pairs (most popular tokens)
  const binanceSymbols = [
    'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'AVAX', 'DOT', 'TON', 'SUI', 'TRX',
    'LINK', 'UNI', 'AAVE', 'MKR', 'CRV', 'COMP', 'SUSHI', 'CAKE', 'RAY', 'JUP',
    'LDO', 'PENDLE', 'ONDO', 'GRT', 'HYPE',
    'USDT', 'USDC', 'DAI',
    'DOGE', 'SHIB', 'PEPE', 'WLD',
    'XLM', 'LTC', 'BCH', 'ZEC', 'HBAR',
    'MATIC', 'ARB', 'OP'
  ];
  
  if (binanceSymbols.includes(sym)) {
    return `https://www.binance.com/en/trade/${sym}_USDT`;
  }
  
  // PancakeSwap for BSC tokens
  const pancakeTokens: Record<string, string> = {
    'CAKE': '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
  };
  
  if (pancakeTokens[sym]) {
    return `https://pancakeswap.finance/swap?chain=bsc&outputCurrency=${pancakeTokens[sym]}`;
  }
  
  // Fallback to CoinGecko markets page
  return `https://www.coingecko.com/en/coins/${id}#markets`;
}

function MiniSparkline({ prices, isPositive }: { prices: number[]; isPositive: boolean }) {
  if (!prices || prices.length === 0) return null;
  
  // Sample every nth point to get ~20 points
  const step = Math.max(1, Math.floor(prices.length / 20));
  const sampledPrices = prices.filter((_, i) => i % step === 0);
  
  const min = Math.min(...sampledPrices);
  const max = Math.max(...sampledPrices);
  const range = max - min || 1;
  
  const height = 32;
  const width = 80;
  
  const points = sampledPrices.map((price, i) => {
    const x = (i / (sampledPrices.length - 1)) * width;
    const y = height - ((price - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={isPositive ? 'hsl(var(--inflow))' : 'hsl(var(--outflow))'}
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  );
}

function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-6" /></TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-8 w-20" /></TableCell>
      <TableCell><Skeleton className="h-8 w-16" /></TableCell>
    </TableRow>
  );
}

export function CryptoPriceTable({ data, isLoading }: CryptoPriceTableProps) {
  const { t } = useTranslation();
  const [sortKey, setSortKey] = useState<SortKey>('marketCap');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [tradeModal, setTradeModal] = useState<{ open: boolean; url: string; symbol: string }>({
    open: false,
    url: '',
    symbol: ''
  });
  const [copied, setCopied] = useState(false);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const handleTradeClick = (symbol: string, id: string) => {
    const url = getTradeUrl(symbol, id);
    // Try to open directly first
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    // If blocked (popup blocked or sandbox restriction), show modal
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      setTradeModal({ open: true, url, symbol: symbol.toUpperCase() });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(tradeModal.url);
      setCopied(true);
      toast({
        title: "Đã copy!",
        description: "Link đã được copy vào clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Lỗi",
        description: "Không thể copy link",
        variant: "destructive",
      });
    }
  };

  const sortedData = useMemo(() => {
    // Thứ tự ưu tiên cố định: CAMLY > BTC > USDT > BNB
    const PRIORITY_ORDER = ['CAMLY', 'BTC', 'USDT', 'BNB'];
    
    return [...data].sort((a, b) => {
      const aSym = a.symbol.toUpperCase();
      const bSym = b.symbol.toUpperCase();
      
      // Priority tokens luôn đứng đầu theo thứ tự cố định
      const aPriority = PRIORITY_ORDER.indexOf(aSym);
      const bPriority = PRIORITY_ORDER.indexOf(bSym);
      
      if (aPriority !== -1 && bPriority !== -1) {
        return aPriority - bPriority;
      }
      if (aPriority !== -1) return -1;
      if (bPriority !== -1) return 1;
      
      // Còn lại: Ưu tiên token tăng mạnh trong ngày (>5%)
      const aChange = a.price_change_percentage_24h ?? 0;
      const bChange = b.price_change_percentage_24h ?? 0;
      
      if (aChange > 5 && bChange <= 5) return -1;
      if (bChange > 5 && aChange <= 5) return 1;
      
      // Cả hai đều hot hoặc không -> sort theo user choice
      let aVal: number, bVal: number;
      switch (sortKey) {
        case 'price':
          aVal = a.current_price ?? 0;
          bVal = b.current_price ?? 0;
          break;
        case 'change':
          aVal = aChange;
          bVal = bChange;
          break;
        case 'volume':
          aVal = a.total_volume ?? 0;
          bVal = b.total_volume ?? 0;
          break;
        case 'marketCap':
          aVal = a.market_cap ?? 0;
          bVal = b.market_cap ?? 0;
          break;
        case 'supply':
          aVal = a.circulating_supply ?? 0;
          bVal = b.circulating_supply ?? 0;
          break;
        default:
          aVal = a.market_cap ?? 0;
          bVal = b.market_cap ?? 0;
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [data, sortKey, sortOrder]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="w-12 text-muted-foreground">#</TableHead>
              <TableHead className="text-muted-foreground">Coin</TableHead>
              <TableHead className="text-right text-muted-foreground">{t('prices.price')}</TableHead>
              <TableHead className="text-right text-muted-foreground">{t('prices.change24h')}</TableHead>
              <TableHead className="text-right text-muted-foreground">{t('prices.volume')}</TableHead>
              <TableHead className="text-right text-muted-foreground">{t('prices.marketCap')}</TableHead>
              <TableHead className="text-right text-muted-foreground">{t('defi.circulatingSupply')}</TableHead>
              <TableHead className="text-right text-muted-foreground">7d</TableHead>
              <TableHead className="text-right text-muted-foreground">{t('defi.trade')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(8)].map((_, i) => (
              <TableRowSkeleton key={i} />
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border/50">
            <TableHead className="w-12 text-muted-foreground font-medium">#</TableHead>
            <TableHead className="text-muted-foreground font-medium min-w-[150px]">Coin</TableHead>
            <SortableHeader label={t('prices.price')} sortKey="price" currentKey={sortKey} currentOrder={sortOrder} onSort={handleSort} />
            <SortableHeader label={t('prices.change24h')} sortKey="change" currentKey={sortKey} currentOrder={sortOrder} onSort={handleSort} />
            <SortableHeader label={t('prices.volume')} sortKey="volume" currentKey={sortKey} currentOrder={sortOrder} onSort={handleSort} />
            <SortableHeader label={t('prices.marketCap')} sortKey="marketCap" currentKey={sortKey} currentOrder={sortOrder} onSort={handleSort} />
            <SortableHeader label={t('defi.circulatingSupply')} sortKey="supply" currentKey={sortKey} currentOrder={sortOrder} onSort={handleSort} />
            <TableHead className="text-right text-muted-foreground font-medium">7d</TableHead>
            <TableHead className="text-right text-muted-foreground font-medium">{t('defi.trade')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
        {sortedData.map((coin, index) => {
            const isPositive = (coin.price_change_percentage_24h ?? 0) >= 0;
            const isCamly = coin.symbol.toUpperCase() === 'CAMLY';
            
            return (
              <TableRow
                key={coin.id}
                className={cn(
                  "hover:bg-muted/50 transition-colors border-border/30",
                  isCamly && "border-2 border-primary bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-[0_0_25px_rgba(201,162,39,0.15)]"
                )}
              >
                <TableCell className="font-medium text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img 
                      src={coin.image} 
                      alt={coin.name}
                      className={cn(
                        "w-8 h-8 rounded-full",
                        isCamly && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      )}
                    />
                    <div>
                      <div className={cn(
                        "font-semibold",
                        isCamly && "text-primary"
                      )}>
                        {coin.name}
                      </div>
                      <div className="text-sm text-muted-foreground uppercase">
                        {coin.symbol}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono font-medium">
                  {formatPrice(coin.current_price, coin.symbol)}
                </TableCell>
                <TableCell className="text-right">
                  <div className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium",
                    isPositive 
                      ? "text-inflow bg-inflow/10" 
                      : "text-outflow bg-outflow/10"
                  )}>
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(coin.price_change_percentage_24h ?? 0).toFixed(2)}%
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  {formatCompact(coin.total_volume)}
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  {formatCompact(coin.market_cap)}
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground text-sm">
                  {coin.circulating_supply ? formatSupply(coin.circulating_supply, coin.symbol) : '--'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <MiniSparkline 
                      prices={coin.sparkline_in_7d?.price || []} 
                      isPositive={isPositive}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTradeClick(coin.symbol, coin.id);
                    }}
                    className={cn(
                      "inline-flex items-center justify-center gap-1 text-xs font-medium rounded-md px-3 h-8",
                      "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                      "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
                      isCamly && "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    )}
                  >
                    {t('defi.trade')}
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Trade Link Modal - Fallback khi bị block trong preview */}
      <Dialog open={tradeModal.open} onOpenChange={(open) => setTradeModal({ ...tradeModal, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-primary" />
              Trade {tradeModal.symbol}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Link bị chặn trong môi trường preview. Hãy copy và mở trong tab mới:
            </p>
            <div className="flex gap-2">
              <Input 
                value={tradeModal.url} 
                readOnly 
                className="text-xs font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-inflow" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleCopyLink}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.open(tradeModal.url, '_blank', 'noopener,noreferrer')}
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Thử Mở Lại
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              💡 Sau khi <strong>Publish</strong> app lên production, link sẽ hoạt động bình thường!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
