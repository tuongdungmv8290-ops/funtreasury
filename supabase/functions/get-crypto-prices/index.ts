import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COIN_IDS = [
  'camly-coin',
  'bitcoin', 'ethereum', 'binancecoin', 'solana', 'ripple', 
  'cardano', 'avalanche-2', 'polkadot', 'the-open-network', 'sui', 'tron',
  'matic-network', 'arbitrum', 'optimism',
  'chainlink', 'uniswap', 'aave', 'maker', 'curve-dao-token',
  'compound-governance-token', 'sushi', '1inch', 'pancakeswap-token',
  'raydium', 'jupiter-exchange-solana', 'lido-dao', 'wrapped-steth',
  'pendle', 'ondo-finance', 'ethena', 'the-graph', 'hyperliquid',
  'tether', 'usd-coin', 'dai', 'ethena-usde',
  'dogecoin', 'shiba-inu', 'pepe', 'worldcoin-wld', 'official-trump',
  'stellar', 'litecoin', 'bitcoin-cash', 'zcash', 'hedera-hashgraph', 
  'bittensor', 'wrapped-bitcoin', 'wrapped-beacon-eth'
].join(',');

interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
  market_cap: number;
  market_cap_rank: number;
  circulating_supply: number;
  sparkline_in_7d?: { price: number[] };
}

// In-memory cache as first layer
let memCache: CryptoData[] | null = null;
let memCacheTime = 0;
const CACHE_TTL_MS = 120_000;

async function fetchWithRetry(url: string, retries = 4, delay = 2000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (response.ok) return response;
    if (response.status === 429 && i < retries - 1) {
      const wait = delay * Math.pow(2, i);
      console.log(`[get-crypto-prices] Rate limited, retry ${i + 1}/${retries} after ${wait}ms`);
      await new Promise(r => setTimeout(r, wait));
      continue;
    }
    throw new Error(`CoinGecko API error: ${response.status}`);
  }
  throw new Error('Max retries exceeded');
}

function sortData(data: CryptoData[]): CryptoData[] {
  const priority = ['CAMLY', 'BTC', 'USDT', 'BNB'];
  return [...data].sort((a, b) => {
    const aSym = a.symbol.toUpperCase();
    const bSym = b.symbol.toUpperCase();
    const aIdx = priority.indexOf(aSym);
    const bIdx = priority.indexOf(bSym);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    const aChange = a.price_change_percentage_24h ?? 0;
    const bChange = b.price_change_percentage_24h ?? 0;
    if (aChange > 5 && bChange <= 5) return -1;
    if (bChange > 5 && aChange <= 5) return 1;
    return (a.market_cap_rank || 999) - (b.market_cap_rank || 999);
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const now = Date.now();

    // Layer 1: In-memory cache
    if (memCache && (now - memCacheTime) < CACHE_TTL_MS) {
      console.log('[get-crypto-prices] Returning memory cache');
      return new Response(JSON.stringify({ success: true, data: memCache, lastUpdated: new Date(memCacheTime).toISOString(), cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Layer 2: DB cache
    const { data: dbCache } = await supabase
      .from('price_cache')
      .select('data, updated_at')
      .eq('id', 'crypto_prices')
      .single();

    if (dbCache) {
      const dbAge = now - new Date(dbCache.updated_at).getTime();
      if (dbAge < CACHE_TTL_MS) {
        console.log('[get-crypto-prices] Returning DB cache');
        memCache = dbCache.data as CryptoData[];
        memCacheTime = new Date(dbCache.updated_at).getTime();
        return new Response(JSON.stringify({ success: true, data: memCache, lastUpdated: dbCache.updated_at, cached: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Layer 3: Fetch from API
    console.log('[get-crypto-prices] Fetching from CoinGecko...');
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COIN_IDS}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`;
    const response = await fetchWithRetry(url);
    const data: CryptoData[] = await response.json();
    const sorted = sortData(data);

    console.log(`[get-crypto-prices] Fetched ${sorted.length} tokens`);

    // Update both caches
    memCache = sorted;
    memCacheTime = now;
    await supabase.from('price_cache').upsert({ id: 'crypto_prices', data: sorted as unknown as Record<string, unknown>, updated_at: new Date().toISOString() });

    return new Response(JSON.stringify({ success: true, data: sorted, lastUpdated: new Date().toISOString(), cached: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[get-crypto-prices] Error:', msg);

    // Fallback: return any available cache
    if (memCache) {
      return new Response(JSON.stringify({ success: true, data: memCache, lastUpdated: new Date(memCacheTime).toISOString(), cached: true, stale: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try DB cache as last resort
    const { data: staleCache } = await supabase.from('price_cache').select('data, updated_at').eq('id', 'crypto_prices').single();
    if (staleCache?.data) {
      return new Response(JSON.stringify({ success: true, data: staleCache.data, lastUpdated: staleCache.updated_at, cached: true, stale: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: false, error: msg, data: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
});
