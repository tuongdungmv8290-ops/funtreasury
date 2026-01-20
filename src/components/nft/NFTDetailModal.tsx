import { Copy, ExternalLink, Check, Sparkles, Send, X, ZoomIn, Hash, Fingerprint, Layers } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';
import { NFTAsset } from '@/hooks/useNFTCollection';
import { toast } from 'sonner';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { NFTMintDialog } from './NFTMintDialog';
import { NFTTransferDialog } from './NFTTransferDialog';

interface NFTDetailModalProps {
  asset: NFTAsset;
  isOpen: boolean;
  onClose: () => void;
}

const rarityColors: Record<string, string> = {
  common: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  rare: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  epic: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  legendary: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

const rarityGlow: Record<string, string> = {
  common: '',
  rare: 'ring-2 ring-blue-500/30',
  epic: 'ring-2 ring-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]',
  legendary: 'ring-2 ring-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.4)]',
};

const rarityBgGlow: Record<string, string> = {
  common: 'from-slate-500/5 to-slate-500/10',
  rare: 'from-blue-500/10 to-blue-500/20',
  epic: 'from-purple-500/10 to-purple-500/20',
  legendary: 'from-amber-500/10 via-orange-500/15 to-amber-500/20',
};

// Lightbox Component for fullscreen image
function ImageLightbox({ 
  imageUrl, 
  alt, 
  isOpen, 
  onClose 
}: { 
  imageUrl: string; 
  alt: string; 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center cursor-zoom-out"
      onClick={onClose}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-[101] text-white hover:bg-white/10"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </Button>
      <img
        src={imageUrl}
        alt={alt}
        className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export function NFTDetailModal({ asset, isOpen, onClose }: NFTDetailModalProps) {
  const { t } = useTranslation();
  const { isViewOnly } = useViewMode();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [copiedTokenId, setCopiedTokenId] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isMintOpen, setIsMintOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const isAdmin = !!user && !isViewOnly;

  const copyToClipboard = (text: string, type: 'address' | 'tokenId' = 'address') => {
    navigator.clipboard.writeText(text);
    if (type === 'tokenId') {
      setCopiedTokenId(true);
      setTimeout(() => setCopiedTokenId(false), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    toast.success(t('transactions.copied'));
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

  const getBscScanUrl = () => {
    if (!asset.collection?.contract_address || !asset.token_id) return null;
    return `https://bscscan.com/token/${asset.collection.contract_address}?a=${asset.token_id}`;
  };

  // Generate unique symbol code like ENERGY-001
  const getUniqueCode = () => {
    if (!asset.collection?.symbol || !asset.token_id) return null;
    // Extract number from token_id (e.g., FAC-010 -> 010)
    const match = asset.token_id.match(/\d+/);
    const num = match ? match[0].padStart(3, '0') : '001';
    return `${asset.collection.symbol}-${num}`;
  };

  // Get serial number like #1/5
  const getSerialNumber = () => {
    if (!asset.token_id || !asset.collection?.total_supply) return null;
    const match = asset.token_id.match(/\d+/);
    if (!match) return null;
    const num = parseInt(match[0], 10);
    // Adjust the number relative to collection start
    const displayNum = num % 100 || 1; // Simple display number
    return `#${displayNum}/${asset.collection.total_supply}`;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          {/* Header with gradient based on rarity */}
          <div className={`relative bg-gradient-to-br ${rarityBgGlow[asset.rarity] || rarityBgGlow.common} p-6`}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-heading flex items-center gap-2">
                {asset.name}
                {asset.rarity === 'legendary' && (
                  <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                )}
              </DialogTitle>
            </DialogHeader>

            {/* Unique Code Badge - Prominent Display */}
            {getUniqueCode() && (
              <div className="absolute top-6 right-14">
                <Badge 
                  className={`text-lg font-mono font-bold px-3 py-1 ${rarityColors[asset.rarity]} cursor-pointer hover:scale-105 transition-transform`}
                  onClick={() => copyToClipboard(getUniqueCode()!, 'tokenId')}
                >
                  <Fingerprint className="w-4 h-4 mr-1.5" />
                  {getUniqueCode()}
                  {copiedTokenId ? (
                    <Check className="w-3 h-3 ml-1.5 text-green-400" />
                  ) : (
                    <Copy className="w-3 h-3 ml-1.5 opacity-50" />
                  )}
                </Badge>
              </div>
            )}
          </div>

          <div className="p-6 pt-0">
            <div className="grid md:grid-cols-2 gap-6">
              {/* NFT Image with Lightbox */}
              <div 
                className={`relative aspect-square rounded-xl overflow-hidden bg-muted cursor-zoom-in group ${rarityGlow[asset.rarity] || ''}`}
                onClick={() => !imageError && asset.image_url && setIsLightboxOpen(true)}
              >
                {!imageError && asset.image_url ? (
                  <>
                    <img
                      src={asset.image_url}
                      alt={asset.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={() => setImageError(true)}
                    />
                    {/* Zoom overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-3">
                        <ZoomIn className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    {/* Rarity badge on image */}
                    <Badge 
                      className={`absolute top-3 left-3 ${rarityColors[asset.rarity] || rarityColors.common} text-sm backdrop-blur-sm`}
                    >
                      {asset.rarity === 'legendary' && (
                        <Sparkles className="w-3 h-3 mr-1" />
                      )}
                      {t(`nft.${asset.rarity}`)}
                    </Badge>
                    {/* For sale badge */}
                    {asset.is_for_sale && (
                      <Badge className="absolute top-3 right-3 bg-primary/90 text-primary-foreground backdrop-blur-sm">
                        {t('nft.forSale')}
                      </Badge>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <span className="text-8xl font-bold text-primary/30">{asset.name.charAt(0)}</span>
                  </div>
                )}
              </div>

              {/* NFT Details */}
              <div className="space-y-4">
                {/* ID Cards Row */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Token ID */}
                  {asset.token_id && (
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                        <Hash className="w-3 h-3" />
                        Token ID
                      </div>
                      <p className="font-mono text-sm font-semibold">{asset.token_id}</p>
                    </div>
                  )}
                  
                  {/* Serial Number */}
                  {getSerialNumber() && (
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                        <Layers className="w-3 h-3" />
                        Serial
                      </div>
                      <p className="font-mono text-sm font-semibold">{getSerialNumber()}</p>
                    </div>
                  )}
                  
                  {/* Collection Symbol */}
                  {asset.collection?.symbol && (
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                        <Fingerprint className="w-3 h-3" />
                        Symbol
                      </div>
                      <p className="font-mono text-sm font-semibold">{asset.collection.symbol}</p>
                    </div>
                  )}
                </div>

                {/* Collection */}
                {asset.collection && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">{t('nft.collection')}</p>
                    <p className="font-semibold">{asset.collection.name}</p>
                  </div>
                )}

                {/* Price */}
                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg p-4 border border-amber-500/20">
                  <p className="text-xs text-muted-foreground mb-1">{t('prices.price')}</p>
                  <p className="text-2xl font-bold gold-text">{getPrice()}</p>
                </div>

                <Separator />

                {/* Description */}
                {asset.description && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t('nft.description')}</p>
                    <p className="text-sm leading-relaxed">{asset.description}</p>
                  </div>
                )}

                {/* Owner */}
                {asset.owner_address && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">{t('nft.owner')}</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-background/50 px-2 py-1 rounded font-mono flex-1 truncate">
                        {asset.owner_address}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => copyToClipboard(asset.owner_address!)}
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Status */}
                <div className="flex gap-2 flex-wrap">
                  {asset.is_minted && (
                    <Badge variant="outline" className="border-green-500/50 text-green-500">
                      <Check className="w-3 h-3 mr-1" />
                      {t('nft.minted')}
                    </Badge>
                  )}
                </div>

                <Separator />

                {/* Admin Action Buttons */}
                {isAdmin && (
                  <div className="flex flex-col gap-2">
                    {!asset.is_minted && (
                      <Button
                        onClick={() => setIsMintOpen(true)}
                        className="w-full gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                      >
                        <Sparkles className="w-4 h-4" />
                        {t('nft.mint')}
                      </Button>
                    )}
                    
                    {asset.is_minted && (
                      <Button
                        variant="outline"
                        onClick={() => setIsTransferOpen(true)}
                        className="w-full gap-2"
                      >
                        <Send className="w-4 h-4" />
                        {t('nft.transfer')}
                      </Button>
                    )}
                  </div>
                )}

                {/* External Links */}
                <div className="flex flex-col gap-2">
                  {getBscScanUrl() && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(getBscScanUrl()!, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {t('nft.viewOnBscscan')}
                    </Button>
                  )}
                  
                  {asset.metadata_url && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(asset.metadata_url!, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {t('nft.viewMetadata')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      {asset.image_url && (
        <ImageLightbox
          imageUrl={asset.image_url}
          alt={asset.name}
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}

      {/* Mint Dialog */}
      <NFTMintDialog
        asset={asset}
        isOpen={isMintOpen}
        onClose={() => setIsMintOpen(false)}
        onSuccess={() => {
          setIsMintOpen(false);
          onClose();
        }}
      />

      {/* Transfer Dialog */}
      <NFTTransferDialog
        asset={asset}
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        onSuccess={() => {
          setIsTransferOpen(false);
          onClose();
        }}
      />
    </>
  );
}
