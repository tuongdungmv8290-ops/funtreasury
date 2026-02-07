

# Dot 5 - FUN Treasury Upgrade Plan

## Tong Quan

Dot 5 tap trung vao 5 muc tieu: (1) Map address thanh ten nguoi dung tren dashboard Giao Dich, (2) Gift Analytics charts, (3) He thong Achievement/Huy hieu, (4) Tim kiem tin nhan, va (5) Notification realtime cho bang notifications.

---

## 1. Address-to-Name Mapping tren Dashboard Giao Dich (YEU CAU TU ADMIN)

Hien tai cot From/To chi hien thi dia chi vi rut gon (0x609a...519d). Can tu dong map dia chi sang ten de hien thi, vd: "FUN TREASURY" thay vi "0x609a...".

**Nguon du lieu mapping:**
- Bang `wallets`: da co 5 Treasury wallets voi name + address
- Bang `profiles`: user profiles co `user_id` nhung chua co truong `wallet_address`
- Can tao bang `address_labels` moi de admin co the gan ten bat ky cho bat ky dia chi nao (vd: "Binance Hot Wallet", "Team Member A")

**Cong viec:**
- Tao bang `address_labels` (address TEXT PRIMARY KEY, label TEXT, created_by UUID)
- Tao hook `useAddressLabels` de load tat ca labels + wallets name vao 1 map
- Cap nhat ham hien thi From/To trong `Transactions.tsx`: neu address co trong map thi hien thi ten (vd: "FUN TREASURY") voi mau vang gold, neu khong thi hien dia chi rut gon nhu cu
- Them nut "Label" nho de admin co the dat ten cho dia chi ngay tren bang giao dich
- Cap nhat CSV/Excel export de them cot "From Name" va "To Name"

---

## 2. Gift Analytics Dashboard

Trang Rewards hien chi co Leaderboard. Can them bieu do tong quan xu huong tang/nhan theo thoi gian.

**Cong viec:**
- Tao component `GiftAnalyticsCharts.tsx` dung Recharts (da cai san)
- 3 bieu do: (a) Gift volume theo tuan/thang (BarChart), (b) Top tokens duoc tang (PieChart), (c) Dong gift theo thoi gian (AreaChart)
- Query aggregate tu bang `gifts` voi status = 'confirmed'
- Tich hop vao trang `Rewards.tsx` nhu 1 tab moi "Analytics"

---

## 3. He thong Achievement / Huy hieu

Tu dong trao huy hieu dua tren Light Score va hoat dong, tao dong luc cho cong dong.

**Cong viec:**
- Tao bang `achievements` (id, name, description, icon_emoji, threshold_type, threshold_value)
- Tao bang `user_achievements` (user_id, achievement_id, earned_at)
- Seed data: 5-7 achievements mac dinh (vd: "First Gift" khi gift_count_sent >= 1, "Generous Heart" khi total_given_usd >= 100, "Light Bearer" khi light_score >= 50)
- Trigger: khi `light_scores` duoc cap nhat -> kiem tra va tu dong INSERT achievement moi
- UI: Hien thi huy hieu tren profile card va PostCard

---

## 4. Tim kiem & Loc tin nhan

GiftMessageThread hien thi tat ca tin nhan. Khi so luong lon, can tim kiem de tra cuu nhanh.

**Cong viec:**
- Them search input phia tren danh sach tin nhan trong `GiftMessageThread.tsx`
- Filter client-side theo `content.includes(searchTerm)`
- Them highlight ket qua tim kiem

---

## 5. Notification realtime voi user_id

Hien tai bang `notifications` khong co cot `user_id`, nghia la tat ca notification la global. Can them `user_id` de moi nguoi chi thay notification cua minh.

**Cong viec:**
- Them cot `user_id UUID` vao bang `notifications`
- Cap nhat RLS: user chi doc notification cua minh (user_id = auth.uid())
- Cap nhat trigger gift -> notification: INSERT voi user_id = receiver_id
- Cap nhat `useNotifications` hook: filter theo user_id

---

## Thu Tu Thuc Hien

| Buoc | Noi Dung | Do Kho | Files Chinh |
|------|----------|--------|-------------|
| 1 | Address-to-Name Mapping | 2/5 | Migration (`address_labels`), `useAddressLabels.ts`, `Transactions.tsx`, `excelExport.ts` |
| 2 | Notification user_id | 2/5 | Migration (alter `notifications`), `useNotifications.ts` |
| 3 | Gift Analytics Dashboard | 2/5 | `GiftAnalyticsCharts.tsx`, `Rewards.tsx` |
| 4 | Tim kiem tin nhan | 1/5 | `GiftMessageThread.tsx` |
| 5 | Achievement / Huy hieu | 3/5 | Migration (2 bang + trigger), `useAchievements.ts`, UI components |

---

## Chi Tiet Ky Thuat

### 1. Bang address_labels

```text
CREATE TABLE address_labels (
  address TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
-- RLS: admin can CRUD, anyone can SELECT
-- Pre-seed: INSERT tu wallets table (5 Treasury wallets)
```

### useAddressLabels hook

```text
useAddressLabels():
  - Query address_labels + wallets
  - Return Map<address_lowercase, label>
  - getLabel(address): return map.get(address.toLowerCase()) || shortenAddress(address)
```

### Transactions.tsx cap nhat From/To

```text
Hien tai (dong 800-824):
  shortenAddress(tx.direction === 'IN' ? tx.from_address : tx.to_address)

Sau khi update:
  const label = getLabel(address)
  Neu label !== shortenAddress -> hien thi voi class "text-treasury-gold font-bold"
  Neu la dia chi thuong -> hien thi nhu cu voi font-mono
```

### 2. Notification user_id

```text
ALTER TABLE notifications ADD COLUMN user_id UUID;
-- Cap nhat RLS SELECT: (user_id IS NULL) OR (auth.uid() = user_id)
-- Cap nhat trigger: INSERT voi user_id = NEW.receiver_id
```

### 3. GiftAnalyticsCharts

```text
- Query gifts grouped by week: SELECT date_trunc('week', created_at), SUM(usd_value)
- PieChart: GROUP BY token_symbol
- Dat trong tab "Analytics" cua Rewards.tsx
```

### 4. Tim kiem tin nhan

```text
GiftMessageThread:
  const [search, setSearch] = useState('')
  const filtered = messages.filter(m => 
    m.content.toLowerCase().includes(search.toLowerCase())
  )
```

### 5. Achievement tables + trigger

```text
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_emoji TEXT DEFAULT '',
  threshold_type TEXT NOT NULL, -- 'gift_count_sent', 'total_given_usd', 'light_score'
  threshold_value NUMERIC NOT NULL DEFAULT 0
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_id UUID REFERENCES achievements(id),
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Trigger on light_scores UPDATE: check all achievements, insert missing ones
```

