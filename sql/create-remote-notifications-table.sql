-- 远程通知演示表
-- 创建日期：2026-03-26
-- 用途：支持后台管理系统远程触发 App 通知

-- 创建表
CREATE TABLE IF NOT EXISTS remote_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  notification_type TEXT NOT NULL,
  title TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建监听索引
CREATE INDEX IF NOT EXISTS idx_remote_notifications_user_created
ON remote_notifications(user_id, created_at DESC);

-- RLS 策略
ALTER TABLE remote_notifications ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的通知
DROP POLICY IF EXISTS "Users can view own notifications" ON remote_notifications;
CREATE POLICY "Users can view own notifications" ON remote_notifications
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 认证用户可以插入通知（发送）
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON remote_notifications;
CREATE POLICY "Authenticated users can insert notifications" ON remote_notifications
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = sent_by);

-- 用户可以更新自己通知的状态
DROP POLICY IF EXISTS "Users can update own notifications" ON remote_notifications;
CREATE POLICY "Users can update own notifications" ON remote_notifications
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- 启用 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE remote_notifications;
