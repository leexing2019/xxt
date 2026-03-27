-- =====================================================
-- 诊断：为什么用户 2 无法搜索到用户 1 添加的"非那雄胺片"
-- =====================================================
-- 执行步骤：在 Supabase SQL Editor 中运行此脚本

-- ===== 第 1 步：查看 common_medications 表的所有 RLS 策略 =====
SELECT
  policyname AS policy_name,
  cmd AS command,
  roles,
  qual AS using_clause,
  with_check AS with_check_clause
FROM pg_policies
WHERE tablename = 'common_medications'
ORDER BY cmd, policyname;

-- ===== 第 2 步：查看"非那雄胺片"的实际数据 =====
SELECT
  id,
  name,
  category,
  created_by,
  created_at,
  (SELECT email FROM auth.users WHERE id = common_medications.created_by) AS added_by_email
FROM common_medications
WHERE name LIKE '%非那雄胺%' OR name = '非那雄胺片';

-- ===== 第 3 步：查看所有药品的 created_by 分布情况 =====
SELECT
  CASE
    WHEN created_by IS NULL THEN '管理员导入'
    ELSE '用户添加'
  END AS source_type,
  COUNT(*) AS count
FROM common_medications
GROUP BY
  CASE
    WHEN created_by IS NULL THEN '管理员导入'
    ELSE '用户添加'
  END;

-- ===== 第 4 步：查看最近添加的 10 条药品记录 =====
SELECT
  id,
  name,
  category,
  created_by,
  created_at,
  (SELECT email FROM auth.users WHERE id = common_medications.created_by) AS added_by_email
FROM common_medications
ORDER BY created_at DESC
LIMIT 10;

-- ===== 第 5 步：检查是否有 SELECT 策略限制了用户查询 =====
-- 如果 SELECT 策略包含 created_by = auth.uid() 这样的条件，就会导致用户 2 查不到用户 1 添加的药品
SELECT
  policyname,
  qual
FROM pg_policies
WHERE tablename = 'common_medications'
AND cmd = 'SELECT';

-- ===== 第 6 步：如果 SELECT 策略有问题，修复它 =====
-- 删除旧的 SELECT 策略（如果有）
DROP POLICY IF EXISTS "authenticated_users_can_select" ON common_medications;
DROP POLICY IF EXISTS "authenticated_users_can_view" ON common_medications;

-- 创建新的 SELECT 策略：所有认证用户都可以查询所有公共药品
CREATE POLICY "authenticated_users_can_view" ON common_medications
  FOR SELECT
  TO authenticated
  USING (true);

-- ===== 第 7 步：验证修复后的策略 =====
SELECT
  policyname AS policy_name,
  cmd AS command,
  qual AS using_clause
FROM pg_policies
WHERE tablename = 'common_medications'
ORDER BY cmd, policyname;

-- ===== 第 8 步：测试查询 - 模拟用户 2 查询"非那雄胺片" =====
-- 这个查询应该返回所有"非那雄胺"相关的药品，无论谁添加的
SELECT
  id,
  name,
  category,
  created_by,
  created_at
FROM common_medications
WHERE name LIKE '%非那雄胺%' OR name LIKE '%finasteride%'
ORDER BY created_at DESC;
