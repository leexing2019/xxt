// 删除并重新创建演示账号（邮箱已确认）
// 运行：node scripts/recreate-demo-user.js

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vqtrfkigzqtcthrivbzn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxdHJma2lnenF0Y3Rocml2YnpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTUxOTUsImV4cCI6MjA4OTQ3MTE5NX0.YznHv4aNl7WpH4s8cjoYRR0_IH1guoBbLl6zRrdsb3s';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function recreateDemoUser() {
  console.log('正在重新创建演示账号...');

  // 先尝试登录，如果成功则删除再重建
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'demo@local.dev',
    password: '123456'
  });

  if (signInError) {
    console.log('登录失败（可能是用户不存在）:', signInError.message);
  }

  if (signInData?.user) {
    console.log('找到现有演示账号，但邮箱未确认');
    console.log('邮箱确认状态:', signInData.user.email_confirmed_at ? '已确认' : '未确认');

    if (signInData.user.email_confirmed_at) {
      console.log('✅ 邮箱已确认，可以直接登录');
      return;
    }

    console.log('\n❌ 需要手动确认邮箱，请前往 Supabase 控制台:');
    console.log('https://supabase.com/dashboard/project/vqtrfkigzqtcthrivbzn/auth/users');
    console.log('找到 demo@local.dev 用户，点击确认邮箱');
    return;
  }

  // 用户不存在，创建新用户
  console.log('\n创建新用户...');
  const { data, error } = await supabase.auth.signUp({
    email: 'demo@local.dev',
    password: '123456',
    options: {
      data: {
        username: 'demo'
      }
    }
  });

  if (error) {
    console.error('创建失败:', error.message);
    return;
  }

  console.log('✅ 演示账号创建成功！');
  console.log('用户 ID:', data.user?.id);
  console.log('请检查邮箱或前往 Supabase 控制台确认邮箱');
}

recreateDemoUser();
