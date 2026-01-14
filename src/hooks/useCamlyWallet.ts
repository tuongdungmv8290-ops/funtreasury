import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'sonner';

// CORRECT CAMLY Contract Address on BSC
export const CAMLY_CONTRACT = '0x0910320181889fefde0bb1ca63962b0a8882e413';
export const BSC_CHAIN_ID = 56;
export const BSC_CHAIN_HEX = '0x38';

// DEX URLs with correct contract
export const PANCAKESWAP_URL = `https://pancakeswap.finance/swap?outputCurrency=${CAMLY_CONTRACT}`;
export const ONEINCH_URL = `https://app.1inch.io/#/56/simple/swap/BNB/${CAMLY_CONTRACT}`;

// ERC20 ABI for balanceOf and transfer
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function transfer(address to, uint256 amount) returns (bool)',
];

export interface CamlyWalletState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  camlyBalance: number;
  bnbBalance: number;
  chainId: number | null;
  isCorrectChain: boolean;
}

export interface UseCamlyWalletReturn extends CamlyWalletState {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToBSC: () => Promise<boolean>;
  refreshBalances: () => Promise<void>;
  sendCamly: (to: string, amount: number) => Promise<string | null>;
}

export function useCamlyWallet(): UseCamlyWalletReturn {
  const [state, setState] = useState<CamlyWalletState>({
    isConnected: false,
    isConnecting: false,
    address: null,
    camlyBalance: 0,
    bnbBalance: 0,
    chainId: null,
    isCorrectChain: false,
  });

  const getProvider = useCallback(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum);
    }
    return null;
  }, []);

  const refreshBalances = useCallback(async () => {
    if (!state.address || !state.isCorrectChain) return;

    const provider = getProvider();
    if (!provider) return;

    try {
      // Get BNB balance
      const bnbBalance = await provider.getBalance(state.address);
      const bnbFormatted = parseFloat(ethers.formatEther(bnbBalance));

      // Get CAMLY balance
      const camlyContract = new ethers.Contract(CAMLY_CONTRACT, ERC20_ABI, provider);
      const camlyBalance = await camlyContract.balanceOf(state.address);
      const decimals = await camlyContract.decimals();
      const camlyFormatted = parseFloat(ethers.formatUnits(camlyBalance, decimals));

      setState(prev => ({
        ...prev,
        bnbBalance: bnbFormatted,
        camlyBalance: camlyFormatted,
      }));
    } catch (error) {
      console.error('Error refreshing balances:', error);
    }
  }, [state.address, state.isCorrectChain, getProvider]);

  const switchToBSC = useCallback(async (): Promise<boolean> => {
    if (!window.ethereum) {
      toast.error('Vui lòng cài đặt MetaMask hoặc Trust Wallet');
      return false;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BSC_CHAIN_HEX }],
      });
      return true;
    } catch (switchError: any) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: BSC_CHAIN_HEX,
              chainName: 'BNB Smart Chain',
              nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
              rpcUrls: ['https://bsc-dataseed.binance.org/'],
              blockExplorerUrls: ['https://bscscan.com/'],
            }],
          });
          return true;
        } catch (addError) {
          console.error('Error adding BSC:', addError);
          toast.error('Không thể thêm BNB Chain vào ví');
          return false;
        }
      }
      console.error('Error switching to BSC:', switchError);
      toast.error('Không thể chuyển sang BNB Chain');
      return false;
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      toast.error('Vui lòng cài đặt MetaMask hoặc Trust Wallet');
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true }));

    try {
      const provider = getProvider();
      if (!provider) throw new Error('Provider not available');

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('Không tìm thấy tài khoản');
      }

      const address = accounts[0];
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      const isCorrectChain = chainId === BSC_CHAIN_ID;

      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        address,
        chainId,
        isCorrectChain,
      }));

      if (!isCorrectChain) {
        toast.warning('Vui lòng chuyển sang BNB Chain để sử dụng đầy đủ tính năng');
      } else {
        toast.success('Đã kết nối ví thành công!');
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      toast.error(error.message || 'Không thể kết nối ví');
      setState(prev => ({ ...prev, isConnecting: false }));
    }
  }, [getProvider]);

  const disconnectWallet = useCallback(() => {
    setState({
      isConnected: false,
      isConnecting: false,
      address: null,
      camlyBalance: 0,
      bnbBalance: 0,
      chainId: null,
      isCorrectChain: false,
    });
    toast.info('Đã ngắt kết nối ví');
  }, []);

  const sendCamly = useCallback(async (to: string, amount: number): Promise<string | null> => {
    if (!state.address || !state.isCorrectChain) {
      toast.error('Vui lòng kết nối ví và chuyển sang BNB Chain');
      return null;
    }

    const provider = getProvider();
    if (!provider) {
      toast.error('Provider không khả dụng');
      return null;
    }

    try {
      const signer = await provider.getSigner();
      const camlyContract = new ethers.Contract(CAMLY_CONTRACT, ERC20_ABI, signer);
      const decimals = await camlyContract.decimals();
      const amountWei = ethers.parseUnits(amount.toString(), decimals);

      toast.loading('Đang gửi giao dịch...');
      const tx = await camlyContract.transfer(to, amountWei);
      
      toast.loading('Đang chờ xác nhận...');
      const receipt = await tx.wait();

      toast.success(`Giao dịch thành công! Hash: ${receipt.hash.slice(0, 10)}...`);
      
      // Refresh balances after transfer
      await refreshBalances();
      
      return receipt.hash;
    } catch (error: any) {
      console.error('Error sending CAMLY:', error);
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Giao dịch bị từ chối');
      } else {
        toast.error(error.message || 'Giao dịch thất bại');
      }
      return null;
    }
  }, [state.address, state.isCorrectChain, getProvider, refreshBalances]);

  // Listen for account and chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[];
      if (!accs || accs.length === 0) {
        disconnectWallet();
      } else if (accs[0] !== state.address) {
        setState(prev => ({ ...prev, address: accs[0] }));
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const chainId = parseInt(chainIdHex, 16);
      setState(prev => ({
        ...prev,
        chainId,
        isCorrectChain: chainId === BSC_CHAIN_ID,
      }));
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [state.address, disconnectWallet]);

  // Refresh balances when connected and on correct chain
  useEffect(() => {
    if (state.isConnected && state.isCorrectChain) {
      refreshBalances();
    }
  }, [state.isConnected, state.isCorrectChain, refreshBalances]);

  return {
    ...state,
    connectWallet,
    disconnectWallet,
    switchToBSC,
    refreshBalances,
    sendCamly,
  };
}

