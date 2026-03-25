import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 从请求体获取 API Key 和 Secret Key
    const { apiKey, secretKey } = await req.json();

    if (!apiKey || !secretKey) {
      return new Response(
        JSON.stringify({ success: false, message: '缺少 API Key 或 Secret Key' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 调用百度 API 获取 token
    const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.access_token) {
      const expiresInHours = (data.expires_in / 3600).toFixed(1);
      return new Response(
        JSON.stringify({
          success: true,
          message: `百度 API 连接正常！Token 有效期：${expiresInHours} 小时`,
          expires_in: data.expires_in,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: data.error_description || '无法获取 access_token，请检查 API Key 和 Secret Key',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        message: '测试失败：' + (error.message || '未知错误'),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
