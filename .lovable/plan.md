

# Tach cot From/To thanh 2 cot rieng biet voi Label Popover

## Hien trang

Hien tai bang Transactions chi co 1 cot "From/To" (dong 727-729), hien thi `from_address` hoac `to_address` tuy theo direction. Nut Label chi xuat hien cho 1 dia chi.

## Thay doi

Tach thanh 2 cot rieng biet **"From"** va **"To"**, moi cot deu co:
- Hien thi ten (tu `useAddressLabels`) hoac dia chi rut gon
- Nut Copy (hover)
- Nut Label Popover cho admin (hover, chi khi `!isViewOnly`)

## Chi Tiet Ky Thuat

### File: `src/pages/Transactions.tsx`

**1. Header (dong 727-729):** Thay 1 cot "From/To" thanh 2 cot "From" va "To"

**2. Body (dong 804-833):** Thay 1 block IIFE thanh 2 block tuong tu:
- Cot From: luon hien `tx.from_address` voi `getLabel()` + Copy + `AddressLabelPopover`
- Cot To: luon hien `tx.to_address` voi `getLabel()` + Copy + `AddressLabelPopover`

Moi cot se dung cung logic hien tai nhung voi dia chi co dinh (from hoac to), khong con phu thuoc `tx.direction`.

### Khong can thay doi file khac
- `AddressLabelPopover` da co san va hoat dong tot
- `useAddressLabels` hook khong can thay doi

