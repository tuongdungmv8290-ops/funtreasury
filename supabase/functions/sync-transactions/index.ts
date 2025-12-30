import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MoralisTransfer {
  transaction_hash: string;
  block_number: string;
  block_timestamp: string;
  from_address: string;
  to_address: string;
  value: string;
  token_symbol?: string;
  token_address?: string | null;
}

interface WalletData {
  id: string;
  address: string;
  chain: string;
  name: string;
}

// Map chain names to Moralis chain format
function getMoralisChain(chain: string): string {
  const chainMap: Record<string, string> = {
    'BNB': '0x38',      // BSC Mainnet
    'ETH': '0x1',       // Ethereum Mainnet
    'POLYGON': '0x89',  // Polygon Mainnet
    'ARB': '0xa4b1',    // Arbitrum One
    'BASE': '0x2105',   // Base Mainnet
  };
  return chainMap[chain] || '0x38'; // Default to BSC
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Starting Transaction Sync ===');

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get Moralis API key from database
    console.log('Fetching Moralis API key from database...');
    const { data: apiSettings, error: apiError } = await supabase
      .from('api_settings')
      .select('key_value')
      .eq('key_name', 'MORALIS_API_KEY')
      .maybeSingle();

    if (apiError) {
      console.error('Error fetching API key:', apiError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Không thể đọc API key từ database'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!apiSettings?.key_value) {
      console.error('Moralis API key not found in database');
      return new Response(JSON.stringify({
        success: false,
        error: 'Chưa cấu hình Moralis API Key. Vui lòng vào Settings để thêm.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const moralisApiKey = apiSettings.key_value;
    console.log('Moralis API key found');

    // 2. Get wallet addresses from database
    console.log('Fetching wallet addresses...');
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('id, address, chain, name');

    if (walletsError) {
      console.error('Error fetching wallets:', walletsError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Không thể đọc danh sách ví từ database'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!wallets || wallets.length === 0) {
      console.error('No wallets found');
      return new Response(JSON.stringify({
        success: false,
        error: 'Chưa có ví nào được cấu hình. Vui lòng thêm ví trong Settings.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${wallets.length} wallets to sync`);

    let totalNewTransactions = 0;
    const syncResults: { wallet: string; newTxCount: number; error?: string }[] = [];

    // 3. Sync each wallet
    for (const wallet of wallets as WalletData[]) {
      if (!wallet.address || !wallet.address.startsWith('0x')) {
        console.log(`Skipping wallet ${wallet.name}: invalid address`);
        syncResults.push({ wallet: wallet.name, newTxCount: 0, error: 'Invalid address' });
        continue;
      }

      console.log(`Syncing wallet: ${wallet.name} (${wallet.address})`);
      
      try {
        const moralisChain = getMoralisChain(wallet.chain);
        
        // Fetch ERC20 token transfers
        const transfersUrl = `https://deep-index.moralis.io/api/v2.2/${wallet.address}/erc20/transfers?chain=${moralisChain}&limit=100`;
        
        console.log(`Calling Moralis API: ${transfersUrl}`);
        
        const headers = new Headers();
        headers.set('X-API-Key', moralisApiKey.trim());
        headers.set('Accept', 'application/json');
        
        const response = await fetch(transfersUrl, {
          method: 'GET',
          headers: headers
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Moralis API error for ${wallet.name}:`, response.status, errorText);
          syncResults.push({ wallet: wallet.name, newTxCount: 0, error: `API error: ${response.status}` });
          continue;
        }

        const data = await response.json();
        const transfers: MoralisTransfer[] = data.result || [];
        
        console.log(`Found ${transfers.length} transfers for ${wallet.name}`);

        // Also fetch native token (BNB/ETH) transfers
        const nativeUrl = `https://deep-index.moralis.io/api/v2.2/${wallet.address}?chain=${moralisChain}&limit=50`;
        const nativeResponse = await fetch(nativeUrl, {
          method: 'GET',
          headers: headers
        });

        let nativeTransfers: MoralisTransfer[] = [];
        if (nativeResponse.ok) {
          const nativeData = await nativeResponse.json();
          nativeTransfers = (nativeData.result || []).filter((tx: any) => tx.value && tx.value !== '0');
          console.log(`Found ${nativeTransfers.length} native transfers for ${wallet.name}`);
        }

        // Combine all transfers
        const allTransfers = [...transfers, ...nativeTransfers];

        if (allTransfers.length === 0) {
          console.log(`No transfers found for ${wallet.name}`);
          syncResults.push({ wallet: wallet.name, newTxCount: 0 });
          continue;
        }

        // 4. Upsert transactions (prevent duplicates using tx_hash)
        let newTxCount = 0;
        
        for (const tx of allTransfers) {
          const direction = tx.to_address?.toLowerCase() === wallet.address.toLowerCase() ? 'IN' : 'OUT';
          
          // Calculate value in decimal format
          let amount = 0;
          try {
            const decimals = tx.token_symbol ? 18 : 18; // Default to 18 decimals
            amount = parseFloat(tx.value) / Math.pow(10, decimals);
          } catch {
            amount = 0;
          }

          const transactionData = {
            wallet_id: wallet.id,
            tx_hash: tx.transaction_hash,
            block_number: parseInt(tx.block_number) || 0,
            timestamp: tx.block_timestamp || new Date().toISOString(),
            from_address: tx.from_address || '',
            to_address: tx.to_address || '',
            direction: direction,
            token_address: tx.token_address || null,
            token_symbol: tx.token_symbol || (wallet.chain === 'BNB' ? 'BNB' : 'ETH'),
            amount: amount,
            usd_value: 0, // Will be calculated later with price API
            gas_fee: 0,
            status: 'success'
          };

          // Check if transaction already exists
          const { data: existing } = await supabase
            .from('transactions')
            .select('id')
            .eq('tx_hash', tx.transaction_hash)
            .maybeSingle();

          if (!existing) {
            const { error: insertError } = await supabase
              .from('transactions')
              .insert(transactionData);

            if (insertError) {
              console.error(`Error inserting tx ${tx.transaction_hash}:`, insertError);
            } else {
              newTxCount++;
            }
          }
        }

        console.log(`Added ${newTxCount} new transactions for ${wallet.name}`);
        syncResults.push({ wallet: wallet.name, newTxCount });
        totalNewTransactions += newTxCount;

        // 5. Update sync state
        const { error: syncStateError } = await supabase
          .from('sync_state')
          .upsert({
            wallet_id: wallet.id,
            last_sync_at: new Date().toISOString(),
            sync_status: 'idle',
            last_block_synced: allTransfers.length > 0 ? parseInt(allTransfers[0].block_number) : 0
          }, {
            onConflict: 'wallet_id'
          });

        if (syncStateError) {
          console.error(`Error updating sync state for ${wallet.name}:`, syncStateError);
        }

      } catch (walletError) {
        console.error(`Error syncing wallet ${wallet.name}:`, walletError);
        syncResults.push({ 
          wallet: wallet.name, 
          newTxCount: 0, 
          error: walletError instanceof Error ? walletError.message : 'Unknown error' 
        });
      }
    }

    console.log(`=== Sync Complete: ${totalNewTransactions} new transactions ===`);

    return new Response(JSON.stringify({
      success: true,
      message: `Sync thành công! Đã thêm ${totalNewTransactions} giao dịch mới.`,
      totalNewTransactions,
      results: syncResults
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Sync error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi không xác định khi sync'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
