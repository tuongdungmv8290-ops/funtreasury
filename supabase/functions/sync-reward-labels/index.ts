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
