import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, ExternalLink } from 'lucide-react';
import camlyLogo from '@/assets/camly-coin-logo.png';

const DEXSCREENER_TRADES_URL = 'https://dexscreener.com/bsc/0x0910320181889fefde0bb1ca63962b0a8882e413?tab=transactions';

export function CamlyTradesCard() {
  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-50/80 via-background to-orange-50/50 dark:from-amber-950/30 dark:via-background dark:to-orange-950/20 shadow-lg">
      <div className="absolute inset-0 rounded-xl border-2 border-treasury-gold/30" />
      
      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-treasury-gold/40 shadow-lg">
              <img src={camlyLogo} alt="CAMLY" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-base font-bold text-treasury-gold">CAMLY Analytics</h3>
              <p className="text-xs text-muted-foreground">Xem giao dịch trên DexScreener</p>
            </div>
          </div>
        </div>

        {/* View All Trades Button */}
        <Button
          size="sm"
          className="w-full h-10 bg-gradient-to-r from-treasury-gold via-amber-500 to-yellow-500 hover:from-amber-600 hover:via-treasury-gold hover:to-amber-500 text-black text-sm font-bold shadow-lg shadow-treasury-gold/30 transition-all hover:scale-[1.01]"
          onClick={() => window.open(DEXSCREENER_TRADES_URL, '_blank')}
          title="Xem lịch sử mua bán realtime"
        >
          <Activity className="w-4 h-4 mr-2" />
          View All Trades on DexScreener
          <ExternalLink className="w-3.5 h-3.5 ml-2" />
        </Button>
      </div>
    </Card>
  );
}
