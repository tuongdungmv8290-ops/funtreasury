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

interface SyncState {
  wallet_id: string;
  last_block_synced: number;
  last_sync_at: string | null;
  last_cursor: string | null;
}

interface MoralisResponse {
  result: ERC20Transfer[] | NativeTransfer[];
  cursor?: string | null;
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

    // Create Supabase client with service role for data operations
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
    let totalDuplicatesRemoved = 0;
    const syncResults: { wallet: string; newTxCount: number; duplicatesRemoved: number; error?: string }[] = [];

    // Check and remove duplicates first
    console.log('Checking for duplicate transactions...');
    const { data: duplicates, error: dupCheckError } = await supabase.rpc('find_duplicate_transactions');
    
    if (!dupCheckError && duplicates && duplicates.length > 0) {
      console.log(`Found ${duplicates.length} duplicate transaction groups`);
      
      // For each duplicate group, keep the oldest and delete the rest
      for (const dup of duplicates) {
        const { data: dupTxs } = await supabase
          .from('transactions')
          .select('id, created_at')
          .eq('tx_hash', dup.tx_hash)
          .order('created_at', { ascending: true });
        
        if (dupTxs && dupTxs.length > 1) {
          // Keep first (oldest), delete the rest
          const idsToDelete = dupTxs.slice(1).map(t => t.id);
          const { error: deleteError } = await supabase
            .from('transactions')
            .delete()
            .in('id', idsToDelete);
          
          if (!deleteError) {
            totalDuplicatesRemoved += idsToDelete.length;
            console.log(`Removed ${idsToDelete.length} duplicates for tx_hash: ${dup.tx_hash}`);
          }
        }
      }
    }
    console.log(`Total duplicates removed: ${totalDuplicatesRemoved}`);

    // 3. Sync each wallet
    for (const wallet of wallets as WalletData[]) {
      if (!wallet.address || !wallet.address.startsWith('0x')) {
        console.log(`Skipping wallet ${wallet.name}: invalid address`);
        syncResults.push({ wallet: wallet.name, newTxCount: 0, duplicatesRemoved: 0, error: 'Invalid address' });
        continue;
      }

      console.log(`Syncing wallet: ${wallet.name} (${wallet.address})`);
      
      try {
        const moralisChain = getMoralisChain(wallet.chain);
        const nativeSymbol = getNativeSymbol(wallet.chain);
        
        // Get last synced block and cursor for incremental sync
        const { data: syncStateData } = await supabase
          .from('sync_state')
          .select('last_block_synced, last_cursor')
          .eq('wallet_id', wallet.id)
          .maybeSingle();
        
        const lastBlockSynced = syncStateData?.last_block_synced || 0;
        console.log(`Last synced block for ${wallet.name}: ${lastBlockSynced}`);
        
        const headers = new Headers();
        headers.set('X-API-Key', moralisApiKey.trim());
        headers.set('Accept', 'application/json');

        // Fetch token contracts from database for proper symbol mapping
        const { data: tokenContracts } = await supabase
          .from('token_contracts')
          .select('contract_address, symbol');
        
        // Build token contract address to symbol map - start with hardcoded CAMLY
        const tokenContractsMap: Record<string, string> = {
          '0x0910320181889fefde0bb1ca63962b0a8882e413': 'CAMLY', // CAMLY contract on BSC
        };
        if (tokenContracts) {
          for (const tc of tokenContracts) {
            if (tc.contract_address) {
              tokenContractsMap[tc.contract_address.toLowerCase()] = tc.symbol;
            }
          }
        }
        console.log(`Token contracts map: ${JSON.stringify(tokenContractsMap)}`);

        // Token prices for USD value calculation
        const tokenPrices: Record<string, number> = {
          'CAMLY': 0.000022,
          'BNB': 710,
          'USDT': 1,
          'USDC': 1,
          'BTCB': 97000,
          'BTC': 97000,
          'ETH': 3500,
          'MATIC': 0.5,
          'FUN': 0.01,
        };

        // Fetch ERC20 token transfers with from_block for incremental sync
        // Use pagination with cursor - loop until no more results
        const fromBlockParam = lastBlockSynced > 0 ? `&from_block=${lastBlockSynced + 1}` : '';
        let erc20Transfers: ERC20Transfer[] = [];
        let erc20Cursor: string | null = null;
        let pageCount = 0;
        const MAX_PAGES = 30; // Increased: 30 pages x 100 = 3,000 transactions max per sync
        
        do {
          const cursorParam = erc20Cursor ? `&cursor=${erc20Cursor}` : '';
          // Moralis free tier limit is 100 per request
          const transfersUrl = `https://deep-index.moralis.io/api/v2.2/${wallet.address}/erc20/transfers?chain=${moralisChain}&limit=100${fromBlockParam}${cursorParam}`;
          console.log(`Calling Moralis ERC20 API (page ${pageCount + 1}): ${transfersUrl}`);
          
          const response = await fetch(transfersUrl, {
            method: 'GET',
            headers: headers
          });

          if (response.ok) {
            const data: MoralisResponse = await response.json();
            const pageTransfers = (data.result || []) as ERC20Transfer[];
            erc20Transfers = [...erc20Transfers, ...pageTransfers];
            erc20Cursor = data.cursor || null;
            console.log(`Page ${pageCount + 1}: ${pageTransfers.length} ERC20 transfers, cursor: ${erc20Cursor ? 'yes' : 'no'}`);
          } else {
            const errorText = await response.text();
            console.error(`Moralis ERC20 API error for ${wallet.name}:`, response.status, errorText);
            break;
          }
          pageCount++;
        } while (erc20Cursor && pageCount < MAX_PAGES);
        
        console.log(`Total ERC20 transfers for ${wallet.name}: ${erc20Transfers.length}`);

        // Fetch native token (BNB/ETH) transfers with pagination
        let nativeTransfers: NativeTransfer[] = [];
        let nativeCursor: string | null = null;
        pageCount = 0;
        
        do {
          const cursorParam = nativeCursor ? `&cursor=${nativeCursor}` : '';
          // Moralis free tier limit is 100 per request
          const nativeUrl = `https://deep-index.moralis.io/api/v2.2/${wallet.address}?chain=${moralisChain}&limit=100${fromBlockParam}${cursorParam}`;
          console.log(`Calling Moralis Native API (page ${pageCount + 1}): ${nativeUrl}`);
          
          const nativeResponse = await fetch(nativeUrl, {
            method: 'GET',
            headers: headers
          });

          if (nativeResponse.ok) {
            const nativeData: MoralisResponse = await nativeResponse.json();
            // Filter only transactions with value (native token transfers)
            const pageTransfers = ((nativeData.result || []) as NativeTransfer[]).filter((tx: NativeTransfer) => 
              tx.value && tx.value !== '0' && tx.hash
            );
            nativeTransfers = [...nativeTransfers, ...pageTransfers];
            nativeCursor = nativeData.cursor || null;
            console.log(`Page ${pageCount + 1}: ${pageTransfers.length} native transfers, cursor: ${nativeCursor ? 'yes' : 'no'}`);
          } else {
            console.error(`Moralis Native API error for ${wallet.name}:`, nativeResponse.status);
            break;
          }
          pageCount++;
        } while (nativeCursor && pageCount < MAX_PAGES);
        
        console.log(`Total native transfers for ${wallet.name}: ${nativeTransfers.length}`);

        if (erc20Transfers.length === 0 && nativeTransfers.length === 0) {
          console.log(`No new transfers found for ${wallet.name}`);
          syncResults.push({ wallet: wallet.name, newTxCount: 0, duplicatesRemoved: 0 });
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

          // Map token symbol from token_contracts if available
          let tokenSymbol = tx.token_symbol || 'UNKNOWN';
          if (tx.token_address) {
            const mappedSymbol = tokenContractsMap[tx.token_address.toLowerCase()];
            if (mappedSymbol) {
              tokenSymbol = mappedSymbol;
              console.log(`Mapped token ${tx.token_address} to ${mappedSymbol}`);
            }
          }

          // Calculate USD value based on token price
          const tokenPrice = tokenPrices[tokenSymbol.toUpperCase()] || 0;
          const usdValue = amount * tokenPrice;

          const transactionData = {
            wallet_id: wallet.id,
            tx_hash: tx.transaction_hash,
            block_number: parseInt(tx.block_number) || 0,
            timestamp: tx.block_timestamp || new Date().toISOString(),
            from_address: tx.from_address || '',
            to_address: tx.to_address || '',
            direction: direction,
            token_address: tx.token_address || null,
            token_symbol: tokenSymbol,
            amount: amount,
            usd_value: usdValue,
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

          // Calculate USD value for native token
          const nativePrice = tokenPrices[nativeSymbol.toUpperCase()] || 0;
          const nativeUsdValue = amount * nativePrice;

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
            usd_value: nativeUsdValue,
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
        syncResults.push({ wallet: wallet.name, newTxCount, duplicatesRemoved: 0 });
        totalNewTransactions += newTxCount;

        // 5. Update sync state with new max block
        const maxBlockNumber = Math.max(
          ...erc20Transfers.map(t => parseInt(t.block_number) || 0),
          ...nativeTransfers.map(t => parseInt(t.block_number) || 0),
          lastBlockSynced // Keep existing block if no new transactions
        );

        // Only update if we have a higher block number
        if (maxBlockNumber > lastBlockSynced) {
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
          } else {
            console.log(`Updated last_block_synced for ${wallet.name}: ${lastBlockSynced} → ${maxBlockNumber}`);
          }
        } else {
          // Just update last_sync_at
          await supabase
            .from('sync_state')
            .upsert({
              wallet_id: wallet.id,
              last_sync_at: new Date().toISOString(),
              sync_status: 'idle',
              last_block_synced: lastBlockSynced
            }, {
              onConflict: 'wallet_id'
            });
        }

      } catch (walletError) {
        console.error(`Error syncing wallet ${wallet.name}:`, walletError);
        syncResults.push({ 
          wallet: wallet.name, 
          newTxCount: 0, 
          duplicatesRemoved: 0,
          error: walletError instanceof Error ? walletError.message : 'Unknown error' 
        });
      }
    }

    console.log(`=== Sync Complete: ${totalNewTransactions} new transactions, ${totalDuplicatesRemoved} duplicates removed ===`);

    return new Response(JSON.stringify({
      success: true,
      message: totalNewTransactions > 0 || totalDuplicatesRemoved > 0
        ? `Sync thành công! Đã thêm ${totalNewTransactions} tx mới, xóa ${totalDuplicatesRemoved} tx dư.`
        : 'Sync hoàn tất! Không có giao dịch mới.',
      totalNewTransactions,
      totalDuplicatesRemoved,
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
