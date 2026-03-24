-- =====================================================
-- 修复用户添加药品时 created_by 字段不生效的问题
-- =====================================================
-- 执行步骤：
-- 1. 打开 https://app.supabase.com/project/vqtrfkigzqtcthrivbzn/sql/new
-- 2. 复制本脚本所有内容并执行
-- =====================================================

-- 第 1 步：确保 created_by 字段存在
ALTER TABLE common_medications
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 第 2 步：检查并修复 RLS 策略
-- 删除旧策略
DROP POLICY IF EXISTS "authenticated_users_can_insert" ON common_medications;
DROP POLICY IF EXISTS "authenticated_users_can_update" ON common_medications;
DROP POLICY IF EXISTS "authenticated_users_can_delete" ON common_medications;

-- 创建新策略 - 允许插入，created_by 可以是当前用户
CREATE POLICY "authenticated_users_can_insert" ON common_medications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);  -- 允许所有认证用户插入

-- 创建新策略 - 允许更新自己添加的药品
CREATE POLICY "authenticated_users_can_update" ON common_medications
  FOR UPDATE
  TO authenticated
  USING (true);  -- 允许所有认证用户更新

-- 创建新策略 - 允许删除自己添加的药品
CREATE POLICY "authenticated_users_can_delete" ON common_medications
  FOR DELETE
  TO authenticated
  USING (true);  -- 允许所有认证用户删除

-- 第 3 步：确保视图存在并正确显示来源
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

GRANT SELECT ON admin_medication_sources TO authenticated;

-- 第 4 步：验证"氯化钠"药品的数据
SELECT
  id,
  name,
  created_by,
  CASE WHEN created_by IS NULL THEN '管理员导入' ELSE '用户添加' END AS source
FROM common_medications
WHERE name LIKE '%氯化钠%';

-- 第 5 步：如果"氯化钠"的 created_by 为空，手动修复（可选）
-- 取消下面注释并替换用户 ID 后执行
-- UPDATE common_medications
-- SET created_by = '用户的 UUID'
-- WHERE name = '氯化钠' AND created_by IS NULL;
