# Kế hoạch: Thêm ví GAME FUN TREASURY

## Thông tin ví mới
- **Tên:** GAME FUN TREASURY
- **BNB Smart Chain:** `0x032269c811a2e58683df9514d3bf6ce70d1d09bb`
- **Bitcoin:** `bc1q05nm7esjp4d96jyaypgc4499lfnclf2g4f787n`
- **Nguồn:** https://fun.rich/game_funtreasury

## Các bước thực hiện

### 1. Thêm ví vào database (migration)
- Insert 2 dòng vào bảng `wallets`:
  - `GAME FUN TREASURY - BNB` (chain=BNB)
  - `GAME FUN TREASURY - BTC` (chain=BTC)
- Insert vào `sync_state` với `last_block_synced = 0` để lần sync đầu tiên quét toàn bộ lịch sử.
- Thêm cả 2 địa chỉ vào `address_labels` với nhãn "GAME FUN TREASURY" (để hiển thị tên đẹp trong các giao dịch liên quan).
- Cập nhật `src/lib/funTreasury.ts` — thêm 2 địa chỉ vào `FUN_TREASURY_WALLETS` để nút "fun.rich" hiển thị đúng.

### 2. Đồng bộ giao dịch on-chain
- Sau khi thêm ví, chạy edge function `sync-transactions` với `force_full_sync: true` cho 2 ví mới:
  - BNB: Moralis ERC20 (CAMLY, USDT, BTCB) + Moralis Native (BNB) — pagination đầy đủ đã có sẵn.
  - BTC: mempool.space full history — đã có sẵn.
- Chạy `get-token-balances` để cập nhật số dư hiện tại vào bảng `tokens`.

### 3. UI Dashboard — Khu vực riêng "GAME FUN TREASURY"
Thêm 1 section mới trên `src/pages/Index.tsx` (Dashboard), đặt phía dưới các thẻ ví hiện tại:

**Component mới:** `src/components/dashboard/GameFunTreasurySection.tsx`

Bố cục:
```text
┌─ GAME FUN TREASURY ────────────────────────┐
│  [Card BNB wallet]      [Card BTC wallet]  │
│   ─ Total Balance USD    ─ Total Balance   │
│   ─ CAMLY / BNB /        ─ BTC balance     │
│     USDT / BTCB balances                    │
├────────────────────────────────────────────┤
│  Lịch sử giao dịch (bảng riêng)            │
│   Cột: Thời gian | Hướng (IN/OUT) |        │
│         Token | Số lượng | USD |            │
│         Từ/Đến (có nhãn) | Tx hash          │
│   Filter: All / BNB / BTC / theo token      │
│   Phân trang 20/page, có nút "Xem thêm"     │
└────────────────────────────────────────────┘
```

- Dùng lại `useWalletSummary()` — lọc theo tên ví bắt đầu bằng "GAME FUN TREASURY" để lấy số dư.
- Dùng lại `useTransactions({ walletIds: [gameBnbId, gameBtcId] })` — cần bổ sung param `walletIds` (mảng) vào hook nếu chưa có, hoặc thêm 1 hook nhỏ `useGameFunTreasuryTx`.
- Style: cùng token màu như `WalletSummaryCards` để nhất quán (gold primary, JetBrains Mono cho số).
- Realtime: đã được xử lý sẵn qua channel `transactions` + `tokens`.

### 4. Đa ngôn ngữ
- Thêm keys vào `src/locales/vi.json` + `en.json` (chỉ 2 ngôn ngữ chính lần này, các ngôn ngữ khác dùng fallback):
  - `dashboard.gameFunTreasury.title`
  - `dashboard.gameFunTreasury.transactionsTitle`
  - `dashboard.gameFunTreasury.emptyState`

## Chi tiết kỹ thuật

**File thay đổi:**
- `supabase/migrations/xxx_add_game_fun_treasury.sql` (mới)
- `src/lib/funTreasury.ts` (thêm 2 address)
- `src/components/dashboard/GameFunTreasurySection.tsx` (mới)
- `src/pages/Index.tsx` (mount section mới)
- `src/hooks/useTransactions.ts` (thêm filter `walletIds` nếu cần)
- `src/locales/vi.json`, `src/locales/en.json`

**Không thay đổi:**
- Schema DB (chỉ insert dữ liệu)
- `sync-transactions` edge function
- Các ví FUN TREASURY hiện có
- RLS / policies

## Sau khi build xong
1. Bấm nút "Đồng bộ lại toàn bộ lịch sử" trong Settings để kéo full history 2 ví mới.
2. Kiểm tra section mới trên Dashboard hiển thị đúng số dư và giao dịch.
