const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CoinGecko coin IDs mapping
const COIN_IDS = 'bitcoin,ethereum,binancecoin,solana,camly-coin,ripple,cardano,dogecoin';

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
  sparkline_in_7d?: { price: number[] };
}

// Simple in-memory cache
let cachedData: CryptoData[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds cache

async function fetchWithRetry(url: string, retries = 3, delay = 1000): Promise<Response> {
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
      console.log(`[get-crypto-prices] Rate limited, retry ${i + 1}/${retries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
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

    console.log('[get-crypto-prices] Fetching prices from CoinGecko...');
    
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COIN_IDS}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`;
    
    const response = await fetchWithRetry(url);
    const data: CryptoData[] = await response.json();
    
    console.log(`[get-crypto-prices] Fetched ${data.length} coins successfully`);

    // Sort data - put CAMLY at top if exists
    const sortedData = data.sort((a, b) => {
      if (a.symbol.toUpperCase() === 'CAMLY') return -1;
      if (b.symbol.toUpperCase() === 'CAMLY') return 1;
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
