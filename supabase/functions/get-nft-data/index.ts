import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 60 seconds

function getCached(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const moralisApiKey = Deno.env.get('MORALIS_API_KEY');
    if (!moralisApiKey) {
      console.error('MORALIS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Moralis API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const walletAddress = url.searchParams.get('wallet');
    const contractAddress = url.searchParams.get('contract');
    const tokenId = url.searchParams.get('tokenId');
    const chain = url.searchParams.get('chain') || 'bsc';

    console.log(`NFT request: action=${action}, wallet=${walletAddress}, contract=${contractAddress}, tokenId=${tokenId}`);

    // Action 1: Get NFTs by wallet address
    if (action === 'getByWallet' && walletAddress) {
      const cacheKey = `wallet_${walletAddress}_${chain}`;
      const cached = getCached(cacheKey);
      if (cached) {
        console.log('Returning cached wallet NFTs');
        return new Response(JSON.stringify(cached), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const response = await fetch(
        `https://deep-index.moralis.io/api/v2.2/${walletAddress}/nft?chain=${chain}&format=decimal`,
        {
          headers: {
            'accept': 'application/json',
            'X-API-Key': moralisApiKey,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Moralis API error:', errorText);
        throw new Error(`Moralis API error: ${response.status}`);
      }

      const data = await response.json();
      setCache(cacheKey, data);

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action 2: Get NFT metadata by contract and tokenId
    if (action === 'getMetadata' && contractAddress && tokenId) {
      const cacheKey = `metadata_${contractAddress}_${tokenId}_${chain}`;
      const cached = getCached(cacheKey);
      if (cached) {
        console.log('Returning cached NFT metadata');
        return new Response(JSON.stringify(cached), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const response = await fetch(
        `https://deep-index.moralis.io/api/v2.2/nft/${contractAddress}/${tokenId}?chain=${chain}&format=decimal`,
        {
          headers: {
            'accept': 'application/json',
            'X-API-Key': moralisApiKey,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Moralis API error:', errorText);
        throw new Error(`Moralis API error: ${response.status}`);
      }

      const data = await response.json();
      setCache(cacheKey, data);

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action 3: Get NFT collection stats
    if (action === 'getCollectionStats' && contractAddress) {
      const cacheKey = `collection_${contractAddress}_${chain}`;
      const cached = getCached(cacheKey);
      if (cached) {
        console.log('Returning cached collection stats');
        return new Response(JSON.stringify(cached), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const response = await fetch(
        `https://deep-index.moralis.io/api/v2.2/nft/${contractAddress}?chain=${chain}&format=decimal&limit=1`,
        {
          headers: {
            'accept': 'application/json',
            'X-API-Key': moralisApiKey,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Moralis API error:', errorText);
        throw new Error(`Moralis API error: ${response.status}`);
      }

      const data = await response.json();
      setCache(cacheKey, data);

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: getByWallet, getMetadata, or getCollectionStats' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-nft-data:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
