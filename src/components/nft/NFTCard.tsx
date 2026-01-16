import { useState } from 'react';
import { ExternalLink, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { NFTAsset } from '@/hooks/useNFTCollection';
import { NFTDetailModal } from './NFTDetailModal';

interface NFTCardProps {
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
  rare: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]',
  epic: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]',
  legendary: 'hover:shadow-[0_0_25px_rgba(245,158,11,0.4)]',
};

export function NFTCard({ asset }: NFTCardProps) {
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
        {/* NFT Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {!imageError && asset.image_url ? (
            <img
              src={asset.image_url}
              alt={asset.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <span className="text-6xl font-bold text-primary/30">{asset.name.charAt(0)}</span>
            </div>
          )}
          
          {/* Rarity Badge */}
          <Badge 
            className={`absolute top-3 right-3 ${rarityColors[asset.rarity] || rarityColors.common}`}
          >
            {t(`nft.${asset.rarity}`)}
          </Badge>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Eye className="w-4 h-4 mr-2" />
              {t('nft.viewDetails')}
            </Button>
          </div>
        </div>

        {/* NFT Info */}
        <CardContent className="p-4 space-y-3">
          {/* Collection Name */}
          {asset.collection && (
            <p className="text-xs text-muted-foreground truncate">
              {asset.collection.name}
            </p>
          )}
          
          {/* NFT Name */}
          <h3 className="font-heading font-bold text-lg truncate group-hover:text-primary transition-colors">
            {asset.name}
          </h3>
          
          {/* Description */}
          {asset.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {asset.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            {/* Owner */}
            <div className="text-xs text-muted-foreground">
              <span className="opacity-60">{t('nft.owner')}:</span>{' '}
              <span className="font-mono">{truncateAddress(asset.owner_address)}</span>
            </div>
            
            {/* Price */}
            <div className="text-sm font-bold text-primary">
              {getPrice()}
            </div>
          </div>
        </CardContent>
      </Card>

      <NFTDetailModal
        asset={asset}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
