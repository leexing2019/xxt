-- =====================================================
-- 后台管理药品库 - 最终修复脚本
-- =====================================================
-- 执行步骤：
-- 1. 打开 https://app.supabase.com/project/vqtrfkigzqtcthrivbzn/sql/new
-- 2. 复制本脚本所有内容并执行
-- 3. 查看输出结果
-- =====================================================

-- ===== 第 1 步：检查视图定义 =====
SELECT
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE viewname = 'admin_medication_sources';

-- ===== 第 2 步：检查 common_medications 表的 RLS 状态 =====
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'common_medications';

-- ===== 第 3 步：检查所有 RLS 策略 =====
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('common_medications', 'admin_medication_sources')
ORDER BY tablename, policyname;

-- ===== 第 4 步：检查表记录数 =====
SELECT COUNT(*) AS total_medications FROM common_medications;

-- ===== 第 5 步：检查是否有 created_by 为 NULL 的记录（管理员导入） =====
SELECT COUNT(*) AS admin_imported FROM common_medications WHERE created_by IS NULL;

-- ===== 第 6 步：检查是否有 created_by 不为 NULL 的记录（用户添加）=====
SELECT COUNT(*) AS user_added FROM common_medications WHERE created_by IS NOT NULL;

-- ===== 第 7 步：查看前 5 条记录的 created_by 值 =====
SELECT
  id,
  name,
  created_by,
  created_at
FROM common_medications
ORDER BY created_at DESC
LIMIT 5;

-- ===== 第 8 步：删除旧视图并重建 =====
DROP VIEW IF EXISTS admin_medication_sources;

CREATE VIEW admin_medication_sources AS
SELECT
  cm.id,
  cm.name,
  cm.generic_name,
  cm.category,
  cm.manufacturer,
  cm.specification,
  cm.form,
  cm.appearance_desc,
  cm.dosage_unit,
  cm.color,
  cm.shape,
  cm.barcode,
  cm.image_url,
  cm.is_active,
  cm.created_at,
  cm.updated_at,
  cm.created_by,
  cm.created_at_with_tz,
  CASE
    WHEN cm.created_by IS NULL THEN '管理员导入'
    ELSE '用户添加'
  END AS source_type,
  CASE
    WHEN cm.created_by IS NULL THEN NULL
    ELSE u.email
  END AS added_by_email
FROM common_medications cm
LEFT JOIN auth.users u ON cm.created_by = u.id;

-- ===== 第 9 步：授予视图权限 =====
GRANT SELECT ON admin_medication_sources TO authenticated;

-- ===== 第 10 步：确保 RLS 策略正确 =====
-- 先删除所有现有策略
DROP POLICY IF EXISTS "authenticated_users_can_view" ON common_medications;
DROP POLICY IF EXISTS "authenticated_users_can_insert" ON common_medications;
DROP POLICY IF EXISTS "authenticated_users_can_update" ON common_medications;
DROP POLICY IF EXISTS "authenticated_users_can_delete" ON common_medications;

-- 创建新策略 - 允许所有认证用户查询
CREATE POLICY "authenticated_users_can_view" ON common_medications
  FOR SELECT TO authenticated USING (true);

-- 创建新策略 - 允许所有认证用户插入
CREATE POLICY "authenticated_users_can_insert" ON common_medications
  FOR INSERT TO authenticated WITH CHECK (true);

-- 创建新策略 - 允许所有认证用户更新
CREATE POLICY "authenticated_users_can_update" ON common_medications
  FOR UPDATE TO authenticated USING (true);

-- 创建新策略 - 允许所有认证用户删除
CREATE POLICY "authenticated_users_can_delete" ON common_medications
  FOR DELETE TO authenticated USING (true);

-- ===== 第 11 步：验证视图 =====
SELECT COUNT(*) AS view_record_count FROM admin_medication_sources;

-- ===== 第 12 步：查看视图数据 =====
SELECT
  id,
  name,
  category,
  created_by,
  source_type,
  added_by_email
FROM admin_medication_sources
ORDER BY created_at_with_tz DESC
LIMIT 10;

-- ===== 第 13 步：确认策略已创建 =====
SELECT
  policyname AS policy_name,
  cmd AS command,
  roles
FROM pg_policies
WHERE tablename = 'common_medications';

-- ===== 第 14 步：测试直接查询表（绕过视图）=====
SELECT
  id,
  name,
  category,
  created_by,
  created_at
FROM common_medications
ORDER BY created_at DESC
LIMIT 5;
