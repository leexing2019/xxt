-- =====================================================
-- 用户添加药品来源显示错误 - 完整修复脚本
-- =====================================================
-- 执行步骤：
-- 1. 打开 https://app.supabase.com/project/vqtrfkigzqtcthrivbzn/sql/new
-- 2. 复制本脚本所有内容并执行
-- 3. 查看输出结果，确认修复成功
-- =====================================================

-- ===== 诊断部分 =====

-- 第 1 步：查看现有药品来源分布
SELECT
  CASE
    WHEN created_by IS NULL THEN '管理员导入'
    ELSE '用户添加'
  END AS source_type,
  COUNT(*) AS count
FROM common_medications
GROUP BY
  CASE
    WHEN created_by IS NULL THEN '管理员导入'
    ELSE '用户添加'
  END;

-- 第 2 步：查看用药计划与药品来源的关系
SELECT
  COUNT(DISTINCT ms.medication_id) AS total_medications_in_use,
  COUNT(DISTINCT CASE WHEN cm.created_by IS NULL THEN ms.medication_id END) AS admin_imported,
  COUNT(DISTINCT CASE WHEN cm.created_by IS NOT NULL THEN ms.medication_id END) AS user_added
FROM medication_schedules ms
JOIN common_medications cm ON ms.medication_id = cm.id;

-- 第 3 步：查看需要修复的药品详情（用户已拥有但 created_by 为 NULL）
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

-- ===== 修复部分 =====

-- 第 4 步：创建修复日志表（记录修复前的状态）
DROP TABLE IF EXISTS medication_source_fix_log;
CREATE TEMP TABLE medication_source_fix_log AS
SELECT
  cm.id AS medication_id,
  cm.name AS medication_name,
  cm.created_by AS old_created_by,
  (SELECT ARRAY_AGG(DISTINCT ms.user_id) FROM medication_schedules ms WHERE ms.medication_id = cm.id) AS user_ids_using,
  NOW() AS fixed_at
FROM common_medications cm
WHERE cm.created_by IS NULL
AND EXISTS (SELECT 1 FROM medication_schedules ms WHERE ms.medication_id = cm.id);

-- 第 5 步：更新 RLS 策略
DROP POLICY IF EXISTS "authenticated_users_can_update" ON common_medications;

CREATE POLICY "authenticated_users_can_update" ON common_medications
  FOR UPDATE TO authenticated
  USING (
    created_by IS NULL OR created_by = auth.uid()
  )
  WITH CHECK (
    created_by IS NULL OR created_by = auth.uid()
  );

-- 第 6 步：修复现有数据 - 将用户已拥有但 created_by 为 NULL 的药品更新为用户 ID
-- 注意：如果一个药品被多个用户添加，选择最早添加的用户（按 user_id 排序取第一个）
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

-- 第 7 步：验证修复结果
SELECT
  CASE
    WHEN created_by IS NULL THEN '管理员导入'
    ELSE '用户添加'
  END AS source_type,
  COUNT(*) AS count
FROM common_medications
GROUP BY
  CASE
    WHEN created_by IS NULL THEN '管理员导入'
    ELSE '用户添加'
  END;

-- 第 8 步：显示修复日志
SELECT
  medication_id,
  medication_name,
  old_created_by,
  user_ids_using,
  fixed_at
FROM medication_source_fix_log
ORDER BY medication_name;

-- 第 9 步：查看修复后的详情（前 20 条）
SELECT
  cm.id,
  cm.name AS medication_name,
  cm.created_by,
  u.email AS added_by_email,
  cm.created_at
FROM common_medications cm
LEFT JOIN auth.users u ON cm.created_by = u.id
ORDER BY cm.created_at DESC
LIMIT 20;

-- ===== 验证部分 =====

-- 第 10 步：确认 RLS 策略已正确创建
SELECT
  policyname AS policy_name,
  cmd AS command,
  roles,
  qual AS using_clause,
  with_check AS with_check_clause
FROM pg_policies
WHERE tablename = 'common_medications'
ORDER BY policyname;

-- 第 11 步：测试视图查询
SELECT COUNT(*) AS view_record_count FROM admin_medication_sources;

-- 第 12 步：查看视图中的来源分布
SELECT
  source_type,
  COUNT(*) AS count
FROM admin_medication_sources
GROUP BY source_type;
