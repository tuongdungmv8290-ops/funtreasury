import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, ExternalLink, Check, RefreshCw, Pencil, X, Save, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import type { Wallet } from '@/hooks/useWallets';
import camlyLogo from '@/assets/camly-logo.jpeg';

// Chain icons and info
const CHAIN_INFO: Record<string, { name: string; color: string; logo: string; explorer: string }> = {
  'BNB': { 
    name: 'BNB Smart Chain', 
    color: 'bg-yellow-500', 
    logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
    explorer: 'https://bscscan.com/address/'
  },
  'ETH': { 
    name: 'Ethereum', 
    color: 'bg-blue-500', 
    logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    explorer: 'https://etherscan.io/address/'
  },
  'POLYGON': { 
    name: 'Polygon', 
    color: 'bg-purple-500', 
    logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
    explorer: 'https://polygonscan.com/address/'
  },
  'ARB': { 
    name: 'Arbitrum', 
    color: 'bg-cyan-500', 
    logo: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png',
    explorer: 'https://arbiscan.io/address/'
  },
  'BASE': { 
    name: 'Base', 
    color: 'bg-indigo-500', 
    logo: 'https://avatars.githubusercontent.com/u/108554348',
    explorer: 'https://basescan.org/address/'
  },
  'BTC': { 
    name: 'Bitcoin', 
    color: 'bg-orange-500', 
    logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    explorer: 'https://www.blockchain.com/btc/address/'
  },
  'SOL': { 
    name: 'Solana', 
    color: 'bg-gradient-to-r from-purple-500 to-green-400', 
    logo: 'https://cryptologos.cc/logos/solana-sol-logo.png',
    explorer: 'https://solscan.io/account/'
  },
};

interface WalletDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet: Wallet;
  onSync?: () => void;
  isSyncing?: boolean;
}

function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletDetailModal({ 
  open, 
  onOpenChange, 
  wallet,
  onSync,
  isSyncing = false
}: WalletDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(wallet.name);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const chainInfo = CHAIN_INFO[wallet.chain] || CHAIN_INFO['BNB'];

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      toast.success('Đã copy địa chỉ ví!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Không thể copy');
    }
  };

  const handleSaveName = async () => {
    if (!newName.trim() || newName === wallet.name) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('wallets')
        .update({ name: newName.trim() })
        .eq('id', wallet.id);

      if (error) throw error;

      toast.success('Đã cập nhật tên ví!');
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      setIsEditing(false);
    } catch (err) {
      toast.error('Không thể cập nhật tên ví');
    } finally {
      setIsSaving(false);
    }
  };

  const explorerUrl = chainInfo.explorer + wallet.address;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border overflow-hidden">
        {/* Header with chain badge */}
        <DialogHeader className="pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-treasury-gold/50">
                <img 
                  src={chainInfo.logo} 
                  alt={chainInfo.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = camlyLogo;
                  }}
                />
              </div>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-8 w-40 text-sm"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-green-500 hover:text-green-600"
                    onClick={handleSaveName}
                    disabled={isSaving}
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-500 hover:text-red-600"
                    onClick={() => {
                      setIsEditing(false);
                      setNewName(wallet.name);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-foreground">{wallet.name}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </DialogTitle>
            <div className={cn(
              "px-3 py-1.5 rounded-full text-xs font-bold text-white",
              chainInfo.color
            )}>
              {chainInfo.name}
            </div>
          </div>
        </DialogHeader>

        {/* QR Code - MetaMask style with gold border */}
        <div className="flex flex-col items-center py-6">
          <div className="relative p-4 rounded-2xl bg-white shadow-lg border-4 border-treasury-gold/60">
            {/* Decorative corner accents */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-treasury-gold rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-treasury-gold rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-treasury-gold rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-treasury-gold rounded-br-lg" />
            
            <QRCodeSVG 
              value={wallet.address}
              size={180}
              level="H"
              includeMargin={false}
              bgColor="#FFFFFF"
              fgColor="#1a1a2e"
              imageSettings={{
                src: chainInfo.logo,
                x: undefined,
                y: undefined,
                height: 36,
                width: 36,
                excavate: true,
              }}
            />
          </div>
          
          {/* QR label */}
          <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
            <QrCode className="w-4 h-4" />
            <span>Quét mã để nhận token</span>
          </div>
        </div>

        {/* Address display */}
        <div className="bg-secondary/50 rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-2">Địa chỉ ví</p>
          <div className="flex items-center justify-between gap-3">
            <code className="flex-1 font-mono text-sm text-foreground bg-background/50 px-3 py-2 rounded-lg border border-border truncate">
              {wallet.address}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={copyAddress}
              className={cn(
                "shrink-0 transition-all",
                copied ? "border-green-500 text-green-500" : "border-treasury-gold/50 text-treasury-gold hover:bg-treasury-gold/10"
              )}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          
          {/* Short address for quick reference */}
          <div className="flex items-center justify-center gap-2 mt-3 text-sm">
            <span className="text-muted-foreground">Short:</span>
            <span className="font-mono font-semibold text-primary">{shortenAddress(wallet.address)}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
          <a 
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button 
              variant="outline" 
              className="w-full gap-2 border-treasury-gold/50 text-treasury-gold hover:bg-treasury-gold/10"
            >
              <ExternalLink className="w-4 h-4" />
              Xem Explorer
            </Button>
          </a>
          
          <Button 
            onClick={onSync}
            disabled={isSyncing}
            className="w-full gap-2 bg-gradient-to-r from-treasury-gold to-treasury-gold-dark hover:opacity-90 text-treasury-dark"
          >
            <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
            {isSyncing ? 'Đang sync...' : 'Sync Now'}
          </Button>
        </div>

        {/* Footer info */}
        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">
            💡 Click vào QR code để copy hoặc scan bằng ví khác
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
