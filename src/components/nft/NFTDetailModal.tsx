import { Copy, ExternalLink, Check, Sparkles, Send } from 'lucide-react';
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
  rare: 'ring-2 ring-blue-500/20',
  epic: 'ring-2 ring-purple-500/20',
  legendary: 'ring-2 ring-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.3)]',
};

export function NFTDetailModal({ asset, isOpen, onClose }: NFTDetailModalProps) {
  const { t } = useTranslation();
  const { isViewOnly } = useViewMode();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isMintOpen, setIsMintOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const isAdmin = !!user && !isViewOnly;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(t('transactions.copied'));
    setTimeout(() => setCopied(false), 2000);
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-heading flex items-center gap-2">
              {asset.name}
              {asset.rarity === 'legendary' && (
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-6">
            {/* NFT Image */}
            <div className={`aspect-square rounded-xl overflow-hidden bg-muted ${rarityGlow[asset.rarity] || ''}`}>
              {!imageError && asset.image_url ? (
                <img
                  src={asset.image_url}
                  alt={asset.name}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <span className="text-8xl font-bold text-primary/30">{asset.name.charAt(0)}</span>
                </div>
              )}
            </div>

            {/* NFT Details */}
            <div className="space-y-4">
              {/* Collection */}
              {asset.collection && (
                <div>
                  <p className="text-sm text-muted-foreground">{t('nft.collection')}</p>
                  <p className="font-semibold">{asset.collection.name}</p>
                </div>
              )}

              {/* Rarity */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t('nft.rarity')}</p>
                <Badge className={`${rarityColors[asset.rarity] || rarityColors.common} text-sm`}>
                  {asset.rarity === 'legendary' && (
                    <Sparkles className="w-3 h-3 mr-1" />
                  )}
                  {t(`nft.${asset.rarity}`)}
                </Badge>
              </div>

              {/* Price */}
              <div>
                <p className="text-sm text-muted-foreground">{t('prices.price')}</p>
                <p className="text-2xl font-bold gold-text">{getPrice()}</p>
              </div>

              <Separator />

              {/* Description */}
              {asset.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('nft.description')}</p>
                  <p className="text-sm">{asset.description}</p>
                </div>
              )}

              {/* Owner */}
              {asset.owner_address && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('nft.owner')}</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                      {asset.owner_address.slice(0, 10)}...{asset.owner_address.slice(-8)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(asset.owner_address!)}
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Token ID */}
              {asset.token_id && (
                <div>
                  <p className="text-sm text-muted-foreground">Token ID</p>
                  <p className="font-mono text-sm">#{asset.token_id}</p>
                </div>
              )}

              {/* Status */}
              <div className="flex gap-2">
                {asset.is_minted && (
                  <Badge variant="outline" className="border-green-500/50 text-green-500">
                    {t('nft.minted')}
                  </Badge>
                )}
                {asset.is_for_sale && (
                  <Badge variant="outline" className="border-primary/50 text-primary">
                    {t('nft.forSale')}
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
        </DialogContent>
      </Dialog>

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
