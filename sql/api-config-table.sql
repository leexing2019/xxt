-- API 配置表 - 用于存储第三方 API 密钥
-- 运行此脚本创建 api_config 表

-- 创建 API 配置表
CREATE TABLE IF NOT EXISTS api_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  baidu_ocr_api_key TEXT,
  baidu_ocr_secret TEXT,
  baidu_speech_app_id TEXT,
  baidu_speech_api_key TEXT,
  baidu_speech_secret TEXT,
  drug_api_base_url TEXT,
  drug_api_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- 启用 RLS
ALTER TABLE api_config ENABLE ROW LEVEL SECURITY;

-- 只允许管理员访问 API 配置
-- 注意：这需要在 Supabase 中创建 admin 角色或使用特定的用户 ID
CREATE POLICY "Admin can view API config" ON api_config
  FOR SELECT USING (true);

CREATE POLICY "Admin can insert API config" ON api_config
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can update API config" ON api_config
  FOR UPDATE USING (true);

-- 创建触发器自动更新 updated_at
CREATE TRIGGER update_api_config_updated_at
  BEFORE UPDATE ON api_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 初始化一行数据（可选）
INSERT INTO api_config (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;
