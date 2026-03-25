-- =====================================================
-- 修复用户添加药品来源显示错误的问题
-- =====================================================
-- 问题描述：
-- 用户在前端添加药品时，如果药品库中已存在该药品（可能是管理员导入的），
-- 代码直接返回现有 ID，但没有更新 created_by 字段，导致后台显示"管理员导入"
--
-- 修复方案：
-- 1. 更新现有药品数据：将用户已拥有但 created_by 为 NULL 的药品，created_by 设置为用户 ID
-- 2. 修改前端代码：当药品已存在但 created_by 为 NULL 时，更新 created_by 为当前用户
-- =====================================================

-- ===== 第 1 步：查看用户用药计划表，找出用户添加了哪些药品 =====
SELECT DISTINCT
  ms.user_id,
  ms.medication_id,
  cm.name AS medication_name,
  cm.created_by,
  CASE
    WHEN cm.created_by IS NULL THEN '管理员导入（需要更新）'
    WHEN cm.created_by = ms.user_id THEN '用户自己添加'
    ELSE '其他用户添加'
  END AS source_status
FROM medication_schedules ms
JOIN common_medications cm ON ms.medication_id = cm.id
ORDER BY ms.user_id, cm.name;

-- ===== 第 2 步：统计需要修复的药品数量 =====
SELECT COUNT(DISTINCT ms.medication_id) AS medications_to_fix
FROM medication_schedules ms
JOIN common_medications cm ON ms.medication_id = cm.id
WHERE cm.created_by IS NULL;

-- ===== 第 3 步：查看每个用户添加的药品中，有多少是"管理员导入"的 =====
SELECT
  ms.user_id,
  u.email,
  COUNT(DISTINCT ms.medication_id) AS total_medications,
  COUNT(DISTINCT CASE WHEN cm.created_by IS NULL THEN ms.medication_id END) AS admin_imported,
  COUNT(DISTINCT CASE WHEN cm.created_by = ms.user_id THEN ms.medication_id END) AS user_added,
  COUNT(DISTINCT CASE WHEN cm.created_by IS NOT NULL AND cm.created_by != ms.user_id THEN ms.medication_id END) AS other_user_added
FROM medication_schedules ms
JOIN common_medications cm ON ms.medication_id = cm.id
LEFT JOIN auth.users u ON ms.user_id = u.id
GROUP BY ms.user_id, u.email
ORDER BY ms.user_id;

-- ===== 第 4 步：修复方案 A - 将用户添加但 created_by 为 NULL 的药品更新为用户 ID =====
-- 注意：这会将"管理员导入"的药品重新标记为"用户添加"
-- 如果某个药品被多个用户添加，只会记录第一个用户的 ID

-- 创建一个临时表记录修复前的状态
CREATE TEMP TABLE IF NOT EXISTS medication_source_fix_log AS
SELECT
  ms.user_id,
  ms.medication_id,
  cm.name AS medication_name,
  cm.created_by AS old_created_by,
  NOW() AS fixed_at
FROM medication_schedules ms
JOIN common_medications cm ON ms.medication_id = cm.id
WHERE cm.created_by IS NULL;

-- 更新 common_medications 表，将用户添加但 created_by 为 NULL 的药品更新为用户 ID
-- 注意：如果一个药品被多个用户添加，使用最早添加的用户
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

-- ===== 第 5 步：验证修复结果 =====
SELECT
  CASE
    WHEN cm.created_by IS NULL THEN '管理员导入'
    ELSE '用户添加'
  END AS source_type,
  COUNT(*) AS count
FROM common_medications cm
GROUP BY
  CASE
    WHEN cm.created_by IS NULL THEN '管理员导入'
    ELSE '用户添加'
  END;

-- ===== 第 6 步：查看修复后的详情 =====
SELECT
  log.medication_id,
  log.medication_name,
  log.old_created_by,
  cm.created_by AS new_created_by,
  u.email AS added_by_email,
  log.fixed_at
FROM medication_source_fix_log log
JOIN common_medications cm ON log.medication_id = cm.id
LEFT JOIN auth.users u ON cm.created_by = u.id
ORDER BY log.medication_name;

-- ===== 第 7 步：删除临时表 =====
DROP TABLE IF EXISTS medication_source_fix_log;
