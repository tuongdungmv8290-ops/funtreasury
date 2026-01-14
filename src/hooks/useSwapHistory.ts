import { useState, useCallback, useEffect } from 'react';

export interface SwapTransaction {
  id: string;
  txHash: string;
  fromToken: { symbol: string; amount: string };
  toToken: { symbol: string; amount: string };
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
  walletAddress: string;
}

const STORAGE_KEY = 'camly_swap_history';

export function useSwapHistory(walletAddress: string | null) {
  const [swaps, setSwaps] = useState<SwapTransaction[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const allSwaps: SwapTransaction[] = JSON.parse(stored);
        // Filter by wallet address if provided
        const filtered = walletAddress 
          ? allSwaps.filter(s => s.walletAddress.toLowerCase() === walletAddress.toLowerCase())
          : [];
        setSwaps(filtered);
      }
    } catch (error) {
      console.error('[useSwapHistory] Error loading from localStorage:', error);
    }
  }, [walletAddress]);

  // Add a new swap
  const addSwap = useCallback((swap: Omit<SwapTransaction, 'id'>) => {
    const newSwap: SwapTransaction = {
      ...swap,
      id: `swap_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    };

    setSwaps(prev => {
      const updated = [newSwap, ...prev];
      // Save to localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const allSwaps: SwapTransaction[] = stored ? JSON.parse(stored) : [];
        allSwaps.unshift(newSwap);
        // Keep only last 100 swaps total
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allSwaps.slice(0, 100)));
      } catch (error) {
        console.error('[useSwapHistory] Error saving to localStorage:', error);
      }
      return updated;
    });

    return newSwap.id;
  }, []);

  // Update swap status
  const updateSwapStatus = useCallback((txHash: string, status: 'success' | 'failed') => {
    setSwaps(prev => {
      const updated = prev.map(swap => 
        swap.txHash.toLowerCase() === txHash.toLowerCase() 
          ? { ...swap, status } 
          : swap
      );

      // Update localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const allSwaps: SwapTransaction[] = JSON.parse(stored);
          const updatedAll = allSwaps.map(swap =>
            swap.txHash.toLowerCase() === txHash.toLowerCase()
              ? { ...swap, status }
              : swap
          );
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAll));
        }
      } catch (error) {
        console.error('[useSwapHistory] Error updating localStorage:', error);
      }

      return updated;
    });
  }, []);

  // Watch transaction status (polling)
  const watchTransaction = useCallback(async (txHash: string) => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const { ethers } = await import('ethers');
    const provider = new ethers.BrowserProvider(window.ethereum);

    // Poll for receipt
    const maxAttempts = 30;
    let attempts = 0;

    const checkReceipt = async () => {
      try {
        const receipt = await provider.getTransactionReceipt(txHash);
        if (receipt) {
          const status = receipt.status === 1 ? 'success' : 'failed';
          updateSwapStatus(txHash, status);
          return true;
        }
        return false;
      } catch (error) {
        console.error('[useSwapHistory] Error checking receipt:', error);
        return false;
      }
    };

    const poll = async () => {
      attempts++;
      const found = await checkReceipt();
      if (!found && attempts < maxAttempts) {
        setTimeout(poll, 3000); // Check every 3 seconds
      }
    };

    poll();
  }, [updateSwapStatus]);

  // Clear all swaps for current wallet
  const clearHistory = useCallback(() => {
    if (!walletAddress) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const allSwaps: SwapTransaction[] = JSON.parse(stored);
        const filtered = allSwaps.filter(
          s => s.walletAddress.toLowerCase() !== walletAddress.toLowerCase()
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      }
    } catch (error) {
      console.error('[useSwapHistory] Error clearing localStorage:', error);
    }

    setSwaps([]);
  }, [walletAddress]);

  return {
    swaps,
    addSwap,
    updateSwapStatus,
    watchTransaction,
    clearHistory,
  };
}
