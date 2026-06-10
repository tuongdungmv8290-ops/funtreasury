import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADDR_RE = /(0x[a-fA-F0-9]{40}|bc1[a-z0-9]{20,})/g;
const FUN_RICH_URL = 'https://fun.rich/funtreasury';

function parsePairs(markdown: string): { address: string; label: string }[] {
  const out = new Map<string, string>();
  const lines = markdown.split(/\r?\n/).map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const matches = [...line.matchAll(ADDR_RE)];
    if (matches.length === 0) continue;
    for (const m of matches) {
      const address = m[1].toLowerCase();
      if (out.has(address)) continue;
      // Strip the address + markdown junk to find a label on the same line
      let name = line.replace(ADDR_RE, '').replace(/[\[\]\(\)\|\*•\-—,:`"']+/g, ' ').replace(/\s+/g, ' ').trim();
      // Fallback: previous non-address line
      if (!name && i > 0) {
        const prev = lines[i - 1].replace(/[\[\]\(\)\|\*•\-—,:`"']+/g, ' ').replace(/\s+/g, ' ').trim();
        if (prev && !ADDR_RE.test(prev)) name = prev;
      }
      name = name.slice(0, 80).trim();
      if (name && name.length >= 2) out.set(address, name);
    }
  }
  return Array.from(out.entries()).map(([address, label]) => ({ address, label }));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    if (!FIRECRAWL_API_KEY) throw new Error('FIRECRAWL_API_KEY is not configured');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Scrape via Firecrawl
    const fcRes = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: FUN_RICH_URL,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 2000,
      }),
    });

    const fcData = await fcRes.json();
    if (!fcRes.ok) {
      return new Response(
        JSON.stringify({ error: `Firecrawl ${fcRes.status}`, detail: fcData }),
        { status: fcRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markdown = fcData?.data?.markdown || fcData?.markdown || '';
    if (!markdown) {
      return new Response(
        JSON.stringify({ error: 'No markdown returned', detail: fcData }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parse pairs
    const pairs = parsePairs(markdown);

    // 3. Skip existing addresses (do NOT overwrite manual edits)
    const { data: existing } = await supabase.from('address_labels').select('address');
    const existingSet = new Set((existing || []).map((l: any) => l.address.toLowerCase()));
    const toUpsert = pairs.filter(p => !existingSet.has(p.address));

    let inserted = 0;
    if (toUpsert.length > 0) {
      const { error } = await supabase
        .from('address_labels')
        .upsert(toUpsert, { onConflict: 'address' });
      if (error) throw error;
      inserted = toUpsert.length;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        scraped: pairs.length,
        inserted,
        skipped_existing: pairs.length - toUpsert.length,
        url: FUN_RICH_URL,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('scrape-funrich-labels error', err);
    return new Response(
      JSON.stringify({ error: String(err?.message || err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
