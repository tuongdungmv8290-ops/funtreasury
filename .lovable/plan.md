

## Kế hoạch xoá tài khoản không hoạt động

### Tình trạng hiện tại
- **Tổng cộng: 61 tài khoản** trong hệ thống
- **Giữ lại 3 tài khoản admin:**
  1. `lekhanhi772@gmail.com`
  2. `funtreasury.rich@gmail.com`
  3. `tuongdung.mv8290@gmail.com`
- **Sẽ xoá: 58 tài khoản** không cần thiết (bao gồm `admin@treasury.fun.rich` cũ)

### Cách thực hiện

Vì không thể xoá user từ bảng `auth.users` bằng SQL thông thường, cần tạo **Edge Function tạm thời** sử dụng `service_role` key để xoá:

1. **Tạo edge function `cleanup-users`** - Lấy danh sách tất cả user, lọc ra 3 tài khoản cần giữ, xoá phần còn lại bằng Supabase Admin API (`auth.admin.deleteUser()`)
2. **Gọi function để thực thi** - Xoá 58 tài khoản
3. **Dọn dẹp** - Xoá các dữ liệu liên quan (profiles, user_roles của tài khoản bị xoá sẽ tự động cascade)
4. **Xoá edge function tạm** - Giữ sạch codebase

### Lưu ý quan trọng
- Dữ liệu liên kết (profiles, user_roles) sẽ tự động bị xoá nhờ `ON DELETE CASCADE`
- Hành động này **không thể hoàn tác** - các tài khoản bị xoá sẽ phải đăng ký lại
- Tài khoản đang đăng nhập sẽ bị đăng xuất ngay lập tức

