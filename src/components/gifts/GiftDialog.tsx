import { useState, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Gift, Loader2, Search, AlertTriangle, ChevronDown, ArrowRight } from 'lucide-react';
import { useGifts, useUserProfiles } from '@/hooks/useGifts';
import { useRealtimePrices } from '@/hooks/useRealtimePrices';
import { useAuth } from '@/contexts/AuthContext';
import { useCamlyWallet } from '@/hooks/useCamlyWallet';
import { GiftCelebrationModal } from './GiftCelebrationModal';
import type { GiftData } from '@/hooks/useGifts';
import camlyLogo from '@/assets/camly-coin-gold-logo.png';

// Token configuration
const GIFT_TOKENS = [
  { symbol: 'FUNM', name: 'FUN Money', emoji: '🌐', internal: true, badge: 'Nội bộ' },
  { symbol: 'CAMLY', name: 'Camly Coin', logo: camlyLogo, internal: false, emoji: '' },
  { symbol: 'BNB', name: 'Binance Coin', emoji: '🪙', internal: false },
  { symbol: 'USDT', name: 'Tether USD', emoji: '💵', internal: false },
  { symbol: 'BTC', name: 'Bitcoin', emoji: '₿', internal: false },
] as const;

type GiftToken = typeof GIFT_TOKENS[number];

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
  const wallet = useCamlyWallet();

  const [selectedToken, setSelectedToken] = useState<GiftToken>(GIFT_TOKENS[0]);
  const [tokenDropdownOpen, setTokenDropdownOpen] = useState(false);
  const [receiverId, setReceiverId] = useState(defaultReceiverId || '');
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
        return p.display_name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q);
      });
  }, [profiles, user?.id, searchQuery]);

  const selectedProfile = profiles?.find(p => p.user_id === receiverId);
  const senderProfile = profiles?.find(p => p.user_id === user?.id);

  const tokenBalance = useMemo(() => {
    if (selectedToken.symbol === 'FUNM') return 10000; // placeholder internal balance
    if (selectedToken.symbol === 'CAMLY') return wallet.isConnected ? wallet.camlyBalance : 0;
    return 0; // other tokens: would need wallet balance query
  }, [selectedToken, wallet]);

  const usdValue = useMemo(() => {
    const amt = parseFloat(amount) || 0;
    const price = prices[selectedToken.symbol === 'FUNM' ? 'CAMLY' : selectedToken.symbol] || 0;
    return amt * price;
  }, [amount, selectedToken, prices]);

  const resetForm = () => {
    setReceiverId('');
    setAmount('');
    setMessage('');
    setSearchQuery('');
    setTokenDropdownOpen(false);
  };

  const handleSend = async () => {
    if (!receiverId || !amount || parseFloat(amount) <= 0) return;

    const targetAddr = selectedToken.internal
      ? '0x0000000000000000000000000000000000000000'
      : (selectedProfile as any)?.wallet_address || '';

    if (!selectedToken.internal && !targetAddr) return;

    const result = await sendGift(
      receiverId,
      targetAddr,
      selectedToken.symbol,
      parseFloat(amount),
      usdValue,
      message,
      postId,
    );

    if (result) {
      const enrichedGift: GiftData = {
        ...result,
        sender_name: senderProfile?.display_name || user?.email || 'Bạn',
        receiver_name: selectedProfile?.display_name || selectedProfile?.email || 'N/A',
      };
      setCelebrationGift(enrichedGift);
      onOpenChange(false);
      resetForm();
    }
  };

  const canSubmit = receiverId && amount && parseFloat(amount) > 0 && !isSending &&
    (selectedToken.internal || (selectedProfile as any)?.wallet_address);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Gift className="w-6 h-6 text-primary" />
              <span className="gold-shimmer text-2xl font-bold">Thưởng & Tặng</span>
            </DialogTitle>
            <DialogDescription>
              Tặng token cho thành viên trong cộng đồng
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-4">
            {/* Sender Card */}
            {senderProfile && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/40">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={senderProfile.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {(senderProfile.display_name || '?')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs text-muted-foreground">Người gửi</p>
                  <p className="text-sm font-semibold">{senderProfile.display_name || user?.email}</p>
                </div>
              </div>
            )}

            {/* Receiver Search */}
            <div className="space-y-2">
              <Label>Người nhận</Label>
              {receiverId && selectedProfile ? (
                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedProfile.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {(selectedProfile.display_name || '?')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{selectedProfile.display_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedProfile.email}</p>
                  </div>
                  <button className="text-xs text-primary hover:underline font-medium"
                    onClick={() => { setReceiverId(''); setSearchQuery(''); }}>
                    Thay đổi
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Tìm theo tên hoặc email..." value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setReceiverId(''); }} className="pl-9" />
                </div>
              )}
              {searchQuery && filteredProfiles.length > 0 && !receiverId && (
                <div className="max-h-40 overflow-y-auto border border-border rounded-lg bg-popover shadow-md">
                  {filteredProfiles.map(p => (
                    <button key={p.user_id}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-secondary/50 transition-colors text-left"
                      onClick={() => { setReceiverId(p.user_id); setSearchQuery(p.display_name || p.email || ''); }}>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={p.avatar_url || ''} />
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
              {/* Web3 warning for on-chain tokens */}
              {receiverId && selectedProfile && !selectedToken.internal && !(selectedProfile as any).wallet_address && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <p className="text-xs text-destructive">
                    Người này chưa đăng ký ví Web3. Vui lòng chọn token nội bộ (FUN Money).
                  </p>
                </div>
              )}
            </div>

            {/* Token Selector Dropdown */}
            <div className="space-y-2">
              <Label>Chọn Token</Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTokenDropdownOpen(!tokenDropdownOpen)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors text-left"
                >
                  <span className="text-xl w-8 h-8 flex items-center justify-center shrink-0">
                    {'logo' in selectedToken && selectedToken.logo
                      ? <img src={selectedToken.logo} alt="" className="w-7 h-7 rounded-full" />
                      : selectedToken.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{selectedToken.name}</span>
                      <span className="text-xs text-muted-foreground">({selectedToken.symbol})</span>
                      {selectedToken.internal && 'badge' in selectedToken && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-blue-500/10 text-blue-600 border-blue-500/20">
                          {selectedToken.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Số dư: {tokenBalance.toLocaleString()} {selectedToken.symbol}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${tokenDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {tokenDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 border border-border rounded-lg bg-popover shadow-lg overflow-hidden">
                    {GIFT_TOKENS.map(token => (
                      <button
                        key={token.symbol}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/50 transition-colors text-left ${
                          token.symbol === selectedToken.symbol ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => { setSelectedToken(token); setTokenDropdownOpen(false); }}
                      >
                        <span className="text-lg w-7 h-7 flex items-center justify-center shrink-0">
                          {'logo' in token && token.logo
                            ? <img src={token.logo} alt="" className="w-6 h-6 rounded-full" />
                            : token.emoji}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{token.name}</span>
                            <span className="text-xs text-muted-foreground">({token.symbol})</span>
                            {token.internal && 'badge' in token && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-blue-500/10 text-blue-600 border-blue-500/20">
                                {token.badge}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label>Số lượng</Label>
              <Input
                type="number"
                placeholder="Hoặc nhập số tuỳ chọn..."
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="0"
                step="any"
              />
              <div className="flex gap-2">
                {[100, 500, 1000].map(v => (
                  <button key={v} onClick={() => setAmount(String(v))}
                    className="px-3 py-1 text-xs rounded-full border border-border hover:bg-primary/10 hover:border-primary/30 transition-colors">
                    {v.toLocaleString()}
                  </button>
                ))}
              </div>
              {amount && parseFloat(amount) > 0 && (
                <p className="text-xs text-muted-foreground">
                  ≈ ${usdValue.toFixed(2)} USD
                </p>
              )}
              {!selectedToken.internal && (
                <p className="text-xs text-muted-foreground">
                  Cần có BNB trong ví để thanh toán phí gas
                </p>
              )}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label>Lời nhắn yêu thương</Label>
              <div className="relative">
                <Textarea
                  placeholder="Gửi lời nhắn kèm phần thưởng..."
                  value={message}
                  onChange={e => setMessage(e.target.value.slice(0, 200))}
                  rows={2}
                  maxLength={200}
                />
                <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">
                  {message.length}/200
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSend}
              disabled={!canSubmit}
              className="w-full h-12 text-base font-bold gap-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 text-white shadow-lg hover:shadow-xl transition-all"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Tặng {amount || '0'} {selectedToken.symbol}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <GiftCelebrationModal
        open={!!celebrationGift}
        onClose={() => setCelebrationGift(null)}
        gift={celebrationGift}
      />
    </>
  );
}
