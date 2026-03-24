-- =====================================================
-- 修复 common_medications 表的 RLS 策略
-- 允许用户添加药品时设置 created_by 字段
-- =====================================================

-- 1. 检查当前 RLS 策略
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'common_medications';

-- 2. 删除旧的插入策略（如果存在）
DROP POLICY IF EXISTS "authenticated_users_can_insert" ON common_medications;

-- 3. 创建新的插入策略，允许用户设置自己的 created_by
CREATE POLICY "authenticated_users_can_insert" ON common_medications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- 允许插入，但 created_by 必须是当前用户 ID 或 NULL
    created_by IS NULL OR created_by = auth.uid()
  );

-- 4. 删除旧的更新策略（如果存在）
DROP POLICY IF EXISTS "authenticated_users_can_update" ON common_medications;

-- 5. 创建新的更新策略
CREATE POLICY "authenticated_users_can_update" ON common_medications
  FOR UPDATE
  TO authenticated
  USING (
    -- 只允许更新自己添加的药品
    created_by = auth.uid() OR created_by IS NULL
  );

-- 6. 删除旧的删除策略（如果存在）
DROP POLICY IF EXISTS "authenticated_users_can_delete" ON common_medications;

-- 7. 创建新的删除策略
CREATE POLICY "authenticated_users_can_delete" ON common_medications
  FOR DELETE
  TO authenticated
  USING (
    -- 只允许删除自己添加的药品
    created_by = auth.uid()
  );

-- 8. 验证策略已创建
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'common_medications';
