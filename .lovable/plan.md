

## Trang Quản lý Admin - FUN TREASURY

### Tổng quan
Tạo trang `/admin` riêng biệt để quản lý tài khoản admin, tách khỏi trang Settings hiện tại. Trang mới sẽ hiển thị danh sách admin với thông tin chi tiết và cho phép thêm/xoá admin trực tiếp.

### Tính năng chính

1. **Danh sách Admin hiện tại** - Bảng hiển thị tất cả admin với email, tên hiển thị, avatar, ngày tạo, và User ID
2. **Thêm Admin mới** - Form nhập User ID hoặc Email để cấp quyền admin
3. **Xoá quyền Admin** - Nút xoá với xác nhận (AlertDialog), không cho phép xoá chính mình
4. **Tổng quan nhanh** - Cards thống kê: tổng số admin, tổng user, admin mới nhất

### Chi tiết kỹ thuật

**File mới:**
- `src/pages/AdminManagement.tsx` - Trang chính với bảng admin, form thêm/xoá, stats cards

**File cần sửa:**
- `src/App.tsx` - Thêm route `/admin` (protected)
- `src/components/layout/TreasurySidebar.tsx` - Thêm menu item "Quản lý Admin" với icon Shield (chỉ hiện cho admin)

**Logic hoạt động:**
- Query bảng `user_roles` (role = 'admin') kết hợp `profiles` để lấy thông tin chi tiết
- Thêm admin: Insert vào `user_roles` với role = 'admin'
- Xoá admin: Delete từ `user_roles` theo user_id + role = 'admin'
- Chỉ admin mới thấy menu item và truy cập được trang
- Ẩn trang khỏi view-only mode

**Bảo mật:**
- RLS policies hiện tại đã đủ: chỉ admin mới có quyền ALL trên `user_roles`
- Không cần tạo thêm migration
- Sử dụng `has_role` function có sẵn để kiểm tra quyền

