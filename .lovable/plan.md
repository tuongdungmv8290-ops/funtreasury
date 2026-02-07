

# Dot 3: Messaging + Invoice/Receipt PDF + Excel Export + Light Score Badge tren Avatar

## Tong Quan

Xay dung 4 tinh nang con lai cua he thong FUN Rewards:
1. **Messaging** - Hien thi tin nhan gift giua 2 user (da co auto-message tu trigger)
2. **Invoice/Receipt PDF** - Xuat chung nhan tang thuong dang PDF (dung jsPDF da cai)
3. **Excel Export cho Gifts** - Xuat lich su tang thuong ra XLSX (dung exceljs da cai)
4. **Light Score Badge tren avatar** - Hien thi diem uy tin canh ten user o header va cac noi khac

---

## Phan 1: Gift Messages Component

### `src/hooks/useMessages.ts`
- `useMessages(otherUserId)` - Query bang `messages` giua user hien tai va user khac, order by `created_at` asc
- `useUnreadCount()` - Dem so tin chua doc (`read = false` va `receiver_id = auth.uid()`)
- `markAsRead(messageId)` - Mutation cap nhat `read = true`
- Dung `profiles` join de lay ten sender/receiver

### `src/components/gifts/GiftMessageThread.tsx`
- Hien thi danh sach tin nhan giua 2 user
- Moi tin nhan co icon gift neu `gift_id` khac null -> click mo chi tiet gift (link BscScan)
- Tin cua minh hien ben phai (mau gold), tin cua nguoi khac ben trai
- Tu dong scroll xuong tin moi nhat
- Hien thi ngay gio + trang thai "da doc"

### Tich hop vao `src/pages/Rewards.tsx`
- Them section "Tin nhan" phia duoi gift history
- Hoac: them tab "Tin nhan" trong Gift History card
- Click vao 1 gift trong lich su -> mo GiftMessageThread voi user tuong ung

---

## Phan 2: Invoice/Receipt PDF

### `src/lib/giftReceiptPDF.ts`
- Dung `jsPDF` (da cai san) de tao PDF receipt
- Noi dung PDF:
  - Tieu de: "FUN Treasury - Chung Nhan Tang Thuong"
  - Ma giao dich (gift.id)
  - Ngay gio
  - Nguoi gui: ten + email
  - Nguoi nhan: ten + email
  - Token + So luong + USD value
  - Tx Hash + BSCScan link
  - Loi nhan (neu co)
  - Footer: "FUN Ecosystem - BNB Chain"
- Style: gold accent, clear layout

### `src/components/gifts/GiftReceiptButton.tsx`
- Nut "Xuat PDF" nho, co the dat canh moi gift trong lich su
- Goi `generateGiftReceiptPDF(gift)` khi click
- Hien toast "Da tai PDF"

### Tich hop
- Them nut "Xuat PDF" vao moi dong gift history trong `Rewards.tsx`
- Them nut "Tai chung nhan" vao `GiftCelebrationModal.tsx` (canh nut Copy va BscScan)

---

## Phan 3: Excel Export cho Gifts

### `src/lib/giftExcelExport.ts`
- Theo pattern y het `src/lib/excelExport.ts` (da co)
- Dung ExcelJS
- Columns: Date, Sender, Receiver, Token, Amount, USD Value, Message, Tx Hash, Explorer Link, Status
- Color-coded: CAMLY = gold background, USDT = blue background, BNB = light orange
- Header style: dark background, white bold text
- Explorer link clickable
- Auto filter
- File name: `FUN-Rewards-Gifts-DD-MM-YYYY.xlsx`

### Tich hop vao `src/pages/Rewards.tsx`
- Them nut "Export Excel" trong header cua Gift History card
- Click -> goi `exportGiftsXLSX(gifts)` -> tai file

---

## Phan 4: Light Score Badge tren Avatar

### Cap nhat `src/components/layout/AppHeader.tsx`
- Them hien thi Light Score badge canh user actions (phai cua header)
- Import `useLightScore` va `LightScoreBadge`
- Chi hien khi user da dang nhap va co diem > 0

### Cap nhat `src/components/gifts/Leaderboard.tsx`
- Da co LightScoreBadge, khong can thay doi

### Cap nhat `src/components/posts/PostCard.tsx`
- Hien thi LightScoreBadge canh ten tac gia
- Query light_score cua author (hoac truyen tu PostFeed)

### Cap nhat `src/hooks/usePosts.ts`
- Join them `light_scores` table de lay diem cua tac gia kem theo post data
- Them truong `author_light_score` vao `PostWithAuthor` interface

---

## Thu Tu Thuc Hien

1. `src/hooks/useMessages.ts` - Hook tin nhan
2. `src/components/gifts/GiftMessageThread.tsx` - UI tin nhan
3. `src/lib/giftReceiptPDF.ts` - Xuat PDF receipt
4. `src/components/gifts/GiftReceiptButton.tsx` - Nut xuat PDF
5. `src/lib/giftExcelExport.ts` - Export Excel gifts
6. Cap nhat `src/pages/Rewards.tsx` - Tich hop messages + PDF + Excel
7. Cap nhat `src/components/gifts/GiftCelebrationModal.tsx` - Them nut tai PDF
8. Cap nhat `src/components/layout/AppHeader.tsx` - Light Score badge
9. Cap nhat `src/hooks/usePosts.ts` + `src/components/posts/PostCard.tsx` - Light Score tren post

## Files Can Tao/Thay Doi

| File | Thay Doi |
|------|----------|
| `src/hooks/useMessages.ts` | **Tao moi** - Hook query/mark-read messages |
| `src/components/gifts/GiftMessageThread.tsx` | **Tao moi** - UI chat tin nhan gift |
| `src/lib/giftReceiptPDF.ts` | **Tao moi** - Generate PDF receipt cho gift |
| `src/components/gifts/GiftReceiptButton.tsx` | **Tao moi** - Nut download PDF |
| `src/lib/giftExcelExport.ts` | **Tao moi** - Export XLSX cho gifts |
| `src/pages/Rewards.tsx` | **Cap nhat** - Tich hop messages, PDF, Excel export |
| `src/components/gifts/GiftCelebrationModal.tsx` | **Cap nhat** - Them nut "Tai chung nhan PDF" |
| `src/components/layout/AppHeader.tsx` | **Cap nhat** - Them Light Score badge |
| `src/hooks/usePosts.ts` | **Cap nhat** - Join light_scores |
| `src/components/posts/PostCard.tsx` | **Cap nhat** - Hien thi LightScoreBadge |

