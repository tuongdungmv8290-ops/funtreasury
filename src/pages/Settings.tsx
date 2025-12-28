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
import { Wallet, RefreshCw, Save, AlertCircle, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { useWalletSettings } from '@/hooks/useWalletSettings';

const Settings = () => {
  const { wallets, isLoading, updateWallets, isUpdating } = useWalletSettings();
  
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

  const handleSyncNow = async () => {
    setIsSyncing(true);
    // Simulate sync - will be implemented in Checkpoint 4
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSyncing(false);
    toast.success('Sync completed! (Demo mode)');
  };

  if (isLoading) {
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

        {/* Sync Configuration */}
        <div className="treasury-card mb-6 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-inflow/20 to-inflow/10 border border-inflow/30 flex items-center justify-center shadow-sm">
              <RefreshCw className="w-5 h-5 text-inflow" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Sync Settings</h2>
              <p className="text-sm text-muted-foreground">Cấu hình đồng bộ dữ liệu (Checkpoint 4)</p>
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

        {/* API Configuration Notice */}
        <div className="treasury-card mb-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/30">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">API Configuration (Checkpoint 4)</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Để kích hoạt đồng bộ on-chain thực sự, bạn cần cấu hình API keys cho blockchain network.
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1.5 rounded-full bg-white border border-border text-foreground font-medium shadow-sm">RPC_URL</span>
                <span className="px-3 py-1.5 rounded-full bg-white border border-border text-foreground font-medium shadow-sm">EXPLORER_API_KEY</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
