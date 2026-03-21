-- ============================================
-- 修复 profiles 表触发器 - 确保注册用户自动创建 profile
-- ============================================
-- 问题：uni-app 注册用户无法出现在 admin 用户列表中
-- 原因：auth.users 创建后，profiles 表没有自动插入记录
-- 解决：重新创建触发器函数和触发器
-- ============================================

-- 1. 检查当前触发器状态
SELECT '当前触发器列表:' AS info;
SELECT tgname, tgrelid::regclass, tgenabled
FROM pg_trigger
WHERE tgname LIKE '%user%' OR tgname LIKE '%profile%';

-- 2. 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- 3. 创建触发器函数
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 为新用户创建 profile 记录
  INSERT INTO profiles (id, username, phone, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.created_at, NOW())
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 创建触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 5. 验证触发器已创建
SELECT '触发器创建成功！' AS status;
SELECT tgname, tgrelid::regclass AS table_name, tgenabled AS status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- 6. 为现有用户 lx1986 手动创建 profile（如果不存在）
INSERT INTO profiles (id, username, phone, created_at)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'username', au.email),
  COALESCE(au.raw_user_meta_data->>'phone', ''),
  COALESCE(au.created_at, NOW())
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 7. 验证结果
SELECT '验证结果:' AS info;
SELECT
  (SELECT COUNT(*) FROM auth.users) AS auth_users_total,
  (SELECT COUNT(*) FROM profiles) AS profiles_total,
  (SELECT COUNT(*) FROM profiles WHERE username = 'lx1986' OR phone LIKE '%1986%') AS lx1986_exists;

-- 8. 显示所有用户
SELECT '所有用户列表:' AS info;
SELECT
  p.id,
  p.username,
  p.phone,
  p.created_at,
  au.email
FROM profiles p
JOIN auth.users au ON au.id = p.id
ORDER BY p.created_at DESC;
