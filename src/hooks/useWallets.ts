import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Token {
  id: string;
  symbol: string;
  balance: number;
  usd_value: number;
}

export interface Wallet {
  id: string;
  name: string;
  address: string;
  chain: string;
  tokens: Token[];
  totalBalance: number;
}

export function useWallets() {
  return useQuery({
    queryKey: ['wallets'],
    queryFn: async (): Promise<Wallet[]> => {
      const { data: wallets, error: walletsError } = await supabase
        .from('wallets')
        .select('*');

      if (walletsError) throw walletsError;

      const { data: tokens, error: tokensError } = await supabase
        .from('tokens')
        .select('*');

      if (tokensError) throw tokensError;

      return (wallets || []).map(wallet => {
        const walletTokens = (tokens || []).filter(t => t.wallet_id === wallet.id);
        const totalBalance = walletTokens.reduce((sum, t) => sum + Number(t.usd_value), 0);
        
        return {
          id: wallet.id,
          name: wallet.name,
          address: wallet.address,
          chain: wallet.chain,
          tokens: walletTokens.map(t => ({
            id: t.id,
            symbol: t.symbol,
            balance: Number(t.balance),
            usd_value: Number(t.usd_value),
          })),
          totalBalance,
        };
      });
    },
  });
}
