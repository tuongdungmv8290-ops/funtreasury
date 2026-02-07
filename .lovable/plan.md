
# Cap nhat phan "Tu" (From) trong dialog xac nhan giao dich

## Thay doi

Hien tai `SendConfirmStep.tsx` chi hien thi dia chi vi rut gon (0x1234...5678) o phan "Tu". Can cap nhat de hien thi ten **FUN TREASURY** (hoac ten sender tu profile) kem dia chi vi, giong cach hien thi ben "Den" (To).

## Chi tiet ky thuat

### File: `src/components/camly/modals/SendConfirmStep.tsx`
- Them prop `senderName` (string, optional)
- Phan "Tu": hien thi ten sender (mac dinh "FUN TREASURY") bang chu vang noi bat, kem dia chi vi rut gon phia duoi

### File: `src/components/camly/modals/CamlySendModal.tsx`
- Truyen them prop `senderName="FUN TREASURY"` vao `SendConfirmStep`

## Truoc va sau

| Phan | Truoc | Sau |
|------|-------|-----|
| Tu (From) | `0x1234...5678` | **FUN TREASURY** + `0x1234...5678` |
| Den (To) | Khong doi | Khong doi |

Chi 2 file thay doi nho, khong can migration database.
