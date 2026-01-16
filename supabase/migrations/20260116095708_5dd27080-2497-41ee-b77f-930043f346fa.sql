-- =============================================
-- NFT COLLECTIONS TABLE
-- =============================================
CREATE TABLE public.nft_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  symbol TEXT,
  image_url TEXT,
  banner_url TEXT,
  contract_address TEXT,
  chain TEXT NOT NULL DEFAULT 'bsc',
  total_supply INTEGER NOT NULL DEFAULT 0,
  floor_price DECIMAL NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'art',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- NFT ASSETS TABLE
-- =============================================
CREATE TABLE public.nft_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES public.nft_collections(id) ON DELETE CASCADE,
  token_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  metadata_url TEXT,
  rarity TEXT NOT NULL DEFAULT 'common',
  owner_address TEXT,
  mint_type TEXT NOT NULL DEFAULT 'free',
  price_camly DECIMAL NOT NULL DEFAULT 0,
  price_bnb DECIMAL NOT NULL DEFAULT 0,
  is_minted BOOLEAN NOT NULL DEFAULT FALSE,
  is_for_sale BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.nft_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_assets ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - PUBLIC READ (như wallets, transactions)
-- =============================================
CREATE POLICY "Public can view nft_collections" 
  ON public.nft_collections 
  FOR SELECT 
  USING (true);

CREATE POLICY "Public can view nft_assets" 
  ON public.nft_assets 
  FOR SELECT 
  USING (true);

-- =============================================
-- RLS POLICIES - ADMIN WRITE (dùng has_role function đã có)
-- =============================================
CREATE POLICY "Admins can manage nft_collections" 
  ON public.nft_collections 
  FOR ALL 
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can manage nft_assets" 
  ON public.nft_assets 
  FOR ALL 
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE TRIGGER update_nft_collections_updated_at
  BEFORE UPDATE ON public.nft_collections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nft_assets_updated_at
  BEFORE UPDATE ON public.nft_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();