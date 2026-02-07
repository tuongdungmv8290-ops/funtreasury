import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ethers } from 'ethers';
import { toast } from 'sonner';

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
];

// Known token addresses on BSC
const TOKEN_ADDRESSES: Record<string, string> = {
  'BNB': 'BNB',
  'CAMLY': '0x3f8a4e8A0c48E5C6D0E37A7b8C0C91e8bC3b1d5A', // placeholder
  'USDT': '0x55d398326f99059fF775485246999027B3197955',
  'USDC': '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  'BTCB': '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
};

const TOKEN_DECIMALS: Record<string, number> = {
  'BNB': 18,
  'CAMLY': 18,
  'USDT': 18,
  'USDC': 18,
  'BTCB': 18,
};

export interface GiftData {
  id: string;
  sender_id: string;
  receiver_id: string;
  token_symbol: string;
  amount: number;
  usd_value: number;
  tx_hash: string | null;
  message: string | null;
  post_id: string | null;
  status: string;
  created_at: string;
  sender_name?: string;
  sender_email?: string;
  receiver_name?: string;
  receiver_email?: string;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  total_given_usd: number;
  total_received_usd: number;
  gift_count_sent: number;
  gift_count_received: number;
  light_score: number;
}

export function useGifts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSending, setIsSending] = useState(false);

  const sendGift = useCallback(async (
    receiverId: string,
    receiverAddress: string,
    tokenSymbol: string,
    amount: number,
    usdValue: number,
    message?: string,
    postId?: string,
  ): Promise<GiftData | null> => {
    if (!user) {
      toast.error('Vui lòng đăng nhập');
      return null;
    }

    if (!window.ethereum) {
      toast.error('Vui lòng cài MetaMask');
      return null;
    }

    setIsSending(true);
    try {
      // 1. Create pending gift record
      const { data: gift, error: insertError } = await supabase
        .from('gifts')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          token_symbol: tokenSymbol,
          amount,
          usd_value: usdValue,
          message: message || null,
          post_id: postId || null,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError || !gift) {
        toast.error('Lỗi tạo giao dịch');
        return null;
      }

      // 2. Execute blockchain transfer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      let txHash: string;

      if (tokenSymbol === 'BNB') {
        // Native BNB transfer
        const tx = await signer.sendTransaction({
          to: receiverAddress,
          value: ethers.parseEther(amount.toString()),
        });
        const receipt = await tx.wait();
        txHash = receipt!.hash;
      } else {
        // ERC20 transfer
        const tokenAddress = TOKEN_ADDRESSES[tokenSymbol];
        if (!tokenAddress || tokenAddress === 'BNB') {
          toast.error(`Token ${tokenSymbol} chưa được hỗ trợ`);
          await supabase.from('gifts').update({ status: 'failed' }).eq('id', gift.id);
          return null;
        }

        const decimals = TOKEN_DECIMALS[tokenSymbol] || 18;
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
        const amountWei = ethers.parseUnits(amount.toString(), decimals);

        const tx = await contract.transfer(receiverAddress, amountWei);
        const receipt = await tx.wait();
        txHash = receipt!.hash;
      }

      // 3. Update gift to confirmed with tx hash
      const { data: confirmedGift, error: updateError } = await supabase
        .from('gifts')
        .update({ status: 'confirmed', tx_hash: txHash })
        .eq('id', gift.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating gift:', updateError);
      }

      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['gifts'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['light-score'] });

      return (confirmedGift || gift) as GiftData;
    } catch (error: any) {
      console.error('Gift transfer error:', error);
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Giao dịch bị từ chối');
      } else {
        toast.error('Lỗi chuyển token: ' + (error.reason || error.message || 'Unknown'));
      }
      return null;
    } finally {
      setIsSending(false);
    }
  }, [user, queryClient]);

  return { sendGift, isSending };
}

export function useGiftHistory(userId?: string) {
  return useQuery({
    queryKey: ['gifts', userId || 'all'],
    queryFn: async () => {
      let query = supabase
        .from('gifts')
        .select('*')
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(100);

      if (userId) {
        query = query.or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profile info for sender/receiver
      if (!data || data.length === 0) return [];

      const userIds = [...new Set(data.flatMap(g => [g.sender_id, g.receiver_id]))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return data.map(g => ({
        ...g,
        sender_name: profileMap.get(g.sender_id)?.display_name || 'Unknown',
        sender_email: profileMap.get(g.sender_id)?.email || '',
        receiver_name: profileMap.get(g.receiver_id)?.display_name || 'Unknown',
        receiver_email: profileMap.get(g.receiver_id)?.email || '',
      })) as GiftData[];
    },
  });
}

export function useLeaderboard(type: 'givers' | 'receivers' | 'sponsors', limit = 20) {
  return useQuery({
    queryKey: ['leaderboard', type, limit],
    queryFn: async () => {
      const orderBy = type === 'receivers' ? 'total_received_usd' : 'total_given_usd';

      const { data: scores, error } = await supabase
        .from('light_scores')
        .select('*')
        .order(orderBy, { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!scores || scores.length === 0) return [];

      const userIds = scores.map(s => s.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return scores.map(s => ({
        ...s,
        display_name: profileMap.get(s.user_id)?.display_name || 'Anonymous',
        email: profileMap.get(s.user_id)?.email || '',
        avatar_url: profileMap.get(s.user_id)?.avatar_url || null,
      })) as LeaderboardEntry[];
    },
  });
}

export function useLightScore(userId?: string) {
  return useQuery({
    queryKey: ['light-score', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('light_scores')
        .select('*')
        .eq('user_id', userId!)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

export function useUserProfiles() {
  return useQuery({
    queryKey: ['user-profiles-for-gift'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, avatar_url')
        .order('display_name');

      if (error) throw error;
      return data || [];
    },
  });
}
