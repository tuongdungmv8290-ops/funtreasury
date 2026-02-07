import { useState, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Gift, Loader2, Search, Wallet } from 'lucide-react';
import { useGifts, useUserProfiles } from '@/hooks/useGifts';
import { useRealtimePrices } from '@/hooks/useRealtimePrices';
import { useAuth } from '@/contexts/AuthContext';
import { GiftCelebrationModal } from './GiftCelebrationModal';
import type { GiftData } from '@/hooks/useGifts';

const GIFT_TOKENS = ['CAMLY', 'USDT', 'BNB', 'BTCB', 'USDC'];

interface GiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultReceiverId?: string;
  postId?: string;
}

export function GiftDialog({ open, onOpenChange, defaultReceiverId, postId }: GiftDialogProps) {
  const { user } = useAuth();
  const { sendGift, isSending } = useGifts();
  const { data: profiles } = useUserProfiles();
  const prices = useRealtimePrices();

  const [receiverId, setReceiverId] = useState(defaultReceiverId || '');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('CAMLY');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [celebrationGift, setCelebrationGift] = useState<GiftData | null>(null);

  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    return profiles
      .filter(p => p.user_id !== user?.id)
      .filter(p => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.display_name?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q)
        );
      });
  }, [profiles, user?.id, searchQuery]);

  const usdValue = useMemo(() => {
    const price = prices[tokenSymbol] || 0;
    return parseFloat(amount || '0') * price;
  }, [amount, tokenSymbol, prices]);

  const selectedProfile = profiles?.find(p => p.user_id === receiverId);

  const handleSend = async () => {
    if (!receiverId || !amount || parseFloat(amount) <= 0) {
      return;
    }

    // For now, use a placeholder address - in production this would come from user's wallet settings
    const targetAddress = receiverAddress || '0x0000000000000000000000000000000000000000';

    const result = await sendGift(
      receiverId,
      targetAddress,
      tokenSymbol,
      parseFloat(amount),
      usdValue,
      message,
      postId,
    );

    if (result) {
      // Add profile names to result for celebration
      const enrichedGift: GiftData = {
        ...result,
        sender_name: profiles?.find(p => p.user_id === user?.id)?.display_name || user?.email || 'Bạn',
        receiver_name: selectedProfile?.display_name || selectedProfile?.email || 'N/A',
      };
      setCelebrationGift(enrichedGift);
      onOpenChange(false);
      // Reset form
      setReceiverId('');
      setAmount('');
      setMessage('');
      setSearchQuery('');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Gift className="w-5 h-5 text-treasury-gold" />
              Tặng Thưởng
            </DialogTitle>
            <DialogDescription>
              Chuyển token cho bạn bè trên BNB Chain
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Receiver Selection */}
            <div className="space-y-2">
              <Label>Người nhận</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên hoặc email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {searchQuery && filteredProfiles.length > 0 && !receiverId && (
                <div className="max-h-40 overflow-y-auto border border-border rounded-lg bg-background">
                  {filteredProfiles.map(p => (
                    <button
                      key={p.user_id}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-secondary/50 transition-colors text-left"
                      onClick={() => {
                        setReceiverId(p.user_id);
                        setSearchQuery(p.display_name || p.email || '');
                      }}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {(p.display_name || p.email || '?')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.display_name || 'Unnamed'}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {receiverId && selectedProfile && (
                <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg border border-primary/20">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {(selectedProfile.display_name || '?')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{selectedProfile.display_name}</span>
                  <button
                    className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => { setReceiverId(''); setSearchQuery(''); }}
                  >
                    Đổi
                  </button>
                </div>
              )}
            </div>

            {/* Wallet address of receiver */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5" /> Địa chỉ ví người nhận
              </Label>
              <Input
                placeholder="0x..."
                value={receiverAddress}
                onChange={e => setReceiverAddress(e.target.value)}
              />
            </div>

            {/* Token Selection */}
            <div className="space-y-2">
              <Label>Token</Label>
              <Select value={tokenSymbol} onValueChange={setTokenSymbol}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GIFT_TOKENS.map(t => (
                    <SelectItem key={t} value={t}>
                      <span className="flex items-center gap-2">
                        {t}
                        <span className="text-xs text-muted-foreground">
                          (${prices[t]?.toFixed(t === 'CAMLY' ? 6 : 2) || '0'})
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label>Số lượng</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="0"
                step="any"
              />
              {parseFloat(amount) > 0 && (
                <p className="text-xs text-muted-foreground">
                  ≈ <span className="gold-text font-semibold">${usdValue.toFixed(2)}</span> USD
                </p>
              )}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label>Lời nhắn (tuỳ chọn)</Label>
              <Textarea
                placeholder="Gửi lời nhắn kèm quà tặng..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={2}
              />
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSend}
              disabled={!receiverId || !receiverAddress || !amount || parseFloat(amount) <= 0 || isSending}
              className="w-full bg-gradient-to-r from-treasury-gold to-treasury-gold-dark text-white font-semibold shadow-lg hover:shadow-xl transition-all gap-2"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Gift className="w-4 h-4" />
              )}
              {isSending ? 'Đang chuyển...' : `Tặng ${amount || '0'} ${tokenSymbol}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Celebration Modal */}
      <GiftCelebrationModal
        open={!!celebrationGift}
        onClose={() => setCelebrationGift(null)}
        gift={celebrationGift}
      />
    </>
  );
}
