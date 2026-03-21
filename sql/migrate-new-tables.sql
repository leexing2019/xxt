-- AI 用药助手 - Supabase 数据库迁移脚本（支持重复执行）
-- 在 Supabase SQL Editor 中执行此脚本

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建管理员用户表（管理后台使用）
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 应用配置表（存储 API 配置等全局设置）
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 药物相互作用表
CREATE TABLE IF NOT EXISTS drug_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  drug_a UUID REFERENCES medications(id) ON DELETE CASCADE,
  drug_b UUID REFERENCES medications(id) ON DELETE CASCADE,
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
  description TEXT,
  recommendation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);
CREATE INDEX IF NOT EXISTS idx_drug_interactions_drug_a ON drug_interactions(drug_a);
CREATE INDEX IF NOT EXISTS idx_drug_interactions_drug_b ON drug_interactions(drug_b);

-- 启用 RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_interactions ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略（先删除再创建）
-- admin_users: 管理员可访问
DROP POLICY IF EXISTS "Admin users can view admin_users" ON admin_users;
CREATE POLICY "Admin users can view admin_users" ON admin_users
  FOR SELECT USING (true);

-- app_settings: 所有用户可读，已认证用户可写
DROP POLICY IF EXISTS "Anyone can view app_settings" ON app_settings;
CREATE POLICY "Anyone can view app_settings" ON app_settings
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert app_settings" ON app_settings;
CREATE POLICY "Authenticated users can insert app_settings" ON app_settings
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Authenticated users can update app_settings" ON app_settings;
CREATE POLICY "Authenticated users can update app_settings" ON app_settings
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- drug_interactions: 所有人可读，已认证用户可写
DROP POLICY IF EXISTS "Anyone can view drug_interactions" ON drug_interactions;
CREATE POLICY "Anyone can view drug_interactions" ON drug_interactions
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert drug_interactions" ON drug_interactions;
CREATE POLICY "Authenticated users can insert drug_interactions" ON drug_interactions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Authenticated users can update drug_interactions" ON drug_interactions;
CREATE POLICY "Authenticated users can update drug_interactions" ON drug_interactions
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- 为 app_settings 和 drug_interactions 添加自动更新触发器
DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_drug_interactions_updated_at ON drug_interactions;
CREATE TRIGGER update_drug_interactions_updated_at
  BEFORE UPDATE ON drug_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
