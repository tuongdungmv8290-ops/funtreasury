

# Dot 3: Messaging + Invoice PDF + Excel Export + Light Score Badge

## Tong Quan

Bo sung 4 tinh nang cho FUN Rewards: messaging (tin nhan lien ket gift), xuat PDF chung nhan, export Excel lich su gift, va hien thi Light Score badge tren header + post cards.

---

## Phan 1: Messaging Hook va UI

### `src/hooks/useMessages.ts` (Tao moi)
- `useMessages(otherUserId)` - Query `messages` table giua user hien tai va 1 user khac, order `created_at` asc
- `useUnreadCount()` - Dem messages chua doc (`read = false`, `receiver_id = auth.uid()`)
- `markAsRead(messageId)` - Mutation update `read = true`
- Join `profiles` de lay ten sender/receiver

### `src/components/gifts/GiftMessageThread.tsx` (Tao moi)
- Dialog hien thi tin nhan giua 2 user
- Tin cua minh ben phai (mau gold), tin nguoi khac ben trai
- Tin co `gift_id` hien icon gift + link BscScan
- Auto scroll xuong cuoi
- Hien ngay gio + trang thai da doc

### Tich hop vao Rewards.tsx
- Click vao 1 gift trong lich su -> mo GiftMessageThread voi user tuong ung

---

## Phan 2: Invoice/Receipt PDF

### `src/lib/giftReceiptPDF.ts` (Tao moi)
- Dung `jsPDF` (da cai)
- Noi dung: tieu de "FUN Treasury - Chung Nhan Tang Thuong", ma giao dich, ngay gio, nguoi gui/nhan, token + so luong + USD, tx hash, loi nhan, footer
- Style gold accent

### `src/components/gifts/GiftReceiptButton.tsx` (Tao moi)
- Nut nho "PDF" hien canh moi gift trong lich su
- Goi `generateGiftReceiptPDF(gift)` khi click

### Tich hop
- Them nut PDF vao moi dong gift history trong `Rewards.tsx`
- Them nut "Tai chung nhan" vao `GiftCelebrationModal.tsx`

---

## Phan 3: Excel Export cho Gifts

### `src/lib/giftExcelExport.ts` (Tao moi)
- Theo pattern giong `src/lib/excelExport.ts`
- Columns: Date, Sender, Receiver, Token, Amount, USD Value, Message, Tx Hash, Explorer Link, Status
- Color-coded: CAMLY = gold (#FFF8E1), USDT = blue (#E3F2FD), BNB = orange (#FFF3E0)
- Header dark, white bold text, auto filter, clickable links
- File: `FUN-Rewards-Gifts-DD-MM-YYYY.xlsx`

### Tich hop vao `Rewards.tsx`
- Them nut "Export Excel" trong CardHeader cua Gift History

---

## Phan 4: Light Score Badge tren Avatar

### Cap nhat `src/components/layout/AppHeader.tsx`
- Import `useLightScore` va `LightScoreBadge`
- Hien thi badge canh notification area khi user dang nhap va co diem > 0

### Cap nhat `src/hooks/usePosts.ts`
- Join them `light_scores` table de lay `author_light_score`
- Them truong `author_light_score` vao interface `PostWithAuthor`

### Cap nhat `src/components/posts/PostCard.tsx`
- Hien thi `LightScoreBadge` (size sm) canh ten tac gia

---

## Thu Tu Thuc Hien

1. `src/hooks/useMessages.ts`
2. `src/components/gifts/GiftMessageThread.tsx`
3. `src/lib/giftReceiptPDF.ts`
4. `src/components/gifts/GiftReceiptButton.tsx`
5. `src/lib/giftExcelExport.ts`
6. Cap nhat `src/pages/Rewards.tsx` - messages + PDF + Excel
7. Cap nhat `src/components/gifts/GiftCelebrationModal.tsx` - nut PDF
8. Cap nhat `src/components/layout/AppHeader.tsx` - Light Score badge
9. Cap nhat `src/hooks/usePosts.ts` + `src/components/posts/PostCard.tsx` - Light Score tren post

## Files

| File | Thay Doi |
|------|----------|
| `src/hooks/useMessages.ts` | Tao moi |
| `src/components/gifts/GiftMessageThread.tsx` | Tao moi |
| `src/lib/giftReceiptPDF.ts` | Tao moi |
| `src/components/gifts/GiftReceiptButton.tsx` | Tao moi |
| `src/lib/giftExcelExport.ts` | Tao moi |
| `src/pages/Rewards.tsx` | Cap nhat - tich hop messages, PDF, Excel |
| `src/components/gifts/GiftCelebrationModal.tsx` | Cap nhat - them nut PDF |
| `src/components/layout/AppHeader.tsx` | Cap nhat - Light Score badge |
| `src/hooks/usePosts.ts` | Cap nhat - join light_scores |
| `src/components/posts/PostCard.tsx` | Cap nhat - hien thi LightScoreBadge |

