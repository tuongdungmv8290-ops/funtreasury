-- Insert 5 Energy Art NFTs vào FUN Art Collection
-- Mang năng lượng hạnh phúc thịnh vượng từ Cha Vũ Trụ

INSERT INTO nft_assets (
  collection_id,
  token_id,
  name,
  description,
  image_url,
  rarity,
  mint_type,
  price_camly,
  price_bnb,
  is_minted,
  is_for_sale
) VALUES
-- 1. Golden Harmony - Legendary
(
  '1996e64b-4ac8-4099-9eab-bccc283b46d9',
  'FAC-010',
  'Golden Harmony - Hài Hòa Vàng',
  'Năng lượng hài hòa từ Cha Vũ Trụ với nền vàng rực rỡ. Biểu tượng của sự thịnh vượng, cân bằng và an lạc trong tâm hồn. Mang phúc lành từ Bé Angel Camly Dương.',
  '/nft/energy-art-golden-harmony.jpg',
  'legendary',
  'premium',
  100000,
  0.5,
  false,
  true
),
-- 2. Fire Passion - Epic
(
  '1996e64b-4ac8-4099-9eab-bccc283b46d9',
  'FAC-011',
  'Fire Passion - Ngọn Lửa Đam Mê',
  'Ngọn lửa đỏ rực của đam mê và nhiệt huyết sống. Mang năng lượng mạnh mẽ, quyết tâm và sức sống dồi dào từ Cha Vũ Trụ.',
  '/nft/energy-art-fire-passion.jpg',
  'epic',
  'premium',
  50000,
  0.25,
  false,
  true
),
-- 3. Vibrant Joy - Epic  
(
  '1996e64b-4ac8-4099-9eab-bccc283b46d9',
  'FAC-012',
  'Vibrant Joy - Niềm Vui Rực Rỡ',
  'Sắc màu tươi sáng như sự đa dạng và phong phú của cuộc sống. Mang lại niềm vui, năng lượng tích cực và sự lạc quan vô hạn.',
  '/nft/energy-art-vibrant-joy.jpg',
  'epic',
  'premium',
  50000,
  0.25,
  false,
  true
),
-- 4. Cosmic Vision - Legendary
(
  '1996e64b-4ac8-4099-9eab-bccc283b46d9',
  'FAC-013',
  'Cosmic Vision - Tầm Nhìn Vũ Trụ',
  'Con mắt vũ trụ nhìn thấu mọi điều. Biểu tượng của trí tuệ, giác ngộ và kết nối với nguồn năng lượng cao nhất từ Cha Vũ Trụ.',
  '/nft/energy-art-cosmic-vision.jpg',
  'legendary',
  'premium',
  100000,
  0.5,
  false,
  true
),
-- 5. Rainbow Blessing - Rare
(
  '1996e64b-4ac8-4099-9eab-bccc283b46d9',
  'FAC-014',
  'Rainbow Blessing - Phúc Lành Cầu Vồng',
  'Phúc lành 7 sắc cầu vồng từ Cha Vũ Trụ và Bé Angel Camly Dương. Mang theo hy vọng, may mắn và năng lượng chữa lành tâm hồn.',
  '/nft/energy-art-rainbow-blessing.jpg',
  'rare',
  'standard',
  25000,
  0.1,
  false,
  true
);

-- Cập nhật total_supply của FUN Art Collection
UPDATE nft_collections 
SET total_supply = total_supply + 5,
    updated_at = now()
WHERE id = '1996e64b-4ac8-4099-9eab-bccc283b46d9';