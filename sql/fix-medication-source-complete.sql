-- =====================================================
-- 修复用户添加药品来源显示错误 - 完整修复脚本
-- =====================================================
-- 问题描述：
-- 用户在前端添加了一种库里面不存在的药品后，后台添加来源显示为"管理员导入"
--
-- 根本原因：
-- 1. common_medications 表创建时没有 created_by 字段
-- 2. 前端虽然传递了 created_by，但数据库字段不存在导致写入失败
-- 3. 后台视图根据 created_by 是否为 NULL 判断来源，NULL 显示为"管理员导入"
--
-- 执行步骤：
-- 1. 打开 https://app.supabase.com/project/vqtrfkigzqtcthrivbzn/sql/new
-- 2. 复制本脚本所有内容并执行
-- 3. 查看输出结果，确认修复成功
-- =====================================================

-- ===== 第 1 步：检查当前表结构 =====
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'common_medications'
ORDER BY ordinal_position;

-- ===== 第 2 步：添加 created_by 字段（如果不存在）=====
ALTER TABLE common_medications
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 添加索引提升查询性能
CREATE INDEX IF NOT EXISTS idx_common_medications_created_by
ON common_medications(created_by);

-- 添加注释
COMMENT ON COLUMN common_medications.created_by IS '添加者 ID：NULL=管理员导入，有值=用户添加';

-- ===== 第 3 步：验证字段已添加 =====
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'common_medications'
AND column_name = 'created_by';

-- ===== 第 4 步：配置 RLS 策略 =====
-- 先删除所有现有策略
DROP POLICY IF EXISTS "authenticated_users_can_view" ON common_medications;
DROP POLICY IF EXISTS "authenticated_users_can_insert" ON common_medications;
DROP POLICY IF EXISTS "authenticated_users_can_update" ON common_medications;
DROP POLICY IF EXISTS "authenticated_users_can_delete" ON common_medications;

-- 创建新策略 - 允许所有认证用户查询
CREATE POLICY "authenticated_users_can_view" ON common_medications
  FOR SELECT TO authenticated USING (true);

-- 创建新策略 - 允许所有认证用户插入，created_by 必须是当前用户或 NULL
CREATE POLICY "authenticated_users_can_insert" ON common_medications
  FOR INSERT TO authenticated
  WITH CHECK (created_by IS NULL OR created_by = auth.uid());

-- 创建新策略 - 允许更新自己添加的药品或管理员导入的药品
CREATE POLICY "authenticated_users_can_update" ON common_medications
  FOR UPDATE TO authenticated
  USING (created_by IS NULL OR created_by = auth.uid());

-- 创建新策略 - 允许删除自己添加的药品
CREATE POLICY "authenticated_users_can_delete" ON common_medications
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR created_by IS NULL);

-- ===== 第 5 步：验证 RLS 策略已创建 =====
SELECT
  policyname AS policy_name,
  cmd AS command,
  roles,
  qual AS using_clause,
  with_check AS with_check_clause
FROM pg_policies
WHERE tablename = 'common_medications'
ORDER BY policyname;

-- ===== 第 6 步：修复后台管理视图 =====
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

-- 授予视图查询权限
GRANT SELECT ON admin_medication_sources TO authenticated;

-- ===== 第 7 步：验证视图已创建 =====
SELECT COUNT(*) AS view_record_count FROM admin_medication_sources;

-- ===== 第 8 步：查看当前药品来源分布 =====
SELECT
  source_type,
  COUNT(*) AS count
FROM admin_medication_sources
GROUP BY source_type;

-- ===== 第 9 步：查看前 10 条记录验证 =====
SELECT
  id,
  name,
  category,
  created_by,
  source_type,
  added_by_email,
  created_at
FROM admin_medication_sources
ORDER BY created_at DESC
LIMIT 10;

-- ===== 第 10 步：查看需要修复的历史数据 =====
-- 找出用户已拥有但 created_by 为 NULL 的药品
SELECT
  cm.id,
  cm.name AS medication_name,
  cm.created_by AS current_created_by,
  ARRAY_AGG(DISTINCT ms.user_id) AS user_ids_using,
  ARRAY_AGG(DISTINCT u.email) AS user_emails
FROM medication_schedules ms
JOIN common_medications cm ON ms.medication_id = cm.id
LEFT JOIN auth.users u ON ms.user_id = u.id
WHERE cm.created_by IS NULL
GROUP BY cm.id, cm.name, cm.created_by
ORDER BY cm.name;

-- ===== 第 11 步：修复历史数据（可选）=====
-- 将用户已拥有但 created_by 为 NULL 的药品更新为最早添加的用户 ID
-- 注意：这会将"管理员导入"的药品重新标记为"用户添加"
-- 如果需要保留"管理员导入"的标记，请注释掉下面的 UPDATE 语句

-- 创建修复日志表
DROP TABLE IF EXISTS medication_source_fix_log;
CREATE TABLE medication_source_fix_log AS
SELECT
  cm.id AS medication_id,
  cm.name AS medication_name,
  cm.created_by AS old_created_by,
  (SELECT ARRAY_AGG(DISTINCT ms.user_id) FROM medication_schedules ms WHERE ms.medication_id = cm.id) AS user_ids_using,
  NOW() AS fixed_at
FROM common_medications cm
WHERE cm.created_by IS NULL
AND EXISTS (SELECT 1 FROM medication_schedules ms WHERE ms.medication_id = cm.id);

-- 更新 created_by 为最早添加的用户
UPDATE common_medications cm
SET created_by = (
  SELECT ms.user_id
  FROM medication_schedules ms
  WHERE ms.medication_id = cm.id
  ORDER BY ms.created_at ASC
  LIMIT 1
)
WHERE cm.created_by IS NULL
AND EXISTS (
  SELECT 1 FROM medication_schedules ms
  WHERE ms.medication_id = cm.id
);

-- ===== 第 12 步：验证修复结果 =====
SELECT
  source_type,
  COUNT(*) AS count
FROM admin_medication_sources
GROUP BY source_type;

-- ===== 第 13 步：显示修复日志 =====
SELECT
  medication_id,
  medication_name,
  old_created_by,
  user_ids_using,
  fixed_at
FROM medication_source_fix_log
ORDER BY medication_name;

-- ===== 第 14 步：最终验证 =====
-- 确认 RLS 策略正确
SELECT
  policyname AS policy_name,
  cmd AS command,
  roles
FROM pg_policies
WHERE tablename = 'common_medications';

-- 确认视图数据正确
SELECT
  id,
  name,
  category,
  created_by,
  source_type,
  added_by_email
FROM admin_medication_sources
ORDER BY created_at DESC
LIMIT 20;
