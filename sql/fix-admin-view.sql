-- =====================================================
-- 修复后台管理页面查询问题 - 完整版
-- =====================================================
-- 使用方法：
-- 1. 打开 Supabase Dashboard: https://app.supabase.com/project/vqtrfkigzqtcthrivbzn/sql/new
-- 2. 复制本脚本所有内容并执行
-- =====================================================

-- 第 1 步：如果不存在，添加 created_by 字段
ALTER TABLE common_medications
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 第 2 步：如果不存在，添加 created_at_with_tz 字段
ALTER TABLE common_medications
  ADD COLUMN IF NOT EXISTS created_at_with_tz TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 第 3 步：为现有数据填充 created_at_with_tz
UPDATE common_medications
SET created_at_with_tz = created_at
WHERE created_at_with_tz IS NULL;

-- 第 4 步：删除旧视图（如果存在）
DROP VIEW IF EXISTS admin_medication_sources;

-- 第 5 步：创建新视图（使用存在的字段）
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

-- 第 6 步：授予视图查询权限
GRANT SELECT ON admin_medication_sources TO authenticated;

-- 第 7 步：验证视图
SELECT COUNT(*) AS total FROM admin_medication_sources;
