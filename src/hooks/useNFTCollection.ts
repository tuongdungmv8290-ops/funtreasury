import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NFTCollection {
  id: string;
  name: string;
  description: string | null;
  symbol: string | null;
  image_url: string | null;
  banner_url: string | null;
  contract_address: string | null;
  chain: string;
  total_supply: number;
  floor_price: number;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface NFTAsset {
  id: string;
  collection_id: string | null;
  token_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  metadata_url: string | null;
  rarity: string;
  owner_address: string | null;
  mint_type: string;
  price_camly: number;
  price_bnb: number;
  is_minted: boolean;
  is_for_sale: boolean;
  created_at: string;
  updated_at: string;
  collection?: NFTCollection;
}

export type NFTCategory = 'all' | 'mantra' | 'membership' | 'art' | 'certificate';
export type NFTRarity = 'all' | 'common' | 'rare' | 'epic' | 'legendary';
export type SortOption = 'newest' | 'oldest' | 'price_low' | 'price_high' | 'name_asc' | 'name_desc';

interface UseNFTCollectionOptions {
  category?: NFTCategory;
  rarity?: NFTRarity;
  search?: string;
  sort?: SortOption;
  collectionId?: string;
}

export function useNFTCollection(options: UseNFTCollectionOptions = {}) {
  const { category = 'all', rarity = 'all', search = '', sort = 'newest', collectionId } = options;
  
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const [assets, setAssets] = useState<NFTAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch collections
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        let query = supabase.from('nft_collections').select('*');
        
        if (category !== 'all') {
          query = query.eq('category', category);
        }
        
        const { data, error: fetchError } = await query.order('created_at', { ascending: false });
        
        if (fetchError) throw fetchError;
        setCollections(data || []);
      } catch (err) {
        console.error('Error fetching NFT collections:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch collections');
      }
    };

    fetchCollections();
  }, [category]);

  // Fetch assets
  useEffect(() => {
    const fetchAssets = async () => {
      setIsLoading(true);
      try {
        let query = supabase.from('nft_assets').select('*');
        
        if (collectionId) {
          query = query.eq('collection_id', collectionId);
        }
        
        if (rarity !== 'all') {
          query = query.eq('rarity', rarity);
        }
        
        const { data, error: fetchError } = await query;
        
        if (fetchError) throw fetchError;
        
        // Join with collections data
        const assetsWithCollection = (data || []).map(asset => ({
          ...asset,
          collection: collections.find(c => c.id === asset.collection_id)
        }));
        
        setAssets(assetsWithCollection);
      } catch (err) {
        console.error('Error fetching NFT assets:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch assets');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssets();
  }, [collectionId, rarity, collections]);

  // Filter and sort assets
  const filteredAssets = useMemo(() => {
    let result = [...assets];
    
    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(asset => 
        asset.name.toLowerCase().includes(searchLower) ||
        asset.description?.toLowerCase().includes(searchLower) ||
        asset.collection?.name.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by category (through collection)
    if (category !== 'all') {
      result = result.filter(asset => asset.collection?.category === category);
    }
    
    // Sort
    switch (sort) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'price_low':
        result.sort((a, b) => a.price_camly - b.price_camly);
        break;
      case 'price_high':
        result.sort((a, b) => b.price_camly - a.price_camly);
        break;
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }
    
    return result;
  }, [assets, search, category, sort]);

  // Statistics
  const stats = useMemo(() => ({
    totalNfts: assets.length,
    totalCollections: collections.length,
    floorPrice: collections.reduce((min, c) => c.floor_price < min ? c.floor_price : min, Infinity) || 0,
    totalValue: assets.reduce((sum, a) => sum + a.price_camly, 0),
    rarityBreakdown: {
      common: assets.filter(a => a.rarity === 'common').length,
      rare: assets.filter(a => a.rarity === 'rare').length,
      epic: assets.filter(a => a.rarity === 'epic').length,
      legendary: assets.filter(a => a.rarity === 'legendary').length,
    }
  }), [assets, collections]);

  return {
    collections,
    assets: filteredAssets,
    isLoading,
    error,
    stats,
  };
}
