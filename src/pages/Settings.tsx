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
        <div className="treasury-card mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-treasury-gold/10 border border-treasury-gold/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-treasury-gold" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Wallet Configuration</h2>
              <p className="text-sm text-muted-foreground">Manage your Treasury wallet addresses</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="wallet1">Treasury Wallet 1</Label>
                <Input
                  id="wallet1"
                  value={wallet1Address}
                  onChange={(e) => setWallet1Address(e.target.value)}
                  placeholder="0x..."
                  className="font-mono bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wallet2">Treasury Wallet 2</Label>
                <Input
                  id="wallet2"
                  value={wallet2Address}
                  onChange={(e) => setWallet2Address(e.target.value)}
                  placeholder="0x..."
                  className="font-mono bg-secondary border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chain">Blockchain Network</Label>
              <Select value={chain} onValueChange={setChain}>
                <SelectTrigger className="w-full md:w-[280px] bg-secondary border-border">
                  <SelectValue placeholder="Select chain" />
                </SelectTrigger>
                <SelectContent>
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
        <div className="treasury-card mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-inflow/10 border border-inflow/20 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-inflow" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Sync Settings</h2>
              <p className="text-sm text-muted-foreground">Configure data synchronization</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoSync">Auto Sync</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically sync transactions at regular intervals
                </p>
              </div>
              <Switch
                id="autoSync"
                checked={autoSync}
                onCheckedChange={setAutoSync}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="syncInterval">Sync Interval (minutes)</Label>
              <Select value={syncInterval} onValueChange={setSyncInterval} disabled={!autoSync}>
                <SelectTrigger className="w-full md:w-[180px] bg-secondary border-border">
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
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
                className="gap-2"
                variant="outline"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Button>
            </div>
          </div>
        </div>

        {/* API Configuration Notice */}
        <div className="treasury-card mb-6 border-treasury-gold/30">
          <div className="flex gap-4">
            <AlertCircle className="w-5 h-5 text-treasury-gold flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-foreground mb-1">API Configuration Required</h3>
              <p className="text-sm text-muted-foreground mb-3">
                To enable live blockchain data, you'll need to configure API keys for your chosen network. 
                Connect to Lovable Cloud to securely store your API keys.
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 rounded bg-secondary">RPC_URL</span>
                <span className="px-2 py-1 rounded bg-secondary">EXPLORER_API_KEY</span>
                <span className="px-2 py-1 rounded bg-secondary">TOKENS_WHITELIST</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2 bg-treasury-gold text-primary-foreground hover:bg-treasury-gold/90"
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
