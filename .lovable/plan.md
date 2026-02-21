

## Cap nhat du lieu giao dich vi FUN TREASURY (FUN PLAY)

### Van de hien tai
Database chi co **6 giao dich** cho vi `0xa496...DA5d`. UI dang hien thi dung tat ca 6 giao dich nay. Neu tren blockchain co 16 giao dich, thi 10 giao dich con lai chua duoc dong bo (sync) tu BNB Chain vao database.

### Giai phap
Goi lai Edge Function `sync-transactions` de dong bo tat ca giao dich tu blockchain vao database. Sau khi sync xong, UI se tu dong hien thi day du tat ca giao dich.

### Cac buoc thuc hien

1. **Kiem tra va goi `sync-transactions` Edge Function** cho vi FUN TREASURY de dong bo du lieu moi nhat tu BNB Chain
2. **Xac nhan** so luong giao dich trong database sau khi sync
3. **Neu can**, cap nhat logic sync de dam bao lay het lich su giao dich (khong bi gioi han so trang hoac so luong)

### Luu y
- Code hien thi (UI) dang hoat dong dung - khong can limit, hien thi tat ca giao dich co trong database
- Van de nam o phia **du lieu chua duoc dong bo**, khong phai loi hien thi

