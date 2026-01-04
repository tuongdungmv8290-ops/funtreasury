import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CAMLY on CoinGecko - use coin ID for accurate data
const COINGECKO_COIN_ID = 'camly-coin';
const COINGECKO_COIN_URL = `https://api.coingecko.com/api/v3/coins/${COINGECKO_COIN_ID}?localization=false&tickers=false&community_data=false&developer_data=false`;

// Correct CAMLY contract on BSC (from CoinGecko)
const CAMLY_CONTRACT = '0x0917eD3D687a59304295D967f4C0E92afFB94A08';
const COINGECKO_CONTRACT_URL = `https://api.coingecko.com/api/v3/coins/binance-smart-chain/contract/${CAMLY_CONTRACT}`;

// DexScreener as backup with correct contract
const DEXSCREENER_URL = `https://api.dexscreener.com/latest/dex/tokens/${CAMLY_CONTRACT}`;

interface CamlyPriceData {
  price_usd: number;
  change_24h: number;
  volume_24h: number;
  market_cap: number;
  last_updated: string;
  source: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let priceData: CamlyPriceData | null = null;

    // Try CoinGecko by coin ID first (most accurate for CAMLY)
    try {
      console.log('Fetching CAMLY price from CoinGecko by coin ID...');
      const response = await fetch(COINGECKO_COIN_URL, {
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        const marketData = data.market_data;
        
        if (marketData && marketData.current_price?.usd) {
          priceData = {
            price_usd: marketData.current_price.usd,
            change_24h: marketData.price_change_percentage_24h || 0,
            volume_24h: marketData.total_volume?.usd || 0,
            market_cap: marketData.market_cap?.usd || marketData.fully_diluted_valuation?.usd || 0,
            last_updated: new Date().toISOString(),
            source: 'coingecko'
          };
          console.log('CoinGecko coin data:', priceData);
        }
      } else {
        console.log('CoinGecko coin ID response not ok:', response.status);
      }
    } catch (e) {
      console.log('CoinGecko coin ID failed:', e);
    }

    // Fallback to CoinGecko contract endpoint
    if (!priceData || priceData.price_usd === 0) {
      try {
        console.log('Trying CoinGecko contract endpoint...');
        const response = await fetch(COINGECKO_CONTRACT_URL, {
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          const marketData = data.market_data;
          
          if (marketData && marketData.current_price?.usd) {
            priceData = {
              price_usd: marketData.current_price.usd,
              change_24h: marketData.price_change_percentage_24h || 0,
              volume_24h: marketData.total_volume?.usd || 0,
              market_cap: marketData.market_cap?.usd || 0,
              last_updated: new Date().toISOString(),
              source: 'coingecko_contract'
            };
            console.log('CoinGecko contract data:', priceData);
          }
        }
      } catch (e) {
        console.log('CoinGecko contract failed:', e);
      }
    }

    // Fallback to DexScreener
    if (!priceData || priceData.price_usd === 0) {
      try {
        console.log('Trying DexScreener...');
        const response = await fetch(DEXSCREENER_URL, {
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          const pair = data.pairs?.[0];
          
          if (pair && parseFloat(pair.priceUsd) < 1) { // Sanity check - CAMLY should be < $1
            priceData = {
              price_usd: parseFloat(pair.priceUsd),
              change_24h: pair.priceChange?.h24 || 0,
              volume_24h: pair.volume?.h24 || 0,
              market_cap: pair.fdv || pair.marketCap || 0,
              last_updated: new Date().toISOString(),
              source: 'dexscreener'
            };
            console.log('DexScreener data:', priceData);
          } else {
            console.log('DexScreener price seems wrong:', pair?.priceUsd);
          }
        }
      } catch (e) {
        console.log('DexScreener failed:', e);
      }
    }

    // Ultimate fallback with realistic CAMLY price
    if (!priceData || priceData.price_usd === 0) {
      console.log('Using fallback CAMLY price');
      priceData = {
        price_usd: 0.00002249,
        change_24h: -2.2,
        volume_24h: 2385.63,
        market_cap: 22487846,
        last_updated: new Date().toISOString(),
        source: 'fallback'
      };
    }

    return new Response(
      JSON.stringify({ success: true, data: priceData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: unknown) {
    console.error('Error fetching CAMLY price:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {
          price_usd: 0.00002249,
          change_24h: -2.2,
          volume_24h: 2385.63,
          market_cap: 22487846,
          last_updated: new Date().toISOString(),
          source: 'error_fallback'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
