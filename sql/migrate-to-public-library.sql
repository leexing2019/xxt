-- =====================================================
-- 公共药品库改造 - 数据库迁移脚本
-- =====================================================
-- 日期：2026-03-23
-- 说明：此脚本用于将系统从个人药品库迁移到统一公共药品库架构
-- =====================================================

-- =====================================================
-- 第 1 步：为 common_medications 添加 created_by 字段
-- =====================================================

-- 添加创建者字段（记录是谁添加的药品）
ALTER TABLE common_medications
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 添加创建时间戳（记录添加时间）
ALTER TABLE common_medications
  ADD COLUMN IF NOT EXISTS created_at_with_tz TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 添加注释
COMMENT ON COLUMN common_medications.created_by IS '添加者 ID（NULL 表示管理员导入，非 NULL 表示用户自助添加）';
COMMENT ON COLUMN common_medications.created_at_with_tz IS '创建时间（带时区）';

-- 为 created_by 创建索引，方便按添加者筛选
CREATE INDEX IF NOT EXISTS idx_common_medications_created_by ON common_medications(created_by);

-- 为 created_at_with_tz 创建索引，方便按时间排序
CREATE INDEX IF NOT EXISTS idx_common_medications_created_at ON common_medications(created_at_with_tz);

-- =====================================================
-- 第 2 步：更新现有数据的 created_by 字段
-- =====================================================

-- 现有药品标记为 NULL（表示管理员导入）
UPDATE common_medications
SET created_by = NULL
WHERE created_by IS NULL;

-- =====================================================
-- 第 3 步：修改 RLS 策略以支持用户自助添加
-- =====================================================

-- 允许所有认证用户查看公共药品
DROP POLICY IF EXISTS "authenticated_users_can_view" ON common_medications;
DROP POLICY IF EXISTS "all_authenticated_users_can_view" ON common_medications;
CREATE POLICY "all_authenticated_users_can_view" ON common_medications
  FOR SELECT
  TO authenticated
  USING (true);

-- 允许所有认证用户插入（用户自助添加）
DROP POLICY IF EXISTS "authenticated_users_can_insert" ON common_medications;
DROP POLICY IF EXISTS "all_authenticated_users_can_insert" ON common_medications;
CREATE POLICY "all_authenticated_users_can_insert" ON common_medications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 允许所有认证用户更新（用户可修改自己添加的药品）
DROP POLICY IF EXISTS "authenticated_users_can_update" ON common_medications;
DROP POLICY IF EXISTS "admin_users_can_update" ON common_medications;
CREATE POLICY "all_authenticated_users_can_update" ON common_medications
  FOR UPDATE
  TO authenticated
  USING (true);

-- 允许所有认证用户删除（仅限管理员或药品添加者）
DROP POLICY IF EXISTS "authenticated_users_can_delete" ON common_medications;
DROP POLICY IF EXISTS "admin_users_can_delete" ON common_medications;
CREATE POLICY "all_authenticated_users_can_delete" ON common_medications
  FOR DELETE
  TO authenticated
  USING (
    -- 管理员可以删除所有药品
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    OR
    -- 用户可以删除自己添加的药品
    created_by = auth.uid()
  );

-- =====================================================
-- 第 4 步：清空旧数据（在外键修改之前）
-- =====================================================

-- 警告：以下操作将删除所有现有用户的用药计划和药品数据
-- 执行前请确认已备份重要数据！

-- 先清空用药计划表（避免外键约束冲突）
TRUNCATE TABLE medication_schedules CASCADE;

-- 清空用药记录表（因为 schedules 被清空了）
TRUNCATE TABLE medication_logs CASCADE;

-- 清空个人药品表
TRUNCATE TABLE medications CASCADE;

-- =====================================================
-- 第 5 步：修改 medication_schedules 外键约束
-- =====================================================

-- 删除旧的外键约束（指向 medications 表）
ALTER TABLE medication_schedules
  DROP CONSTRAINT IF EXISTS medication_schedules_medication_id_fkey;

-- 建立新的外键约束（指向 common_medications 表）
ALTER TABLE medication_schedules
  ADD CONSTRAINT medication_schedules_medication_id_fkey
    FOREIGN KEY (medication_id)
    REFERENCES common_medications(id)
    ON DELETE CASCADE;

-- =====================================================
-- 第 6 步：删除个人药品表（可选，确认无误后执行）
-- =====================================================

-- 注意：执行此步骤前请确保所有依赖已清除
-- 如果有其他表引用 medications 表，需要先处理那些表

-- 删除 medications 表
-- DROP TABLE IF EXISTS medications;

-- =====================================================
-- 第 7 步：创建辅助视图（方便后台管理查询）
-- =====================================================

-- 创建视图：显示药品添加来源（带邮箱）
CREATE OR REPLACE VIEW admin_medication_sources AS
SELECT
  cm.id,
  cm.name,
  cm.generic_name,
  cm.category,
  cm.manufacturer,
  cm.created_by,
  CASE
    WHEN cm.created_by IS NULL THEN '管理员导入'
    ELSE '用户添加'
  END AS source_type,
  CASE
    WHEN cm.created_by IS NULL THEN NULL
    ELSE u.email
  END AS added_by_email,
  cm.created_at_with_tz
FROM common_medications cm
LEFT JOIN auth.users u ON cm.created_by = u.id;

-- 为视图创建注释
COMMENT ON VIEW admin_medication_sources IS '管理员视图：显示药品来源（管理员导入或用户添加）';

-- =====================================================
-- 第 8 步：允许后台直接查询 auth.users 获取邮箱
-- =====================================================

-- 授予认证用户查询 auth.users 的权限（用于关联查询获取邮箱）
GRANT SELECT ON auth.users TO authenticated;

-- =====================================================
-- 第 8 步：验证迁移结果
-- =====================================================

-- 查询确认字段已添加
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'common_medications'
  AND column_name IN ('created_by', 'created_at_with_tz');

-- 查询确认索引已创建
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'common_medications'
  AND indexname LIKE 'idx_common_medications_%';

-- 查询确认外键约束已更新
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'medication_schedules'
  AND kcu.column_name = 'medication_id';

-- 查询药品来源统计
SELECT
  CASE WHEN created_by IS NULL THEN '管理员导入' ELSE '用户添加' END AS source,
  COUNT(*) AS count
FROM common_medications
GROUP BY
  CASE WHEN created_by IS NULL THEN '管理员导入' ELSE '用户添加' END;

-- =====================================================
-- 完成提示
-- =====================================================
-- 迁移完成后，请执行以下操作：
-- 1. 更新后台管理页面 Medications.vue
-- 2. 更新前端添加药品页面 add-medication.vue
-- 3. 更新前端药品列表页面 medication-list.vue
-- 4. 测试用户自助添加药品功能
-- 5. 测试后台筛选功能
-- =====================================================
