import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, Copy, CheckCircle, ExternalLink, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimePrices } from '@/hooks/useRealtimePrices';
import { formatCurrency, shortenAddress } from '@/lib/formatUtils';
import camlyLogo from '@/assets/camly-logo.jpeg';

const REWARDS_ADDRESS = '0xa4967da72d012151950627483285c3042957DA5d';

const TOKEN_LOGOS: Record<string, string> = {
  'CAMLY': camlyLogo,
  'BNB': 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
  'USDT': 'https://cryptologos.cc/logos/tether-usdt-logo.png',
  'BTC': 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
  'BTCB': 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
  'USDC': 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
};

const CORE_TOKENS = ['CAMLY', 'BNB', 'USDT', 'USDC', 'BTCB'];

function TokenLogo({ symbol, size = 22 }: { symbol: string; size?: number }) {
  const [hasError, setHasError] = useState(false);
  const logoUrl = TOKEN_LOGOS[symbol];
  if (!logoUrl || hasError) {
    return <span className="text-xs font-bold text-muted-foreground">{symbol.substring(0, 2)}</span>;
  }
  return <img src={logoUrl} alt={symbol} className="rounded-full object-cover" style={{ width: size, height: size }} onError={() => setHasError(true)} loading="lazy" />;
}

function useRewardsWallet() {
  const prices = useRealtimePrices();

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['rewards-wallet'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select('id, name, address')
        .ilike('address', REWARDS_ADDRESS)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['rewards-wallet-transactions', wallet?.id],
    queryFn: async () => {
      if (!wallet?.id) return [];
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('wallet_id', wallet.id)
        .in('token_symbol', CORE_TOKENS)
        .order('timestamp', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!wallet?.id,
  });

  return { wallet, walletLoading, transactions, txLoading, prices };
}

export function RewardsWalletCard() {
  const [copied, setCopied] = useState(false);
  const prices = useRealtimePrices();

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['rewards-wallet'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select('id, name, address')
        .ilike('address', REWARDS_ADDRESS)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: tokens, isLoading: tokensLoading } = useQuery({
    queryKey: ['rewards-wallet-tokens', wallet?.id],
    queryFn: async () => {
      if (!wallet?.id) return [];
      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .eq('wallet_id', wallet.id);
      if (error) throw error;
      return (data || [])
        .filter(t => CORE_TOKENS.includes(t.symbol) && Number(t.balance) > 0)
        .map(t => ({
          symbol: t.symbol,
          balance: Number(t.balance),
          usd_value: Number(t.balance) * (prices[t.symbol] || 0),
        }))
        .sort((a, b) => b.usd_value - a.usd_value);
    },
    enabled: !!wallet?.id,
  });

  const totalUsd = tokens?.reduce((sum, t) => sum + t.usd_value, 0) || 0;

  const copyAddress = async () => {
    await navigator.clipboard.writeText(REWARDS_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (walletLoading || tokensLoading) {
    return <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>;
  }

  if (!wallet) return null;

  return (
    <Card className="border-treasury-gold/30 bg-gradient-to-br from-treasury-gold/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-treasury-gold/25 to-treasury-gold/10 border border-treasury-gold/40 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-treasury-gold" />
            </div>
            <div>
              <h3 className="text-lg font-heading font-semibold text-foreground">FUN TREASURY (FUN PLAY)</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground font-mono bg-secondary/60 px-2 py-0.5 rounded">{shortenAddress(wallet.address)}</span>
                <button onClick={copyAddress} className="text-muted-foreground hover:text-treasury-gold transition-colors">
                  {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a href={`https://bscscan.com/address/${wallet.address}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-treasury-gold transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Balance</p>
            <p className="font-mono text-xl font-bold text-treasury-gold">{formatCurrency(totalUsd)}</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tokens && tokens.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {tokens.map(token => (
              <div key={token.symbol} className="px-3 py-2.5 rounded-xl bg-secondary/70 border border-border/60">
                <div className="flex items-center gap-2">
                  <TokenLogo symbol={token.symbol} />
                  <div className="flex-1 min-w-0">
                    <span className="font-heading text-sm font-bold text-foreground">{token.symbol}</span>
                    <p className="text-xs text-muted-foreground font-mono">{formatCurrency(token.usd_value)}</p>
                  </div>
                </div>
                <p className="text-sm font-mono font-semibold text-foreground mt-1">{token.balance.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function WalletTransactionList() {
  const { wallet, walletLoading, transactions, txLoading } = useRewardsWallet();

  if (walletLoading) return <Skeleton className="h-40 w-full" />;
  if (!wallet) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wallet className="w-5 h-5 text-treasury-gold" />
          Tất cả giao dịch ví FUN TREASURY
        </CardTitle>
      </CardHeader>
      <CardContent>
        {txLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : !transactions || transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Chưa có giao dịch</p>
        ) : (
          <div className="space-y-1.5">
            {transactions.map(tx => {
              const isIn = tx.direction === 'IN';
              return (
                <div key={tx.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 border border-border/30 hover:bg-secondary/50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isIn ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {isIn ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <TokenLogo symbol={tx.token_symbol} size={16} />
                      <span className="text-sm font-medium">{isIn ? 'Nhận' : 'Gửi'} {tx.token_symbol}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5">{isIn ? 'IN' : 'OUT'}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(tx.timestamp).toLocaleString('vi-VN')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-mono font-bold text-sm ${isIn ? 'text-green-500' : 'text-red-500'}`}>
                      {isIn ? '+' : '-'}{Number(tx.amount).toLocaleString()} {tx.token_symbol}
                    </p>
                    <p className="text-xs text-muted-foreground">~{formatCurrency(Number(tx.usd_value))}</p>
                  </div>
                  {tx.tx_hash && (
                    <a href={`https://bscscan.com/tx/${tx.tx_hash}`} target="_blank" rel="noopener noreferrer" className="shrink-0">
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
