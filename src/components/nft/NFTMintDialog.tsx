import { useState } from 'react';
import { Loader2, Wallet, Sparkles, Check, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { NFTAsset } from '@/hooks/useNFTCollection';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NFTMintDialogProps {
  asset: NFTAsset;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function NFTMintDialog({ asset, isOpen, onClose, onSuccess }: NFTMintDialogProps) {
  const { t } = useTranslation();
  const [isMinting, setIsMinting] = useState(false);
  const [mintStep, setMintStep] = useState<'confirm' | 'connecting' | 'signing' | 'minting' | 'success' | 'error'>('confirm');
  const [error, setError] = useState<string | null>(null);

  const handleMint = async () => {
    setIsMinting(true);
    setError(null);
    
    try {
      // Step 1: Connect wallet
      setMintStep('connecting');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if ethereum is available
      if (!window.ethereum) {
        throw new Error('Please install MetaMask or another Web3 wallet');
      }
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      if (!accounts || accounts.length === 0) {
        throw new Error('No wallet connected');
      }
      
      const walletAddress = accounts[0];
      
      // Step 2: Sign transaction
      setMintStep('signing');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Step 3: Mint (simulate blockchain transaction)
      setMintStep('minting');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update database
      const { error: updateError } = await supabase
        .from('nft_assets')
        .update({
          is_minted: true,
          owner_address: walletAddress,
          updated_at: new Date().toISOString(),
        })
        .eq('id', asset.id);
      
      if (updateError) throw updateError;
      
      setMintStep('success');
      toast.success(`Successfully minted ${asset.name}!`);
      
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 2000);
      
    } catch (err) {
      console.error('Mint error:', err);
      setError(err instanceof Error ? err.message : 'Mint failed');
      setMintStep('error');
    } finally {
      setIsMinting(false);
    }
  };

  const handleClose = () => {
    if (!isMinting) {
      setMintStep('confirm');
      setError(null);
      onClose();
    }
  };

  const getStepContent = () => {
    switch (mintStep) {
      case 'connecting':
        return (
          <div className="flex flex-col items-center py-8">
            <Wallet className="w-12 h-12 text-primary mb-4 animate-pulse" />
            <p className="text-lg font-semibold">Connecting Wallet...</p>
            <p className="text-sm text-muted-foreground">Please approve the connection in your wallet</p>
          </div>
        );
      case 'signing':
        return (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="w-12 h-12 text-primary mb-4 animate-spin" />
            <p className="text-lg font-semibold">Signing Transaction...</p>
            <p className="text-sm text-muted-foreground">Please sign the transaction in your wallet</p>
          </div>
        );
      case 'minting':
        return (
          <div className="flex flex-col items-center py-8">
            <Sparkles className="w-12 h-12 text-amber-500 mb-4 animate-bounce" />
            <p className="text-lg font-semibold">Minting NFT...</p>
            <p className="text-sm text-muted-foreground">Transaction is being processed on the blockchain</p>
          </div>
        );
      case 'success':
        return (
          <div className="flex flex-col items-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-lg font-semibold text-green-500">Mint Successful!</p>
            <p className="text-sm text-muted-foreground">{asset.name} is now yours</p>
          </div>
        );
      case 'error':
        return (
          <div className="flex flex-col items-center py-8">
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <p className="text-lg font-semibold text-destructive">Mint Failed</p>
            <p className="text-sm text-muted-foreground text-center">{error}</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Mint NFT
          </DialogTitle>
          {mintStep === 'confirm' && (
            <DialogDescription>
              You are about to mint this NFT to your connected wallet
            </DialogDescription>
          )}
        </DialogHeader>

        {mintStep === 'confirm' ? (
          <>
            {/* NFT Preview */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border/50">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
                {asset.image_url ? (
                  <img
                    src={asset.image_url}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <span className="text-2xl font-bold text-primary/30">{asset.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-semibold">{asset.name}</h4>
                {asset.collection && (
                  <p className="text-sm text-muted-foreground">{asset.collection.name}</p>
                )}
                <Badge className="mt-1 capitalize">{asset.rarity}</Badge>
              </div>
            </div>

            {/* Mint Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network</span>
                <span className="font-semibold">BNB Chain</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-semibold text-primary">
                  {asset.mint_type === 'free' ? t('nft.free') : `${asset.price_camly} CAMLY`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gas Fee (est.)</span>
                <span className="font-semibold">~0.002 BNB</span>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleClose}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleMint} className="gap-2">
                <Sparkles className="w-4 h-4" />
                Mint Now
              </Button>
            </DialogFooter>
          </>
        ) : (
          getStepContent()
        )}

        {mintStep === 'error' && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            <Button onClick={() => setMintStep('confirm')}>
              Try Again
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
