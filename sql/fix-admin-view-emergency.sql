-- =====================================================
-- 修复后台管理药品库视图 - 紧急修复
-- =====================================================
-- 执行步骤：
-- 1. 打开 https://app.supabase.com/project/vqtrfkigzqtcthrivbzn/sql/new
-- 2. 复制本脚本所有内容并执行
-- =====================================================

-- 第 1 步：检查当前视图是否存在
SELECT schemaname, viewname
FROM pg_views
WHERE viewname = 'admin_medication_sources';

-- 第 2 步：检查 common_medications 表结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'common_medications'
ORDER BY ordinal_position;

-- 第 3 步：删除旧视图（如果存在）
DROP VIEW IF EXISTS admin_medication_sources;

-- 第 4 步：创建新视图（确保字段与表结构匹配）
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

-- 第 5 步：授予视图查询权限
GRANT SELECT ON admin_medication_sources TO authenticated;

-- 第 6 步：验证视图
SELECT COUNT(*) as total_count FROM admin_medication_sources;

-- 第 7 步：查看前 10 条记录
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

-- 第 8 步：检查 RLS 策略
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'common_medications';
