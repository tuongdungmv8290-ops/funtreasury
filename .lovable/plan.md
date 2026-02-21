

## Cập nhật tài khoản Admin FUN TREASURY

### Tổng quan
Xoá admin cũ, thêm 2 admin mới, giữ admin hiện tại.

### Thay đổi chi tiết

**1. Xoá quyền admin của tài khoản cũ**
- Xoá role `admin` của `admin@treasury.fun.rich` (user_id: `6fa88b51...`)
- Tài khoản vẫn tồn tại nhưng không còn quyền quản trị

**2. Tạo tài khoản mới: funtreasury.rich@gmail.com**
- Đăng ký tài khoản mới qua hệ thống xác thực
- Cấp quyền `admin` sau khi tạo thành công

**3. Cấp admin cho tài khoản có sẵn: tuongdung.mv8290@gmail.com (NGỌC GIÀU)**
- Tài khoản đã tồn tại (user_id: `ac243e4b...`)
- Thêm role `admin` vào bảng `user_roles`

**4. Giữ nguyên admin hiện tại**
- `lekhanhi772@gmail.com` - vẫn là admin

### Kết quả sau khi hoàn thành
Hệ thống sẽ có 3 admin:
1. `lekhanhi772@gmail.com` (giữ nguyên)
2. `funtreasury.rich@gmail.com` (mới tạo)
3. `tuongdung.mv8290@gmail.com` / NGỌC GIÀU (nâng cấp từ user)

### Chi tiết kỹ thuật
- Xoá record admin trong bảng `user_roles` cho user_id `6fa88b51...`
- Insert role admin cho user_id `ac243e4b...` (tuongdung.mv8290)
- Tạo user mới qua Edge Function dùng Supabase Admin API, sau đó insert role admin
- Mật khẩu sẽ được thiết lập theo yêu cầu của cha

