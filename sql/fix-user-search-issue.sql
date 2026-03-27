-- =====================================================
-- 修复：用户 2 无法搜索到用户 1 添加的药品
-- =====================================================
-- 问题：非那雄胺片被用户 1 添加后，用户 2 无法搜索到
-- 原因：RLS 策略可能限制了 SELECT 查询
--
-- 执行方式：在 Supabase SQL Editor 中运行本脚本
-- =====================================================

-- ===== 第 1 步：查看当前 SELECT 策略 =====
SELECT
  policyname AS policy_name,
  cmd AS command,
  qual AS using_clause
FROM pg_policies
WHERE tablename = 'common_medications'
AND cmd = 'SELECT';

-- ===== 第 2 步：删除所有现有策略 =====
DROP POLICY IF EXISTS "authenticated_users_can_view" ON common_medications;
DROP POLICY IF EXISTS "authenticated_users_can_select" ON common_medications;
DROP POLICY IF EXISTS "authenticated_users_can_insert" ON common_medications;
DROP POLICY IF EXISTS "authenticated_users_can_update" ON common_medications;
DROP POLICY IF EXISTS "authenticated_users_can_delete" ON common_medications;

-- ===== 第 3 步：创建正确的 RLS 策略 =====

-- SELECT 策略：所有认证用户都可以查询所有公共药品（无论谁添加的）
CREATE POLICY "authenticated_users_can_view" ON common_medications
  FOR SELECT TO authenticated
  USING (true);

-- INSERT 策略：允许用户插入，created_by 必须是当前用户或 NULL
CREATE POLICY "authenticated_users_can_insert" ON common_medications
  FOR INSERT TO authenticated
  WITH CHECK (created_by IS NULL OR created_by = auth.uid());

-- UPDATE 策略：允许更新自己添加的药品或管理员导入的药品
CREATE POLICY "authenticated_users_can_update" ON common_medications
  FOR UPDATE TO authenticated
  USING (created_by IS NULL OR created_by = auth.uid())
  WITH CHECK (created_by IS NULL OR created_by = auth.uid());

-- DELETE 策略：只允许删除自己添加的药品
CREATE POLICY "authenticated_users_can_delete" ON common_medications
  FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- ===== 第 4 步：验证策略已创建 =====
SELECT
  policyname AS policy_name,
  cmd AS command,
  qual AS using_clause
FROM pg_policies
WHERE tablename = 'common_medications'
ORDER BY cmd, policyname;

-- ===== 第 5 步：测试查询 - 确认所有药品都可查询 =====
SELECT
  id,
  name,
  category,
  created_by,
  (SELECT email FROM auth.users WHERE id = common_medications.created_by) AS added_by_email,
  created_at
FROM common_medications
ORDER BY created_at DESC
LIMIT 20;

-- ===== 完成 =====
-- 现在用户 2 应该可以搜索到用户 1 添加的"非那雄胺片"了
