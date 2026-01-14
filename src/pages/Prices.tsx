import { useState, useMemo } from "react";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { CryptoPriceTable } from "@/components/prices/CryptoPriceTable";
import { DeFiStatsCards } from "@/components/defi/DeFiStatsCards";
import { MarketTabs, MarketCategory, filterByCategory } from "@/components/defi/MarketTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, TrendingUp, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export default function Prices() {
  const { t } = useTranslation();
  const { data: cryptoPrices, isLoading, refetch, isFetching } = useCryptoPrices();
  const [activeCategory, setActiveCategory] = useState<MarketCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Apply category + search filters
  const tableData = useMemo(() => {
    let data = cryptoPrices || [];
    
    // Apply category filter
    data = filterByCategory(data, activeCategory);
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      data = data.filter(
        (coin) =>
          coin.name.toLowerCase().includes(query) ||
          coin.symbol.toLowerCase().includes(query)
      );
    }
    
    return data;
  }, [cryptoPrices, activeCategory, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('defi.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('defi.subtitle')}
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

      {/* DeFi Stats Cards */}
      <DeFiStatsCards data={cryptoPrices || []} isLoading={isLoading} />

      {/* Filters Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Category Tabs */}
          <MarketTabs 
            activeCategory={activeCategory} 
            onCategoryChange={setActiveCategory} 
          />
          
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('defi.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Token count */}
        <div className="text-sm text-muted-foreground">
          {t('defi.showingTokens', { count: tableData.length })}
        </div>
      </div>

      {/* Market Token Table */}
      <CryptoPriceTable data={tableData} isLoading={isLoading} />
    </div>
  );
}
