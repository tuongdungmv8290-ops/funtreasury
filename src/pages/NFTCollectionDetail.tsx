import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Image, Sparkles, Grid3X3, List, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { NFTCollection, NFTAsset, NFTRarity, SortOption } from '@/hooks/useNFTCollection';
import { NFTCard } from '@/components/nft/NFTCard';
import { NFTListCard } from '@/components/nft/NFTListCard';
import { NFTFilters } from '@/components/nft/NFTFilters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { ViewOnlyWatermark } from '@/components/ViewOnlyWatermark';
import { useViewMode } from '@/contexts/ViewModeContext';

export default function NFTCollectionDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isViewOnly } = useViewMode();

  const [collection, setCollection] = useState<NFTCollection | null>(null);
  const [assets, setAssets] = useState<NFTAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filter states
  const [rarity, setRarity] = useState<NFTRarity>('all');
  const [sort, setSort] = useState<SortOption>('newest');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCollectionData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        // Fetch collection
        const { data: collectionData, error: collectionError } = await supabase
          .from('nft_collections')
          .select('*')
          .eq('id', id)
          .single();
        
        if (collectionError) throw collectionError;
        setCollection(collectionData);

        // Fetch assets
        let query = supabase.from('nft_assets').select('*').eq('collection_id', id);
        
        if (rarity !== 'all') {
          query = query.eq('rarity', rarity);
        }
        
        const { data: assetsData, error: assetsError } = await query;
        
        if (assetsError) throw assetsError;
        
        // Add collection to each asset
        const assetsWithCollection = (assetsData || []).map(asset => ({
          ...asset,
          collection: collectionData
        }));
        
        setAssets(assetsWithCollection);
      } catch (err) {
        console.error('Error fetching collection:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollectionData();
  }, [id, rarity]);

  // Filter and sort assets
  const filteredAssets = assets
    .filter(asset => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        asset.name.toLowerCase().includes(searchLower) ||
        asset.description?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      switch (sort) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'price_low':
          return a.price_camly - b.price_camly;
        case 'price_high':
          return b.price_camly - a.price_camly;
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

  const stats = {
    total: assets.length,
    minted: assets.filter(a => a.is_minted).length,
    forSale: assets.filter(a => a.is_for_sale).length,
    legendary: assets.filter(a => a.rarity === 'legendary').length,
    epic: assets.filter(a => a.rarity === 'epic').length,
    rare: assets.filter(a => a.rarity === 'rare').length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Skeleton className="h-64 w-full rounded-xl mb-8" />
        <div className="flex gap-4 mb-8">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Image className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Collection Not Found</h2>
          <Button onClick={() => navigate('/nft')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Gallery
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {isViewOnly && <ViewOnlyWatermark />}

      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/nft')}
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('nft.title')}
      </Button>

      {/* Banner */}
      <div className="relative h-64 rounded-2xl overflow-hidden mb-8 bg-gradient-to-br from-primary/30 via-primary/10 to-background border border-primary/20">
        {collection.banner_url ? (
          <img
            src={collection.banner_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

        {/* Collection Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end gap-6">
          {/* Collection Image */}
          <div className="w-32 h-32 rounded-xl overflow-hidden border-4 border-background bg-muted shrink-0 shadow-2xl">
            {collection.image_url ? (
              <img
                src={collection.image_url}
                alt={collection.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <span className="text-4xl font-bold text-primary/30">
                  {collection.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Collection Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-heading font-bold gold-text truncate">
                {collection.name}
              </h1>
              {collection.symbol && (
                <Badge variant="outline" className="shrink-0">
                  {collection.symbol}
                </Badge>
              )}
            </div>
            {collection.description && (
              <p className="text-muted-foreground line-clamp-2 mb-3">
                {collection.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{stats.total}</span> {t('nft.items')}
              </span>
              <span className="text-muted-foreground">
                {t('nft.floor')}: <span className="font-semibold text-primary">
                  {collection.floor_price === 0 ? t('nft.free') : `${collection.floor_price} CAMLY`}
                </span>
              </span>
              <Badge variant="outline" className="capitalize">
                {collection.chain}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <Card className="p-4 bg-card/50 border-border/50">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card className="p-4 bg-card/50 border-border/50">
          <p className="text-sm text-muted-foreground">{t('nft.minted')}</p>
          <p className="text-2xl font-bold text-green-500">{stats.minted}</p>
        </Card>
        <Card className="p-4 bg-card/50 border-border/50">
          <p className="text-sm text-muted-foreground">{t('nft.forSale')}</p>
          <p className="text-2xl font-bold text-primary">{stats.forSale}</p>
        </Card>
        <Card className="p-4 bg-card/50 border-border/50 border-amber-500/30">
          <p className="text-sm text-muted-foreground">{t('nft.legendary')}</p>
          <p className="text-2xl font-bold text-amber-500">{stats.legendary}</p>
        </Card>
        <Card className="p-4 bg-card/50 border-border/50 border-purple-500/30">
          <p className="text-sm text-muted-foreground">{t('nft.epic')}</p>
          <p className="text-2xl font-bold text-purple-500">{stats.epic}</p>
        </Card>
        <Card className="p-4 bg-card/50 border-border/50 border-blue-500/30">
          <p className="text-sm text-muted-foreground">{t('nft.rare')}</p>
          <p className="text-2xl font-bold text-blue-500">{stats.rare}</p>
        </Card>
      </div>

      {/* Filters with View Toggle */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1">
          <NFTFilters
            rarity={rarity}
            sort={sort}
            search={search}
            onRarityChange={setRarity}
            onSortChange={setSort}
            onSearchChange={setSearch}
            hideCategory
          />
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-muted-foreground">
        {t('nft.showingNfts', { count: filteredAssets.length })}
      </div>

      {/* NFT Grid/List */}
      {filteredAssets.length === 0 ? (
        <div className="text-center py-20">
          <Image className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold text-muted-foreground">
            {t('nft.noNfts')}
          </h3>
          <p className="text-sm text-muted-foreground/70 mt-2">
            {t('nft.noNftsDesc')}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAssets.map((asset) => (
            <NFTCard key={asset.id} asset={asset} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssets.map((asset) => (
            <NFTListCard key={asset.id} asset={asset} />
          ))}
        </div>
      )}
    </div>
  );
}
