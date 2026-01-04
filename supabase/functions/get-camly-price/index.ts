import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CAMLY contract on BSC
const CAMLY_CONTRACT = '0x31f8d38df6514b6cc3c360ace3a2efa7496214f6';

// CoinGecko API for CAMLY (free, no API key needed)
const COINGECKO_URL = `https://api.coingecko.com/api/v3/coins/binance-smart-chain/contract/${CAMLY_CONTRACT}`;

// Fallback to simple price endpoint
const COINGECKO_SIMPLE_URL = `https://api.coingecko.com/api/v3/simple/token_price/binance-smart-chain?contract_addresses=${CAMLY_CONTRACT}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true`;

interface CamlyPriceData {
  price_usd: number;
  change_24h: number;
  volume_24h: number;
  market_cap: number;
  last_updated: string;
  source: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let priceData: CamlyPriceData | null = null;

    // Try CoinGecko contract endpoint first
    try {
      console.log('Fetching CAMLY price from CoinGecko contract endpoint...');
      const response = await fetch(COINGECKO_URL, {
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        priceData = {
          price_usd: data.market_data?.current_price?.usd || 0,
          change_24h: data.market_data?.price_change_percentage_24h || 0,
          volume_24h: data.market_data?.total_volume?.usd || 0,
          market_cap: data.market_data?.market_cap?.usd || 0,
          last_updated: new Date().toISOString(),
          source: 'coingecko_contract'
        };
        console.log('CoinGecko contract data:', priceData);
      }
    } catch (e) {
      console.log('CoinGecko contract endpoint failed:', e);
    }

    // Fallback to simple price endpoint
    if (!priceData || priceData.price_usd === 0) {
      try {
        console.log('Trying CoinGecko simple price endpoint...');
        const response = await fetch(COINGECKO_SIMPLE_URL, {
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          const tokenData = data[CAMLY_CONTRACT.toLowerCase()];
          
          if (tokenData) {
            priceData = {
              price_usd: tokenData.usd || 0,
              change_24h: tokenData.usd_24h_change || 0,
              volume_24h: tokenData.usd_24h_vol || 0,
              market_cap: tokenData.usd_market_cap || 0,
              last_updated: new Date().toISOString(),
              source: 'coingecko_simple'
            };
            console.log('CoinGecko simple data:', priceData);
          }
        }
      } catch (e) {
        console.log('CoinGecko simple endpoint failed:', e);
      }
    }

    // Ultimate fallback with known approximate price
    if (!priceData || priceData.price_usd === 0) {
      console.log('Using fallback CAMLY price');
      priceData = {
        price_usd: 0.00002272, // Fallback price from CMC
        change_24h: 0,
        volume_24h: 0,
        market_cap: 0,
        last_updated: new Date().toISOString(),
        source: 'fallback'
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: priceData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: unknown) {
    console.error('Error fetching CAMLY price:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {
          price_usd: 0.00002272,
          change_24h: 0,
          volume_24h: 0,
          market_cap: 0,
          last_updated: new Date().toISOString(),
          source: 'error_fallback'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
});
