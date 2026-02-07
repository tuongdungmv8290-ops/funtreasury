

# Dot 2: He Thong Post (PostFeed, CreatePost, PostCard) + Tich Hop Trang /rewards

## Tong Quan

Xay dung he thong bai viet (Social Feed) cho phep user dang bai, xem feed, va tang thuong truc tiep tren moi bai viet. Tich hop vao trang `/rewards` hien co.

## Cac Files Can Tao Moi

### 1. `src/hooks/usePosts.ts` - Hook quan ly bai viet

- `usePosts()` - Query danh sach posts, join profiles de lay ten/avatar tac gia, sap xep theo `created_at` desc
- `useCreatePost()` - Mutation tao bai viet moi (content, image_url)
- `useDeletePost()` - Mutation xoa bai viet (chi author)
- Invalidate query khi tao/xoa thanh cong

### 2. `src/components/posts/CreatePost.tsx` - Form tao bai viet

- Avatar user hien tai + Textarea nhap noi dung
- Nut "Dang bai" voi style gold
- Validate: content khong duoc rong
- Sau khi dang thanh cong: clear form, hien toast thong bao

### 3. `src/components/posts/PostCard.tsx` - Card hien thi 1 bai viet

- Header: Avatar + Ten tac gia + Thoi gian (relative: "2 gio truoc")
- Body: Noi dung bai viet + Hinh anh (neu co)
- Footer: 
  - Hien thi so gift da nhan va tong gia tri (`gift_count`, `total_gifts_received`)
  - Nut "Tang Thuong" mo GiftDialog voi `postId` va `defaultReceiverId` = author_id
  - Nut xoa bai (chi hien cho author)
- Style: Card voi border gold nhe, hover effect

### 4. `src/components/posts/PostFeed.tsx` - Danh sach bai viet

- Render danh sach PostCard tu `usePosts()`
- Loading state voi Skeleton
- Empty state khi chua co bai viet
- Truyen callback mo GiftDialog xuong PostCard

## Files Can Cap Nhat

### 5. `src/pages/Rewards.tsx` - Trang chinh

Thay doi layout thanh 3 phan:
- **Tren cung**: Header + nut Tang Thuong (giu nguyen)
- **Giua**: CreatePost + PostFeed (phan moi)
- **Duoi**: Grid 2 cot - Gift History (trai) + Leaderboard (phai) (giu nguyen)

Layout moi:

```text
+------------------------------------------+
| FUN Rewards Header + Light Score + Button |
+------------------------------------------+
| CreatePost (textarea + nut Dang bai)     |
+------------------------------------------+
| PostFeed (danh sach bai viet)            |
|   PostCard 1 [Tang Thuong]               |
|   PostCard 2 [Tang Thuong]               |
|   PostCard 3 [Tang Thuong]               |
+------------------------------------------+
| Gift History (2/3)  | Leaderboard (1/3)  |
+------------------------------------------+
```

## Chi Tiet Ky Thuat

### usePosts hook
- Query `posts` table, join `profiles` bang `author_id = user_id` de lay `display_name`, `avatar_url`
- Do RLS chi cho phep user SELECT tat ca posts, INSERT posts cua minh -> khong can thay doi RLS
- Dung `useQuery` voi key `['posts']`, `useMutation` cho create/delete

### PostCard - Nut Tang Thuong
- Click nut "Tang Thuong" tren bai viet -> mo GiftDialog voi props:
  - `defaultReceiverId = post.author_id`
  - `postId = post.id`
- GiftDialog da co san `postId` prop tu Dot 1, chi can truyen vao

### Thoi gian tuong doi
- Dung `date-fns` (da cai san) de format: `formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: vi })`

### Thu tu tao file
1. `src/hooks/usePosts.ts`
2. `src/components/posts/CreatePost.tsx`
3. `src/components/posts/PostCard.tsx`
4. `src/components/posts/PostFeed.tsx`
5. Cap nhat `src/pages/Rewards.tsx`

