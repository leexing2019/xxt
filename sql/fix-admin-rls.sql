-- =====================================================
-- 修复管理后台访问权限 - 允许管理员查看所有用户数据
-- =====================================================

-- 方案 1：创建一个 isAdmin() 函数，然后在 RLS 策略中使用
-- 检查用户邮箱是否包含 "admin@" 或者是否在 admin_users 表中

CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- 获取当前用户的邮箱
  SELECT auth.users.email INTO user_email
  FROM auth.users
  WHERE auth.users.id = auth.uid();

  -- 如果邮箱包含 admin，返回 true
  IF user_email LIKE '%admin%' THEN
    RETURN TRUE;
  END IF;

  -- 或者检查是否在 admin_users 表中
  IF EXISTS (
    SELECT 1 FROM admin_users WHERE email = user_email
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== profiles 表 - 管理员可以查看所有用户 =====
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- ===== medications 表 - 管理员可以查看所有药品 =====
DROP POLICY IF EXISTS "Admins can view all medications" ON medications;
CREATE POLICY "Admins can view all medications" ON medications
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- ===== medication_schedules 表 - 管理员可以查看所有用药计划 =====
DROP POLICY IF EXISTS "Admins can view all schedules" ON medication_schedules;
CREATE POLICY "Admins can view all schedules" ON medication_schedules
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- ===== medication_logs 表 - 管理员可以查看所有用药记录 =====
DROP POLICY IF EXISTS "Admins can view all medication logs" ON medication_logs;
CREATE POLICY "Admins can view all medication logs" ON medication_logs
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- ===== health_records 表 - 管理员可以查看所有健康记录 =====
DROP POLICY IF EXISTS "Admins can view all health records" ON health_records;
CREATE POLICY "Admins can view all health records" ON health_records
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- ===== medical_history_answers 表 - 管理员可以查看所有病史答案 =====
DROP POLICY IF EXISTS "Admins can view all history answers" ON medical_history_answers;
CREATE POLICY "Admins can view all history answers" ON medical_history_answers
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- ===== 验证策略已创建 =====
SELECT
  tablename,
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE 'Admins can view%'
ORDER BY tablename, policyname;
