const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 50+ tokens matching Binance/Blockchain.com market
const COIN_IDS = [
  // Featured
  'camly-coin',
  // Top Layer 1
  'bitcoin', 'ethereum', 'binancecoin', 'solana', 'ripple', 
  'cardano', 'avalanche-2', 'polkadot', 'the-open-network', 'sui', 'tron',
  // Layer 2
  'matic-network', 'arbitrum', 'optimism',
  // DeFi
  'chainlink', 'uniswap', 'aave', 'maker', 'curve-dao-token',
  'compound-governance-token', 'sushi', '1inch', 'pancakeswap-token',
  'raydium', 'jupiter-exchange-solana', 'lido-dao', 'wrapped-steth',
  'pendle', 'ondo-finance', 'ethena', 'the-graph', 'hyperliquid',
  // Stablecoins
  'tether', 'usd-coin', 'dai', 'ethena-usde',
  // Meme Coins
  'dogecoin', 'shiba-inu', 'pepe', 'worldcoin-wld', 'official-trump',
  // Others
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

// Simple in-memory cache
let cachedData: CryptoData[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 120 * 1000; // 120 seconds cache

async function fetchWithRetry(url: string, retries = 4, delay = 2000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (response.ok) {
      return response;
    }
    
    if (response.status === 429 && i < retries - 1) {
      const wait = delay * Math.pow(2, i);
      console.log(`[get-crypto-prices] Rate limited, retry ${i + 1}/${retries} after ${wait}ms`);
      await new Promise(resolve => setTimeout(resolve, wait));
      continue;
    }
    
    throw new Error(`CoinGecko API error: ${response.status}`);
  }
  
  throw new Error('Max retries exceeded');
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = Date.now();
    
    // Return cached data if still valid
    if (cachedData && (now - cacheTimestamp) < CACHE_TTL_MS) {
      console.log('[get-crypto-prices] Returning cached data');
      return new Response(
        JSON.stringify({
          success: true,
          data: cachedData,
          lastUpdated: new Date(cacheTimestamp).toISOString(),
          cached: true,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log('[get-crypto-prices] Fetching DeFi prices from CoinGecko...');
    
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COIN_IDS}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`;
    
    const response = await fetchWithRetry(url);
    const data: CryptoData[] = await response.json();
    
    console.log(`[get-crypto-prices] Fetched ${data.length} DeFi tokens successfully`);

    // Sort với thứ tự ưu tiên: CAMLY > BTC > USDT > BNB, sau đó token tăng mạnh
    const priority = ['CAMLY', 'BTC', 'USDT', 'BNB'];
    const sortedData = data.sort((a, b) => {
      const aSym = a.symbol.toUpperCase();
      const bSym = b.symbol.toUpperCase();
      
      const aIdx = priority.indexOf(aSym);
      const bIdx = priority.indexOf(bSym);
      
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      
      // Token tăng mạnh trong ngày (>5%) được ưu tiên
      const aChange = a.price_change_percentage_24h ?? 0;
      const bChange = b.price_change_percentage_24h ?? 0;
      
      if (aChange > 5 && bChange <= 5) return -1;
      if (bChange > 5 && aChange <= 5) return 1;
      
      return (a.market_cap_rank || 999) - (b.market_cap_rank || 999);
    });

    // Update cache
    cachedData = sortedData;
    cacheTimestamp = now;

    return new Response(
      JSON.stringify({
        success: true,
        data: sortedData,
        lastUpdated: new Date().toISOString(),
        cached: false,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[get-crypto-prices] Error:', errorMessage);
    
    // Return stale cache if available during errors
    if (cachedData) {
      console.log('[get-crypto-prices] Returning stale cache due to error');
      return new Response(
        JSON.stringify({
          success: true,
          data: cachedData,
          lastUpdated: new Date(cacheTimestamp).toISOString(),
          cached: true,
          stale: true,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        data: [],
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
