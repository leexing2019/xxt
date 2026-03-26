-- 检查 Realtime 发布配置
-- 在 Supabase Dashboard → SQL Editor 中运行

-- 1. 检查 publication 配置
SELECT
  schemaname,
  tablename,
  pubname,
  puballtables
FROM pg_publication_tables
WHERE tablename = 'remote_notifications';

-- 2. 检查表的复制标识
SELECT
  schemaname,
  tablename,
  replicaident
FROM pg_tables
WHERE tablename = 'remote_notifications';

-- 3. 检查 publication 详情
SELECT
  pubname,
  pubowner,
  puballtables,
  pubinsert,
  pubupdate,
  pubdelete
FROM pg_publication
WHERE pubname = 'supabase_realtime';
