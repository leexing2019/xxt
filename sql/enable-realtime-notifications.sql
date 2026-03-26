-- 检查并启用 remote_notifications 表的 Realtime 广播
-- 在 Supabase Dashboard → SQL Editor 中运行此脚本

-- 1. 检查当前 publication 状态
SELECT * FROM pg_publication_tables WHERE tablename = 'remote_notifications';

-- 2. 如果上面查询返回空结果，运行以下命令启用 Realtime
-- Supabase 使用 supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE remote_notifications;

-- 3. 验证启用成功
SELECT
  schemaname,
  tablename,
  tablename || '_' || schemaname as subscription_name
FROM pg_tables
WHERE tablename = 'remote_notifications';

-- 4. 检查 RLS 策略是否允许 authenticated 用户读取
-- 注意：remote_notifications 表需要允许用户读取自己的记录
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'remote_notifications';
