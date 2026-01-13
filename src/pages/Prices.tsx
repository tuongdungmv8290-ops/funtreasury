import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { CryptoPriceTable } from "@/components/prices/CryptoPriceTable";
import { CamlyFeaturedCard } from "@/components/prices/CamlyFeaturedCard";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export default function Prices() {
  const { t } = useTranslation();
  const { data: cryptoPrices, isLoading, refetch, isFetching } = useCryptoPrices();
  
  // Find CAMLY in the data
  const camlyData = cryptoPrices?.find(
    (coin) => coin.symbol.toUpperCase() === 'CAMLY'
  );
  
  // Filter out CAMLY from the main table (it's in featured card)
  const tableData = cryptoPrices?.filter(
    (coin) => coin.symbol.toUpperCase() !== 'CAMLY'
  ) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('prices.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('prices.subtitle')}
            </p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
          {t('common.refresh')}
        </Button>
      </div>

      {/* CAMLY Featured Card */}
      <CamlyFeaturedCard camlyData={camlyData} isLoading={isLoading} />

      {/* Crypto Price Table */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-muted-foreground">
          {t('prices.topCryptos')}
        </h2>
        <CryptoPriceTable data={tableData} isLoading={isLoading} />
      </div>
    </div>
  );
}
