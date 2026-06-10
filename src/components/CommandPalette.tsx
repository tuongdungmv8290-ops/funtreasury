import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard, ArrowLeftRight, Gift, Coins, Sun, Image as ImageIcon,
  FileText, Settings, Users, Wallet, Tag, Globe, Send, Moon, LogOut, Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const { data: wallets = [] } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const { data } = await supabase.from('wallets').select('address, name');
      return data || [];
    },
  });

  const { data: labels = [] } = useQuery({
    queryKey: ['address-labels'],
    queryFn: async () => {
      const { data } = await supabase.from('address_labels').select('address, label').order('label');
      return data || [];
    },
  });

  const go = (path: string) => { setOpen(false); navigate(path); };

  const copy = async (text: string, msg: string) => {
    try { await navigator.clipboard.writeText(text); toast.success(msg); } catch { toast.error('Không copy được'); }
    setOpen(false);
  };

  const runSync = async () => {
    setOpen(false);
    toast.info('Đang đồng bộ từ fun.rich…');
    const { data, error } = await supabase.functions.invoke('scrape-funrich-labels');
    if (error || data?.error) return toast.error(error?.message || data?.error || 'Sync lỗi');
    toast.success(`🌐 fun.rich: tìm ${data.scraped}, thêm ${data.inserted}`);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Tìm trang, ví, nhãn, hoặc hành động… (⌘K)" />
      <CommandList>
        <CommandEmpty>Không có kết quả.</CommandEmpty>

        <CommandGroup heading="Trang">
          <CommandItem onSelect={() => go('/')}><LayoutDashboard /> <span className="ml-2">Dashboard</span></CommandItem>
          <CommandItem onSelect={() => go('/transactions')}><ArrowLeftRight /> <span className="ml-2">Giao dịch</span></CommandItem>
          <CommandItem onSelect={() => go('/rewards')}><Gift /> <span className="ml-2">Phần thưởng</span></CommandItem>
          <CommandItem onSelect={() => go('/camly')}><Coins /> <span className="ml-2">CAMLY</span></CommandItem>
          <CommandItem onSelect={() => go('/anh-sang')}><Sun /> <span className="ml-2">Ánh Sáng</span></CommandItem>
          <CommandItem onSelect={() => go('/nft-gallery')}><ImageIcon /> <span className="ml-2">NFT Gallery</span></CommandItem>
          <CommandItem onSelect={() => go('/prices')}><FileText /> <span className="ml-2">Giá Crypto</span></CommandItem>
          <CommandItem onSelect={() => go('/constitution')}><FileText /> <span className="ml-2">Hiến Pháp Ánh Sáng</span></CommandItem>
          <CommandItem onSelect={() => go('/fun-ecosystem')}><Users /> <span className="ml-2">FUN Ecosystem</span></CommandItem>
          <CommandItem onSelect={() => go('/settings')}><Settings /> <span className="ml-2">Cài đặt</span></CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Hành động nhanh">
          <CommandItem onSelect={runSync}><Globe /> <span className="ml-2">Cập nhật nhãn từ fun.rich</span></CommandItem>
          <CommandItem onSelect={() => go('/camly')}><Send /> <span className="ml-2">Gửi CAMLY</span></CommandItem>
          <CommandItem onSelect={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setOpen(false); }}>
            <Moon /> <span className="ml-2">Đổi theme ({theme === 'dark' ? 'sáng' : 'tối'})</span>
          </CommandItem>
          <CommandItem onSelect={() => { setOpen(false); signOut(); }}><LogOut /> <span className="ml-2">Đăng xuất</span></CommandItem>
        </CommandGroup>

        {wallets.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Ví Treasury">
              {wallets.map((w) => (
                <CommandItem
                  key={w.address}
                  value={`${w.name} ${w.address}`}
                  onSelect={() => copy(w.address, `Đã copy địa chỉ ${w.name}`)}
                >
                  <Wallet /> <span className="ml-2 flex-1 truncate">{w.name}</span>
                  <CommandShortcut className="font-mono">{w.address.slice(0, 6)}…{w.address.slice(-4)}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {labels.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`Nhãn ví (${labels.length})`}>
              {labels.slice(0, 50).map((l) => (
                <CommandItem
                  key={l.address}
                  value={`${l.label} ${l.address}`}
                  onSelect={() => copy(l.address, `Đã copy địa chỉ ${l.label}`)}
                >
                  <Tag /> <span className="ml-2 flex-1 truncate">{l.label}</span>
                  <CommandShortcut className="font-mono">{l.address.slice(0, 6)}…{l.address.slice(-4)}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
