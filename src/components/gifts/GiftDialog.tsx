import { useState, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Gift, Loader2, Search, AlertTriangle, ChevronDown, ArrowRight, Wallet, Users, BookUser, Plus, Trash2, Check } from 'lucide-react';
import { useAddressBook } from '@/hooks/useAddressBook';
import { useGifts, useUserProfiles } from '@/hooks/useGifts';
import { useRealtimePrices } from '@/hooks/useRealtimePrices';
import { useAuth } from '@/contexts/AuthContext';
import { useCamlyWallet } from '@/hooks/useCamlyWallet';
import { GiftCelebrationModal } from './GiftCelebrationModal';
import type { GiftData } from '@/hooks/useGifts';
import camlyLogo from '@/assets/camly-coin-gold-logo.png';

// Internal tokens (database transfer, no MetaMask)
const INTERNAL_TOKENS = [
  { symbol: 'FUNM', name: 'FUN Money', emoji: '🌐', internal: true, badge: 'Nội bộ' },
  { symbol: 'CAMLY', name: 'Camly Coin', logo: camlyLogo, internal: true, emoji: '' },
] as const;

// On-chain tokens (MetaMask required)
const CRYPTO_TOKENS = [
  { symbol: 'CAMLY', name: 'Camly Coin', logo: camlyLogo, internal: false, emoji: '' },
  { symbol: 'BNB', name: 'Binance Coin', emoji: '🪙', internal: false },
  { symbol: 'USDT', name: 'Tether USD', emoji: '💵', internal: false },
  { symbol: 'BTC', name: 'Bitcoin', emoji: '₿', internal: false },
] as const;

type TokenItem = { symbol: string; name: string; emoji: string; internal: boolean; badge?: string; logo?: string };

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
  const { savedAddresses, saveAddress, deleteAddress } = useAddressBook();
  const [activeTab, setActiveTab] = useState('internal');
  const [selectedInternal, setSelectedInternal] = useState<TokenItem>(INTERNAL_TOKENS[0] as TokenItem);
  const [selectedCrypto, setSelectedCrypto] = useState<TokenItem>(CRYPTO_TOKENS[0] as TokenItem);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [receiverId, setReceiverId] = useState(defaultReceiverId || '');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [celebrationGift, setCelebrationGift] = useState<GiftData | null>(null);

  // Crypto tab: toggle between wallet address / profile
  const [cryptoReceiverMode, setCryptoReceiverMode] = useState<'profile' | 'address'>('profile');
  const [manualAddress, setManualAddress] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactAddress, setNewContactAddress] = useState('');
  const isInternal = activeTab === 'internal';
  const selectedToken = isInternal ? selectedInternal : selectedCrypto;
  const currentTokens = isInternal ? INTERNAL_TOKENS : CRYPTO_TOKENS;

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
    if (selectedToken.symbol === 'FUNM') return 10000;
    if (selectedToken.symbol === 'CAMLY') return wallet.isConnected ? wallet.camlyBalance : 0;
    return 0;
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
    setDropdownOpen(false);
    setManualAddress('');
  };

  const handleSend = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    let targetAddr: string;
    let targetReceiverId: string;

    if (isInternal) {
      if (!receiverId) return;
      targetAddr = '0x0000000000000000000000000000000000000000';
      targetReceiverId = receiverId;
    } else {
      if (cryptoReceiverMode === 'address') {
        if (!manualAddress) return;
        targetAddr = manualAddress;
        targetReceiverId = receiverId || user?.id || '';
      } else {
        if (!receiverId || !selectedProfile?.wallet_address) return;
        targetAddr = selectedProfile.wallet_address;
        targetReceiverId = receiverId;
      }
    }

    const result = await sendGift(
      targetReceiverId,
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

  const canSubmit = (() => {
    if (!amount || parseFloat(amount) <= 0 || isSending) return false;
    if (isInternal) return !!receiverId;
    if (cryptoReceiverMode === 'address') return !!manualAddress;
    return !!receiverId && !!selectedProfile?.wallet_address;
  })();

  const renderTokenIcon = (token: TokenItem) => (
    token.logo
      ? <img src={token.logo} alt="" className="w-6 h-6 rounded-full" />
      : <span className="text-lg">{token.emoji}</span>
  );

  // Shared profile search component
  const renderProfileSearch = (showLabel = true) => (
    <div className="space-y-2">
      {showLabel && <Label className="text-sm font-semibold">Tìm người nhận</Label>}
      {receiverId && selectedProfile ? (
        <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-amber-400/60 bg-gradient-to-r from-amber-50/80 to-yellow-50/50 dark:from-amber-900/20 dark:to-yellow-900/10 shadow-sm">
          <Avatar className="w-10 h-10 ring-2 ring-amber-400/40">
            <AvatarImage src={selectedProfile.avatar_url || ''} />
            <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-sm font-bold">
              {(selectedProfile.display_name || '?')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">{selectedProfile.display_name}</p>
            {!isInternal && !selectedProfile.wallet_address && (
              <p className="text-xs text-orange-500 font-medium">Người này chưa đăng ký ví Web3</p>
            )}
          </div>
          <button className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold"
            onClick={() => { setReceiverId(''); setSearchQuery(''); }}>
            Thay đổi
          </button>
        </div>
      ) : (
        <>
          {!isInternal && (
            <p className="text-xs text-muted-foreground">Người nhận cần đã liên kết ví Web3 với tài khoản</p>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
            <Input
              placeholder="Tìm theo tên hoặc email..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setReceiverId(''); }}
              className="pl-9 border-2 border-amber-300/50 focus:border-amber-400 focus-visible:ring-amber-400/30 dark:border-amber-700/40"
            />
          </div>
        </>
      )}
      {searchQuery && filteredProfiles.length > 0 && !receiverId && (
        <div className="max-h-44 overflow-y-auto border-2 border-amber-300/40 dark:border-amber-700/30 rounded-xl bg-popover shadow-lg">
          {filteredProfiles.map(p => (
            <button key={p.user_id}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors text-left border-b border-border/30 last:border-b-0"
              onClick={() => { setReceiverId(p.user_id); setSearchQuery(p.display_name || p.email || ''); }}>
              <Avatar className="w-8 h-8">
                <AvatarImage src={p.avatar_url || ''} />
                <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-bold">
                  {(p.display_name || p.email || '?')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{p.display_name || 'Unnamed'}</p>
                <p className="text-xs text-muted-foreground truncate">{p.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Token dropdown for current tab
  const renderTokenSelector = () => (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">Chọn Token</Label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border-2 border-amber-300/50 dark:border-amber-700/40 bg-card hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors text-left"
        >
          <span className="w-8 h-8 flex items-center justify-center shrink-0">
            {renderTokenIcon(selectedToken)}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">{selectedToken.name}</span>
              <span className="text-xs text-muted-foreground">({selectedToken.symbol})</span>
              {selectedToken.badge && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-blue-500/10 text-blue-600 border-blue-500/20">
                  {selectedToken.badge}
                </Badge>
              )}
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-amber-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute z-50 w-full mt-1 border-2 border-amber-300/50 dark:border-amber-700/40 rounded-xl bg-popover shadow-xl overflow-hidden">
            {(currentTokens as readonly TokenItem[]).map(token => (
              <button
                key={token.symbol}
                className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors text-left ${
                  token.symbol === selectedToken.symbol ? 'bg-amber-50 dark:bg-amber-900/20' : ''
                }`}
                onClick={() => {
                  if (isInternal) setSelectedInternal(token);
                  else setSelectedCrypto(token);
                  setDropdownOpen(false);
                }}
              >
                <span className="w-7 h-7 flex items-center justify-center shrink-0">
                  {renderTokenIcon(token)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{token.name}</span>
                    <span className="text-xs text-muted-foreground">({token.symbol})</span>
                    {token.badge && (
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
  );

  // Balance card
  const renderBalanceCard = () => (
    <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-100 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/20 border-2 border-amber-400/50 dark:border-amber-600/40 shadow-sm">
      <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
        {isInternal ? 'Số dư của bạn' : `Số dư ${selectedToken.symbol} trong ví`}
      </p>
      <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-300 mt-0.5">
        {tokenBalance.toLocaleString()} {selectedToken.symbol}
      </p>
      {!isInternal && wallet.isConnected && wallet.address && (
        <p className="text-[11px] text-amber-600/70 dark:text-amber-400/60 font-mono mt-1">
          {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
        </p>
      )}
    </div>
  );

  // Receiver mode selector (Crypto tab)
  const renderReceiverModeToggle = () => (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Chọn cách nhập người nhận</Label>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setCryptoReceiverMode('address')}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
            cryptoReceiverMode === 'address'
              ? 'border-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/20 text-amber-700 dark:text-amber-300 shadow-md'
              : 'border-border hover:border-amber-300/50 text-muted-foreground hover:text-foreground'
          }`}
        >
          <Wallet className="w-4 h-4" />
          Địa chỉ ví
        </button>
        <button
          onClick={() => setCryptoReceiverMode('profile')}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
            cryptoReceiverMode === 'profile'
              ? 'border-amber-400 bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md'
              : 'border-border hover:border-amber-300/50 text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4" />
          Từ hồ sơ
        </button>
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-0 border-2 border-amber-400/30 dark:border-amber-600/30 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Gift className="w-6 h-6 text-amber-500" />
              <span className="text-2xl font-bold text-foreground">Thưởng Camly Coin</span>
            </DialogTitle>
            <DialogDescription>
              Tặng token cho thành viên trong cộng đồng
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-4 overflow-y-auto flex-1">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setDropdownOpen(false); }}>
              <TabsList className="w-full grid grid-cols-2 h-12 rounded-xl bg-amber-100/50 dark:bg-amber-900/20 border border-amber-300/30 dark:border-amber-700/30">
                <TabsTrigger value="internal" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-amber-300/40 text-sm font-semibold gap-1.5">
                  <Gift className="w-4 h-4" /> Camly Coin
                </TabsTrigger>
                <TabsTrigger value="crypto" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-amber-300/40 text-sm font-semibold gap-1.5">
                  <Wallet className="w-4 h-4" /> Chuyển Crypto
                </TabsTrigger>
              </TabsList>

              {/* ===== Tab: Camly Coin (Internal) ===== */}
              <TabsContent value="internal" className="space-y-4 mt-4">
                {renderTokenSelector()}
                {renderBalanceCard()}
                {renderProfileSearch()}

                {/* Amount */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Số lượng (tối thiểu 100)</Label>
                  <Input type="number" placeholder="Hoặc nhập số tuỳ chọn..." value={amount}
                    onChange={e => setAmount(e.target.value)} min="100" step="any"
                    className="border-2 border-amber-300/40 focus:border-amber-400 focus-visible:ring-amber-400/30" />
                  <div className="flex gap-2">
                    {[100, 500, 1000].map(v => (
                      <button key={v} onClick={() => setAmount(String(v))}
                        className="px-4 py-1.5 text-xs font-semibold rounded-full border-2 border-amber-300/40 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-400 text-amber-700 dark:text-amber-400 transition-all">
                        {v.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  {amount && parseFloat(amount) > 0 && (
                    <p className="text-xs text-muted-foreground">≈ ${usdValue.toFixed(2)} USD</p>
                  )}
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Lời nhắn yêu thương (tuỳ chọn)</Label>
                  <div className="relative">
                    <Textarea placeholder="Gửi lời nhắn kèm phần thưởng..." value={message}
                      onChange={e => setMessage(e.target.value.slice(0, 200))} rows={2} maxLength={200}
                      className="border-2 border-amber-300/40 focus:border-amber-400 focus-visible:ring-amber-400/30" />
                    <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">{message.length}/200</span>
                  </div>
                </div>

                {/* Submit */}
                <Button onClick={handleSend} disabled={!canSubmit}
                  className="w-full h-12 text-base font-bold gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all border border-amber-400/50">
                  {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>Xác nhận thưởng <ArrowRight className="w-5 h-5" /></>
                  )}
                </Button>
              </TabsContent>

              {/* ===== Tab: Chuyển Crypto (On-chain) ===== */}
              <TabsContent value="crypto" className="space-y-4 mt-4">
                {renderTokenSelector()}
                {renderBalanceCard()}

                {/* Receiver mode toggle - pill buttons */}
                {renderReceiverModeToggle()}

                {/* Receiver input */}
                <div className="space-y-2">
                  {cryptoReceiverMode === 'address' ? (
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Người nhận</Label>
                      <Input placeholder="0x..." value={manualAddress}
                        onChange={e => setManualAddress(e.target.value)}
                        className="font-mono text-sm border-2 border-amber-300/40 focus:border-amber-400 focus-visible:ring-amber-400/30" />

                      {/* Saved Contacts */}
                      {savedAddresses.length > 0 && (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                            <BookUser className="w-3.5 h-3.5" /> Danh bạ đã lưu
                          </Label>
                          <div className="max-h-32 overflow-y-auto border-2 border-amber-300/40 dark:border-amber-700/30 rounded-xl bg-popover">
                            {savedAddresses.map(item => (
                              <div key={item.address}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors border-b border-border/30 last:border-b-0 group">
                                <button
                                  className="flex-1 flex items-center gap-2 text-left min-w-0"
                                  onClick={() => setManualAddress(item.address)}>
                                  <span className="text-sm font-semibold truncate">{item.label}</span>
                                  <span className="text-xs text-muted-foreground font-mono truncate">
                                    {item.address.slice(0, 6)}...{item.address.slice(-4)}
                                  </span>
                                </button>
                                {manualAddress.toLowerCase() === item.address.toLowerCase() && (
                                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                                )}
                                <button
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all shrink-0"
                                  onClick={() => deleteAddress.mutate(item.address)}
                                  title="Xoá">
                                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Save new contact */}
                      {!showSaveForm ? (
                        <button
                          onClick={() => setShowSaveForm(true)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors">
                          <Plus className="w-3.5 h-3.5" /> Lưu người nhận mới
                        </button>
                      ) : (
                        <div className="p-3 border-2 border-amber-400/50 rounded-xl bg-gradient-to-r from-amber-50/50 to-yellow-50/30 dark:from-amber-900/20 dark:to-yellow-900/10 space-y-2">
                          <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Lưu người nhận mới</p>
                          <Input placeholder="Tên người nhận" value={newContactName}
                            onChange={e => setNewContactName(e.target.value)}
                            className="h-8 text-sm border-amber-300/40 focus:border-amber-400" />
                          <Input placeholder="Địa chỉ ví (0x...)" value={newContactAddress}
                            onChange={e => setNewContactAddress(e.target.value)}
                            className="h-8 text-sm font-mono border-amber-300/40 focus:border-amber-400" />
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="h-7 text-xs"
                              onClick={() => { setShowSaveForm(false); setNewContactName(''); setNewContactAddress(''); }}>
                              Huỷ
                            </Button>
                            <Button size="sm" className="h-7 text-xs bg-gradient-to-r from-amber-500 to-yellow-400 text-white border-0"
                              disabled={!newContactName.trim() || !newContactAddress.trim() || saveAddress.isPending}
                              onClick={() => {
                                saveAddress.mutate(
                                  { address: newContactAddress.trim(), label: newContactName.trim() },
                                  { onSuccess: () => { setShowSaveForm(false); setNewContactName(''); setNewContactAddress(''); } }
                                );
                              }}>
                              {saveAddress.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Lưu'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {renderProfileSearch()}
                      {receiverId && selectedProfile && !selectedProfile.wallet_address && (
                        <div className="flex items-start gap-2 p-3 bg-orange-500/10 border-2 border-orange-400/30 rounded-xl">
                          <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                          <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                            Người này chưa đăng ký ví Web3. Không thể chuyển crypto.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Số lượng {selectedToken.symbol}</Label>
                  <Input type="number" placeholder="Nhập số lượng..." value={amount}
                    onChange={e => setAmount(e.target.value)} min="0" step="any"
                    className="border-2 border-amber-300/40 focus:border-amber-400 focus-visible:ring-amber-400/30" />
                  {amount && parseFloat(amount) > 0 && (
                    <p className="text-xs text-muted-foreground">≈ ${usdValue.toFixed(2)} USD</p>
                  )}
                  <p className="text-xs text-amber-600/80 dark:text-amber-400/80 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Cần có BNB trong ví để thanh toán phí gas
                  </p>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Lời nhắn (tuỳ chọn)</Label>
                  <div className="relative">
                    <Textarea placeholder="Gửi lời nhắn kèm phần thưởng..." value={message}
                      onChange={e => setMessage(e.target.value.slice(0, 200))} rows={2} maxLength={200}
                      className="border-2 border-amber-300/40 focus:border-amber-400 focus-visible:ring-amber-400/30" />
                    <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">{message.length}/200</span>
                  </div>
                </div>

                {/* Submit */}
                <Button onClick={handleSend} disabled={!canSubmit}
                  className="w-full h-12 text-base font-bold gap-2 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all border border-orange-400/50">
                  {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <><Wallet className="w-5 h-5" /> Xác nhận chuyển</>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
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
