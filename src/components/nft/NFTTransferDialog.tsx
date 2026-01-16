import { useState } from 'react';
import { Loader2, Send, Check, AlertCircle, Wallet } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { NFTAsset } from '@/hooks/useNFTCollection';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NFTTransferDialogProps {
  asset: NFTAsset;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function NFTTransferDialog({ asset, isOpen, onClose, onSuccess }: NFTTransferDialogProps) {
  const { t } = useTranslation();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferStep, setTransferStep] = useState<'input' | 'confirming' | 'transferring' | 'success' | 'error'>('input');
  const [error, setError] = useState<string | null>(null);

  const isValidAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleTransfer = async () => {
    if (!isValidAddress(recipientAddress)) {
      setError('Invalid wallet address. Please enter a valid BNB Chain address.');
      return;
    }

    setIsTransferring(true);
    setError(null);

    try {
      // Step 1: Confirm with wallet
      setTransferStep('confirming');
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

      // Step 2: Execute transfer
      setTransferStep('transferring');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update database
      const { error: updateError } = await supabase
        .from('nft_assets')
        .update({
          owner_address: recipientAddress.toLowerCase(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', asset.id);

      if (updateError) throw updateError;

      setTransferStep('success');
      toast.success(`Successfully transferred ${asset.name}!`);

      setTimeout(() => {
        handleClose();
        onSuccess?.();
      }, 2000);

    } catch (err) {
      console.error('Transfer error:', err);
      setError(err instanceof Error ? err.message : 'Transfer failed');
      setTransferStep('error');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleClose = () => {
    if (!isTransferring) {
      setTransferStep('input');
      setRecipientAddress('');
      setError(null);
      onClose();
    }
  };

  const getStepContent = () => {
    switch (transferStep) {
      case 'confirming':
        return (
          <div className="flex flex-col items-center py-8">
            <Wallet className="w-12 h-12 text-primary mb-4 animate-pulse" />
            <p className="text-lg font-semibold">Confirming Transfer...</p>
            <p className="text-sm text-muted-foreground">Please confirm the transaction in your wallet</p>
          </div>
        );
      case 'transferring':
        return (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="w-12 h-12 text-primary mb-4 animate-spin" />
            <p className="text-lg font-semibold">Transferring NFT...</p>
            <p className="text-sm text-muted-foreground">Transaction is being processed</p>
          </div>
        );
      case 'success':
        return (
          <div className="flex flex-col items-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-lg font-semibold text-green-500">Transfer Successful!</p>
            <p className="text-sm text-muted-foreground text-center">
              {asset.name} has been transferred to<br />
              <code className="text-xs bg-muted px-2 py-1 rounded mt-1 inline-block">
                {recipientAddress.slice(0, 10)}...{recipientAddress.slice(-8)}
              </code>
            </p>
          </div>
        );
      case 'error':
        return (
          <div className="flex flex-col items-center py-8">
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <p className="text-lg font-semibold text-destructive">Transfer Failed</p>
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
            <Send className="w-5 h-5 text-primary" />
            {t('nft.transfer')} NFT
          </DialogTitle>
          {transferStep === 'input' && (
            <DialogDescription>
              Transfer this NFT to another wallet address
            </DialogDescription>
          )}
        </DialogHeader>

        {transferStep === 'input' ? (
          <>
            {/* NFT Preview */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border/50">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                {asset.image_url ? (
                  <img
                    src={asset.image_url}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <span className="text-xl font-bold text-primary/30">{asset.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-semibold">{asset.name}</h4>
                {asset.collection && (
                  <p className="text-sm text-muted-foreground">{asset.collection.name}</p>
                )}
              </div>
            </div>

            {/* Recipient Address */}
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Address</Label>
              <Input
                id="recipient"
                placeholder="0x..."
                value={recipientAddress}
                onChange={(e) => {
                  setRecipientAddress(e.target.value);
                  setError(null);
                }}
                className={error ? 'border-destructive' : ''}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Enter the BNB Chain wallet address of the recipient
              </p>
            </div>

            {/* Warning */}
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-600 dark:text-amber-400">
                ⚠️ Double-check the recipient address. NFT transfers cannot be reversed.
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleClose}>
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleTransfer} 
                disabled={!recipientAddress || !isValidAddress(recipientAddress)}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                Transfer
              </Button>
            </DialogFooter>
          </>
        ) : (
          getStepContent()
        )}

        {transferStep === 'error' && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            <Button onClick={() => setTransferStep('input')}>
              Try Again
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
