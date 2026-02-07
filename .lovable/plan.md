

# Nang Cap Fun Treasury - Avatar Upload, Immutable Gifts, Public View

## 1. Avatar Upload cho Profile

Bang `profiles` da co truong `avatar_url`, bucket `avatars` da ton tai (public). Chi can them UI upload anh trong trang Settings.

**File: `src/pages/Settings.tsx`**
- Them section upload avatar voi preview thumbnail 100x100
- Upload anh len bucket `avatars`, tu dong generate URL
- Luu URL vao `profiles.avatar_url`

## 2. Hien thi vi + avatar trong dropdown tim nguoi nhan

**File: `src/components/gifts/GiftDialog.tsx`**
- Trong `renderProfileSearch()`, them hien thi `wallet_address` (rut gon 0x1234...5678) ben canh ten va avatar
- Da co avatar trong dropdown, chi can them dia chi vi

## 3. Lam bang gifts immutable (khong cho UPDATE/DELETE sau khi insert)

**Database migration:**
- Xoa RLS policy "Sender can update own gifts" (hien tai cho phep sender update)
- Tao trigger `prevent_gift_modification` de block UPDATE tren cac truong quan trong (amount, sender_id, receiver_id, token_symbol) - chi cho phep update `status` va `tx_hash` (can thiet cho flow pending -> confirmed)

## 4. Generate internal hash cho non-blockchain gifts

**File: `src/hooks/useGifts.ts`**
- Khi gift la internal (FUNM, internal CAMLY), generate SHA-256 hash tu data (sender_id + receiver_id + amount + token + timestamp)
- Luu hash vao truong `tx_hash` de verify immutable
- Prefix internal hash voi "INT-" de phan biet voi blockchain tx hash

## 5. Nang cap trang History voi filter/search

**File: `src/pages/Rewards.tsx`** - Nang cap `GiftHistorySection`:
- Them Input search (tim theo ten nguoi gui/nhan, tx_hash)
- Them filter theo token_symbol (dropdown)
- Hien thi columns: From (ten + avatar + vi rut gon), To (ten + avatar + vi rut gon), Amount, Token, Timestamp, Note, Status, TxHash (link bscscan)
- Nut Export CSV (ben canh Export Excel da co)

## 6. Trang Public View (khong can login)

**File moi: `src/pages/PublicRewards.tsx`**
- Route: `/public/rewards` (ngoai ProtectedRoute)
- Hien thi danh sach user (ten + avatar, an email)
- Hien thi lich su gift (an message private, chi hien From name, To name, Amount, Token, Timestamp, TxHash)
- Chi doc, khong co nut tang thuong
- Giao dien don gian, mau vang gold

**File: `src/App.tsx`**
- Them route `/public/rewards` ngoai ProtectedRoute wrapper

---

## Chi tiet ky thuat

| File | Thay doi |
|------|---------|
| `src/pages/Settings.tsx` | Them avatar upload section |
| `src/components/gifts/GiftDialog.tsx` | Them wallet_address trong dropdown search |
| `src/hooks/useGifts.ts` | Generate internal SHA-256 hash cho non-blockchain gifts |
| `src/pages/Rewards.tsx` | Nang cap GiftHistorySection voi search/filter/CSV, hien thi avatar+vi |
| `src/pages/PublicRewards.tsx` | Trang public view moi |
| `src/App.tsx` | Them route /public/rewards |
| Database migration | Lam gifts immutable (restrict UPDATE fields, block DELETE) |

## Luu y bao mat

- Public view chi hien thi ten + avatar, **an email va thong tin nhay cam**
- RLS policy tren `profiles` hien tai chi cho phep user xem profile cua minh -> Can them policy SELECT public cho `display_name`, `avatar_url` (da co trong `useUserProfiles`)
- Gifts da co policy "Anyone can view gifts" -> OK cho public view
