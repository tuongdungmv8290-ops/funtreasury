import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    // Test với địa chỉ zero để verify API key hoạt động
    const testAddress = '0x0000000000000000000000000000000000000000';
    const response = await fetch(
      `https://deep-index.moralis.io/api/v2.2/wallets/${testAddress}/transfers?chain=bsc&limit=1`,
      {
        headers: {
          'X-API-Key': api_key,
          'Accept': 'application/json'
        }
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
