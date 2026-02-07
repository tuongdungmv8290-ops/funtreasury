import { useState, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, Loader2, Search, Wallet, AlertTriangle, Coins, ArrowRightLeft } from 'lucide-react';
import { useGifts, useUserProfiles } from '@/hooks/useGifts';
import { useRealtimePrices } from '@/hooks/useRealtimePrices';
import { useAuth } from '@/contexts/AuthContext';
import { useCamlyWallet } from '@/hooks/useCamlyWallet';
import { GiftCelebrationModal } from './GiftCelebrationModal';
import type { GiftData } from '@/hooks/useGifts';
import camlyLogo from '@/assets/camly-coin-gold-logo.png';

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

  // Shared state
  const [receiverId, setReceiverId] = useState(defaultReceiverId || '');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [celebrationGift, setCelebrationGift] = useState<GiftData | null>(null);

  // Crypto tab state
  const [receiverAddress, setReceiverAddress] = useState('');
  const [addressMode, setAddressMode] = useState<'address' | 'profile'>('profile');

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

  const selectedProfile = profiles?.find(p => p.user_id === receiverId);

  const resetForm = () => {
    setReceiverId('');
    setAmount('');
    setMessage('');
    setSearchQuery('');
    setReceiverAddress('');
  };

  const handleCelebration = (result: GiftData) => {
    const enrichedGift: GiftData = {
      ...result,
      sender_name: profiles?.find(p => p.user_id === user?.id)?.display_name || user?.email || 'Bạn',
      receiver_name: selectedProfile?.display_name || selectedProfile?.email || 'N/A',
    };
    setCelebrationGift(enrichedGift);
    onOpenChange(false);
    resetForm();
  };

  // === Tab Camly Coin: internal gift ===
  const handleSendCamly = async () => {
    if (!receiverId || !amount || parseFloat(amount) < 100) return;
    const usdValue = parseFloat(amount) * (prices['CAMLY'] || 0);
    const result = await sendGift(
      receiverId,
      '0x0000000000000000000000000000000000000000', // internal, no wallet needed
      'CAMLY',
      parseFloat(amount),
      usdValue,
      message,
      postId,
    );
    if (result) handleCelebration(result);
  };

  // === Tab Chuyển Crypto: on-chain ===
  const handleSendCrypto = async () => {
    const targetAddr = addressMode === 'address' ? receiverAddress : (selectedProfile as any)?.wallet_address;
    if (!targetAddr || !amount || parseFloat(amount) <= 0) return;
    const usdValue = parseFloat(amount) * (prices['CAMLY'] || 0);
    const result = await sendGift(
      receiverId || 'external',
      targetAddr,
      'CAMLY',
      parseFloat(amount),
      usdValue,
      message,
      postId,
    );
    if (result) handleCelebration(result);
  };

  // Profile search dropdown component
  const ProfileSearch = ({ onSelect }: { onSelect: (p: any) => void }) => (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tên hoặc email..."
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setReceiverId(''); }}
          className="pl-9"
        />
      </div>
      {searchQuery && filteredProfiles.length > 0 && !receiverId && (
        <div className="max-h-40 overflow-y-auto border border-border rounded-lg bg-popover shadow-md z-50">
          {filteredProfiles.map(p => (
            <button
              key={p.user_id}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-secondary/50 transition-colors text-left"
              onClick={() => {
                setReceiverId(p.user_id);
                setSearchQuery(p.display_name || p.email || '');
                onSelect(p);
              }}
            >
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
      {receiverId && selectedProfile && (
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
          <button
            className="text-xs text-primary hover:underline font-medium"
            onClick={() => { setReceiverId(''); setSearchQuery(''); }}
          >
            Thay đổi
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <img src={camlyLogo} alt="Camly" className="w-7 h-7" />
              Thưởng Camly Coin
            </DialogTitle>
            <DialogDescription>
              Tặng thưởng hoặc chuyển crypto cho thành viên
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="camly" className="px-6 pb-6">
            <TabsList className="w-full grid grid-cols-2 mb-4">
              <TabsTrigger value="camly" className="gap-1.5">
                <Coins className="w-4 h-4" /> Camly Coin
              </TabsTrigger>
              <TabsTrigger value="crypto" className="gap-1.5">
                <ArrowRightLeft className="w-4 h-4" /> Chuyển Crypto
              </TabsTrigger>
            </TabsList>

            {/* ===== TAB 1: CAMLY COIN (internal) ===== */}
            <TabsContent value="camly" className="space-y-4 mt-0">
              {/* Balance Card */}
              <div className="rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 p-4 text-white">
                <p className="text-sm opacity-90">Số dư của bạn</p>
                <div className="flex items-center gap-2 mt-1">
                  <img src={camlyLogo} alt="" className="w-8 h-8" />
                  <span className="text-2xl font-bold">
                    {wallet.isConnected ? wallet.camlyBalance.toLocaleString() : '---'}
                  </span>
                  <span className="text-lg opacity-90">Camly Coin</span>
                </div>
              </div>

              {/* Receiver */}
              <div className="space-y-2">
                <Label>Người nhận</Label>
                <ProfileSearch onSelect={() => {}} />
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label>Số lượng</Label>
                <Input
                  type="number"
                  placeholder="Nhập số lượng..."
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  min="100"
                  step="1"
                />
                <p className="text-xs text-muted-foreground">Tối thiểu 100 Camly Coin</p>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label>Lời nhắn (tuỳ chọn)</Label>
                <Textarea
                  placeholder="Gửi lời nhắn kèm phần thưởng..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Submit */}
              <Button
                onClick={handleSendCamly}
                disabled={!receiverId || !amount || parseFloat(amount) < 100 || isSending}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-white font-semibold shadow-lg hover:shadow-xl transition-all gap-2 h-11"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                {isSending ? 'Đang xử lý...' : 'Xác nhận thưởng'}
              </Button>
            </TabsContent>

            {/* ===== TAB 2: CHUYỂN CRYPTO (on-chain) ===== */}
            <TabsContent value="crypto" className="space-y-4 mt-0">
              {/* Wallet Balance Card */}
              <div className="rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 p-4 text-white">
                <p className="text-sm opacity-90">Số dư CAMLY trong ví</p>
                <div className="flex items-center gap-2 mt-1">
                  <img src={camlyLogo} alt="" className="w-8 h-8" />
                  <span className="text-2xl font-bold">
                    {wallet.isConnected ? wallet.camlyBalance.toLocaleString() : '---'}
                  </span>
                  <span className="text-lg opacity-90">CAMLY</span>
                </div>
                {wallet.isConnected && wallet.address && (
                  <p className="text-xs mt-2 opacity-80 font-mono">
                    {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                  </p>
                )}
                {!wallet.isConnected && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-2 text-xs"
                    onClick={wallet.connectWallet}
                  >
                    <Wallet className="w-3 h-3 mr-1" /> Kết nối ví
                  </Button>
                )}
              </div>

              {/* Address Mode Toggle */}
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    addressMode === 'address'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setAddressMode('address')}
                >
                  Địa chỉ ví
                </button>
                <button
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    addressMode === 'profile'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setAddressMode('profile')}
                >
                  Từ hồ sơ
                </button>
              </div>

              {/* Address Input or Profile Search */}
              {addressMode === 'address' ? (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5" /> Địa chỉ ví người nhận
                  </Label>
                  <Input
                    placeholder="0x..."
                    value={receiverAddress}
                    onChange={e => setReceiverAddress(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Chọn người nhận</Label>
                  <ProfileSearch onSelect={() => {}} />
                  {/* Web3 warning */}
                  {receiverId && selectedProfile && !(selectedProfile as any).wallet_address && (
                    <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                      <p className="text-xs text-destructive">
                        Người này chưa đăng ký ví Web3. Vui lòng chuyển bằng địa chỉ ví trực tiếp.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Amount */}
              <div className="space-y-2">
                <Label>Số lượng CAMLY</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  min="0"
                  step="any"
                />
                <p className="text-xs text-muted-foreground">
                  Cần có BNB trong ví để thanh toán phí gas
                </p>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label>Lời nhắn (tuỳ chọn)</Label>
                <Textarea
                  placeholder="Gửi lời nhắn..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Submit */}
              <Button
                onClick={handleSendCrypto}
                disabled={
                  isSending ||
                  !amount || parseFloat(amount) <= 0 ||
                  (addressMode === 'address' ? !receiverAddress : (!receiverId || !(selectedProfile as any)?.wallet_address))
                }
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all gap-2 h-11"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
                {isSending ? 'Đang chuyển...' : 'Xác nhận chuyển'}
              </Button>
            </TabsContent>
          </Tabs>
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
