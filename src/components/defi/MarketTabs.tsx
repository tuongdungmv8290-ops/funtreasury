import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { CryptoPrice } from "@/hooks/useCryptoPrices";

export type MarketCategory = 'all' | 'layer1' | 'defi' | 'meme' | 'stablecoins' | 'layer2';

interface MarketTabsProps {
  activeCategory: MarketCategory;
  onCategoryChange: (category: MarketCategory) => void;
}

// Token categorization mapping
export const TOKEN_CATEGORIES: Record<string, MarketCategory[]> = {
  // Layer 1
  'BTC': ['layer1'],
  'ETH': ['layer1'],
  'BNB': ['layer1'],
  'SOL': ['layer1'],
  'XRP': ['layer1'],
  'ADA': ['layer1'],
  'AVAX': ['layer1'],
  'DOT': ['layer1'],
  'TON': ['layer1'],
  'SUI': ['layer1'],
  'TRX': ['layer1'],
  'XLM': ['layer1'],
  'LTC': ['layer1'],
  'BCH': ['layer1'],
  'ZEC': ['layer1'],
  'HBAR': ['layer1'],
  'TAO': ['layer1'],
  
  // Layer 2
  'MATIC': ['layer2'],
  'POL': ['layer2'],
  'ARB': ['layer2'],
  'OP': ['layer2'],
  
  // DeFi
  'CAMLY': ['defi'],
  'LINK': ['defi'],
  'UNI': ['defi'],
  'AAVE': ['defi'],
  'MKR': ['defi'],
  'CRV': ['defi'],
  'COMP': ['defi'],
  'SUSHI': ['defi'],
  '1INCH': ['defi'],
  'CAKE': ['defi'],
  'RAY': ['defi'],
  'JUP': ['defi'],
  'LDO': ['defi'],
  'WSTETH': ['defi'],
  'PENDLE': ['defi'],
  'ONDO': ['defi'],
  'ENA': ['defi'],
  'GRT': ['defi'],
  'HYPE': ['defi'],
  'WBTC': ['defi'],
  'WBETH': ['defi'],
  
  // Stablecoins
  'USDT': ['stablecoins'],
  'USDC': ['stablecoins'],
  'DAI': ['stablecoins'],
  'USDE': ['stablecoins'],
  
  // Meme
  'DOGE': ['meme'],
  'SHIB': ['meme'],
  'PEPE': ['meme'],
  'WLD': ['meme'],
  'TRUMP': ['meme'],
};

export function filterByCategory(tokens: CryptoPrice[], category: MarketCategory): CryptoPrice[] {
  if (category === 'all') return tokens;
  
  return tokens.filter(token => {
    const symbol = token.symbol.toUpperCase();
    const categories = TOKEN_CATEGORIES[symbol] || [];
    return categories.includes(category);
  });
}

export function MarketTabs({ activeCategory, onCategoryChange }: MarketTabsProps) {
  const { t } = useTranslation();
  
  const tabs = [
    { value: 'all', label: t('defi.allTokens') },
    { value: 'layer1', label: t('defi.layer1') },
    { value: 'layer2', label: t('defi.layer2') },
    { value: 'defi', label: t('defi.defiCategory') },
    { value: 'meme', label: t('defi.meme') },
    { value: 'stablecoins', label: t('defi.stablecoins') },
  ];

  return (
    <Tabs value={activeCategory} onValueChange={(v) => onCategoryChange(v as MarketCategory)}>
      <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 py-1.5 text-sm font-medium transition-all"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
