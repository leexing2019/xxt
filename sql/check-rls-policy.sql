-- ============================================
-- 临时禁用 profiles 表的 RLS 限制（仅用于测试）
-- ============================================
-- 注意：生产环境不应该禁用 RLS
-- 这里只是为了验证是否是 RLS 策略导致的问题
-- ============================================

-- 1. 检查当前 RLS 状态
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';

-- 2. 检查 profiles 表的 RLS 策略
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';

-- 3. 如果 profiles 没有允许所有用户查看的策略，添加一个（临时测试）
DROP POLICY IF EXISTS "admin_can_view_all_profiles" ON profiles;
CREATE POLICY "admin_can_view_all_profiles" ON profiles
  FOR SELECT
  USING (true);

-- 4. 验证策略已创建
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';

-- 5. 测试查询 - 应该返回所有用户
SELECT '测试查询结果:' AS info;
SELECT id, username, phone, created_at
FROM profiles
ORDER BY created_at DESC;
