import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Trash2, Save, ClipboardPaste, Search, Sparkles, Pencil, X, Check, Globe } from 'lucide-react';
import { toast } from 'sonner';

const ADDR_RE = /(0x[a-fA-F0-9]{40}|bc1[a-z0-9]{20,})/g;
const ADDR_RE_ONE = /(0x[a-fA-F0-9]{40}|bc1[a-z0-9]{20,})/;

interface Pair { name: string; address: string; checked: boolean; }

function parseInput(raw: string): Pair[] {
  if (!raw.trim()) return [];
  // Try JSON first
  try {
    const j = JSON.parse(raw);
    const arr: any[] = Array.isArray(j) ? j : (Array.isArray(j?.data) ? j.data : []);
    const out: Pair[] = [];
    arr.forEach((it: any) => {
      const address = String(it.address || it.wallet || it.recipient_address || it.to || '').trim();
      const name = String(it.name || it.recipient_name || it.display_name || it.label || '').trim();
      if (ADDR_RE_ONE.test(address) && name) {
        out.push({ name, address, checked: true });
      }
    });
    if (out.length > 0) return dedupe(out);
  } catch {}

  // HTML/text fallback
  const text = raw
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
  const lines = text.split(/\n+/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const out: Pair[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(ADDR_RE_ONE);
    if (!m) continue;
    const address = m[1];
    let name = lines[i].replace(ADDR_RE, '').replace(/[|•\-—,:]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!name && i > 0) name = lines[i - 1].trim();
    // strip leading/trailing junk
    name = name.replace(/^[ "'`]+|[ "'`]+$/g, '').trim();
    if (name && name.length <= 80) out.push({ name, address, checked: true });
  }
  return dedupe(out);
}

function dedupe(arr: Pair[]): Pair[] {
  const m = new Map<string, Pair>();
  arr.forEach(p => {
    const k = p.address.toLowerCase();
    if (!m.has(k)) m.set(k, p);
  });
  return Array.from(m.values());
}

export function AddressLabelManager() {
  const qc = useQueryClient();
  const [raw, setRaw] = useState('');
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<string | null>(null); // old address
  const [editLabel, setEditLabel] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const { data: labels = [] } = useQuery({
    queryKey: ['address-labels'],
    queryFn: async () => {
      const { data, error } = await supabase.from('address_labels').select('address, label').order('label');
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return labels;
    const s = search.toLowerCase();
    return labels.filter(l => l.label.toLowerCase().includes(s) || l.address.toLowerCase().includes(s));
  }, [labels, search]);

  const handleParse = () => {
    const result = parseInput(raw);
    if (result.length === 0) {
      toast.error('Không tìm thấy cặp tên ↔ địa chỉ nào');
      return;
    }
    setPairs(result);
    toast.success(`Đã trích xuất ${result.length} cặp`);
  };

  const handlePaste = async () => {
    try {
      const t = await navigator.clipboard.readText();
      setRaw(t);
      toast.success('Đã dán nội dung');
    } catch {
      toast.error('Không thể đọc clipboard');
    }
  };

  const saveAll = useMutation({
    mutationFn: async () => {
      const rows = pairs.filter(p => p.checked && p.name.trim() && ADDR_RE_ONE.test(p.address))
        .map(p => ({ address: p.address.toLowerCase(), label: p.name.trim() }));
      if (rows.length === 0) throw new Error('Không có dòng hợp lệ');
      const { error } = await supabase.from('address_labels').upsert(rows, { onConflict: 'address' });
      if (error) throw error;
      return rows.length;
    },
    onSuccess: (n) => {
      toast.success(`✅ Đã lưu ${n} nhãn vào address_labels`);
      setPairs([]);
      setRaw('');
      qc.invalidateQueries({ queryKey: ['address-labels'] });
    },
    onError: (e: any) => toast.error(e.message || 'Lưu thất bại — cần quyền admin'),
  });

  const updateLabel = useMutation({
    mutationFn: async ({ oldAddress, address, label }: { oldAddress: string; address: string; label: string }) => {
      const newAddr = address.trim().toLowerCase();
      const oldAddr = oldAddress.toLowerCase();
      const cleanLabel = label.trim();
      if (!cleanLabel) throw new Error('Tên không được để trống');
      if (!ADDR_RE_ONE.test(newAddr)) throw new Error('Địa chỉ không hợp lệ (0x… hoặc bc1…)');

      if (newAddr === oldAddr) {
        const { error } = await supabase.from('address_labels').upsert(
          { address: newAddr, label: cleanLabel },
          { onConflict: 'address' }
        );
        if (error) throw error;
      } else {
        // Check new address doesn't collide
        const { data: existing } = await supabase
          .from('address_labels').select('address').eq('address', newAddr).maybeSingle();
        if (existing) throw new Error('Địa chỉ mới đã có nhãn — xoá nhãn cũ trước');
        const { error: delErr } = await supabase.from('address_labels').delete().eq('address', oldAddr);
        if (delErr) throw delErr;
        const { error: insErr } = await supabase.from('address_labels').insert({ address: newAddr, label: cleanLabel });
        if (insErr) throw insErr;
      }
    },
    onSuccess: () => {
      toast.success('Đã cập nhật');
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['address-labels'] });
    },
    onError: (e: any) => toast.error(e.message || 'Lỗi'),
  });

  const deleteLabel = useMutation({
    mutationFn: async (address: string) => {
      const { error } = await supabase.from('address_labels').delete().eq('address', address.toLowerCase());
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Đã xoá');
      qc.invalidateQueries({ queryKey: ['address-labels'] });
    },
    onError: (e: any) => toast.error(e.message || 'Lỗi'),
  });

  const autoSync = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('scrape-funrich-labels');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { scraped: number; inserted: number; skipped_existing: number };
    },
    onSuccess: (d) => {
      toast.success(`🌐 fun.rich: tìm ${d.scraped} ví, thêm mới ${d.inserted}, bỏ qua ${d.skipped_existing} đã có`);
      qc.invalidateQueries({ queryKey: ['address-labels'] });
    },
    onError: (e: any) => toast.error(e.message || 'Sync thất bại'),
  });

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
        <h3 className="text-xl font-bold text-treasury-gold flex items-center gap-2">
          <Sparkles className="w-5 h-5" /> Quản lý nhãn ví (Address Labels)
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Dán nội dung từ <span className="font-mono">fun.rich/funtreasury</span> (HTML/JSON/text) → hệ thống tự trích tên ↔ địa chỉ.
        </p>
        </div>
        <Button
          onClick={() => autoSync.mutate()}
          disabled={autoSync.isPending}
          className="bg-treasury-gold/10 text-treasury-gold border border-treasury-gold/30 hover:bg-treasury-gold/20"
        >
          <Globe className="w-4 h-4 mr-2" />
          {autoSync.isPending ? 'Đang scrape…' : 'Cập nhật từ fun.rich'}
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Nội dung dán vào</label>
          <Button size="sm" variant="outline" onClick={handlePaste}>
            <ClipboardPaste className="w-4 h-4 mr-2" /> Dán từ clipboard
          </Button>
        </div>
        <Textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder='Ví dụ: copy toàn bộ trang fun.rich/funtreasury (Ctrl+A → Ctrl+C) rồi dán vào đây. Hoặc JSON: [{"name":"Hồ Thị Hương","address":"0x..."}]'
          className="font-mono text-xs min-h-[160px]"
        />
        <div className="flex gap-2">
          <Button onClick={handleParse} disabled={!raw.trim()}>
            <Sparkles className="w-4 h-4 mr-2" /> Trích xuất tên ↔ địa chỉ
          </Button>
          {pairs.length > 0 && (
            <Button variant="outline" onClick={() => { setPairs([]); setRaw(''); }}>Xoá</Button>
          )}
        </div>
      </div>

      {pairs.length > 0 && (
        <div className="space-y-2 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Xem trước ({pairs.filter(p => p.checked).length}/{pairs.length} sẽ lưu)
            </p>
            <Button
              size="sm"
              onClick={() => saveAll.mutate()}
              disabled={saveAll.isPending || pairs.filter(p => p.checked).length === 0}
            >
              <Save className="w-4 h-4 mr-2" /> Lưu tất cả
            </Button>
          </div>
          <div className="max-h-[320px] overflow-y-auto space-y-1">
            {pairs.map((p, idx) => (
              <div key={p.address} className="flex items-center gap-2 p-2 rounded-lg bg-background/50 hover:bg-background">
                <input
                  type="checkbox"
                  checked={p.checked}
                  onChange={(e) => setPairs(prev => prev.map((x, i) => i === idx ? { ...x, checked: e.target.checked } : x))}
                  className="w-4 h-4"
                />
                <Input
                  value={p.name}
                  onChange={(e) => setPairs(prev => prev.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                  className="h-8 text-sm flex-1"
                />
                <span className="text-xs font-mono text-muted-foreground truncate max-w-[180px]">
                  {p.address.slice(0, 10)}...{p.address.slice(-6)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            Nhãn hiện có <Badge variant="outline" className="ml-2">{labels.length}</Badge>
          </p>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên hoặc địa chỉ..."
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>
        <div className="max-h-[400px] overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Chưa có nhãn nào</p>
          ) : filtered.map(l => (
            <div key={l.address} className="flex items-center gap-2 p-2 rounded-lg bg-background/50 hover:bg-background group">
              {editing === l.address ? (
                <>
                  <Input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    placeholder="Tên"
                    className="h-8 text-sm flex-1"
                    autoFocus
                  />
                  <Input
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && updateLabel.mutate({ oldAddress: l.address, address: editAddress, label: editLabel })}
                    placeholder="0x… hoặc bc1…"
                    className="h-8 text-xs font-mono flex-1 max-w-[260px]"
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7" disabled={updateLabel.isPending}
                    onClick={() => updateLabel.mutate({ oldAddress: l.address, address: editAddress, label: editLabel })}>
                    <Check className="w-4 h-4 text-green-500" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium flex-1">{l.label}</span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {l.address.slice(0, 10)}...{l.address.slice(-6)}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100"
                    onClick={() => { setEditing(l.address); setEditLabel(l.label); setEditAddress(l.address); }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:text-destructive"
                    onClick={() => { if (confirm(`Xoá nhãn "${l.label}"?`)) deleteLabel.mutate(l.address); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
