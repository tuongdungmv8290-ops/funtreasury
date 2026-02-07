

# Dot 5 Bo Sung - Label Button + Achievement Badges

## 1. Nut "Label" tren bang Transactions

Hien tai cot From/To da hien thi ten tu `useAddressLabels`, nhung admin chua the dat ten cho dia chi moi ngay tren giao dien. Can them nut nho de admin nhap ten truc tiep.

**Cong viec:**
- Them nut "Tag" (icon nho) ben canh dia chi trong cot From/To cua `Transactions.tsx`
- Khi bam: hien Popover nho voi input nhap ten + nut Luu
- Goi `addLabel.mutate()` tu `useAddressLabels` hook (da co san)
- Chi hien nut nay khi `isViewOnly === false` (chi admin thay)
- Sau khi luu, ten se tu dong cap nhat nho invalidateQueries

**Files thay doi:** `src/pages/Transactions.tsx`

---

## 2. Achievement Badges tren PostCard

Hien thi huy hieu (emoji badges) cua tac gia ngay canh ten tren moi bai dang, giup cong dong thay thanh tich cua nhau.

**Cong viec:**
- Import `AchievementBadges` component (da co san tu Dot 5) vao `PostCard.tsx`
- Dat component ngay sau `LightScoreBadge` trong phan header
- Truyen `post.author_id` vao component
- Component se tu dong query `user_achievements` va hien thi emoji badges

**Files thay doi:** `src/components/posts/PostCard.tsx`

---

## Thu Tu Thuc Hien

| Buoc | Noi Dung | File |
|------|----------|------|
| 1 | Them Popover label inline tren Transactions | `Transactions.tsx` |
| 2 | Them AchievementBadges tren PostCard | `PostCard.tsx` |

---

## Chi Tiet Ky Thuat

### Transactions.tsx - Label Popover (dong 803-829)

```text
Hien tai:
  <span>{label}</span>
  <button copy />

Sau khi update:
  <span>{label}</span>
  <button copy />
  {!isViewOnly && (
    <Popover>
      <PopoverTrigger>
        <Tag icon nho />
      </PopoverTrigger>
      <PopoverContent>
        <Input value={newLabel} placeholder="Nhap ten..." />
        <Button onClick={() => addLabel.mutate({ address: addr, label: newLabel })}>
          Luu
        </Button>
      </PopoverContent>
    </Popover>
  )}
```

### PostCard.tsx - Achievement Badges (dong 38-43)

```text
Hien tai:
  <p>{post.author_name}</p>
  {post.author_light_score > 0 && <LightScoreBadge />}

Sau khi update:
  <p>{post.author_name}</p>
  {post.author_light_score > 0 && <LightScoreBadge />}
  <AchievementBadges userId={post.author_id} maxShow={3} />
```
