-- =====================================================
-- 修复 common_medications 表的 RLS 策略
-- 允许用户更新自己添加的药品的 created_by 字段
-- =====================================================

-- ===== 第 1 步：检查现有策略 =====
SELECT
  policyname AS policy_name,
  cmd AS command,
  roles,
  qual AS using_clause,
  with_check AS with_check_clause
FROM pg_policies
WHERE tablename = 'common_medications'
ORDER BY policyname;

-- ===== 第 2 步：删除旧的更新策略 =====
DROP POLICY IF EXISTS "authenticated_users_can_update" ON common_medications;

-- ===== 第 3 步：创建新的更新策略 =====
-- 允许认证用户更新药品，但只能更新自己添加的药品（created_by = auth.uid()）
-- 或者更新 created_by 为 NULL 的药品（管理员导入的，可以认领）
CREATE POLICY "authenticated_users_can_update" ON common_medications
  FOR UPDATE TO authenticated
  USING (
    created_by IS NULL OR created_by = auth.uid()
  )
  WITH CHECK (
    created_by IS NULL OR created_by = auth.uid()
  );

-- ===== 第 4 步：验证策略已创建 =====
SELECT
  policyname AS policy_name,
  cmd AS command,
  qual AS using_clause,
  with_check AS with_check_clause
FROM pg_policies
WHERE tablename = 'common_medications'
AND policyname = 'authenticated_users_can_update';

-- ===== 第 5 步：测试策略 - 查看用户是否可以更新 =====
-- 这个查询会显示哪些药品可以被当前用户更新
SELECT
  id,
  name,
  created_by,
  CASE
    WHEN created_by IS NULL THEN '可以更新（管理员导入）'
    WHEN created_by = auth.uid() THEN '可以更新（自己添加的）'
    ELSE '不可更新（其他用户添加的）'
  END AS can_update
FROM common_medications
ORDER BY created_at DESC
LIMIT 10;
