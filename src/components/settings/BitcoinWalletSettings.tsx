import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bitcoin, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface BtcWallet {
  id: string;
  name: string;
  address: string;
  extra_addresses: string[] | null;
  manual_balance: number | null;
}

export function BitcoinWalletSettings() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Record<string, { extra: string; manual: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const { data: wallets, isLoading } = useQuery({
    queryKey: ['btc-wallet-settings'],
    queryFn: async (): Promise<BtcWallet[]> => {
      const { data, error } = await supabase
        .from('wallets')
        .select('id, name, address, extra_addresses, manual_balance')
        .eq('chain', 'BTC')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as BtcWallet[];
    },
  });

  useEffect(() => {
    if (!wallets) return;
    setDraft(prev => {
      const next = { ...prev };
      for (const w of wallets) {
        if (!next[w.id]) {
          next[w.id] = {
            extra: (w.extra_addresses || []).join('\n'),
            manual: w.manual_balance === null ? '' : String(w.manual_balance),
          };
        }
      }
      return next;
    });
  }, [wallets]);

  const save = async (w: BtcWallet) => {
    const d = draft[w.id];
    if (!d) return;
    setSavingId(w.id);
    const extra = d.extra
      .split(/[\s,]+/)
      .map(s => s.trim())
      .filter(Boolean);
    const manual = d.manual.trim() === '' ? null : Number(d.manual.replace(',', '.'));
    if (manual !== null && !Number.isFinite(manual)) {
      toast.error('Số dư ghim không hợp lệ');
      setSavingId(null);
      return;
    }
    const { error } = await supabase
      .from('wallets')
      .update({ extra_addresses: extra, manual_balance: manual })
      .eq('id', w.id);
    setSavingId(null);
    if (error) {
      toast.error('Lỗi khi lưu: ' + error.message);
      return;
    }
    toast.success('Đã lưu cấu hình ví Bitcoin');
    queryClient.invalidateQueries({ queryKey: ['btc-wallet-settings'] });
  };

  const refreshBalances = async () => {
    setSyncing(true);
    const { error } = await supabase.functions.invoke('get-token-balances');
    setSyncing(false);
    if (error) {
      toast.error('Không cập nhật được số dư: ' + error.message);
      return;
    }
    toast.success('Đã cập nhật số dư từ mạng Bitcoin');
    queryClient.invalidateQueries({ queryKey: ['wallets-raw'] });
    queryClient.invalidateQueries({ queryKey: ['token-balances-db-raw'] });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bitcoin className="h-5 w-5 text-primary" />
          Ví Bitcoin nâng cao
        </CardTitle>
        <CardDescription>
          Thêm các địa chỉ phụ của cùng một ví (MetaMask sinh nhiều địa chỉ) để cộng gộp số dư,
          hoặc ghim số dư thủ công. Bỏ trống ô ghim để hệ thống tự lấy số thật trên mạng.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
        {(wallets || []).map(w => (
          <div key={w.id} className="space-y-3 rounded-lg border border-border p-4">
            <div>
              <p className="font-semibold">{w.name}</p>
              <p className="font-mono text-xs text-muted-foreground break-all">{w.address}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`extra-${w.id}`}>Địa chỉ phụ (mỗi dòng một địa chỉ)</Label>
                <textarea
                  id={`extra-${w.id}`}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background p-2 font-mono text-xs"
                  value={draft[w.id]?.extra ?? ''}
                  onChange={e =>
                    setDraft(p => ({ ...p, [w.id]: { ...p[w.id], extra: e.target.value } }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`manual-${w.id}`}>Số dư ghim (BTC)</Label>
                <Input
                  id={`manual-${w.id}`}
                  inputMode="decimal"
                  placeholder="Để trống = tự động theo mạng"
                  value={draft[w.id]?.manual ?? ''}
                  onChange={e =>
                    setDraft(p => ({ ...p, [w.id]: { ...p[w.id], manual: e.target.value } }))
                  }
                />
              </div>
            </div>
            <Button size="sm" onClick={() => save(w)} disabled={savingId === w.id}>
              {savingId === w.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Lưu ví này
            </Button>
          </div>
        ))}
        <Button variant="outline" onClick={refreshBalances} disabled={syncing}>
          {syncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Cập nhật lại số dư Bitcoin
        </Button>
      </CardContent>
    </Card>
  );
}
