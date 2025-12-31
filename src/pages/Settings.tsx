import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputWithPaste } from '@/components/ui/input-with-paste';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Wallet, RefreshCw, Save, Crown, Link, Eye, EyeOff, CheckCircle, XCircle, ExternalLink, UserPlus, Shield, Trash2, ClipboardPaste, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useWalletSettings } from '@/hooks/useWalletSettings';
import { useTokenContracts } from '@/hooks/useTokenContracts';
import { useApiSettings } from '@/hooks/useApiSettings';
import { supabase } from '@/integrations/supabase/client';


const Settings = () => {
  const { wallets, isLoading, updateWallets, isUpdating } = useWalletSettings();
  const { contracts, isLoading: isLoadingContracts, updateAllContracts, getContractBySymbol } = useTokenContracts();
  const { settings: apiSettings, isLoading: isLoadingApiSettings, updateSettingAsync, getSettingByKey } = useApiSettings();
  
  // Local state for form
  const [wallet1Name, setWallet1Name] = useState('');
  const [wallet1Address, setWallet1Address] = useState('');
  const [wallet2Name, setWallet2Name] = useState('');
  const [wallet2Address, setWallet2Address] = useState('');
  const [chain, setChain] = useState('BNB');
  
  // Sync settings (for future use)
  const [syncInterval, setSyncInterval] = useState('5');
  const [autoSync, setAutoSync] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Moralis API state
  const [moralisApiKey, setMoralisApiKey] = useState('');
  const [showMoralisKey, setShowMoralisKey] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');

  // Token contract addresses
  const [camlyCoinAddress, setCamlyCoinAddress] = useState('');
  const [usdtAddress, setUsdtAddress] = useState('');
  const [btcbAddress, setBtcbAddress] = useState('');

  // Admin management
  const [newAdminUserId, setNewAdminUserId] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [adminList, setAdminList] = useState<{ user_id: string; email?: string }[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);

  // Flags to track if form has been initialized (prevent overwriting user input)
  const [isWalletsInitialized, setIsWalletsInitialized] = useState(false);
  const [isContractsInitialized, setIsContractsInitialized] = useState(false);
  const [isApiKeyInitialized, setIsApiKeyInitialized] = useState(false);

  // Fetch admin list
  const fetchAdmins = async () => {
    setIsLoadingAdmins(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      
      if (error) {
        console.error('Error fetching admins:', error);
        return;
      }
      
      // Get emails from profiles
      if (data && data.length > 0) {
        const userIds = data.map(d => d.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email')
          .in('user_id', userIds);
        
        const adminsWithEmail = data.map(admin => ({
          user_id: admin.user_id,
          email: profiles?.find(p => p.user_id === admin.user_id)?.email || 'Unknown'
        }));
        
        setAdminList(adminsWithEmail);
      } else {
        setAdminList([]);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  // Add new admin
  const handleAddAdmin = async () => {
    if (!newAdminUserId.trim()) {
      toast.error('Vui lòng nhập User ID');
      return;
    }

    setIsAddingAdmin(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: newAdminUserId.trim(), role: 'admin' });

      if (error) {
        if (error.code === '23505') {
          toast.error('User này đã là admin');
        } else {
          console.error('Error adding admin:', error);
          toast.error('Không thể thêm admin: ' + error.message);
        }
        return;
      }

      toast.success('Đã thêm admin mới thành công!');
      setNewAdminUserId('');
      fetchAdmins();
    } catch (err) {
      console.error('Error:', err);
      toast.error('Có lỗi xảy ra');
    } finally {
      setIsAddingAdmin(false);
    }
  };

  // Remove admin
  const handleRemoveAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (error) {
        console.error('Error removing admin:', error);
        toast.error('Không thể xóa admin');
        return;
      }

      toast.success('Đã xóa admin');
      fetchAdmins();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  // Load admins on mount
  useEffect(() => {
    fetchAdmins();
  }, []);

  // Populate form when wallets load - ONLY ONCE
  useEffect(() => {
    if (wallets.length > 0 && !isWalletsInitialized) {
      const w1 = wallets[0];
      const w2 = wallets[1];
      
      if (w1) {
        setWallet1Name(w1.name || 'Treasury Wallet 1');
        setWallet1Address(w1.address || '');
        setChain(w1.chain || 'BNB');
      }
      
      if (w2) {
        setWallet2Name(w2.name || 'Treasury Wallet 2');
        setWallet2Address(w2.address || '');
      }
      setIsWalletsInitialized(true);
      console.log('Wallets initialized:', wallets);
    }
  }, [wallets, isWalletsInitialized]);

  // Populate token contracts when loaded - ONLY ONCE
  useEffect(() => {
    if (contracts.length > 0 && !isContractsInitialized) {
      const camly = getContractBySymbol('CAMLY');
      const usdt = getContractBySymbol('USDT');
      const btcb = getContractBySymbol('BTCB');
      
      setCamlyCoinAddress(camly);
      setUsdtAddress(usdt);
      setBtcbAddress(btcb);
      setIsContractsInitialized(true);
      console.log('Token contracts initialized:', { camly, usdt, btcb });
    }
  }, [contracts, isContractsInitialized, getContractBySymbol]);

  // Populate Moralis API key when loaded - ONLY ONCE
  useEffect(() => {
    if (apiSettings.length > 0 && !isApiKeyInitialized) {
      const key = getSettingByKey('MORALIS_API_KEY');
      setMoralisApiKey(key);
      setIsApiKeyInitialized(true);
      console.log('Moralis API key initialized, length:', key?.length || 0);
    }
  }, [apiSettings, isApiKeyInitialized, getSettingByKey]);

  // State for saving
  const [isSavingContracts, setIsSavingContracts] = useState(false);
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);

  // Save only wallet settings
  const handleSaveWallets = () => {
    if (wallets.length < 2) {
      toast.error('Không tìm thấy đủ ví trong database');
      return;
    }

    const updatedWallets = [
      {
        id: wallets[0].id,
        name: wallet1Name,
        address: wallet1Address,
        chain: chain,
      },
      {
        id: wallets[1].id,
        name: wallet2Name,
        address: wallet2Address,
        chain: chain,
      },
    ];

    updateWallets(updatedWallets);
  };

  // Save only token contracts
  const handleSaveTokenContracts = async () => {
    setIsSavingContracts(true);
    try {
      const success = await updateAllContracts([
        { symbol: 'CAMLY', contract_address: camlyCoinAddress },
        { symbol: 'USDT', contract_address: usdtAddress },
        { symbol: 'BTCB', contract_address: btcbAddress },
      ]);
      if (success) {
        toast.success('Đã lưu Token Contracts thành công!', {
          description: 'Dữ liệu sẽ giữ nguyên sau khi reload trang.'
        });
      }
    } finally {
      setIsSavingContracts(false);
    }
  };

  // Save only Moralis API key
  const handleSaveMoralisKey = async () => {
    if (!moralisApiKey.trim()) {
      toast.error('Vui lòng nhập Moralis API Key');
      return;
    }
    setIsSavingApiKey(true);
    try {
      await updateSettingAsync({ key_name: 'MORALIS_API_KEY', key_value: moralisApiKey.trim() });
      toast.success('Đã lưu Moralis API Key thành công!', {
        description: 'Dữ liệu sẽ giữ nguyên sau khi reload trang.'
      });
    } finally {
      setIsSavingApiKey(false);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-transactions');
      
      if (error) {
        console.error('Sync function error:', error);
        toast.error('Không thể kết nối tới server sync');
        return;
      }
      
      if (data?.success) {
        const newTxCount = data.totalNewTransactions || 0;
        toast.success(`🎉 ${data.message}`, {
          description: data.results?.map((r: any) => 
            `${r.wallet}: +${r.newTxCount} tx${r.error ? ` (${r.error})` : ''}`
          ).join(' | ')
        });
      } else {
        toast.error(data?.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Lỗi kết nối khi sync');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTestMoralisConnection = async () => {
    if (!moralisApiKey.trim()) {
      toast.error('Vui lòng nhập Moralis API Key');
      return;
    }
    
    setIsTestingConnection(true);
    setConnectionStatus('idle');
    setConnectionMessage('');
    
    try {
      const { data, error } = await supabase.functions.invoke('test-moralis-connection', {
        body: { api_key: moralisApiKey }
      });
      
      if (error) {
        console.error('Supabase function error:', error);
        setConnectionStatus('error');
        setConnectionMessage('Không thể kết nối tới server');
        toast.error('Không thể kết nối tới server');
        return;
      }
      
      if (data?.success) {
        setConnectionStatus('success');
        setConnectionMessage(data.message);
        toast.success('🎉 ' + data.message);
      } else {
        setConnectionStatus('error');
        setConnectionMessage(data?.error || 'Test connection failed');
        toast.error(data?.error || 'Test connection failed');
      }
    } catch (error) {
      console.error('Test connection error:', error);
      setConnectionStatus('error');
      setConnectionMessage('Network error - Kiểm tra kết nối mạng');
      toast.error('Không thể kết nối tới server');
    } finally {
      setIsTestingConnection(false);
    }
  };

  if (isLoading || isLoadingContracts || isLoadingApiSettings) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 max-w-4xl">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">
              <span className="gold-text">Treasury Wallet Settings</span>
            </h1>
          </div>
          <p className="text-muted-foreground">
            Quản lý và cấu hình các ví thiêng liêng của Treasury
          </p>
        </div>

        {/* Wallet 1 Card */}
        <div className="treasury-card mb-6 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <span className="text-primary-foreground font-bold text-lg">1</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Treasury Wallet 1</h2>
              <p className="text-sm text-muted-foreground">Ví chính của Treasury</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wallet1Name" className="text-foreground font-medium">
                Wallet Name
              </Label>
              <Input
                id="wallet1Name"
                value={wallet1Name}
                onChange={(e) => setWallet1Name(e.target.value)}
                placeholder="Treasury Wallet 1"
                className="bg-white border-border focus:border-primary focus:ring-primary/20 shadow-sm text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wallet1Address" className="text-foreground font-medium">
                Wallet Address
              </Label>
              <Input
                id="wallet1Address"
                value={wallet1Address}
                onChange={(e) => setWallet1Address(e.target.value)}
                placeholder="0x..."
                className="font-mono text-sm bg-secondary/30 border-border focus:border-primary focus:ring-primary/20 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Wallet 2 Card */}
        <div className="treasury-card mb-6 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/80 to-primary/50 flex items-center justify-center shadow-lg">
              <span className="text-primary-foreground font-bold text-lg">2</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Treasury Wallet 2</h2>
              <p className="text-sm text-muted-foreground">Ví phụ của Treasury</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wallet2Name" className="text-foreground font-medium">
                Wallet Name
              </Label>
              <Input
                id="wallet2Name"
                value={wallet2Name}
                onChange={(e) => setWallet2Name(e.target.value)}
                placeholder="Treasury Wallet 2"
                className="bg-white border-border focus:border-primary focus:ring-primary/20 shadow-sm text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wallet2Address" className="text-foreground font-medium">
                Wallet Address
              </Label>
              <Input
                id="wallet2Address"
                value={wallet2Address}
                onChange={(e) => setWallet2Address(e.target.value)}
                placeholder="0x..."
                className="font-mono text-sm bg-secondary/30 border-border focus:border-primary focus:ring-primary/20 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Blockchain Network */}
        <div className="treasury-card mb-6 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-inflow/20 to-inflow/10 border border-inflow/30 flex items-center justify-center shadow-sm">
              <Wallet className="w-6 h-6 text-inflow" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Blockchain Network</h2>
              <p className="text-sm text-muted-foreground">Chọn mạng blockchain cho cả 2 ví</p>
            </div>
          </div>

          <Select value={chain} onValueChange={setChain}>
            <SelectTrigger className="w-full md:w-[320px] bg-white border-border hover:border-primary/50 transition-colors shadow-sm h-12 text-base">
              <SelectValue placeholder="Select blockchain" />
            </SelectTrigger>
            <SelectContent className="bg-white border-border shadow-lg z-50">
              <SelectItem value="BNB" className="text-base py-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                  BNB Smart Chain
                </div>
              </SelectItem>
              <SelectItem value="ETH" className="text-base py-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Ethereum
                </div>
              </SelectItem>
              <SelectItem value="BTC" className="text-base py-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  Bitcoin
                </div>
              </SelectItem>
              <SelectItem value="SOL" className="text-base py-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-green-400"></span>
                  Solana
                </div>
              </SelectItem>
              <SelectItem value="POLYGON" className="text-base py-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  Polygon
                </div>
              </SelectItem>
              <SelectItem value="ARB" className="text-base py-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                  Arbitrum
                </div>
              </SelectItem>
              <SelectItem value="BASE" className="text-base py-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  Base
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Token Contracts Card */}
        <div className="treasury-card mb-6 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-inflow to-inflow/70 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">💎</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Token Contracts</h2>
              <p className="text-sm text-muted-foreground">Nhập contract address các token cần theo dõi</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* CAMLY COIN */}
            <div className="space-y-2">
              <Label htmlFor="camlyCoin" className="text-foreground font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-500"></span>
                CAMLY COIN
              </Label>
              <InputWithPaste
                id="camlyCoin"
                value={camlyCoinAddress}
                onChange={(e) => setCamlyCoinAddress(e.target.value)}
                placeholder="0x... (paste contract address)"
                className="font-mono text-sm bg-secondary/30 border-border focus:border-primary focus:ring-primary/20 shadow-sm"
              />
              {camlyCoinAddress && (
                <div className="flex items-center gap-2 mt-1 p-2 rounded-lg bg-primary/5 border border-primary/20">
                  <code className="flex-1 text-xs font-mono text-foreground truncate">{camlyCoinAddress}</code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(camlyCoinAddress);
                      toast.success('Đã copy CAMLY contract!');
                    }}
                    className="p-1.5 rounded-md hover:bg-primary/20 text-primary transition-colors"
                    title="Copy contract address"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* USDT */}
            <div className="space-y-2">
              <Label htmlFor="usdt" className="text-foreground font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                USDT (Tether)
              </Label>
              <InputWithPaste
                id="usdt"
                value={usdtAddress}
                onChange={(e) => setUsdtAddress(e.target.value)}
                placeholder="0x... (paste contract address)"
                className="font-mono text-sm bg-secondary/30 border-border focus:border-primary focus:ring-primary/20 shadow-sm"
              />
              {usdtAddress && (
                <div className="flex items-center gap-2 mt-1 p-2 rounded-lg bg-inflow/5 border border-inflow/20">
                  <code className="flex-1 text-xs font-mono text-foreground truncate">{usdtAddress}</code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(usdtAddress);
                      toast.success('Đã copy USDT contract!');
                    }}
                    className="p-1.5 rounded-md hover:bg-inflow/20 text-inflow transition-colors"
                    title="Copy contract address"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* BTCB */}
            <div className="space-y-2">
              <Label htmlFor="btcb" className="text-foreground font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                BTCB (Bitcoin BEP20)
              </Label>
              <InputWithPaste
                id="btcb"
                value={btcbAddress}
                onChange={(e) => setBtcbAddress(e.target.value)}
                placeholder="0x... (paste contract address)"
                className="font-mono text-sm bg-secondary/30 border-border focus:border-primary focus:ring-primary/20 shadow-sm"
              />
              {btcbAddress && (
                <div className="flex items-center gap-2 mt-1 p-2 rounded-lg bg-orange-500/5 border border-orange-500/20">
                  <code className="flex-1 text-xs font-mono text-foreground truncate">{btcbAddress}</code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(btcbAddress);
                      toast.success('Đã copy BTCB contract!');
                    }}
                    className="p-1.5 rounded-md hover:bg-orange-500/20 text-orange-500 transition-colors"
                    title="Copy contract address"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Note */}
          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <ClipboardPaste className="w-3.5 h-3.5 text-primary" />
              <span>Paste contract/API key suôn sẻ – lưu vĩnh viễn! Ctrl+V hoặc nhấn icon paste.</span>
            </p>
          </div>

          {/* Save Token Contracts Button */}
          <div className="mt-6 pt-6 border-t border-border">
            <Button
              onClick={handleSaveTokenContracts}
              disabled={isSavingContracts}
              className="w-full md:w-auto gap-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 shadow-lg px-6 py-5 text-base font-semibold"
            >
              {isSavingContracts ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Token Contracts
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Save Button - Big Gold */}
        <div className="mb-8">
          <Button
            onClick={handleSaveWallets}
            disabled={isUpdating}
            className="w-full md:w-auto gap-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 shadow-lg px-8 py-6 text-lg font-semibold"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Wallet Settings
              </>
            )}
          </Button>
        </div>

        {/* Moralis Realtime Sync Section */}
        <div className="treasury-card mb-6 bg-gradient-to-br from-primary/5 via-white to-primary/10 border-2 border-primary/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <Link className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Moralis Realtime Sync (Free Tier)</h2>
              <p className="text-sm text-muted-foreground">Kết nối on-chain sync miễn phí với Moralis API</p>
            </div>
          </div>

          {/* Info Note */}
          <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-sm text-foreground font-medium mb-1">
                  Đăng ký miễn phí tại{' '}
                  <a 
                    href="https://moralis.io/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    moralis.io
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
                <p className="text-xs text-muted-foreground">
                  Free tier đủ sync hàng nghìn transactions/ngày!
                </p>
              </div>
            </div>
          </div>

          {/* API Key Input */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="moralisApiKey" className="text-foreground font-medium">
                Moralis API Key <span className="text-outflow">*</span>
              </Label>
              <div className="relative">
                <input
                  id="moralisApiKey"
                  type={showMoralisKey ? 'text' : 'password'}
                  value={moralisApiKey}
                  onChange={(e) => setMoralisApiKey(e.target.value)}
                  placeholder="Nhập Moralis API key... (paste Ctrl+V)"
                  className="flex h-10 w-full rounded-md border border-input bg-secondary/30 px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary pr-20 shadow-sm transition-all"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        if (text) {
                          setMoralisApiKey(text.trim());
                          toast.success("Đã paste API Key!", { description: "Nhấn Save để lưu" });
                        }
                      } catch (err) {
                        toast.error("Không thể đọc clipboard");
                      }
                    }}
                    className="p-1.5 rounded-md hover:bg-primary/10 text-primary/60 hover:text-primary transition-colors"
                    title="Paste từ clipboard"
                  >
                    <ClipboardPaste className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMoralisKey(!showMoralisKey)}
                    className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors"
                    title={showMoralisKey ? 'Ẩn' : 'Hiện'}
                  >
                    {showMoralisKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            {/* Save & Test Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleSaveMoralisKey}
                disabled={isSavingApiKey}
                className="gap-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 shadow-lg px-6 py-5 text-base font-semibold"
              >
                {isSavingApiKey ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Moralis API Key
                  </>
                )}
              </Button>
              <Button
                onClick={handleTestMoralisConnection}
                disabled={isTestingConnection || !moralisApiKey.trim()}
                variant="outline"
                className="gap-3 border-primary/50 text-primary hover:bg-primary/10 px-6 py-5 text-base font-semibold disabled:opacity-50"
              >
                {isTestingConnection ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Đang kiểm tra...
                  </>
                ) : (
                  <>
                    <Link className="w-5 h-5" />
                    Test Connection
                  </>
                )}
              </Button>
            </div>

            {/* Connection Status Display */}
            {connectionStatus !== 'idle' && (
              <div className={`mt-4 p-4 rounded-xl border-2 flex items-center gap-3 ${
                connectionStatus === 'success' 
                  ? 'bg-inflow/10 border-inflow/30 text-inflow' 
                  : 'bg-outflow/10 border-outflow/30 text-outflow'
              }`}>
                {connectionStatus === 'success' ? (
                  <CheckCircle className="w-6 h-6 flex-shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 flex-shrink-0" />
                )}
                <span className="font-medium">{connectionMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Sync Configuration */}
        <div className="treasury-card mb-6 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-inflow/20 to-inflow/10 border border-inflow/30 flex items-center justify-center shadow-sm">
              <RefreshCw className="w-5 h-5 text-inflow" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Sync Settings</h2>
              <p className="text-sm text-muted-foreground">Cấu hình đồng bộ dữ liệu (Bước 4.2)</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
              <div>
                <Label htmlFor="autoSync" className="text-foreground font-medium">Auto Sync</Label>
                <p className="text-sm text-muted-foreground">
                  Tự động đồng bộ transactions theo chu kỳ
                </p>
              </div>
              <Switch
                id="autoSync"
                checked={autoSync}
                onCheckedChange={setAutoSync}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="syncInterval" className="text-foreground font-medium">Sync Interval</Label>
              <Select value={syncInterval} onValueChange={setSyncInterval} disabled={!autoSync}>
                <SelectTrigger className="w-full md:w-[200px] bg-white border-border hover:border-primary/50 transition-colors shadow-sm disabled:opacity-50">
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent className="bg-white border-border shadow-lg z-50">
                  <SelectItem value="1">Every 1 minute</SelectItem>
                  <SelectItem value="5">Every 5 minutes</SelectItem>
                  <SelectItem value="15">Every 15 minutes</SelectItem>
                  <SelectItem value="30">Every 30 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="gap-2 bg-inflow text-white hover:bg-inflow/90 shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Button>
            </div>
          </div>
        </div>

        {/* Admin Management */}
        <div className="treasury-card mb-6 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/10 border border-destructive/30 flex items-center justify-center shadow-sm">
              <Shield className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Admin Management</h2>
              <p className="text-sm text-muted-foreground">Quản lý quyền admin cho Treasury</p>
            </div>
          </div>

          {/* Add New Admin */}
          <div className="space-y-4 mb-6">
            <Label className="text-foreground font-medium">Thêm Admin mới bằng User ID</Label>
            <div className="flex gap-3">
              <Input
                value={newAdminUserId}
                onChange={(e) => setNewAdminUserId(e.target.value)}
                placeholder="Nhập User ID (UUID)..."
                className="flex-1 font-mono text-sm bg-secondary/30 border-border focus:border-primary focus:ring-primary/20 shadow-sm"
              />
              <Button
                onClick={handleAddAdmin}
                disabled={isAddingAdmin || !newAdminUserId.trim()}
                className="gap-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 shadow-lg"
              >
                {isAddingAdmin ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                Thêm Admin
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Lưu ý: User ID là UUID của user trong database (có thể tìm trong bảng profiles)
            </p>
          </div>

          {/* Admin List */}
          <div className="border-t border-border pt-6">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-foreground font-medium">Danh sách Admin hiện tại</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchAdmins}
                disabled={isLoadingAdmins}
                className="gap-1 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingAdmins ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {isLoadingAdmins ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : adminList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Chưa có admin nào
              </div>
            ) : (
              <div className="space-y-2">
                {adminList.map((admin) => (
                  <div
                    key={admin.user_id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{admin.email}</p>
                        <p className="text-xs text-muted-foreground font-mono">{admin.user_id}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAdmin(admin.user_id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
