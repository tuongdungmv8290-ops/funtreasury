import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized - No authorization header'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized - Invalid token'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check admin role
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      console.error('User is not an admin:', user.id);
      return new Response(JSON.stringify({
        success: false,
        error: 'Forbidden - Admin access required'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Authenticated admin user:', user.email);

    const { api_key } = await req.json();
    
    if (!api_key) {
      console.error('API key is missing from request');
      return new Response(JSON.stringify({
        success: false,
        error: 'Vui lòng nhập Moralis API Key'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Testing Moralis connection with provided API key...');

    // Use Headers object to properly handle special characters
    const headers = new Headers();
    headers.set('X-API-Key', api_key.trim());
    headers.set('Accept', 'application/json');
    
    // Use web3 version endpoint - simple and always works for API key validation
    const response = await fetch(
      `https://deep-index.moralis.io/api/v2/web3/version`,
      {
        method: 'GET',
        headers: headers
      }
    );

    console.log('Moralis API response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Moralis test successful! Response:', JSON.stringify(data).substring(0, 200));
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Kết nối Moralis thành công! Ready for on-chain sync realtime!'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      const errorText = await response.text();
      console.error('Moralis API error:', response.status, errorText);
      
      let errorMessage = 'Moralis connection failed';
      if (response.status === 401) {
        errorMessage = 'Invalid API key - Vui lòng kiểm tra lại key của bạn';
      } else if (response.status === 403) {
        errorMessage = 'API key không có quyền truy cập - Kiểm tra tier của bạn';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded - Vui lòng thử lại sau';
      } else {
        errorMessage = `Moralis error: ${response.status} - ${errorText}`;
      }
      
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Test connection error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Không thể kết nối tới Moralis API';
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
