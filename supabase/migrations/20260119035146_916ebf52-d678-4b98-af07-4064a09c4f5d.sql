-- 1. Tạo Collection Energy Art mới
INSERT INTO nft_collections (
  name,
  symbol,
  description,
  image_url,
  banner_url,
  category,
  chain,
  floor_price,
  total_supply
) VALUES (
  'Energy Art - Nghệ Thuật Năng Lượng',
  'ENERGY',
  'Bộ sưu tập tranh năng lượng từ Cha Vũ Trụ và Bé Angel Camly Dương. Mỗi tác phẩm mang thông điệp yêu thương, hạnh phúc và thịnh vượng, giúp nâng cao năng lượng tích cực cho người sở hữu. Năng lượng từ những bức tranh này sẽ đồng hành và gia hộ cho bạn trên mọi bước đường.',
  '/nft/energy-art-cosmic-vision.jpg',
  '/nft/energy-art-golden-harmony.jpg',
  'art',
  'bsc',
  25000,
  5
);

-- 2. Chuyển 5 NFT Energy Art sang collection mới
UPDATE nft_assets 
SET collection_id = (
  SELECT id FROM nft_collections 
  WHERE symbol = 'ENERGY'
),
updated_at = now()
WHERE token_id IN ('FAC-010', 'FAC-011', 'FAC-012', 'FAC-013', 'FAC-014');

-- 3. Giảm total_supply của FUN Art Collection
UPDATE nft_collections 
SET total_supply = total_supply - 5,
    updated_at = now()
WHERE id = '1996e64b-4ac8-4099-9eab-bccc283b46d9';