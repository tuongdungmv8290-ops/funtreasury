import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ERC20Transfer {
  transaction_hash: string;
  block_number: string;
  block_timestamp: string;
  from_address: string;
  to_address: string;
  value: string;
  token_symbol?: string;
  token_address?: string | null;
  token_decimals?: string;
}

interface NativeTransfer {
  hash: string; // Native uses 'hash' not 'transaction_hash'
  block_number: string;
  block_timestamp: string;
  from_address: string;
  to_address: string;
  value: string;
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

// Get native token symbol for chain
function getNativeSymbol(chain: string): string {
  const symbols: Record<string, string> = {
    'BNB': 'BNB',
    'ETH': 'ETH',
    'POLYGON': 'MATIC',
    'ARB': 'ETH',
    'BASE': 'ETH',
  };
  return symbols[chain] || 'BNB';
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

    // 1. Get Moralis API key - prioritize env variable, fallback to database
    console.log('Fetching Moralis API key...');
    let moralisApiKey = Deno.env.get('MORALIS_API_KEY');
    
    if (!moralisApiKey) {
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
      
      moralisApiKey = apiSettings?.key_value || null;
    }

    if (!moralisApiKey) {
      console.error('Moralis API key not found');
      return new Response(JSON.stringify({
        success: false,
        error: 'Chưa cấu hình Moralis API Key. Vui lòng vào Settings để thêm.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

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
        const nativeSymbol = getNativeSymbol(wallet.chain);
        
        const headers = new Headers();
        headers.set('X-API-Key', moralisApiKey.trim());
        headers.set('Accept', 'application/json');

        // Fetch ERC20 token transfers
        const transfersUrl = `https://deep-index.moralis.io/api/v2.2/${wallet.address}/erc20/transfers?chain=${moralisChain}&limit=100`;
        console.log(`Calling Moralis ERC20 API: ${transfersUrl}`);
        
        const response = await fetch(transfersUrl, {
          method: 'GET',
          headers: headers
        });

        let erc20Transfers: ERC20Transfer[] = [];
        if (response.ok) {
          const data = await response.json();
          erc20Transfers = data.result || [];
          console.log(`Found ${erc20Transfers.length} ERC20 transfers for ${wallet.name}`);
        } else {
          const errorText = await response.text();
          console.error(`Moralis ERC20 API error for ${wallet.name}:`, response.status, errorText);
        }

        // Fetch native token (BNB/ETH) transfers - uses different endpoint
        const nativeUrl = `https://deep-index.moralis.io/api/v2.2/${wallet.address}?chain=${moralisChain}&limit=100`;
        console.log(`Calling Moralis Native API: ${nativeUrl}`);
        
        const nativeResponse = await fetch(nativeUrl, {
          method: 'GET',
          headers: headers
        });

        let nativeTransfers: NativeTransfer[] = [];
        if (nativeResponse.ok) {
          const nativeData = await nativeResponse.json();
          // Filter only transactions with value (native token transfers)
          nativeTransfers = (nativeData.result || []).filter((tx: NativeTransfer) => 
            tx.value && tx.value !== '0' && tx.hash
          );
          console.log(`Found ${nativeTransfers.length} native transfers for ${wallet.name}`);
        } else {
          console.error(`Moralis Native API error for ${wallet.name}:`, nativeResponse.status);
        }

        if (erc20Transfers.length === 0 && nativeTransfers.length === 0) {
          console.log(`No transfers found for ${wallet.name}`);
          syncResults.push({ wallet: wallet.name, newTxCount: 0 });
          continue;
        }

        // 4. Process and upsert transactions
        let newTxCount = 0;

        // Process ERC20 transfers
        for (const tx of erc20Transfers) {
          if (!tx.transaction_hash) {
            console.log('Skipping ERC20 tx without hash');
            continue;
          }

          const direction = tx.to_address?.toLowerCase() === wallet.address.toLowerCase() ? 'IN' : 'OUT';
          
          // Calculate value with decimals
          let amount = 0;
          try {
            const decimals = tx.token_decimals ? parseInt(tx.token_decimals) : 18;
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
            token_symbol: tx.token_symbol || 'UNKNOWN',
            amount: amount,
            usd_value: 0,
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
              console.error(`Error inserting ERC20 tx ${tx.transaction_hash}:`, insertError);
            } else {
              newTxCount++;
            }
          }
        }

        // Process native transfers (BNB/ETH) - uses 'hash' field
        for (const tx of nativeTransfers) {
          if (!tx.hash) {
            console.log('Skipping native tx without hash');
            continue;
          }

          const direction = tx.to_address?.toLowerCase() === wallet.address.toLowerCase() ? 'IN' : 'OUT';
          
          // Native token has 18 decimals
          let amount = 0;
          try {
            amount = parseFloat(tx.value) / Math.pow(10, 18);
          } catch {
            amount = 0;
          }

          const transactionData = {
            wallet_id: wallet.id,
            tx_hash: tx.hash, // Use 'hash' for native transfers
            block_number: parseInt(tx.block_number) || 0,
            timestamp: tx.block_timestamp || new Date().toISOString(),
            from_address: tx.from_address || '',
            to_address: tx.to_address || '',
            direction: direction,
            token_address: null,
            token_symbol: nativeSymbol,
            amount: amount,
            usd_value: 0,
            gas_fee: 0,
            status: 'success'
          };

          // Check if transaction already exists
          const { data: existing } = await supabase
            .from('transactions')
            .select('id')
            .eq('tx_hash', tx.hash)
            .maybeSingle();

          if (!existing) {
            const { error: insertError } = await supabase
              .from('transactions')
              .insert(transactionData);

            if (insertError) {
              console.error(`Error inserting native tx ${tx.hash}:`, insertError);
            } else {
              newTxCount++;
            }
          }
        }

        console.log(`Added ${newTxCount} new transactions for ${wallet.name}`);
        syncResults.push({ wallet: wallet.name, newTxCount });
        totalNewTransactions += newTxCount;

        // 5. Update sync state
        const maxBlockNumber = Math.max(
          ...erc20Transfers.map(t => parseInt(t.block_number) || 0),
          ...nativeTransfers.map(t => parseInt(t.block_number) || 0),
          0
        );

        const { error: syncStateError } = await supabase
          .from('sync_state')
          .upsert({
            wallet_id: wallet.id,
            last_sync_at: new Date().toISOString(),
            sync_status: 'idle',
            last_block_synced: maxBlockNumber
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
      message: totalNewTransactions > 0 
        ? `Sync thành công! Đã thêm ${totalNewTransactions} giao dịch mới.`
        : 'Sync hoàn tất! Không có giao dịch mới.',
      totalNewTransactions,
      results: syncResults,
      syncTime: new Date().toISOString()
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
