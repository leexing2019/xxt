-- =====================================================
-- 修复 created_by 字段不生效问题 - 强制更新方案
-- =====================================================
-- 问题可能原因：
-- 1. RLS 策略阻止了 created_by 的写入
-- 2. 前端代码虽然传递了 created_by，但 Supabase 没有正确接收
-- 3. 有触发器将 created_by 设置为 NULL
--
-- 解决方案：
-- 1. 修改 RLS 策略，允许 created_by 为任何值（在 INSERT 时）
-- 2. 或者使用数据库触发器自动设置 created_by

-- ===== 第 1 步：查看当前 test 药品的数据 =====
SELECT id, name, created_by, created_at
FROM common_medications
WHERE name = 'test'
ORDER BY created_at DESC;

-- ===== 第 2 步：强制更新 test 药品的 created_by =====
-- 找到最近添加的 test 药品，更新为当前测试用户的 ID
-- 注意：需要先获取测试用户的 ID

-- 获取测试用户 ID（替换为你的用户邮箱）
-- SELECT id FROM auth.users WHERE email = '你的测试用户邮箱';

-- 假设测试用户 ID 是 xxxxx-xxxxx-xxxxx，执行：
-- UPDATE common_medications
-- SET created_by = 'xxxxx-xxxxx-xxxxx'
-- WHERE name = 'test' AND created_by IS NULL;

-- ===== 第 3 步：创建自动触发器（确保 INSERT 时 created_by 不被设置为 NULL）=====
-- 删除已存在的触发器
DROP TRIGGER IF EXISTS trg_set_created_by ON common_medications;

-- 创建触发器函数
CREATE OR REPLACE FUNCTION fn_set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果 created_by 为 NULL，自动设置为当前用户 ID
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
CREATE TRIGGER trg_set_created_by
  BEFORE INSERT ON common_medications
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_created_by();

-- ===== 第 4 步：修改 RLS 策略 - 允许 INSERT 时 created_by 为任何值 =====
DROP POLICY IF EXISTS "authenticated_users_can_insert" ON common_medications;

CREATE POLICY "authenticated_users_can_insert" ON common_medications
  FOR INSERT TO authenticated
  WITH CHECK (true);  -- 允许任何认证用户插入，不过滤 created_by

-- ===== 第 5 步：验证触发器和策略 =====
-- 查看触发器
SELECT tgname, tgrelid::regclass, tgenabled
FROM pg_trigger
WHERE tgname = 'trg_set_created_by';

-- 查看策略
SELECT policyname, cmd, with_check
FROM pg_policies
WHERE tablename = 'common_medications' AND policyname = 'authenticated_users_can_insert';

-- ===== 第 6 步：测试插入 =====
-- 手动插入一条测试记录
-- INSERT INTO common_medications (name, generic_name, category, is_active)
-- VALUES ('test-manual', 'test-generic', '其他', true);

-- 查看插入结果
-- SELECT name, created_by FROM common_medications WHERE name LIKE '%test%' ORDER BY created_at DESC;

-- ===== 第 7 步：更新现有的 NULL created_by 记录 =====
-- 将所有 created_by 为 NULL 且被用户拥有的药品更新为最早添加的用户
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

-- ===== 第 8 步：验证最终结果 =====
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

-- 查看 test 药品
SELECT id, name, created_by, source_type
FROM admin_medication_sources
WHERE name = 'test';
