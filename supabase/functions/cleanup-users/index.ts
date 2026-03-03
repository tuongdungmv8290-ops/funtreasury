import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const KEEP_EMAILS = [
      'lekhanhi772@gmail.com',
      'funtreasury.rich@gmail.com',
      'tuongdung.mv8290@gmail.com',
    ];

    // List all users (paginate)
    const allUsers: any[] = [];
    let page = 1;
    while (true) {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
      if (error) throw error;
      if (!users || users.length === 0) break;
      allUsers.push(...users);
      if (users.length < 100) break;
      page++;
    }

    const toDelete = allUsers.filter(u => !KEEP_EMAILS.includes(u.email?.toLowerCase() || ''));
    const kept = allUsers.filter(u => KEEP_EMAILS.includes(u.email?.toLowerCase() || ''));

    const deleted: string[] = [];
    const errors: string[] = [];

    for (const user of toDelete) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (error) {
        errors.push(`${user.email}: ${error.message}`);
      } else {
        deleted.push(user.email || user.id);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      total_found: allUsers.length,
      kept: kept.map(u => u.email),
      deleted_count: deleted.length,
      deleted,
      errors,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
