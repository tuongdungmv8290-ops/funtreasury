import { useState } from 'react';
import { Image, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNFTCollection, NFTCategory, NFTRarity, SortOption } from '@/hooks/useNFTCollection';
import { NFTStatsCards } from '@/components/nft/NFTStatsCards';
import { NFTFilters } from '@/components/nft/NFTFilters';
import { NFTCard } from '@/components/nft/NFTCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ViewOnlyWatermark } from '@/components/ViewOnlyWatermark';
import { useViewMode } from '@/contexts/ViewModeContext';

export default function NFTGallery() {
  const { t } = useTranslation();
  const { isViewOnly } = useViewMode();
  
  // Filter states
  const [category, setCategory] = useState<NFTCategory>('all');
  const [rarity, setRarity] = useState<NFTRarity>('all');
  const [sort, setSort] = useState<SortOption>('newest');
  const [search, setSearch] = useState('');

  const { assets, collections, isLoading, stats } = useNFTCollection({
    category,
    rarity,
    sort,
    search,
  });

  return (
    <div className="min-h-screen">
      {/* View Only Watermark */}
      {isViewOnly && <ViewOnlyWatermark />}

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl mb-8 bg-gradient-to-br from-primary/20 via-background to-primary/10 border border-primary/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        
        <div className="relative px-8 py-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 rounded-2xl bg-primary/20 backdrop-blur-sm">
              <Image className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-heading font-bold gold-text flex items-center gap-3">
                {t('nft.title')}
                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              </h1>
              <p className="text-muted-foreground text-lg mt-1">
                {t('nft.subtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8">
        <NFTStatsCards
          totalNfts={stats.totalNfts}
          totalCollections={stats.totalCollections}
          floorPrice={stats.floorPrice}
          rarityBreakdown={stats.rarityBreakdown}
        />
      </div>

      {/* Filters */}
      <div className="mb-8">
        <NFTFilters
          category={category}
          rarity={rarity}
          sort={sort}
          search={search}
          onCategoryChange={setCategory}
          onRarityChange={setRarity}
          onSortChange={setSort}
          onSearchChange={setSearch}
        />
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-muted-foreground">
        {t('nft.showingNfts', { count: assets.length })}
      </div>

      {/* NFT Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-20">
          <Image className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold text-muted-foreground">
            {t('nft.noNfts')}
          </h3>
          <p className="text-sm text-muted-foreground/70 mt-2">
            {t('nft.noNftsDesc')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {assets.map((asset) => (
            <NFTCard key={asset.id} asset={asset} />
          ))}
        </div>
      )}

      {/* Collections Section */}
      {collections.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-heading font-bold mb-6 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            {t('nft.featuredCollections')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.slice(0, 3).map((collection) => (
              <div
                key={collection.id}
                className="group relative overflow-hidden rounded-xl bg-card/50 border border-border/50 hover:border-primary/50 transition-all duration-300"
              >
                {/* Banner */}
                <div className="h-32 bg-gradient-to-br from-primary/30 to-primary/10">
                  {collection.banner_url && (
                    <img
                      src={collection.banner_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                
                {/* Collection Image */}
                <div className="absolute top-20 left-4 w-24 h-24 rounded-xl overflow-hidden border-4 border-background bg-muted">
                  {collection.image_url ? (
                    <img
                      src={collection.image_url}
                      alt={collection.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <span className="text-2xl font-bold text-primary/30">
                        {collection.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="pt-16 px-4 pb-4">
                  <h3 className="font-heading font-bold text-lg group-hover:text-primary transition-colors">
                    {collection.name}
                  </h3>
                  {collection.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {collection.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="text-muted-foreground">
                      {collection.total_supply} {t('nft.items')}
                    </span>
                    <span className="text-primary font-semibold">
                      {t('nft.floor')}: {collection.floor_price === 0 ? t('nft.free') : `${collection.floor_price} CAMLY`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
