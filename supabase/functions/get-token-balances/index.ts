import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

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
    const btcBalance = parseInt(satoshis) / 100000000; // Convert satoshis to BTC
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Moralis API key - prioritize env variable, fallback to database
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

        // Handle Bitcoin chain separately - use BTC symbol for native Bitcoin
        if (wallet.chain === 'BTC') {
          const btcBalance = await fetchBitcoinBalance(wallet.address);
          walletTokens.push({
            symbol: 'BTC',
            name: 'Bitcoin',
            balance: btcBalance.toFixed(8),
            decimals: 8,
            usd_value: 0,
            contract_address: 'native-btc'
          });
        } else if (wallet.address && wallet.address.startsWith('0x')) {
          // Handle EVM chains (BNB, ETH, etc.)
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

          // Add native token
          const nativeSymbol = wallet.chain === 'ETH' ? 'ETH' : 'BNB';
          const nativeBalanceFormatted = parseFloat(nativeBalance) / 1e18;
          walletTokens.push({
            symbol: nativeSymbol,
            name: nativeSymbol === 'BNB' ? 'BNB' : 'Ethereum',
            balance: nativeBalanceFormatted.toFixed(6),
            decimals: 18,
            usd_value: 0,
            contract_address: 'native'
          });

          if (tokensResponse.ok) {
            const tokensData = await tokensResponse.json();
            
            for (const token of tokensData || []) {
              const isTracked = contractAddresses.includes(token.token_address?.toLowerCase());
              const balance = parseFloat(token.balance) / Math.pow(10, token.decimals || 18);
              
              if (isTracked || balance > 0) {
                walletTokens.push({
                  symbol: token.symbol || 'Unknown',
                  name: token.name || token.symbol || 'Unknown Token',
                  balance: balance.toFixed(6),
                  decimals: token.decimals || 18,
                  usd_value: 0,
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

    return new Response(JSON.stringify({
      success: true,
      balances: allBalances,
      trackedTokens: tokenContracts?.map(t => t.symbol) || []
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
