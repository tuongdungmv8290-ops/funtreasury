import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  usd_value: number;
  contract_address: string;
}

// Fallback prices if API fails - CAMLY price ~$0.000022 as of Jan 2026
const FALLBACK_PRICES: Record<string, number> = {
  'BTC': 97000,
  'BTCB': 97000,
  'BNB': 710,
  'ETH': 3500,
  'MATIC': 0.50,
  'USDT': 1,
  'USDC': 1,
  'BUSD': 1,
  'CAMLY': 0.000022,
};

// CoinGecko token IDs mapping
const COINGECKO_IDS: Record<string, string> = {
  'BTC': 'bitcoin',
  'BTCB': 'bitcoin',
  'BNB': 'binancecoin',
  'ETH': 'ethereum',
  'USDT': 'tether',
  'USDC': 'usd-coin',
  'BUSD': 'binance-usd',
  'MATIC': 'matic-network',
};

// CAMLY contract address on BSC for price lookup
const CAMLY_CONTRACT = '0x0910320181889fefde0bb1ca63962b0a8882e413';

// Cache for prices (5 minutes TTL)
let priceCache: { prices: Record<string, number>; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Fetch prices from CoinGecko
async function fetchPricesFromCoinGecko(): Promise<Record<string, number>> {
  // Check cache first
  if (priceCache && (Date.now() - priceCache.timestamp) < CACHE_TTL) {
    console.log('Using cached prices');
    return priceCache.prices;
  }

  const prices: Record<string, number> = { ...FALLBACK_PRICES };

  try {
    // Fetch main token prices
    const ids = Object.values(COINGECKO_IDS).join(',');
    const mainPricesUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;
    console.log('Fetching prices from CoinGecko...');
    
    const mainResponse = await fetch(mainPricesUrl);
    if (mainResponse.ok) {
      const data = await mainResponse.json();
      console.log('CoinGecko response:', JSON.stringify(data));
      
      // Map back to our symbols
      for (const [symbol, geckoId] of Object.entries(COINGECKO_IDS)) {
        if (data[geckoId]?.usd) {
          prices[symbol] = data[geckoId].usd;
        }
      }
    } else {
      console.log(`CoinGecko main prices API error: ${mainResponse.status}`);
    }

    // Fetch CAMLY price from BSC contract
    try {
      const camlyUrl = `https://api.coingecko.com/api/v3/simple/token_price/binance-smart-chain?contract_addresses=${CAMLY_CONTRACT}&vs_currencies=usd`;
      const camlyResponse = await fetch(camlyUrl);
      
      if (camlyResponse.ok) {
        const camlyData = await camlyResponse.json();
        console.log('CAMLY price response:', JSON.stringify(camlyData));
        
        const camlyAddress = CAMLY_CONTRACT.toLowerCase();
        if (camlyData[camlyAddress]?.usd) {
          prices['CAMLY'] = camlyData[camlyAddress].usd;
        }
      } else {
        console.log(`CoinGecko CAMLY API error: ${camlyResponse.status}`);
      }
    } catch (camlyError) {
      console.log('Error fetching CAMLY price:', camlyError);
    }

    // Update cache
    priceCache = { prices, timestamp: Date.now() };
    console.log('Prices updated:', JSON.stringify(prices));
    
  } catch (error) {
    console.error('Error fetching prices from CoinGecko:', error);
  }

  return prices;
}

// Get token price
async function getTokenPrice(symbol: string, prices: Record<string, number>): Promise<number> {
  const upperSymbol = symbol.toUpperCase();
  return prices[upperSymbol] || 0;
}

// Map chain names to Moralis chain format
function getMoralisChain(chain: string): string {
  const chainMap: Record<string, string> = {
    'BNB': '0x38',
    'ETH': '0x1',
    'POLYGON': '0x89',
    'ARB': '0xa4b1',
    'BASE': '0x2105',
  };
  return chainMap[chain] || '0x38';
}

// Fetch Bitcoin balance using Blockchain.info API
async function fetchBitcoinBalance(address: string): Promise<number> {
  try {
    const url = `https://blockchain.info/q/addressbalance/${address}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log(`Bitcoin API error for ${address}: ${response.status}`);
      return 0;
    }
    
    const satoshis = await response.text();
    const btcBalance = parseInt(satoshis) / 100000000;
    console.log(`Bitcoin balance for ${address}: ${btcBalance} BTC`);
    return btcBalance;
  } catch (error) {
    console.error(`Error fetching Bitcoin balance:`, error);
    return 0;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Fetching Token Balances ===');

    // Authenticate the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized - No authorization header'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized - Invalid token'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check admin role
    const { data: roleData } = await authClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      console.error('User is not an admin:', user.id);
      return new Response(JSON.stringify({
        success: false,
        error: 'Forbidden - Admin access required'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Authenticated admin user:', user.email);

    // Fetch prices first
    const prices = await fetchPricesFromCoinGecko();

    // Use service role for data operations
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Moralis API key
    let moralisApiKey = Deno.env.get('MORALIS_API_KEY');
    
    if (!moralisApiKey) {
      const { data: apiSettings } = await supabase
        .from('api_settings')
        .select('key_value')
        .eq('key_name', 'MORALIS_API_KEY')
        .maybeSingle();
      moralisApiKey = apiSettings?.key_value || null;
    }

    if (!moralisApiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Chưa cấu hình Moralis API Key'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Moralis API key found');

    // Get wallets
    const { data: wallets } = await supabase
      .from('wallets')
      .select('id, address, chain, name');

    if (!wallets || wallets.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Chưa có ví nào được cấu hình'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get token contracts to track
    const { data: tokenContracts } = await supabase
      .from('token_contracts')
      .select('symbol, name, contract_address');

    const contractAddresses = (tokenContracts || [])
      .filter(tc => tc.contract_address && tc.contract_address.startsWith('0x'))
      .map(tc => tc.contract_address.toLowerCase());

    console.log(`Tracking ${contractAddresses.length} token contracts`);

    const allBalances: { wallet: string; walletName: string; tokens: TokenBalance[] }[] = [];

    for (const wallet of wallets) {
      console.log(`Fetching balances for ${wallet.name}: ${wallet.address} (${wallet.chain})`);

      try {
        const walletTokens: TokenBalance[] = [];

        if (wallet.chain === 'BTC') {
          const btcBalance = await fetchBitcoinBalance(wallet.address);
          const btcPrice = await getTokenPrice('BTC', prices);
          walletTokens.push({
            symbol: 'BTC',
            name: 'Bitcoin',
            balance: btcBalance.toFixed(8),
            decimals: 8,
            usd_value: btcBalance * btcPrice,
            contract_address: 'native-btc'
          });
        } else if (wallet.address && wallet.address.startsWith('0x')) {
          const moralisChain = getMoralisChain(wallet.chain);
          
          const headers = new Headers();
          headers.set('X-API-Key', moralisApiKey.trim());
          headers.set('Accept', 'application/json');

          // Get native balance (BNB/ETH)
          const nativeUrl = `https://deep-index.moralis.io/api/v2.2/${wallet.address}/balance?chain=${moralisChain}`;
          const nativeResponse = await fetch(nativeUrl, { method: 'GET', headers });
          
          let nativeBalance = '0';
          if (nativeResponse.ok) {
            const nativeData = await nativeResponse.json();
            nativeBalance = nativeData.balance || '0';
          }

          // Get ERC20 token balances
          const tokensUrl = `https://deep-index.moralis.io/api/v2.2/${wallet.address}/erc20?chain=${moralisChain}`;
          const tokensResponse = await fetch(tokensUrl, { method: 'GET', headers });

          const nativeSymbolMap: Record<string, string> = {
            'BNB': 'BNB',
            'ETH': 'ETH',
            'POLYGON': 'MATIC',
            'ARB': 'ETH',
            'BASE': 'ETH',
          };
          const nativeNameMap: Record<string, string> = {
            'BNB': 'BNB',
            'ETH': 'Ethereum',
            'POLYGON': 'Polygon',
            'ARB': 'Ethereum (Arbitrum)',
            'BASE': 'Ethereum (Base)',
          };
          const nativeSymbol = nativeSymbolMap[wallet.chain] || 'ETH';
          const nativeName = nativeNameMap[wallet.chain] || 'Native Token';
          const nativeBalanceFormatted = parseFloat(nativeBalance) / 1e18;
          const nativePrice = await getTokenPrice(nativeSymbol, prices);
          walletTokens.push({
            symbol: nativeSymbol,
            name: nativeName,
            balance: nativeBalanceFormatted.toFixed(6),
            decimals: 18,
            usd_value: nativeBalanceFormatted * nativePrice,
            contract_address: 'native'
          });

          if (tokensResponse.ok) {
            const tokensData = await tokensResponse.json();
            
            for (const token of tokensData || []) {
              const isTracked = contractAddresses.includes(token.token_address?.toLowerCase());
              const balance = parseFloat(token.balance) / Math.pow(10, token.decimals || 18);
              const tokenSymbol = token.symbol || 'Unknown';
              const tokenPrice = await getTokenPrice(tokenSymbol, prices);
              
              if (isTracked || balance > 0) {
                walletTokens.push({
                  symbol: tokenSymbol,
                  name: token.name || tokenSymbol || 'Unknown Token',
                  balance: balance.toFixed(6),
                  decimals: token.decimals || 18,
                  usd_value: balance * tokenPrice,
                  contract_address: token.token_address || ''
                });
              }
            }
          }
        } else {
          console.log(`Skipping wallet ${wallet.name}: unsupported address format`);
          continue;
        }

        allBalances.push({
          wallet: wallet.address,
          walletName: wallet.name,
          tokens: walletTokens
        });

        // Update tokens table in DB
        for (const token of walletTokens) {
          const { error: upsertError } = await supabase
            .from('tokens')
            .upsert({
              wallet_id: wallet.id,
              symbol: token.symbol,
              balance: parseFloat(token.balance),
              usd_value: token.usd_value
            }, {
              onConflict: 'wallet_id,symbol',
              ignoreDuplicates: false
            });

          if (upsertError) {
            console.log(`Note: Could not upsert token ${token.symbol}:`, upsertError.message);
          }
        }

      } catch (walletError) {
        console.error(`Error fetching ${wallet.name}:`, walletError);
      }
    }

    console.log('=== Token Balances Fetched ===');
    console.log('Final prices used:', JSON.stringify(prices));

    return new Response(JSON.stringify({
      success: true,
      balances: allBalances,
      trackedTokens: tokenContracts?.map(t => t.symbol) || [],
      prices: prices
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
