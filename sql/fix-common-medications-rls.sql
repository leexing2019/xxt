-- =====================================================
-- 修复 common_medications 表的 RLS 策略
-- 1. 允许 anon 用户读取公共药品库（SELECT 权限）
-- 2. 允许用户添加药品时设置 created_by 字段
-- =====================================================

-- 1. 检查当前 RLS 策略
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'common_medications';

-- ============================================
-- 第一部分：添加 SELECT 权限（允许 anon 读取）
-- ============================================

-- 删除旧的 SELECT 策略（如果存在）
DROP POLICY IF EXISTS "anon_users_can_view_common_medications" ON common_medications;
DROP POLICY IF EXISTS "enable_read_access_for_all" ON common_medications;
DROP POLICY IF EXISTS "public_read_access" ON common_medications;

-- 创建新策略：允许所有用户（包括 anon）读取 is_active = true 的记录
CREATE POLICY "anon_users_can_view_common_medications" ON common_medications
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- ============================================
-- 第二部分：INSERT/UPDATE/DELETE 权限
-- ============================================

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
