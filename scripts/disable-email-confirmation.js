// 关闭 Supabase 邮箱验证脚本
// 运行：node scripts/disable-email-confirmation.js
// 注意：需要使用 Supabase Management API，需要你的 Service Role Key 或 Management Token

const https = require('https');

const SUPABASE_PROJECT_ID = 'vqtrfkigzqtcthrivbzn';
// 注意：这里需要使用 Management Token，不是 anon key
// 在 https://supabase.com/dashboard/project/vqtrfkigzqtcthrivbzn/settings/api 获取
const MANAGEMENT_TOKEN = 'YOUR_MANAGEMENT_TOKEN_HERE';

// 禁用邮箱验证的配置
const options = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/${SUPABASE_PROJECT_ID}/config`,
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${MANAGEMENT_TOKEN}`,
    'Content-Type': 'application/json',
    'User-Agent': 'supabase-management-api'
  }
};

const data = JSON.stringify({
  auth: {
    email_confirm_enabled: false
  }
});

console.log('正在禁用邮箱验证...');
console.log('项目 ID:', SUPABASE_PROJECT_ID);

const req = https.request(options, (res) => {
  let body = '';

  console.log('状态码:', res.statusCode);

  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    console.log('响应:', JSON.parse(body));
    if (res.statusCode === 200) {
      console.log('✅ 邮箱验证已禁用！');
    } else {
      console.log('❌ 请求失败，请检查 Management Token 是否正确');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ 请求失败:', error.message);
  console.log('\n请确保:');
  console.log('1. 已设置正确的 MANAGEMENT_TOKEN');
  console.log('2. 网络连接正常');
});

req.write(data);
req.end();
