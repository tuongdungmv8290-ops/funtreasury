import { useState } from 'react';
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
import { Wallet, RefreshCw, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const [wallet1Address, setWallet1Address] = useState('0x742d35Cc6634C0532925a3b844Bc9e7595f1dE3A');
  const [wallet2Address, setWallet2Address] = useState('0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063');
  const [chain, setChain] = useState('BNB');
  const [syncInterval, setSyncInterval] = useState('5');
  const [autoSync, setAutoSync] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success('Settings saved successfully!');
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    // Simulate sync
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSyncing(false);
    toast.success('Sync completed! 12 new transactions found.');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-1">
            <span className="gold-text">Settings</span>
          </h1>
          <p className="text-muted-foreground">
            Configure your Treasury dashboard
          </p>
        </div>

        {/* Wallet Configuration */}
        <div className="treasury-card mb-6 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center shadow-sm">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Wallet Configuration</h2>
              <p className="text-sm text-muted-foreground">Manage your Treasury wallet addresses</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="wallet1" className="text-foreground font-medium">Treasury Wallet 1</Label>
                <Input
                  id="wallet1"
                  value={wallet1Address}
                  onChange={(e) => setWallet1Address(e.target.value)}
                  placeholder="0x..."
                  className="font-mono bg-white border-border focus:border-primary focus:ring-primary/20 shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wallet2" className="text-foreground font-medium">Treasury Wallet 2</Label>
                <Input
                  id="wallet2"
                  value={wallet2Address}
                  onChange={(e) => setWallet2Address(e.target.value)}
                  placeholder="0x..."
                  className="font-mono bg-white border-border focus:border-primary focus:ring-primary/20 shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chain" className="text-foreground font-medium">Blockchain Network</Label>
              <Select value={chain} onValueChange={setChain}>
                <SelectTrigger className="w-full md:w-[280px] bg-white border-border hover:border-primary/50 transition-colors shadow-sm">
                  <SelectValue placeholder="Select chain" />
                </SelectTrigger>
                <SelectContent className="bg-white border-border shadow-lg z-50">
                  <SelectItem value="BNB">BNB Smart Chain</SelectItem>
                  <SelectItem value="ETH">Ethereum</SelectItem>
                  <SelectItem value="POLYGON">Polygon</SelectItem>
                  <SelectItem value="ARB">Arbitrum</SelectItem>
                  <SelectItem value="BASE">Base</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              <p className="text-sm text-muted-foreground">Configure data synchronization</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
              <div>
                <Label htmlFor="autoSync" className="text-foreground font-medium">Auto Sync</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically sync transactions at regular intervals
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
              <Label htmlFor="syncInterval" className="text-foreground font-medium">Sync Interval (minutes)</Label>
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
              <h3 className="font-semibold text-foreground mb-1">API Configuration Required</h3>
              <p className="text-sm text-muted-foreground mb-3">
                To enable live blockchain data, you'll need to configure API keys for your chosen network. 
                Connect to Lovable Cloud to securely store your API keys.
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1.5 rounded-full bg-white border border-border text-foreground font-medium shadow-sm">RPC_URL</span>
                <span className="px-3 py-1.5 rounded-full bg-white border border-border text-foreground font-medium shadow-sm">EXPLORER_API_KEY</span>
                <span className="px-3 py-1.5 rounded-full bg-white border border-border text-foreground font-medium shadow-sm">TOKENS_WHITELIST</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md px-6"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Settings;
