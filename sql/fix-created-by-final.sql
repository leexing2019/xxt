-- =====================================================
-- 修复 created_by 不生效 - 最终方案
-- =====================================================
-- 问题根因：RLS 策略中的 WITH CHECK (created_by IS NULL OR created_by = auth.uid())
-- 可能阻止了 INSERT，因为 INSERT 时 created_by 字段可能还没有被正确解析
--
-- 解决方案：
-- 1. 放宽 INSERT 策略，允许任何认证用户插入
-- 2. 创建触发器确保 INSERT 时 created_by 自动设置为当前用户

-- ===== 第 1 步：创建触发器，自动设置 created_by =====
CREATE OR REPLACE FUNCTION fn_set_created_by_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果是 INSERT 且 created_by 为 NULL，自动设置为当前用户
  IF (TG_OP = 'INSERT' AND NEW.created_by IS NULL) THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_set_created_by_on_insert ON common_medications;
CREATE TRIGGER trg_set_created_by_on_insert
  BEFORE INSERT ON common_medications
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_created_by_on_insert();

-- ===== 第 2 步：放宽 INSERT 策略 =====
DROP POLICY IF EXISTS "authenticated_users_can_insert" ON common_medications;

-- 允许任何认证用户插入（不检查 created_by，由触发器自动设置）
CREATE POLICY "authenticated_users_can_insert" ON common_medications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ===== 第 3 步：验证触发器已创建 =====
SELECT tgname AS trigger_name, tgenabled AS enabled
FROM pg_trigger
WHERE tgname = 'trg_set_created_by_on_insert';

-- ===== 第 4 步：验证策略已更新 =====
SELECT policyname, with_check
FROM pg_policies
WHERE tablename = 'common_medications' AND policyname = 'authenticated_users_can_insert';

-- ===== 第 5 步：更新现有的 NULL 记录 =====
-- 将用户已拥有但 created_by 为 NULL 的药品更新为用户 ID
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

-- 如果上面没有更新任何记录（因为是全新添加的药品），则需要更新最近添加的 test 药品
-- 获取当前测试用户的 ID（通过已有的 medication_schedules 记录）
UPDATE common_medications cm
SET created_by = (
  SELECT ms.user_id
  FROM medication_schedules ms
  WHERE ms.medication_id = cm.id
  LIMIT 1
)
WHERE cm.created_by IS NULL
AND cm.name = 'test';

-- ===== 第 6 步：验证修复结果 =====
SELECT id, name, created_by,
  CASE
    WHEN created_by IS NULL THEN '管理员导入'
    ELSE '用户添加'
  END AS source_type
FROM admin_medication_sources
WHERE name = 'test';

-- ===== 第 7 步：查看整体分布 =====
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
