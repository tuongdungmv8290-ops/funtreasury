import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Wallet, RefreshCw, Save, Crown, Link, Eye, EyeOff, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useWalletSettings } from '@/hooks/useWalletSettings';
import { useTokenContracts } from '@/hooks/useTokenContracts';
import { supabase } from '@/integrations/supabase/client';

const Settings = () => {
  const { wallets, isLoading, updateWallets, isUpdating } = useWalletSettings();
  const { contracts, isLoading: isLoadingContracts, updateAllContracts, getContractBySymbol } = useTokenContracts();
  
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

  // Populate form when wallets load
  useEffect(() => {
    if (wallets.length > 0) {
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
    }
  }, [wallets]);

  // Populate token contracts when loaded
  useEffect(() => {
    if (contracts.length > 0) {
      setCamlyCoinAddress(getContractBySymbol('CAMLY'));
      setUsdtAddress(getContractBySymbol('USDT'));
      setBtcbAddress(getContractBySymbol('BTCB'));
    }
  }, [contracts, getContractBySymbol]);

  const handleSaveWallets = async () => {
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

    // Save wallet settings
    updateWallets(updatedWallets);

    // Save token contracts
    const success = await updateAllContracts([
      { symbol: 'CAMLY', contract_address: camlyCoinAddress },
      { symbol: 'USDT', contract_address: usdtAddress },
      { symbol: 'BTCB', contract_address: btcbAddress },
    ]);

    if (success) {
      toast.success('Đã lưu tất cả cấu hình thành công');
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    // Simulate sync - will be implemented in Checkpoint 4.2
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSyncing(false);
    toast.success('Sync completed! (Demo mode)');
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

  if (isLoading || isLoadingContracts) {
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

          <div className="space-y-4">
            {/* CAMLY COIN */}
            <div className="space-y-2">
              <Label htmlFor="camlyCoin" className="text-foreground font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                CAMLY COIN
              </Label>
              <Input
                id="camlyCoin"
                value={camlyCoinAddress}
                onChange={(e) => setCamlyCoinAddress(e.target.value)}
                placeholder="0x... (Contract address)"
                className="font-mono text-sm bg-secondary/30 border-border focus:border-primary focus:ring-primary/20 shadow-sm"
              />
            </div>

            {/* USDT */}
            <div className="space-y-2">
              <Label htmlFor="usdt" className="text-foreground font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-inflow"></span>
                USDT (Tether)
              </Label>
              <Input
                id="usdt"
                value={usdtAddress}
                onChange={(e) => setUsdtAddress(e.target.value)}
                placeholder="0x... (Contract address)"
                className="font-mono text-sm bg-secondary/30 border-border focus:border-primary focus:ring-primary/20 shadow-sm"
              />
            </div>

            {/* BTCB */}
            <div className="space-y-2">
              <Label htmlFor="btcb" className="text-foreground font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                BTCB (Bitcoin BEP20)
              </Label>
              <Input
                id="btcb"
                value={btcbAddress}
                onChange={(e) => setBtcbAddress(e.target.value)}
                placeholder="0x... (Contract address)"
                className="font-mono text-sm bg-secondary/30 border-border focus:border-primary focus:ring-primary/20 shadow-sm"
              />
            </div>
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
                <Input
                  id="moralisApiKey"
                  type={showMoralisKey ? 'text' : 'password'}
                  value={moralisApiKey}
                  onChange={(e) => setMoralisApiKey(e.target.value)}
                  placeholder="Nhập Moralis API key miễn phí..."
                  className="bg-white border-border focus:border-primary focus:ring-primary/20 shadow-sm text-base pr-12 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowMoralisKey(!showMoralisKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showMoralisKey ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Test Connection Button */}
            <Button
              onClick={handleTestMoralisConnection}
              disabled={isTestingConnection || !moralisApiKey.trim()}
              className="w-full md:w-auto gap-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 shadow-lg px-8 py-6 text-lg font-semibold disabled:opacity-50"
            >
              {isTestingConnection ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Đang kiểm tra...
                </>
              ) : (
                <>
                  <Link className="w-5 h-5" />
                  Test Moralis Connection
                </>
              )}
            </Button>

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
      </main>
    </div>
  );
};

export default Settings;
