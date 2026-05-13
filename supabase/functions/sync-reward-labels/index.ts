import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Existing labels — never overwrite
    const { data: existing } = await supabase
      .from('address_labels')
      .select('address');
    const existingSet = new Set(
      (existing || []).map((l: any) => l.address.toLowerCase())
    );

    const upserts = new Map<string, string>(); // address -> label

    // 2. camly_transfers (recipient_address + recipient_name)
    const { data: transfers } = await supabase
      .from('camly_transfers')
      .select('recipient_address, recipient_name')
      .not('recipient_name', 'is', null);

    (transfers || []).forEach((t: any) => {
      if (!t.recipient_address || !t.recipient_name) return;
      const addr = t.recipient_address.toLowerCase();
      if (existingSet.has(addr) || upserts.has(addr)) return;
      const label = String(t.recipient_name).trim();
      if (label) upserts.set(addr, label);
    });

    // 3. profiles with wallet_address + display_name (covers gifts receivers/senders)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('display_name, wallet_address')
      .not('wallet_address', 'is', null)
      .not('display_name', 'is', null);

    (profiles || []).forEach((p: any) => {
      if (!p.wallet_address || !p.display_name) return;
      const addr = p.wallet_address.toLowerCase();
      if (existingSet.has(addr) || upserts.has(addr)) return;
      const label = String(p.display_name).trim();
      if (label) upserts.set(addr, label);
    });

    // 4. gifts.tx_hash → transactions.to_address  (covers ERC20/BEP20 + native pair fees)
    //    Áp dụng nhãn tên người nhận cho ĐÚNG địa chỉ on-chain của giao dịch token,
    //    không chỉ wallet_address khai báo trên profile.
    const { data: gifts } = await supabase
      .from('gifts')
      .select('tx_hash, receiver_id')
      .eq('status', 'confirmed')
      .not('tx_hash', 'is', null);

    if (gifts && gifts.length > 0) {
      const receiverIds = Array.from(
        new Set(gifts.map((g: any) => g.receiver_id).filter(Boolean))
      );
      const { data: receiverProfiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', receiverIds);
      const nameByUser = new Map<string, string>();
      (receiverProfiles || []).forEach((p: any) => {
        if (p.display_name) nameByUser.set(p.user_id, String(p.display_name).trim());
      });

      const hashes = Array.from(
        new Set(gifts.map((g: any) => g.tx_hash).filter(Boolean))
      );
      // Batch query transactions by tx_hash (chunk to avoid URL length limit)
      const CHUNK = 100;
      const txByHash = new Map<string, string>(); // hash -> to_address
      for (let i = 0; i < hashes.length; i += CHUNK) {
        const slice = hashes.slice(i, i + CHUNK);
        const { data: txs } = await supabase
          .from('transactions')
          .select('tx_hash, to_address')
          .in('tx_hash', slice);
        (txs || []).forEach((t: any) => {
          if (t.tx_hash && t.to_address) txByHash.set(t.tx_hash, t.to_address);
        });
      }

      gifts.forEach((g: any) => {
        const name = nameByUser.get(g.receiver_id);
        const toAddr = txByHash.get(g.tx_hash);
        if (!name || !toAddr) return;
        const addr = toAddr.toLowerCase();
        if (existingSet.has(addr) || upserts.has(addr)) return;
        upserts.set(addr, name);
      });
    }

    // 5. camly_transfers.tx_hash → transactions.to_address  (same logic, độc lập với gifts)
    const { data: ctxs } = await supabase
      .from('camly_transfers')
      .select('tx_hash, recipient_name')
      .not('tx_hash', 'is', null)
      .not('recipient_name', 'is', null);

    if (ctxs && ctxs.length > 0) {
      const hashes = Array.from(
        new Set(ctxs.map((c: any) => c.tx_hash).filter(Boolean))
      );
      const CHUNK = 100;
      const txByHash = new Map<string, string>();
      for (let i = 0; i < hashes.length; i += CHUNK) {
        const slice = hashes.slice(i, i + CHUNK);
        const { data: txs } = await supabase
          .from('transactions')
          .select('tx_hash, to_address')
          .in('tx_hash', slice);
        (txs || []).forEach((t: any) => {
          if (t.tx_hash && t.to_address) txByHash.set(t.tx_hash, t.to_address);
        });
      }

      ctxs.forEach((c: any) => {
        const toAddr = txByHash.get(c.tx_hash);
        if (!toAddr) return;
        const addr = toAddr.toLowerCase();
        if (existingSet.has(addr) || upserts.has(addr)) return;
        upserts.set(addr, String(c.recipient_name).trim());
      });
    }


    let inserted = 0;
    if (upserts.size > 0) {
      const rows = Array.from(upserts.entries()).map(([address, label]) => ({
        address,
        label,
      }));
      const { error } = await supabase
        .from('address_labels')
        .upsert(rows, { onConflict: 'address' });
      if (error) {
        console.error('upsert error', error);
      } else {
        inserted = rows.length;
      }
    }

    return new Response(
      JSON.stringify({ inserted, skipped: existingSet.size }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('sync-reward-labels error', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
