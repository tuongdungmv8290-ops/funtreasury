## Phần A — Nâng cấp chỉnh sửa nhãn (cho phép sửa CẢ tên và địa chỉ)

Hiện tại nút bút chì chỉ cho sửa **tên**. Nâng cấp để sửa được cả địa chỉ ví.

**File:** `src/components/settings/AddressLabelManager.tsx`

- Thay `editing: string | null` + `editValue: string` bằng state `editing: { oldAddress, label, address } | null`.
- Khi bấm bút chì → mở 2 ô input cạnh nhau: **Tên** + **Địa chỉ ví** (font mono), kèm nút ✓ Lưu và ✗ Huỷ.
- Mutation `updateLabel` mới:
  - Validate địa chỉ mới khớp `0x...{40}` hoặc `bc1...`.
  - Nếu địa chỉ **không đổi** → `upsert({ address, label })`.
  - Nếu địa chỉ **đổi** → `delete` row cũ theo `oldAddress`, sau đó `upsert` row mới `{ address: newAddress.toLowerCase(), label }`. (Làm tuần tự, không cần transaction vì admin-only.)
  - Báo lỗi nếu địa chỉ mới đã tồn tại ở row khác (check trước khi delete).
- Giữ nguyên nút xoá 🗑.

## Phần B — Bước 2: Command Palette ⌘K (Spotlight cho Treasury)

Mục tiêu: bấm **⌘K** (Mac) / **Ctrl+K** (Win) ở bất cứ trang nào → mở popup tìm kiếm nhanh, gõ tên ví / nhãn / địa chỉ / route → Enter để nhảy tới.

**Tạo mới:** `src/components/CommandPalette.tsx`

- Dùng sẵn `@/components/ui/command` (cmdk) + `Dialog`.
- Listen global `keydown`: `(e.metaKey||e.ctrlKey) && e.key==='k'` → toggle open.
- Indexes (gộp vào 1 list, có group heading):
  1. **Trang** (tĩnh): Dashboard, Ví Treasury, Giao dịch, Phần thưởng (Rewards), CAMLY, Ánh Sáng, NFT, Báo cáo, Cài đặt, Cộng đồng/Posts.
  2. **Ví Treasury** từ `wallets` (name + address rút gọn) → nhảy `/?wallet=<address>` hoặc Dashboard.
  3. **Nhãn** từ `address_labels` (label + address) → copy address vào clipboard + toast, hoặc mở Settings.
  4. **Hành động nhanh:**
     - "Cập nhật từ fun.rich" → invoke `scrape-funrich-labels`.
     - "Gửi CAMLY" → mở modal Send (nếu ở trang Camly) hoặc điều hướng `/camly`.
     - "Đổi theme sáng/tối", "Đăng xuất".
- Mỗi item có icon (lucide), shortcut hint khi liên quan.
- Mount global trong `src/components/layout/AppLayout.tsx` (luôn render).
- Thêm nút nhỏ "⌘K" trong `AppHeader` (desktop) để khám phá.
- i18n: chuỗi tiếng Việt, có thể bổ sung key vào `vi.json`/`en.json` cho 5 nhãn chính (search placeholder, group titles).

### Kỹ thuật

- Dữ liệu lấy qua React Query (`wallets`, `address-labels`) — đã có hook/queryKey sẵn nên cache dùng chung, không tạo request thừa.
- Fuzzy filter: cmdk tự lo (default scoring).
- Không tạo bảng/migration mới. Không đổi backend.

### Files

- New: `src/components/CommandPalette.tsx`
- Edit: `src/components/layout/AppLayout.tsx` (mount), `src/components/layout/AppHeader.tsx` (nút ⌘K), `src/components/settings/AddressLabelManager.tsx` (sửa địa chỉ).
- Optional edit: `src/locales/vi.json`, `src/locales/en.json` (5 keys).

Sau khi xong Phần B, sẵn sàng chuyển **Bước 3: Onboarding Tour (driver.js)**.
