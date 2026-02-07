import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Search, Upload, Pencil, X, Check, Wallet, Link, Send as SendIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileRow {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
  telegram: string | null;
}

export function MemberDirectory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editWallet, setEditWallet] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editTelegram, setEditTelegram] = useState('');
  const [avatarMode, setAvatarMode] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: isAdmin } = useQuery({
    queryKey: ['is-admin', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', user!.id).eq('role', 'admin').maybeSingle();
      return !!data;
    },
  });

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, user_id, display_name, email, avatar_url, wallet_address, telegram').order('created_at', { ascending: true });
      if (error) throw error;
      return data as ProfileRow[];
    },
  });

  const updateProfile = useMutation({
    mutationFn: async ({ userId, name, wallet, avatar, telegram }: { userId: string; name: string; wallet: string; avatar: string; telegram: string }) => {
      const { error } = await supabase.from('profiles').update({
        display_name: name,
        wallet_address: wallet || null,
        avatar_url: avatar || null,
        telegram: telegram || null,
      }).eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      toast.success('Đã cập nhật thông tin thành viên!');
      setEditingId(null);
    },
    onError: () => toast.error('Không thể cập nhật. Bạn có quyền admin?'),
  });

  const handleEdit = (p: ProfileRow) => {
    setEditingId(p.user_id);
    setEditName(p.display_name || '');
    setEditWallet(p.wallet_address || '');
    setEditAvatarUrl(p.avatar_url || '');
    setEditTelegram(p.telegram || '');
    setAvatarMode('upload');
  };

  const handleSave = (userId: string) => {
    updateProfile.mutate({ userId, name: editName, wallet: editWallet, avatar: editAvatarUrl, telegram: editTelegram });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>, userId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${userId}/avatar.${ext}`;
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      setEditAvatarUrl(urlData.publicUrl + '?t=' + Date.now());
      toast.success('Đã upload ảnh!');
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast.error('Upload thất bại: ' + (err instanceof Error ? err.message : 'Lỗi không xác định'));
    } finally {
      setIsUploading(false);
    }
  };

  const filtered = profiles?.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.display_name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.wallet_address?.toLowerCase().includes(q) ||
      p.telegram?.toLowerCase().includes(q)
    );
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 flex-wrap gap-2">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Thư mục thành viên
        </CardTitle>
        <Badge variant="outline" className="text-xs border-primary/50 text-primary">
          {profiles?.length || 0} thành viên
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm tên, email, ví, telegram..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : !filtered?.length ? (
          <p className="text-center text-muted-foreground py-8">Không tìm thấy thành viên</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(p => {
              const isEditing = editingId === p.user_id;

              return (
                <div
                  key={p.user_id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-secondary/20 hover:bg-secondary/40 transition-colors"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0 pt-1">
                    <Avatar className="w-12 h-12 border-2 border-primary/20">
                      <AvatarImage src={isEditing ? editAvatarUrl : (p.avatar_url || undefined)} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {(p.display_name || p.email || '?').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && isAdmin && avatarMode === 'upload' && (
                      <>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={e => handleAvatarUpload(e, p.user_id)}
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/80"
                          disabled={isUploading}
                        >
                          <Upload className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          placeholder="Tên hiển thị"
                          className="h-8 text-sm"
                        />
                        <div className="flex items-center gap-1">
                          <Wallet className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <Input
                            value={editWallet}
                            onChange={e => setEditWallet(e.target.value)}
                            placeholder="0x... địa chỉ ví"
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <SendIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <Input
                            value={editTelegram}
                            onChange={e => setEditTelegram(e.target.value)}
                            placeholder="@username hoặc link Telegram"
                            className="h-8 text-xs"
                          />
                        </div>
                        {/* Avatar mode toggle */}
                        <div className="space-y-1">
                          <Tabs value={avatarMode} onValueChange={v => setAvatarMode(v as 'upload' | 'url')}>
                            <TabsList className="h-7 p-0.5">
                              <TabsTrigger value="upload" className="text-xs h-6 px-2 gap-1">
                                <Upload className="w-3 h-3" /> Tải ảnh
                              </TabsTrigger>
                              <TabsTrigger value="url" className="text-xs h-6 px-2 gap-1">
                                <Link className="w-3 h-3" /> Dán ảnh
                              </TabsTrigger>
                            </TabsList>
                          </Tabs>
                        {avatarMode === 'url' && (
                            <div
                              className="relative border-2 border-dashed border-primary/30 rounded-md p-3 text-center cursor-pointer hover:border-primary/60 transition-colors min-h-[60px] flex items-center justify-center"
                              onPaste={async (e) => {
                                const items = e.clipboardData?.items;
                                if (!items) return;
                                for (const item of Array.from(items)) {
                                  if (item.type.startsWith('image/')) {
                                    e.preventDefault();
                                    const file = item.getAsFile();
                                    if (!file) return;
                                    setIsUploading(true);
                                    try {
                                      const ext = file.type.split('/')[1] || 'png';
                                      const path = `${p.user_id}/avatar-paste.${ext}`;
                                      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
                                      if (error) throw error;
                                      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
                                      setEditAvatarUrl(urlData.publicUrl + '?t=' + Date.now());
                                      toast.success('Đã dán ảnh thành công!');
                                    } catch (err) {
                                      console.error('Paste avatar upload error:', err);
                                      toast.error('Dán ảnh thất bại: ' + (err instanceof Error ? err.message : 'Lỗi không xác định'));
                                    } finally {
                                      setIsUploading(false);
                                    }
                                    return;
                                  }
                                }
                                toast.error('Không tìm thấy ảnh trong clipboard');
                              }}
                              tabIndex={0}
                            >
                              {isUploading ? (
                                <p className="text-xs text-muted-foreground">Đang tải...</p>
                              ) : editAvatarUrl && avatarMode === 'url' ? (
                                <img src={editAvatarUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover mx-auto" />
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  📋 Nhấn vào đây rồi <span className="font-semibold text-primary">Ctrl+V</span> để dán ảnh
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium text-sm truncate text-foreground">
                          {p.display_name || <span className="text-muted-foreground italic">Chưa đặt tên</span>}
                        </p>
                        {p.wallet_address && (
                          <p className="text-xs font-mono text-muted-foreground truncate flex items-center gap-1">
                            <Wallet className="w-3 h-3 shrink-0" />
                            {p.wallet_address.slice(0, 6)}...{p.wallet_address.slice(-4)}
                          </p>
                        )}
                        {!p.wallet_address && (
                          <p className="text-xs text-muted-foreground/60 italic">Chưa có ví</p>
                        )}
                        {p.telegram && (
                          <a
                            href={p.telegram.startsWith('http') ? p.telegram : `https://t.me/${p.telegram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary/80 hover:text-primary flex items-center gap-1 truncate"
                          >
                            <SendIcon className="w-3 h-3 shrink-0" />
                            {p.telegram}
                          </a>
                        )}
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  {isAdmin && (
                    <div className="shrink-0 flex items-center gap-1 pt-1">
                      {isEditing ? (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSave(p.user_id)} disabled={updateProfile.isPending}>
                            <Check className="w-4 h-4 text-green-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingId(null)}>
                            <X className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(p)}>
                          <Pencil className="w-4 h-4 text-muted-foreground hover:text-primary" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
