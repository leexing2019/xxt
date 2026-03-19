// 创建演示账号脚本
// 使用 Node.js 运行：node scripts/create-demo-user.js

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://vqtrfkigzqtcthrivbzn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxdHJma2lnenF0Y3Rocml2YnpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTUxOTUsImV4cCI6MjA4OTQ3MTE5NX0.YznHv4aNl7WpH4s8cjoYRR0_IH1guoBbLl6zRrdsb3s'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function createDemoUser() {
  console.log('正在创建演示账号...')

  // 创建用户（使用 email/password 方式）
  const { data, error } = await supabase.auth.signUp({
    email: 'demo@local.dev',
    password: '123456',
    options: {
      data: {
        username: 'demo'
      }
    }
  })

  if (error) {
    console.error('创建用户失败:', error.message)
    // 如果用户已存在，尝试直接创建 profile
    if (error.message.includes('User already registered')) {
      console.log('用户已存在，尝试创建 profile...')

      // 先登录获取用户 ID
      return signInAndGetProfile()
    }
    return
  }

  console.log('✅ 演示账号创建成功！')
  console.log('用户 ID:', data.user?.id)
  console.log('邮箱：demo@local.dev')
  console.log('密码：123456')

  // 创建 profile
  if (data.user) {
    await createProfile(data.user.id)
  }
}

async function signInAndGetProfile() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'demo@local.dev',
    password: '123456'
  })

  if (error) {
    console.error('登录失败:', error.message)
    return
  }

  console.log('✅ 演示账号已存在，可直接登录')
  console.log('用户 ID:', data.user?.id)

  await createProfile(data.user?.id)
}

async function createProfile(userId) {
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      username: 'demo',
      phone: '13800138000'
    })

  if (error) {
    console.error('创建 profile 失败:', error.message)
  } else {
    console.log('✅ Profile 创建成功！')
  }
}

createDemoUser()
