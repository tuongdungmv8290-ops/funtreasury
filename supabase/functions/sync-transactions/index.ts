import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
  hash: string;
  block_number: string;
  block_timestamp: string;
  from_address: string;
  to_address: string;
  value: string;
}

interface BSCScanTransfer {
  hash: string;
  blockNumber: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  tokenSymbol: string;
  tokenDecimal: string;
  contractAddress: string;
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
    'BNB': '0x38',
    'ETH': '0x1',
    'POLYGON': '0x89',
    'ARB': '0xa4b1',
    'BASE': '0x2105',
  };
  return chainMap[chain] || '0x38';
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

// Fetch ERC20 transfers from Etherscan V2 as fallback (supports multi-chain)
async function fetchFromEtherscanV2(address: string, apiKey: string, chainId: number = 56): Promise<BSCScanTransfer[]> {
  // Etherscan API V2 - chainid=56 for BSC Mainnet, chainid=1 for Ethereum, etc.
  const url = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&page=1&offset=3000&sort=desc&apikey=${apiKey}`;
  console.log(`Calling Etherscan V2 API (chainid=${chainId}) for address: ${address.substring(0, 10)}...`);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === '1' && Array.isArray(data.result)) {
      console.log(`Etherscan V2 returned ${data.result.length} transfers`);
      return data.result;
    }
    console.log(`Etherscan V2 returned status: ${data.status}, message: ${data.message}`);
    return [];
  } catch (error) {
    console.error('Etherscan V2 API error:', error);
    return [];
  }
}

// Get Etherscan chain ID from internal chain name
function getEtherscanChainId(chain: string): number {
  const chainIds: Record<string, number> = {
    'BNB': 56,      // BSC Mainnet
    'ETH': 1,       // Ethereum Mainnet
    'POLYGON': 137, // Polygon Mainnet
    'ARB': 42161,   // Arbitrum One
    'BASE': 8453,   // Base
  };
  return chainIds[chain] || 56;
}

// Convert BSCScan transfer to ERC20Transfer format
function convertBSCScanToERC20(bscTx: BSCScanTransfer): ERC20Transfer {
  return {
    transaction_hash: bscTx.hash,
    block_number: bscTx.blockNumber,
    block_timestamp: new Date(parseInt(bscTx.timeStamp) * 1000).toISOString(),
    from_address: bscTx.from,
    to_address: bscTx.to,
    value: bscTx.value,
    token_symbol: bscTx.tokenSymbol,
    token_address: bscTx.contractAddress,
    token_decimals: bscTx.tokenDecimal,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body for wallet_id filter and force_full_sync flag
    let targetWalletId: string | null = null;
    let forceFullSync = false;
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        targetWalletId = body.wallet_id || null;
        forceFullSync = body.force_full_sync === true;
      } catch {
        // No body or invalid JSON, sync all wallets
      }
    }
    
    console.log('=== Starting Transaction Sync ===');
    if (targetWalletId) {
      console.log(`Target wallet ID: ${targetWalletId}`);
    }
    if (forceFullSync) {
      console.log('Force full sync enabled - will fetch all historical transactions');
    }

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

    // 1. Get Moralis API key
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
      }
      moralisApiKey = apiSettings?.key_value || null;
    }

    // Get Etherscan API key for fallback (supports multi-chain via V2 API)
    const etherscanApiKey = Deno.env.get('ETHERSCAN_API_KEY');
    console.log(`Etherscan API key available: ${etherscanApiKey ? 'yes' : 'no'}`);

    if (!moralisApiKey && !etherscanApiKey) {
      console.error('No API keys found (Moralis or Etherscan)');
      return new Response(JSON.stringify({
        success: false,
        error: 'Chưa cấu hình Moralis hoặc Etherscan API Key. Vui lòng vào Settings để thêm.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Moralis API key: ${moralisApiKey ? 'found' : 'not found'}`);

    // 2. Get wallet addresses from database
    console.log('Fetching wallet addresses...');
    let walletsQuery = supabase.from('wallets').select('id, address, chain, name');
    
    // If target wallet specified, only sync that wallet
    if (targetWalletId) {
      walletsQuery = walletsQuery.eq('id', targetWalletId);
    }
    
    const { data: wallets, error: walletsError } = await walletsQuery;

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
      const errorMsg = targetWalletId 
        ? `Không tìm thấy ví với ID: ${targetWalletId}`
        : 'Chưa có ví nào được cấu hình. Vui lòng thêm ví trong Settings.';
      console.error('No wallets found');
      return new Response(JSON.stringify({
        success: false,
        error: errorMsg
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${wallets.length} wallet(s) to sync`);

    let totalNewTransactions = 0;
    let totalDuplicatesRemoved = 0;
    const syncResults: { wallet: string; newTxCount: number; duplicatesRemoved: number; error?: string; source?: string }[] = [];

    // Check and remove duplicates first
    console.log('Checking for duplicate transactions...');
    const { data: duplicates, error: dupCheckError } = await supabase.rpc('find_duplicate_transactions');
    
    if (!dupCheckError && duplicates && duplicates.length > 0) {
      console.log(`Found ${duplicates.length} duplicate transaction groups`);
      
      for (const dup of duplicates) {
        const { data: dupTxs } = await supabase
          .from('transactions')
          .select('id, created_at')
          .eq('tx_hash', dup.tx_hash)
          .order('created_at', { ascending: true });
        
        if (dupTxs && dupTxs.length > 1) {
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

    // CAMLY contract address for validation
    const CAMLY_CONTRACT = '0x0910320181889fefde0bb1ca63962b0a8882e413';
    // USDT contract on BSC
    const USDT_CONTRACT = '0x55d398326f99059ff775485246999027b3197955';
    
    // Fetch realtime CAMLY price from get-camly-price function
    let camlyPrice = 0.000022; // fallback
    try {
      const priceResponse = await fetch(`${supabaseUrl}/functions/v1/get-camly-price`, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        if (priceData?.data?.price_usd) {
          camlyPrice = priceData.data.price_usd;
          console.log(`Fetched realtime CAMLY price: $${camlyPrice}`);
        }
      }
    } catch (priceError) {
      console.log('Failed to fetch CAMLY price, using fallback:', priceError);
    }
    
    // Token prices for USD value calculation
    const tokenPrices: Record<string, number> = {
      'CAMLY': camlyPrice,
      'BNB': 710,
      'USDT': 1,
      'USDC': 1,
    };

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
        
        // Get last synced block
        const { data: syncStateData } = await supabase
          .from('sync_state')
          .select('last_block_synced, last_cursor')
          .eq('wallet_id', wallet.id)
          .maybeSingle();
        
        // If force_full_sync, ignore last_block_synced and fetch all history
        const lastBlockSynced = forceFullSync ? 0 : (syncStateData?.last_block_synced || 0);
        console.log(`Last synced block for ${wallet.name}: ${lastBlockSynced}${forceFullSync ? ' (force full sync)' : ''}`);

        let erc20Transfers: ERC20Transfer[] = [];
        let usedSource = 'Moralis';
        let moralisQuotaExceeded = false;

        // Try Moralis first
        if (moralisApiKey) {
          const headers = new Headers();
          headers.set('X-API-Key', moralisApiKey.trim());
          headers.set('Accept', 'application/json');

          const fromBlockParam = lastBlockSynced > 0 ? `&from_block=${lastBlockSynced + 1}` : '';
          let erc20Cursor: string | null = null;
          let pageCount = 0;
          const MAX_PAGES = 30;
          
          do {
            const cursorParam = erc20Cursor ? `&cursor=${erc20Cursor}` : '';
            const transfersUrl = `https://deep-index.moralis.io/api/v2.2/${wallet.address}/erc20/transfers?chain=${moralisChain}&limit=100${fromBlockParam}${cursorParam}`;
            console.log(`Calling Moralis ERC20 API (page ${pageCount + 1})`);
            
            const response = await fetch(transfersUrl, {
              method: 'GET',
              headers: headers
            });

            if (response.ok) {
              const data: MoralisResponse = await response.json();
              const pageTransfers = (data.result || []) as ERC20Transfer[];
              erc20Transfers = [...erc20Transfers, ...pageTransfers];
              erc20Cursor = data.cursor || null;
              console.log(`Page ${pageCount + 1}: ${pageTransfers.length} ERC20 transfers`);
            } else if (response.status === 401) {
              console.log('Moralis API quota exceeded (401), switching to BSCScan fallback...');
              moralisQuotaExceeded = true;
              break;
            } else {
              const errorText = await response.text();
              console.error(`Moralis ERC20 API error:`, response.status, errorText);
              moralisQuotaExceeded = true;
              break;
            }
            pageCount++;
          } while (erc20Cursor && pageCount < MAX_PAGES);
        } else {
          moralisQuotaExceeded = true;
        }

        // Fallback to Etherscan V2 if Moralis failed or quota exceeded
        if ((moralisQuotaExceeded || erc20Transfers.length === 0) && etherscanApiKey) {
          const chainId = getEtherscanChainId(wallet.chain);
          console.log(`Using Etherscan V2 fallback for ${wallet.name} (chainid=${chainId})...`);
          usedSource = 'Etherscan V2';
          
          const etherscanTransfers = await fetchFromEtherscanV2(wallet.address, etherscanApiKey, chainId);
          
          // Filter only CAMLY and USDT tokens, then convert to ERC20Transfer format
          erc20Transfers = etherscanTransfers
            .filter(tx => {
              const contractLower = tx.contractAddress?.toLowerCase();
              const symbolUpper = tx.tokenSymbol?.toUpperCase();
              
              // Only keep CAMLY (by contract or symbol) and USDT
              const isCAMLY = contractLower === CAMLY_CONTRACT.toLowerCase() || symbolUpper === 'CAMLY';
              const isUSDT = contractLower === USDT_CONTRACT.toLowerCase() || symbolUpper === 'USDT';
              
              return isCAMLY || isUSDT;
            })
            .map(convertBSCScanToERC20);
          
          console.log(`Etherscan V2 filtered to ${erc20Transfers.length} CAMLY/USDT transactions`);
        }

        console.log(`Total ERC20 transfers for ${wallet.name}: ${erc20Transfers.length} (source: ${usedSource})`);

        if (erc20Transfers.length === 0) {
          console.log(`No transfers found for ${wallet.name}`);
          syncResults.push({ wallet: wallet.name, newTxCount: 0, duplicatesRemoved: 0, source: usedSource });
          continue;
        }

        // 4. Process and upsert transactions - ONLY CAMLY and USDT
        let newTxCount = 0;

        for (const tx of erc20Transfers) {
          if (!tx.transaction_hash) {
            console.log('Skipping tx without hash');
            continue;
          }

          // Determine token symbol - prioritize contract address matching
          let tokenSymbol = tx.token_symbol || 'UNKNOWN';
          const contractLower = tx.token_address?.toLowerCase();
          
          if (contractLower === CAMLY_CONTRACT.toLowerCase()) {
            tokenSymbol = 'CAMLY';
          } else if (contractLower === USDT_CONTRACT.toLowerCase()) {
            tokenSymbol = 'USDT';
          }

          // Filter: only process CAMLY and USDT
          const symbolUpper = tokenSymbol.toUpperCase();
          if (symbolUpper !== 'CAMLY' && symbolUpper !== 'USDT') {
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

          // Skip zero amount transactions and dust USDT (< 1 USDT)
          if (amount <= 0) {
            console.log(`Skipping zero amount tx: ${tx.transaction_hash}`);
            continue;
          }
          
          // Skip dust USDT transactions (< 1 USDT = spam)
          if (symbolUpper === 'USDT' && amount < 1) {
            console.log(`Skipping dust USDT tx: ${amount} USDT`);
            continue;
          }

          // Calculate USD value
          const tokenPrice = tokenPrices[symbolUpper] || 0;
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
            token_symbol: symbolUpper,
            amount: amount,
            usd_value: usdValue,
            gas_fee: 0,
            status: 'success'
          };

          // Check if transaction already exists FOR THIS WALLET (same tx_hash can exist for different wallets)
          const { data: existing } = await supabase
            .from('transactions')
            .select('id')
            .eq('tx_hash', tx.transaction_hash)
            .eq('wallet_id', wallet.id)
            .maybeSingle();

          if (!existing) {
            const { error: insertError } = await supabase
              .from('transactions')
              .insert(transactionData);

            if (insertError) {
              console.error(`Error inserting tx ${tx.transaction_hash}:`, insertError);
            } else {
              newTxCount++;
              console.log(`Inserted ${symbolUpper} tx: ${amount.toLocaleString()} ${symbolUpper}, direction: ${direction}`);
            }
          }
          
          // ============== DUAL-ENTRY LOGIC (ALWAYS CHECK) ==============
          // Check if counterparty is also a tracked wallet in our system
          // If so, create the corresponding IN/OUT entry for that wallet
          // This runs for BOTH new and existing transactions to backfill missing entries
          const counterpartyAddress = direction === 'OUT' ? tx.to_address : tx.from_address;
          const counterpartyWallet = (wallets as WalletData[]).find(w => 
            w.address.toLowerCase() === counterpartyAddress?.toLowerCase() && w.id !== wallet.id
          );

          if (counterpartyWallet) {
            const counterpartyDirection = direction === 'OUT' ? 'IN' : 'OUT';
            
            // Check if counterparty entry already exists
            const { data: existingCounterparty } = await supabase
              .from('transactions')
              .select('id')
              .eq('tx_hash', tx.transaction_hash)
              .eq('wallet_id', counterpartyWallet.id)
              .maybeSingle();
              
            if (!existingCounterparty) {
              // Calculate USD value for counterparty (same as original)
              const counterpartyData = {
                wallet_id: counterpartyWallet.id,
                tx_hash: tx.transaction_hash,
                block_number: parseInt(tx.block_number) || 0,
                timestamp: tx.block_timestamp || new Date().toISOString(),
                from_address: tx.from_address || '',
                to_address: tx.to_address || '',
                direction: counterpartyDirection,
                token_address: tx.token_address || null,
                token_symbol: symbolUpper,
                amount: amount,
                usd_value: amount * (tokenPrices[symbolUpper] || 0),
                gas_fee: 0,
                status: 'success'
              };
              
              const { error: dualError } = await supabase
                .from('transactions')
                .insert(counterpartyData);
                
              if (!dualError) {
                newTxCount++;
                console.log(`  ↳ Created dual-entry for ${counterpartyWallet.name}: ${counterpartyDirection} ${amount.toLocaleString()} ${symbolUpper}`);
              } else {
                console.error(`  ↳ Error creating dual-entry for ${counterpartyWallet.name}:`, dualError);
              }
            }
          }
          // ============== END DUAL-ENTRY LOGIC ==============
        }

        console.log(`Added ${newTxCount} new transactions for ${wallet.name}`);
        syncResults.push({ wallet: wallet.name, newTxCount, duplicatesRemoved: 0, source: usedSource });
        totalNewTransactions += newTxCount;

        // 5. Update sync state
        const maxBlockNumber = Math.max(
          ...erc20Transfers.map(t => parseInt(t.block_number) || 0),
          lastBlockSynced
        );

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

    // ============== BACKFILL DUAL-ENTRY FOR EXISTING TRANSACTIONS ==============
    // This runs ONLY on force full sync to create missing dual-entries
    // for transactions that were synced before dual-entry logic was added
    if (forceFullSync) {
      console.log('=== Backfilling dual-entry for existing transactions ===');
      
      // Get ALL wallets (not just target) to check counterparty relationships
      const { data: allWallets } = await supabase
        .from('wallets')
        .select('id, address, chain, name');
      
      if (allWallets && allWallets.length > 0) {
        // Get all existing transactions
        const { data: existingTxs, error: existingError } = await supabase
          .from('transactions')
          .select('*');
        
        if (!existingError && existingTxs && existingTxs.length > 0) {
          console.log(`Checking ${existingTxs.length} existing transactions for missing dual-entries...`);
          
          let backfillCount = 0;
          
          for (const tx of existingTxs) {
            // Find the counterparty address based on direction
            const counterpartyAddress = tx.direction === 'OUT' ? tx.to_address : tx.from_address;
            
            // Check if counterparty is one of our tracked wallets (but not the same wallet)
            const counterpartyWallet = allWallets.find(w => 
              w.address.toLowerCase() === counterpartyAddress?.toLowerCase() && w.id !== tx.wallet_id
            );
            
            if (counterpartyWallet) {
              // Check if dual-entry already exists
              const { data: existingDual } = await supabase
                .from('transactions')
                .select('id')
                .eq('tx_hash', tx.tx_hash)
                .eq('wallet_id', counterpartyWallet.id)
                .maybeSingle();
              
              if (!existingDual) {
                const counterpartyDirection = tx.direction === 'OUT' ? 'IN' : 'OUT';
                
                const dualEntryData = {
                  wallet_id: counterpartyWallet.id,
                  tx_hash: tx.tx_hash,
                  block_number: tx.block_number,
                  timestamp: tx.timestamp,
                  from_address: tx.from_address,
                  to_address: tx.to_address,
                  direction: counterpartyDirection,
                  token_address: tx.token_address,
                  token_symbol: tx.token_symbol,
                  amount: tx.amount,
                  usd_value: tx.usd_value,
                  gas_fee: 0,
                  status: 'success'
                };
                
                const { error: dualError } = await supabase
                  .from('transactions')
                  .insert(dualEntryData);
                
                if (!dualError) {
                  backfillCount++;
                  console.log(`  ↳ Backfilled: ${tx.token_symbol} ${counterpartyDirection} ${tx.amount.toLocaleString()} for ${counterpartyWallet.name}`);
                } else {
                  console.error(`  ↳ Error backfilling for ${counterpartyWallet.name}:`, dualError);
                }
              }
            }
          }
          
          console.log(`=== Backfill complete: Created ${backfillCount} dual-entry transactions ===`);
          totalNewTransactions += backfillCount;
        }
      }
    }
    // ============== END BACKFILL DUAL-ENTRY ==============

    // 6. Clean up: Delete spam tokens, zero-amount, and dust USDT transactions
    console.log('Cleaning up spam transactions...');
    
    // Delete zero amount transactions
    const { error: zeroError } = await supabase
      .from('transactions')
      .delete()
      .eq('amount', 0);
    
    if (!zeroError) {
      console.log('Deleted zero amount transactions');
    }
    
    // Delete dust USDT transactions (< 1 USDT = spam)
    const { error: dustError } = await supabase
      .from('transactions')
      .delete()
      .eq('token_symbol', 'USDT')
      .lt('amount', 1);
    
    if (!dustError) {
      console.log('Deleted dust USDT transactions (< 1 USDT)');
    }
    
    // Delete non-CAMLY/USDT tokens
    const { error: spamError } = await supabase
      .from('transactions')
      .delete()
      .not('token_symbol', 'in', '("CAMLY","USDT")');
    
    if (!spamError) {
      console.log('Deleted spam token transactions');
    }

    console.log(`=== Sync Complete: ${totalNewTransactions} new transactions, ${totalDuplicatesRemoved} cleaned up ===`);

    // Auto-refresh token balances from blockchain after syncing transactions
    console.log('Auto-refreshing token balances from blockchain...');
    try {
      const balanceResponse = await fetch(`${supabaseUrl}/functions/v1/get-token-balances`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });
      
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        console.log('Token balances refreshed successfully:', balanceData?.message || 'OK');
      } else {
        console.log('Warning: Could not refresh balances, status:', balanceResponse.status);
      }
    } catch (balanceError) {
      console.log('Warning: Error refreshing balances:', balanceError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: totalNewTransactions > 0 || totalDuplicatesRemoved > 0
        ? `Sync thành công! Đã thêm ${totalNewTransactions} tx mới, xóa ${totalDuplicatesRemoved} tx dư.`
        : 'Sync hoàn tất! Không có giao dịch mới.',
      totalNewTransactions,
      totalDuplicatesRemoved,
      balancesRefreshed: true,
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
