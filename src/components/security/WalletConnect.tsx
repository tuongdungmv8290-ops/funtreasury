import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Wallet,
  Link,
  Unlink,
  Check,
  ExternalLink,
  Copy,
  AlertCircle
} from 'lucide-react';

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

export const WalletConnect = () => {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<string | null>(null);

  const BNB_CHAIN_ID = '0x38'; // 56 in hex

  useEffect(() => {
    // Check if already connected
    checkConnection();
    
    // Listen for account changes
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: unknown) => {
        const accountList = accounts as string[];
        if (accountList.length === 0) {
          setConnectedAddress(null);
        } else {
          setConnectedAddress(accountList[0]);
        }
      };

      const handleChainChanged = (chainId: unknown) => {
        setChainId(chainId as string);
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const checkConnection = async () => {
    if (!window.ethereum) return;
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
      if (accounts.length > 0) {
        setConnectedAddress(accounts[0]);
        const chain = await window.ethereum.request({ method: 'eth_chainId' }) as string;
        setChainId(chain);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('Vui lòng cài đặt MetaMask hoặc Trust Wallet');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsConnecting(true);
    
    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      }) as string[];
      
      if (accounts.length > 0) {
        setConnectedAddress(accounts[0]);
        
        // Check and switch to BNB Chain
        const chain = await window.ethereum.request({ method: 'eth_chainId' }) as string;
        setChainId(chain);
        
        if (chain !== BNB_CHAIN_ID) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: BNB_CHAIN_ID }],
            });
            setChainId(BNB_CHAIN_ID);
          } catch (switchError: unknown) {
            // Chain not added, try to add it
            const error = switchError as { code?: number };
            if (error.code === 4902) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: BNB_CHAIN_ID,
                  chainName: 'BNB Smart Chain',
                  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                  rpcUrls: ['https://bsc-dataseed.binance.org/'],
                  blockExplorerUrls: ['https://bscscan.com/'],
                }],
              });
            }
          }
        }
        
        toast.success('🔗 Đã kết nối ví thành công!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Không thể kết nối ví');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setConnectedAddress(null);
    setChainId(null);
    toast.success('Đã ngắt kết nối ví');
  };

  const copyAddress = () => {
    if (connectedAddress) {
      navigator.clipboard.writeText(connectedAddress);
      toast.success('Đã copy địa chỉ!');
    }
  };

  const shortAddress = connectedAddress 
    ? `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}`
    : '';

  const isCorrectChain = chainId === BNB_CHAIN_ID;
  const chainName = chainId === BNB_CHAIN_ID ? 'BNB Chain' : 
                   chainId === '0x1' ? 'Ethereum' :
                   chainId === '0x89' ? 'Polygon' :
                   'Unknown Chain';

  return (
    <Card className="border-border/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Wallet Connect</CardTitle>
              <CardDescription>Kết nối MetaMask/Trust Wallet để ký giao dịch</CardDescription>
            </div>
          </div>
          <Badge 
            variant={connectedAddress ? "default" : "secondary"}
            className={connectedAddress ? "bg-orange-500/20 text-orange-500 border-orange-500/50" : ""}
          >
            {connectedAddress ? (
              <>
                <Link className="w-3 h-3 mr-1" />
                Connected
              </>
            ) : (
              'Disconnected'
            )}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {connectedAddress ? (
          <div className="space-y-4">
            {/* Connected Wallet Info */}
            <div className="p-4 bg-secondary/50 rounded-lg border border-border/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Connected Wallet</span>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={isCorrectChain 
                      ? "border-green-500/50 text-green-500" 
                      : "border-yellow-500/50 text-yellow-500"
                    }
                  >
                    {chainName}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-mono font-medium">{shortAddress}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyAddress}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => window.open(`https://bscscan.com/address/${connectedAddress}`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Chain Warning */}
            {!isCorrectChain && (
              <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Vui lòng chuyển sang BNB Chain để thực hiện giao dịch
                </p>
              </div>
            )}

            {/* Status */}
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-600 dark:text-green-400">
                Ví đã sẵn sàng để ký giao dịch Bulk Transfer
              </p>
            </div>

            <Button 
              variant="outline" 
              className="w-full border-red-500/50 text-red-500 hover:bg-red-500/10"
              onClick={disconnectWallet}
            >
              <Unlink className="w-4 h-4 mr-2" />
              Disconnect Wallet
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-secondary/50 rounded-lg border border-border/50 text-center">
              <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                Kết nối ví để xác thực và ký các giao dịch Bulk Transfer
              </p>
              <Button 
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white"
                onClick={connectWallet}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  'Connecting...'
                ) : (
                  <>
                    <Link className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </>
                )}
              </Button>
            </div>

            {/* Supported Wallets */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
                  alt="MetaMask" 
                  className="w-5 h-5"
                />
                MetaMask
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <img 
                  src="https://trustwallet.com/assets/images/media/assets/trust_platform.svg" 
                  alt="Trust Wallet" 
                  className="w-5 h-5"
                />
                Trust Wallet
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            🔐 Wallet Connect cho phép ký giao dịch trực tiếp từ ví của bạn, đảm bảo an toàn tuyệt đối.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
