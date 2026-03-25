-- =====================================================
-- 后台管理药品库 - 完整诊断和修复脚本
-- =====================================================
-- 执行步骤：
-- 1. 打开 https://app.supabase.com/project/vqtrfkigzqtcthrivbzn/sql/new
-- 2. 复制本脚本所有内容并执行
-- 3. 查看输出结果，诊断问题
-- =====================================================

-- ===== 诊断第 1 步：检查视图是否存在 =====
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'admin_medication_sources')
    THEN '视图已存在'
    ELSE '视图不存在 - 需要创建'
  END AS view_status;

-- ===== 诊断第 2 步：检查 common_medications 表记录数 =====
SELECT COUNT(*) AS total_medications FROM common_medications;

-- ===== 诊断第 3 步：检查 RLS 策略 =====
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'common_medications';

-- ===== 诊断第 4 步：检查现有策略详情 =====
SELECT
  policyname AS policy_name,
  cmd AS command,
  qual AS using_clause,
  with_check AS with_check_clause
FROM pg_policies
WHERE tablename = 'common_medications';

-- ===== 诊断第 5 步：检查是否有 auth.users 数据 =====
SELECT COUNT(*) AS total_users FROM auth.users;

-- ===== 诊断第 6 步：尝试直接查询表（绕过视图） =====
SELECT
  id,
  name,
  category,
  created_by,
  created_at
FROM common_medications
ORDER BY created_at DESC
LIMIT 5;

-- ===== 修复第 1 步：创建/重建视图 =====
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

-- ===== 修复第 2 步：授予视图权限 =====
GRANT SELECT ON admin_medication_sources TO authenticated;

-- ===== 修复第 3 步：确保 RLS 策略正确 =====
-- 先删除所有现有策略
DROP POLICY IF EXISTS "authenticated_users_can_view" ON common_medications;
DROP POLICY IF EXISTS "authenticated_users_can_insert" ON common_medications;
DROP POLICY IF EXISTS "authenticated_users_can_update" ON common_medications;
DROP POLICY IF EXISTS "authenticated_users_can_delete" ON common_medications;

-- 创建新策略
CREATE POLICY "authenticated_users_can_view" ON common_medications
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_users_can_insert" ON common_medications
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_users_can_update" ON common_medications
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "authenticated_users_can_delete" ON common_medications
  FOR DELETE TO authenticated USING (true);

-- ===== 验证第 1 步：测试视图查询 =====
SELECT COUNT(*) AS view_record_count FROM admin_medication_sources;

-- ===== 验证第 2 步：查看视图数据 =====
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

-- ===== 验证第 3 步：确认策略已创建 =====
SELECT
  policyname AS policy_name,
  cmd AS command
FROM pg_policies
WHERE tablename = 'common_medications';
