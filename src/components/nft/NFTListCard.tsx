import { useState } from 'react';
import { Eye, ExternalLink, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { NFTAsset } from '@/hooks/useNFTCollection';
import { NFTDetailModal } from './NFTDetailModal';

interface NFTListCardProps {
  asset: NFTAsset;
}

const rarityColors: Record<string, string> = {
  common: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  rare: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  epic: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  legendary: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

const rarityGlow: Record<string, string> = {
  common: '',
  rare: 'hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]',
  epic: 'hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]',
  legendary: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]',
};

export function NFTListCard({ asset }: NFTListCardProps) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const truncateAddress = (address: string | null) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getPrice = () => {
    if (asset.mint_type === 'free' || (asset.price_camly === 0 && asset.price_bnb === 0)) {
      return t('nft.free');
    }
    if (asset.price_camly > 0) {
      return `${asset.price_camly.toLocaleString()} CAMLY`;
    }
    return `${asset.price_bnb} BNB`;
  };

  return (
    <>
      <Card 
        className={`group overflow-hidden bg-card/50 border-border/50 hover:border-primary/50 
                    transition-all duration-300 ${rarityGlow[asset.rarity] || ''}`}
      >
        <div className="flex items-center gap-4 p-4">
          {/* Image */}
          <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
            {!imageError && asset.image_url ? (
              <img
                src={asset.image_url}
                alt={asset.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <span className="text-2xl font-bold text-primary/30">{asset.name.charAt(0)}</span>
              </div>
            )}
            
            {/* Legendary sparkle */}
            {asset.rarity === 'legendary' && (
              <Sparkles className="absolute top-1 right-1 w-4 h-4 text-amber-500 animate-pulse" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-heading font-bold truncate group-hover:text-primary transition-colors">
                {asset.name}
              </h3>
              <Badge className={`${rarityColors[asset.rarity] || rarityColors.common} shrink-0`}>
                {t(`nft.${asset.rarity}`)}
              </Badge>
            </div>
            
            {asset.collection && (
              <p className="text-sm text-muted-foreground truncate mb-1">
                {asset.collection.name}
              </p>
            )}
            
            {asset.description && (
              <p className="text-sm text-muted-foreground/70 line-clamp-1">
                {asset.description}
              </p>
            )}
          </div>

          {/* Owner */}
          <div className="hidden md:block text-sm text-muted-foreground shrink-0">
            <span className="opacity-60">{t('nft.owner')}:</span>{' '}
            <span className="font-mono">{truncateAddress(asset.owner_address)}</span>
          </div>

          {/* Price */}
          <div className="text-right shrink-0 min-w-24">
            <p className="font-bold text-primary">{getPrice()}</p>
            {asset.is_for_sale && (
              <Badge variant="outline" className="border-primary/50 text-primary text-xs mt-1">
                {t('nft.forSale')}
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setIsModalOpen(true)}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      <NFTDetailModal
        asset={asset}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
