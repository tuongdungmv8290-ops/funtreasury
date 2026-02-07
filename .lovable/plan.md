

## Xoa logo FUN Treasury

Con muon xoa logo ruong kho bau (treasure chest) ra khoi giao dien FUN Treasury. Logo nay hien dang xuat hien o 3 noi:

### Thay doi

**1. Sidebar (TreasurySidebar.tsx)**
- Xoa hinh logo tron lon (w-24 h-24) o phan header sidebar
- Giu lai text "FUN Treasury" va dong mo ta "A Treasury of the Universe"
- Xoa import `funTreasuryLogo`

**2. Header di dong (Header.tsx)**
- Xoa hinh logo tron (w-16 h-16) trong header
- Giu lai text "FUN Treasury"
- Xoa import `funTreasuryLogo`

**3. Trang Docs (PlatformDocs.tsx)**
- Xoa hinh logo tron (w-32 h-32) tren trang tai lieu
- Xoa import `funTreasuryLogo`

### Chi tiet ky thuat

- Xoa dong `import funTreasuryLogo` trong ca 3 file
- Xoa cac khoi `<div>` chua `<img src={funTreasuryLogo}>` va cac hieu ung xung quanh (gold-shimmer-border, SparkleOnClick)
- Khong anh huong den chuc nang navigation hay cac logo khac (FUN Platforms)
- File anh `src/assets/fun-treasury-logo.png` van giu lai (co the dung cho PWA icons)

