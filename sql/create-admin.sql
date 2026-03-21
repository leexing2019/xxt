-- ============================================
-- 创建管理员账户 - 完整指南
-- ============================================
-- 由于 Supabase 的安全机制，不能直接通过 SQL 创建用户
-- 请按照以下步骤操作：
-- ============================================

-- 方法一：通过 Supabase Dashboard 创建（推荐）
-- ============================================
-- 1. 访问 https://supabase.com/dashboard
-- 2. 选择你的项目
-- 3. 进入 Authentication → Users
-- 4. 点击 "Add user" 按钮
-- 5. 选择 "Create new user"
-- 6. 填写以下信息：
--    Email: admin@medication-assistant.local
--    Password: admin123456
-- 7. 点击 "Create user"
-- 8. 如果要求确认邮件，可以点击 "Confirm email" 跳过验证

-- 创建成功后，在 admin_users 表添加记录：
INSERT INTO admin_users (email, password_hash, role)
SELECT
  'admin@medication-assistant.local',
  -- 注意：这里只是占位符，实际验证由 Supabase Auth 处理
  'dummy_hash',
  'admin'
WHERE EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'admin@medication-assistant.local'
)
ON CONFLICT (email) DO NOTHING;

-- 验证创建成功
SELECT '创建成功！请使用以下账号登录：' as 提示,
       '邮箱：admin@medication-assistant.local' as 账号，
       '密码：admin123456' as 密码;

-- ============================================
-- 方法二：使用 Supabase CLI（适合自动化部署）
-- ============================================
-- supabase auth signup --email admin@medication-assistant.local --password admin123456

-- ============================================
-- 方法三：使用 Supabase JS SDK（适合程序化创建）
-- ============================================
-- const { data, error } = await supabase.auth.signUp({
--   email: 'admin@medication-assistant.local',
--   password: 'admin123456'
-- })

-- ============================================
-- 注意事项
-- ============================================
-- 1. 生产环境请修改默认密码
-- 2. 建议启用邮箱验证
-- 3. 可以在创建后手动删除或禁用测试账号
-- 4. admin_users 表主要用于角色管理，实际认证由 auth.users 处理
