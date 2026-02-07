

# Realtime Messaging cho Gift Messages

## Tong Quan

Them tinh nang realtime cho he thong tin nhan gift: khi co tin nhan moi duoc gui/nhan, UI tu dong cap nhat ma khong can refresh trang.

## Thay Doi Can Thuc Hien

### 1. Migration: Enable Realtime cho bang `messages`

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
```

### 2. Cap nhat `src/hooks/useMessages.ts`

Them realtime subscription trong `useMessages` hook:
- Subscribe vao channel `messages-{sortedUserIds}` lang nghe `postgres_changes` tren bang `messages`
- Filter theo `sender_id` va `receiver_id` de chi nhan tin nhan lien quan
- Khi co INSERT moi -> `invalidateQueries(['messages', ...])` de refetch
- Khi co UPDATE (read status) -> cung invalidate
- Cleanup subscription khi unmount hoac khi `otherUserId` thay doi

Them realtime vao `useUnreadCount`:
- Subscribe vao channel `unread-{userId}` lang nghe INSERT/UPDATE tren `messages` voi `receiver_id = user.id`
- Invalidate `['unread-messages']` khi co thay doi

### 3. Thu tu

1. Chay migration enable realtime
2. Cap nhat `useMessages.ts` - them `useEffect` voi Supabase realtime channel

## Chi Tiet Ky Thuat

### useMessages - Realtime subscription

```text
useEffect:
  if (!user || !otherUserId) return
  
  channel = supabase.channel(`messages-${user.id}-${otherUserId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
      queryClient.invalidateQueries({ queryKey: ['messages', user.id, otherUserId] })
    })
    .subscribe()
  
  return () => supabase.removeChannel(channel)
```

### useUnreadCount - Realtime subscription

```text
useEffect:
  if (!user) return
  
  channel = supabase.channel(`unread-${user.id}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, () => {
      queryClient.invalidateQueries({ queryKey: ['unread-messages', user.id] })
    })
    .subscribe()
  
  return () => supabase.removeChannel(channel)
```

### Files thay doi

| File | Thay Doi |
|------|----------|
| Migration SQL | Enable realtime cho `messages` table |
| `src/hooks/useMessages.ts` | Them useEffect realtime subscriptions cho `useMessages` va `useUnreadCount` |

