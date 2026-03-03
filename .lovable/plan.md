

## Xoá 58 tài khoản không hoạt động

Edge function `cleanup-users` đã có sẵn trong codebase. Các bước thực hiện:

1. **Deploy edge function** `cleanup-users`
2. **Gọi function** để xoá 58 tài khoản, giữ lại 3 admin
3. **Xác nhận kết quả** từ response
4. **Xoá edge function tạm** và dọn config

Không cần thay đổi database - dữ liệu liên kết (profiles, user_roles) sẽ tự động cascade delete.

