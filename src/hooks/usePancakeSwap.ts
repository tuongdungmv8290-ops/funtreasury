import { useState, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { toast } from 'sonner';

// PancakeSwap Router V2 on BSC
export const PANCAKE_ROUTER_V2 = '0x10ED43C718714eb63d5aA57B78B54917e3C0D2d9';
export const WBNB_ADDRESS = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';

// Router V2 ABI
const ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] path) view returns (uint[] amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] path, address to, uint deadline) payable returns (uint[] amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] amounts)',
  'function WETH() view returns (address)',
];

// ERC20 ABI
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

export interface TokenInfo {
  symbol: string;
  name: string;
  address: string; // 'BNB' for native
  decimals: number;
  logoUrl?: string;
}

export interface SwapQuote {
  amountIn: string;
  amountOut: string;
  amountOutMin: string;
  path: string[];
  priceImpact: number;
  rate: number;
}

export interface SwapParams {
  fromToken: TokenInfo;
  toToken: TokenInfo;
  amountIn: string;
  slippage: number;
  userAddress: string;
}

export function usePancakeSwap() {
  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  const getProvider = useCallback(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum);
    }
    return null;
  }, []);

  // Get quote from router
  const getQuote = useCallback(async (
    fromToken: TokenInfo,
    toToken: TokenInfo,
    amountIn: string,
    slippage: number = 0.5
  ): Promise<SwapQuote | null> => {
    if (!amountIn || parseFloat(amountIn) === 0) return null;

    const provider = getProvider();
    if (!provider) return null;

    try {
      const router = new ethers.Contract(PANCAKE_ROUTER_V2, ROUTER_ABI, provider);
      
      // Determine path
      const isFromBNB = fromToken.address === 'BNB';
      const isToBNB = toToken.address === 'BNB';
      
      let path: string[];
      if (isFromBNB) {
        path = [WBNB_ADDRESS, toToken.address];
      } else if (isToBNB) {
        path = [fromToken.address, WBNB_ADDRESS];
      } else {
        // Token to Token: go through WBNB
        path = [fromToken.address, WBNB_ADDRESS, toToken.address];
      }

      const amountInWei = ethers.parseUnits(amountIn, fromToken.decimals);
      const amounts = await router.getAmountsOut(amountInWei, path);
      
      const amountOut = amounts[amounts.length - 1];
      const amountOutFormatted = ethers.formatUnits(amountOut, toToken.decimals);
      
      // Apply slippage
      const slippageMultiplier = BigInt(Math.floor((100 - slippage) * 100));
      const amountOutMin = (amountOut * slippageMultiplier) / 10000n;
      const amountOutMinFormatted = ethers.formatUnits(amountOutMin, toToken.decimals);

      // Calculate rate
      const rate = parseFloat(amountOutFormatted) / parseFloat(amountIn);

      return {
        amountIn,
        amountOut: amountOutFormatted,
        amountOutMin: amountOutMinFormatted,
        path,
        priceImpact: 0.1, // Simplified - real calculation needs reserves
        rate,
      };
    } catch (error) {
      console.error('Error getting quote:', error);
      return null;
    }
  }, [getProvider]);

  // Check token allowance
  const checkAllowance = useCallback(async (
    tokenAddress: string,
    ownerAddress: string
  ): Promise<bigint> => {
    const provider = getProvider();
    if (!provider || tokenAddress === 'BNB') return ethers.MaxUint256;

    try {
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const allowance = await token.allowance(ownerAddress, PANCAKE_ROUTER_V2);
      return allowance;
    } catch (error) {
      console.error('Error checking allowance:', error);
      return 0n;
    }
  }, [getProvider]);

  // Approve token for router
  const approve = useCallback(async (
    tokenAddress: string,
    amount?: bigint
  ): Promise<boolean> => {
    const provider = getProvider();
    if (!provider || tokenAddress === 'BNB') return true;

    setIsApproving(true);
    try {
      const signer = await provider.getSigner();
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      
      const approveAmount = amount ?? ethers.MaxUint256;
      
      toast.loading('Đang yêu cầu approve token...');
      const tx = await token.approve(PANCAKE_ROUTER_V2, approveAmount);
      
      toast.loading('Đang chờ xác nhận approve...');
      await tx.wait();
      
      toast.success('Approve thành công!');
      return true;
    } catch (error: any) {
      console.error('Error approving:', error);
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Approve bị từ chối');
      } else {
        toast.error('Approve thất bại');
      }
      return false;
    } finally {
      setIsApproving(false);
    }
  }, [getProvider]);

  // Execute swap
  const executeSwap = useCallback(async (params: SwapParams): Promise<string | null> => {
    const { fromToken, toToken, amountIn, slippage, userAddress } = params;
    
    const provider = getProvider();
    if (!provider) {
      toast.error('Vui lòng kết nối ví');
      return null;
    }

    setIsSwapping(true);
    try {
      const signer = await provider.getSigner();
      const router = new ethers.Contract(PANCAKE_ROUTER_V2, ROUTER_ABI, signer);
      
      const isFromBNB = fromToken.address === 'BNB';
      const isToBNB = toToken.address === 'BNB';
      
      // Get quote first
      const quote = await getQuote(fromToken, toToken, amountIn, slippage);
      if (!quote) {
        toast.error('Không thể lấy báo giá');
        return null;
      }

      const amountInWei = ethers.parseUnits(amountIn, fromToken.decimals);
      const amountOutMinWei = ethers.parseUnits(quote.amountOutMin, toToken.decimals);
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

      let tx;

      if (isFromBNB) {
        // BNB → Token
        toast.loading('Đang swap BNB → ' + toToken.symbol + '...');
        tx = await router.swapExactETHForTokens(
          amountOutMinWei,
          quote.path,
          userAddress,
          deadline,
          { value: amountInWei }
        );
      } else if (isToBNB) {
        // Token → BNB
        // Check and approve if needed
        const allowance = await checkAllowance(fromToken.address, userAddress);
        if (allowance < amountInWei) {
          const approved = await approve(fromToken.address);
          if (!approved) return null;
        }

        toast.loading('Đang swap ' + fromToken.symbol + ' → BNB...');
        tx = await router.swapExactTokensForETH(
          amountInWei,
          amountOutMinWei,
          quote.path,
          userAddress,
          deadline
        );
      } else {
        // Token → Token
        // Check and approve if needed
        const allowance = await checkAllowance(fromToken.address, userAddress);
        if (allowance < amountInWei) {
          const approved = await approve(fromToken.address);
          if (!approved) return null;
        }

        toast.loading(`Đang swap ${fromToken.symbol} → ${toToken.symbol}...`);
        tx = await router.swapExactTokensForTokens(
          amountInWei,
          amountOutMinWei,
          quote.path,
          userAddress,
          deadline
        );
      }

      toast.loading('Đang chờ xác nhận giao dịch...');
      const receipt = await tx.wait();
      
      toast.success(`Swap thành công! Xem trên BscScan: ${receipt.hash.slice(0, 10)}...`);
      
      return receipt.hash;
    } catch (error: any) {
      console.error('Error executing swap:', error);
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Giao dịch bị từ chối');
      } else if (error.reason?.includes('INSUFFICIENT_OUTPUT_AMOUNT')) {
        toast.error('Slippage quá thấp, vui lòng tăng slippage');
      } else if (error.reason?.includes('INSUFFICIENT_LIQUIDITY')) {
        toast.error('Không đủ thanh khoản');
      } else {
        toast.error('Swap thất bại: ' + (error.reason || error.message || 'Unknown error'));
      }
      return null;
    } finally {
      setIsSwapping(false);
    }
  }, [getProvider, getQuote, checkAllowance, approve]);

  // Get token balance
  const getTokenBalance = useCallback(async (
    tokenAddress: string,
    ownerAddress: string,
    decimals: number
  ): Promise<number> => {
    const provider = getProvider();
    if (!provider) return 0;

    try {
      if (tokenAddress === 'BNB') {
        const balance = await provider.getBalance(ownerAddress);
        return parseFloat(ethers.formatEther(balance));
      }

      const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const balance = await token.balanceOf(ownerAddress);
      return parseFloat(ethers.formatUnits(balance, decimals));
    } catch (error) {
      console.error('Error getting balance:', error);
      return 0;
    }
  }, [getProvider]);

  // Get token info from contract
  const getTokenInfo = useCallback(async (tokenAddress: string): Promise<TokenInfo | null> => {
    const provider = getProvider();
    if (!provider) return null;

    if (tokenAddress === 'BNB' || tokenAddress.toLowerCase() === WBNB_ADDRESS.toLowerCase()) {
      return {
        symbol: 'BNB',
        name: 'BNB',
        address: 'BNB',
        decimals: 18,
      };
    }

    try {
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const [symbol, name, decimals] = await Promise.all([
        token.symbol(),
        token.name(),
        token.decimals(),
      ]);

      return {
        symbol,
        name,
        address: tokenAddress,
        decimals: Number(decimals),
      };
    } catch (error) {
      console.error('Error getting token info:', error);
      return null;
    }
  }, [getProvider]);

  return {
    getQuote,
    checkAllowance,
    approve,
    executeSwap,
    getTokenBalance,
    getTokenInfo,
    isLoading,
    isApproving,
    isSwapping,
  };
}
