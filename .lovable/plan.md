

# Dot 1: He Thong Tang Thuong FUN Rewards - Core

## Tong Quan
Tao he thong tang thuong (Gift/Reward) cho phep user chuyen token that (CAMLY, USDT, BNB) tren BNB Chain, voi hieu ung chuc mung phao hoa, bang xep hang Leaderboard, va Light Score.

## Phan 1: Database Migration

Tao 4 bang moi voi RLS policies:

### Bang `gifts`
```sql
CREATE TABLE public.gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  receiver_id uuid NOT NULL REFERENCES auth.users(id),
  token_symbol text NOT NULL DEFAULT 'CAMLY',
  amount numeric NOT NULL DEFAULT 0,
  usd_value numeric NOT NULL DEFAULT 0,
  tx_hash text,
  message text,
  post_id uuid,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Bang `posts`
```sql
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id),
  content text NOT NULL,
  image_url text,
  total_gifts_received numeric NOT NULL DEFAULT 0,
  gift_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### Bang `messages`
```sql
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  receiver_id uuid NOT NULL REFERENCES auth.users(id),
  content text NOT NULL,
  gift_id uuid REFERENCES public.gifts(id),
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Bang `light_scores`
```sql
CREATE TABLE public.light_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) UNIQUE,
  total_given_usd numeric NOT NULL DEFAULT 0,
  total_received_usd numeric NOT NULL DEFAULT 0,
  gift_count_sent integer NOT NULL DEFAULT 0,
  gift_count_received integer NOT NULL DEFAULT 0,
  light_score numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### RLS Policies
- `gifts`: Authenticated users co the SELECT tat ca, INSERT gifts ma sender_id = auth.uid()
- `posts`: Authenticated users co the SELECT tat ca, INSERT posts ma author_id = auth.uid()
- `messages`: Users chi co the SELECT messages ma minh la sender hoac receiver, INSERT messages ma sender_id = auth.uid()
- `light_scores`: Authenticated users co the SELECT tat ca (public leaderboard), chi update qua trigger

### Trigger: Tu dong cap nhat light_scores khi gift duoc confirmed
Tao trigger function `update_light_scores_on_gift()` chay khi gift.status chuyen sang 'confirmed'.

### Enable Realtime cho `gifts`, `messages`, `posts`

## Phan 2: Gift Dialog (`src/components/gifts/GiftDialog.tsx`)

Modal tang thuong voi cac buoc:
1. Chon nguoi nhan - dropdown search tu bang `profiles` (display_name, email)
2. Chon token - CAMLY (uu tien, hien dau), USDT, BNB, cac dong khac
3. Nhap so luong - hien thi USD value tuong duong (dung `useRealtimePrices`)
4. Nhap loi nhan (optional)
5. Nut "Tang Thuong" -> ket noi MetaMask (dung ethers.js tuong tu usePancakeSwap) -> ky giao dich -> doi confirm
6. Khi tx confirmed -> cap nhat gift status -> hien CelebrationModal

## Phan 3: Gift Celebration Modal (`src/components/gifts/GiftCelebrationModal.tsx`)

Hien thi sau khi tang thanh cong:
- **Hieu ung phao hoa CSS** - confetti particles bay khap man hinh, dung CSS keyframes animations (khong can thu vien ngoai)
- **Bang thong tin chinh** (de chup hinh):
  - Tieu de: "Chuc mung ban da chuyen thanh cong!"
  - Nguoi chuyen: avatar + ten
  - Nguoi nhan: avatar + ten
  - Token + So luong + USD value
  - Tx Hash (link BscScan)
  - Thoi gian
- **Hieu ung giu lau** - Modal KHONG tu dong dong, chi dong khi user bam nut "Dong" hoac "X"
- **Nut "Copy" va "Chia se"** - copy thong tin de dan

## Phan 4: Leaderboard (`src/components/gifts/Leaderboard.tsx`)

Component tabs:
- **Tab "Top Givers"** - Xep hang theo tong USD da tang (tu `light_scores.total_given_usd`)
- **Tab "Top Receivers"** - Xep hang theo tong USD da nhan
- **Tab "Top Sponsors" (Manh Thuong Quan)** - All-time top givers voi huy hieu dac biet
- Moi dong: Avatar, Ten, So tien, So giao dich, Light Score badge
- Highlight top 3 voi mau gold/silver/bronze

## Phan 5: Light Score Badge (`src/components/gifts/LightScoreBadge.tsx`)

Huy hieu nho hien thi diem uy tin:
- Cong thuc: `light_score = (total_given_usd * 2) + (total_received_usd * 1) + (gift_count_sent * 10) + (gift_count_received * 5)`
- Hien thi dang icon + so diem, mau gold

## Phan 6: Hook `src/hooks/useGifts.ts`

- `sendGift(receiverId, tokenSymbol, amount, message)` - Tao gift record (status=pending), goi MetaMask chuyen token, cap nhat status khi confirmed
- `useGiftHistory(userId?)` - Query gifts table, join profiles de lay ten sender/receiver
- `useLeaderboard(type: 'givers' | 'receivers' | 'sponsors', limit)` - Query light_scores order by tuong ung
- `useLightScore(userId)` - Lay diem uy tin cua 1 user

## Phan 7: Tich Hop Vao Giao Dien

### Trang Dashboard (`src/pages/Index.tsx`)
- Them nut "Tang Thuong" mau gold noi bat o header (canh nut Sync Now)
- Click mo GiftDialog

### Sidebar (`src/components/layout/TreasurySidebar.tsx`)
- Them menu item "Rewards" voi icon Gift, link toi `/rewards`

### Trang Rewards (`src/pages/Rewards.tsx`)
- Layout: Leaderboard + Gift History table
- Nut "Tang Thuong" o header
- GiftDialog modal

### Route (`src/App.tsx`)
- Them route `/rewards` -> `<Rewards />`

## Files Can Tao/Thay Doi

| File | Thay Doi |
|------|----------|
| **Migration SQL** | Tao 4 bang: gifts, posts, messages, light_scores + RLS + triggers + realtime |
| `src/hooks/useGifts.ts` | **Tao moi** - Core gift logic, blockchain transfer, leaderboard queries |
| `src/components/gifts/GiftDialog.tsx` | **Tao moi** - Modal tang thuong (chon user, token, amount, message) |
| `src/components/gifts/GiftCelebrationModal.tsx` | **Tao moi** - Modal chuc mung voi hieu ung phao hoa CSS |
| `src/components/gifts/Leaderboard.tsx` | **Tao moi** - Bang xep hang 3 tabs (Givers, Receivers, Sponsors) |
| `src/components/gifts/LightScoreBadge.tsx` | **Tao moi** - Huy hieu diem uy tin |
| `src/pages/Rewards.tsx` | **Tao moi** - Trang chinh /rewards |
| `src/App.tsx` | Them route `/rewards` |
| `src/components/layout/TreasurySidebar.tsx` | Them menu "Rewards" |
| `src/pages/Index.tsx` | Them nut "Tang Thuong" o header |

## Thu Tu Thuc Hien

1. Chay migration SQL tao 4 bang + RLS + triggers
2. Tao `useGifts.ts` hook
3. Tao `GiftDialog.tsx`
4. Tao `GiftCelebrationModal.tsx` voi hieu ung phao hoa
5. Tao `LightScoreBadge.tsx`
6. Tao `Leaderboard.tsx`
7. Tao `Rewards.tsx` page
8. Cap nhat `App.tsx` (route), `TreasurySidebar.tsx` (menu), `Index.tsx` (nut tang thuong)

