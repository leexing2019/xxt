-- =====================================================
-- 诊断 created_by 不生效问题
-- =====================================================
-- 执行步骤：在 Supabase SQL Editor 中运行

-- ===== 第 1 步：查看 test 药品的实际数据 =====
SELECT id, name, created_by, created_at
FROM common_medications
WHERE name LIKE '%test%' OR name = 'test'
ORDER BY created_at DESC;

-- ===== 第 2 步：查看当前 RLS 策略 =====
SELECT
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'common_medications';

-- ===== 第 3 步：检查 common_medications 表是否启用了 RLS =====
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'common_medications';

-- ===== 第 4 步：查看 admin_medication_sources 视图定义 =====
SELECT definition
FROM pg_views
WHERE viewname = 'admin_medication_sources';

-- ===== 第 5 步：查看视图中的 test 药品 =====
SELECT id, name, created_by, source_type, added_by_email
FROM admin_medication_sources
WHERE name LIKE '%test%' OR name = 'test';

-- ===== 第 6 步：查看最新的 5 条药品记录 =====
SELECT id, name, created_by, created_at
FROM common_medications
ORDER BY created_at DESC
LIMIT 5;

-- ===== 第 7 步：测试当前用户的 RLS 权限 =====
-- 检查当前会话的 auth.uid()
SELECT auth.uid() AS current_user_id;

-- ===== 第 8 步：查看是否有错误日志 =====
-- 检查是否有插入失败的日志（需要查看应用日志）
