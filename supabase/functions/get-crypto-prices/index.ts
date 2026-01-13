import { createClient } from "npm:@supabase/supabase-js@2";

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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[get-crypto-prices] Fetching prices from CoinGecko...');
    
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COIN_IDS}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[get-crypto-prices] CoinGecko API error:', response.status);
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: CryptoData[] = await response.json();
    console.log(`[get-crypto-prices] Fetched ${data.length} coins successfully`);

    // Transform and sort data - put CAMLY at top if exists
    const sortedData = data.sort((a, b) => {
      if (a.symbol.toUpperCase() === 'CAMLY') return -1;
      if (b.symbol.toUpperCase() === 'CAMLY') return 1;
      return (a.market_cap_rank || 999) - (b.market_cap_rank || 999);
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: sortedData,
        lastUpdated: new Date().toISOString(),
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[get-crypto-prices] Error:', errorMessage);
    
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
