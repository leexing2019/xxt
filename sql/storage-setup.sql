-- =============================================
-- 用药助手 - Storage Bucket 配置脚本
-- 用于创建图片存储桶和配置 RLS 策略
-- =============================================

-- 1. 创建 medication-images bucket (药品图片)
INSERT INTO storage.buckets (id, name, public)
VALUES ('medication-images', 'medication-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 创建 avatars bucket (用户头像)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- medication-images bucket RLS 策略
-- =============================================

-- 允许任何人查看药品图片（公开访问）
CREATE POLICY "允许任何人查看药品图片"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'medication-images');

-- 允许认证用户上传药品图片
CREATE POLICY "允许认证用户上传药品图片"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'medication-images');

-- 允许用户删除自己上传的药品图片
CREATE POLICY "允许用户删除自己的药品图片"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'medication-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- avatars bucket RLS 策略
-- =============================================

-- 允许任何人查看头像（公开访问）
CREATE POLICY "允许任何人查看头像"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 允许认证用户上传自己的头像
CREATE POLICY "允许用户上传自己的头像"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 允许用户更新自己的头像
CREATE POLICY "允许用户更新自己的头像"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 允许用户删除自己的头像
CREATE POLICY "允许用户删除自己的头像"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- 完成提示
-- =============================================
-- 执行此脚本后，请确认：
-- 1. buckets 表中存在 medication-images 和 avatars 记录
-- 2. storage.objects 表上有正确的 RLS 策略
-- 3. 在 Supabase 控制台 Storage 页面可以看到两个 bucket
