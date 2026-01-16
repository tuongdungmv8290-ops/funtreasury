import { Image, Layers, Tag, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

interface NFTStatsCardsProps {
  totalNfts: number;
  totalCollections: number;
  floorPrice: number;
  rarityBreakdown: {
    common: number;
    rare: number;
    epic: number;
    legendary: number;
  };
}

export function NFTStatsCards({ totalNfts, totalCollections, floorPrice, rarityBreakdown }: NFTStatsCardsProps) {
  const { t } = useTranslation();

  const stats = [
    {
      label: t('nft.totalNfts'),
      value: totalNfts.toLocaleString(),
      icon: Image,
      gradient: 'from-primary/20 to-primary/5',
      iconColor: 'text-primary',
    },
    {
      label: t('nft.collections'),
      value: totalCollections.toLocaleString(),
      icon: Layers,
      gradient: 'from-blue-500/20 to-blue-500/5',
      iconColor: 'text-blue-500',
    },
    {
      label: t('nft.floorPrice'),
      value: floorPrice === Infinity || floorPrice === 0 ? t('nft.free') : `${floorPrice.toLocaleString()} CAMLY`,
      icon: Tag,
      gradient: 'from-green-500/20 to-green-500/5',
      iconColor: 'text-green-500',
    },
    {
      label: t('nft.legendary'),
      value: rarityBreakdown.legendary.toLocaleString(),
      icon: Sparkles,
      gradient: 'from-amber-500/20 to-amber-500/5',
      iconColor: 'text-amber-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={index} 
            className={`bg-gradient-to-br ${stat.gradient} border-border/50 hover:border-primary/30 transition-all duration-300`}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-background/50 ${stat.iconColor}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold font-heading">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
