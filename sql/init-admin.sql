-- 管理后台初始化脚本
-- 用于创建管理员账户和默认 API 配置

-- 1. 创建默认管理员账户
-- 注意：实际部署时请修改密码
INSERT INTO admin_users (email, password_hash, role)
VALUES (
  'admin@medication-assistant.local',
  '$2b$10$YourHashedPasswordHere', -- 请替换为实际加密的密码
  'admin'
)
ON CONFLICT (id) DO NOTHING;

-- 2. 创建默认 API 配置
-- 百度语音识别 API 配置
INSERT INTO app_settings (key, value, description)
VALUES (
  'baidu_api_config',
  '{
    "app_id": "YOUR_BAIDU_APP_ID",
    "api_key": "YOUR_BAIDU_API_KEY",
    "secret_key": "YOUR_BAIDU_SECRET_KEY"
  }'::jsonb,
  '百度语音识别和图片识别 API 配置'
)
ON CONFLICT (key) DO NOTHING;

-- 3. 创建默认应用配置
INSERT INTO app_settings (key, value, description)
VALUES (
  'app_config',
  '{
    "voice_recognition_enabled": true,
    "image_recognition_enabled": true,
    "voice_guidance_enabled": true,
    "elderly_mode_enabled": true
  }'::jsonb,
  '应用功能开关配置'
)
ON CONFLICT (key) DO NOTHING;
