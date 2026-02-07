

# Dot 4 - FUN Treasury Upgrade Plan

## Tong Quan

Dot 4 tap trung vao 3 muc tieu chinh: (1) Nang cao trai nghiem tin nhan, (2) Cai thien hieu suat backend, va (3) Them tinh nang thong bao thong minh.

---

## 1. Reply truc tiep trong GiftMessageThread

Hien tai `GiftMessageThread` chi hien thi tin nhan, khong cho phep nguoi dung gui tin nhan moi. Can them o nhap tin nhan va nut gui ngay trong dialog.

**Cong viec:**
- Them input + nut gui o cuoi `GiftMessageThread.tsx`
- Tao mutation `useSendMessage` trong `useMessages.ts` de INSERT vao bang `messages`
- Tin nhan moi se tu dong hien len nho realtime da cai o Dot 3

---

## 2. Database-backed cache cho get-crypto-prices

Hien tai edge function `get-crypto-prices` dung in-memory cache, mat data moi khi cold start. Can luu cache vao database de giu data giua cac lan restart.

**Cong viec:**
- Tao bang `price_cache` (key, data JSONB, updated_at)
- Cap nhat edge function: doc cache tu DB truoc, neu con tuoi (<2 phut) thi tra ve luon, neu het han thi goi API va luu lai vao DB
- Giam dang ke loi 429 tu CoinGecko vi cold start khong mat cache nua

---

## 3. Thong bao realtime khi nhan gift moi

Hien tai `NotificationCenter` doc tu bang `notifications`. Can tu dong tao notification khi co gift moi va hien thi realtime.

**Cong viec:**
- Tao database trigger: khi gift duoc confirmed -> INSERT vao bang `notifications` cho receiver
- Enable realtime cho bang `notifications`
- Cap nhat `useNotifications` hook de subscribe realtime, tu dong hien badge moi

---

## 4. Hien thi so tin nhan chua doc tren Sidebar

Them badge so unread messages canh muc "Rewards" tren sidebar de nguoi dung biet co tin nhan moi.

**Cong viec:**
- Goi `useUnreadCount()` trong `TreasurySidebar.tsx`
- Hien thi badge nho mau do canh icon Rewards neu count > 0

---

## 5. Profile ca nhan - chinh sua ten va avatar

Hien tai profile chi tu dong tao khi dang ky. Can cho phep nguoi dung chinh sua ten hien thi va upload avatar.

**Cong viec:**
- Tao storage bucket `avatars` cho upload anh
- Them phan "Ho so ca nhan" trong trang Settings: input ten, upload avatar
- Cap nhat `profiles` table khi luu

---

## Thu Tu Thuc Hien

| Buoc | Noi Dung | Files Chinh |
|------|----------|-------------|
| 1 | Reply trong GiftMessageThread | `useMessages.ts`, `GiftMessageThread.tsx` |
| 2 | Database cache cho crypto prices | Migration (bang `price_cache`), `get-crypto-prices/index.ts` |
| 3 | Thong bao realtime khi nhan gift | Migration (trigger), `useNotifications.ts` |
| 4 | Badge unread tren Sidebar | `TreasurySidebar.tsx` |
| 5 | Profile ca nhan | Migration (storage bucket), `Settings.tsx` |

---

## Chi Tiet Ky Thuat

### 1. useSendMessage mutation

```text
useSendMessage(otherUserId):
  mutationFn: (content: string) =>
    supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: otherUserId,
      content,
    })
  onSuccess: invalidate ['messages', ...]
```

### 2. Bang price_cache

```text
CREATE TABLE price_cache (
  id TEXT PRIMARY KEY DEFAULT 'crypto_prices',
  data JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: cho phep service role doc/ghi, anon chi doc
```

### 3. Trigger thong bao gift

```text
Trong function update_light_scores_on_gift() da co:
  - Them INSERT vao notifications cho receiver
  - Title: "Ban da nhan duoc X TOKEN tu SENDER_NAME"
  - Type: 'success'
```

### 4. Unread badge tren Sidebar

```text
TreasurySidebar:
  const { data: unreadCount } = useUnreadCount()
  // Hien thi badge do canh muc Rewards neu unreadCount > 0
```

### 5. Profile update

```text
Settings.tsx:
  - Them section "Ho so ca nhan"
  - Input display_name, upload avatar (Supabase Storage)
  - Save: supabase.from('profiles').update(...)
```

