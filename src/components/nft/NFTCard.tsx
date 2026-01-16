import { useState, useRef } from 'react';
import { Eye, Sparkles } from 'lucide-react';
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
  legendary: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] shadow-[0_0_15px_rgba(245,158,11,0.2)]',
};

const rarityBorder: Record<string, string> = {
  common: 'border-border/50 hover:border-slate-500/50',
  rare: 'border-border/50 hover:border-blue-500/50',
  epic: 'border-border/50 hover:border-purple-500/50',
  legendary: 'border-amber-500/30 hover:border-amber-500/60',
};

export function NFTCard({ asset }: NFTCardProps) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState({ transform: '' });

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

  // 3D Tilt Effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 15;
    const rotateY = (centerX - x) / 15;
    
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({ transform: '' });
  };

  return (
    <>
      <Card 
        ref={cardRef}
        className={`group overflow-hidden bg-card/50 ${rarityBorder[asset.rarity] || rarityBorder.common}
                    transition-all duration-300 ease-out ${rarityGlow[asset.rarity] || ''}`}
        style={tiltStyle}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* NFT Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {/* Shimmer Loading */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-pulse" />
          )}
          
          {!imageError && asset.image_url ? (
            <img
              src={asset.image_url}
              alt={asset.name}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onError={() => setImageError(true)}
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <span className="text-6xl font-bold text-primary/30">{asset.name.charAt(0)}</span>
            </div>
          )}
          
          {/* Rarity Badge */}
          <Badge 
            className={`absolute top-3 right-3 ${rarityColors[asset.rarity] || rarityColors.common} backdrop-blur-sm`}
          >
            {asset.rarity === 'legendary' && (
              <Sparkles className="w-3 h-3 mr-1 animate-pulse" />
            )}
            {t(`nft.${asset.rarity}`)}
          </Badge>

          {/* For Sale Badge */}
          {asset.is_for_sale && (
            <Badge 
              className="absolute top-3 left-3 bg-primary/80 text-primary-foreground backdrop-blur-sm"
            >
              {t('nft.forSale')}
            </Badge>
          )}

          {/* Legendary Glow Effect */}
          {asset.rarity === 'legendary' && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-t from-amber-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground transform scale-90 group-hover:scale-100 transition-transform duration-300"
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
          <h3 className="font-heading font-bold text-lg truncate group-hover:text-primary transition-colors flex items-center gap-2">
            {asset.name}
            {asset.rarity === 'legendary' && (
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
            )}
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
