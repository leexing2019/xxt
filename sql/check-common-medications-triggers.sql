-- =====================================================
-- 检查 common_medications 表的触发器
-- =====================================================

-- 1. 检查所有触发器
SELECT
  tgname AS trigger_name,
  tgtype AS trigger_type,
  tgenabled AS enabled,
  relname AS table_name
FROM pg_trigger
JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
WHERE relname = 'common_medications';

-- 2. 检查触发器函数定义
SELECT
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_definition LIKE '%common_medications%';

-- 3. 查看 created_by 字段是否有默认值
SELECT
  column_name,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'common_medications'
AND column_name = 'created_by';

-- 4. 检查“氯化钠”药品的实际数据
SELECT
  id,
  name,
  created_by,
  created_at,
  (SELECT email FROM auth.users WHERE id = common_medications.created_by) AS user_email
FROM common_medications
WHERE name LIKE '%氯化钠%';
