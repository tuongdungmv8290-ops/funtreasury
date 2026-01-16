import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { NFTCategory, NFTRarity, SortOption } from '@/hooks/useNFTCollection';

interface NFTFiltersProps {
  category?: NFTCategory;
  rarity: NFTRarity;
  sort: SortOption;
  search: string;
  onCategoryChange?: (value: NFTCategory) => void;
  onRarityChange: (value: NFTRarity) => void;
  onSortChange: (value: SortOption) => void;
  onSearchChange: (value: string) => void;
  hideCategory?: boolean;
}

export function NFTFilters({
  category = 'all',
  rarity,
  sort,
  search,
  onCategoryChange,
  onRarityChange,
  onSortChange,
  onSearchChange,
  hideCategory = false,
}: NFTFiltersProps) {
  const { t } = useTranslation();

  const categories = [
    { value: 'all', label: t('nft.allCategories') },
    { value: 'mantra', label: t('nft.mantra') },
    { value: 'membership', label: t('nft.membership') },
    { value: 'art', label: t('nft.art') },
    { value: 'certificate', label: t('nft.certificate') },
  ];

  const rarities = [
    { value: 'all', label: t('common.all') },
    { value: 'common', label: t('nft.common') },
    { value: 'rare', label: t('nft.rare') },
    { value: 'epic', label: t('nft.epic') },
    { value: 'legendary', label: t('nft.legendary') },
  ];

  const sortOptions = [
    { value: 'newest', label: t('nft.sortNewest') },
    { value: 'oldest', label: t('nft.sortOldest') },
    { value: 'price_low', label: t('nft.sortPriceLow') },
    { value: 'price_high', label: t('nft.sortPriceHigh') },
    { value: 'name_asc', label: t('nft.sortNameAsc') },
    { value: 'name_desc', label: t('nft.sortNameDesc') },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('nft.searchPlaceholder')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
        />
      </div>

      {/* Category Filter */}
      {!hideCategory && onCategoryChange && (
        <Select value={category} onValueChange={(v) => onCategoryChange(v as NFTCategory)}>
          <SelectTrigger className="w-full md:w-40 bg-background/50 border-border/50">
            <SelectValue placeholder={t('nft.category')} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Rarity Filter */}
      <Select value={rarity} onValueChange={(v) => onRarityChange(v as NFTRarity)}>
        <SelectTrigger className="w-full md:w-36 bg-background/50 border-border/50">
          <SelectValue placeholder={t('nft.rarity')} />
        </SelectTrigger>
        <SelectContent>
          {rarities.map((r) => (
            <SelectItem key={r.value} value={r.value}>
              {r.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
        <SelectTrigger className="w-full md:w-44 bg-background/50 border-border/50">
          <SelectValue placeholder={t('nft.sort')} />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
