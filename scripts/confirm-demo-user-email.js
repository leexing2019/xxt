// 确认演示账号邮箱脚本
// 运行：node scripts/confirm-demo-user-email.js

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vqtrfkigzqtcthrivbzn.supabase.co';
// Service Role Key
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_L08GfNDCgBOngRXkilv1lQ_VhSgjvYN';

// 使用 Service Role Key 创建 admin 客户端
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function confirmUserEmail(email) {
  console.log('正在确认用户邮箱:', email);

  // 首先获取用户列表
  const { data: usersData, error: fetchError } = await supabaseAdmin.auth.admin.listUsers();

  if (fetchError) {
    console.error('获取用户列表失败:', fetchError.message);
    return;
  }

  const user = usersData.users.find(u => u.email === email);

  if (!user) {
    console.error('未找到用户:', email);
    return;
  }

  console.log('找到用户 ID:', user.id);
  console.log('邮箱已验证:', user.email_confirmed_at ? '是' : '否');

  if (user.email_confirmed_at) {
    console.log('✅ 该用户邮箱已确认，可以直接登录');
    return;
  }

  // 确认用户邮箱
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    email_confirm: true
  });

  if (error) {
    console.error('确认邮箱失败:', error.message);
    return;
  }

  console.log('✅ 邮箱已确认！');
  console.log('用户现在可以登录了');
}

// 确认演示账号
confirmUserEmail('demo@local.dev');
