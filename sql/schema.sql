-- AI用药助手 - Supabase 数据库结构
-- 运行此脚本创建所有表

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户资料表
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  phone TEXT,
  avatar_url TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 药品表
CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  generic_name TEXT,
  manufacturer TEXT,
  specification TEXT,
  form TEXT,
  appearance_desc TEXT,
  dosage_unit TEXT,
  color TEXT,
  shape TEXT,
  barcode TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用药计划表
CREATE TABLE IF NOT EXISTS medication_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_id UUID REFERENCES medications(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  time_of_day TEXT NOT NULL,
  dosage TEXT NOT NULL,
  instructions TEXT,
  weekdays INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7],
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用药记录表
CREATE TABLE IF NOT EXISTS medication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID REFERENCES medication_schedules(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  taken_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('taken', 'missed', 'delayed')),
  side_effects TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 药物禁忌表
CREATE TABLE IF NOT EXISTS drug_contraindications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_id UUID REFERENCES medications(id) ON DELETE CASCADE NOT NULL,
  contraindication_type TEXT NOT NULL,
  description TEXT,
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe'))
);

-- 健康记录表
CREATE TABLE IF NOT EXISTS health_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  symptoms JSONB,
  vital_signs JSONB,
  overall_feeling TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 病史问答答案表
CREATE TABLE IF NOT EXISTS medical_history_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  question_id TEXT NOT NULL,
  answer TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- 管理员用户表（管理后台使用）
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
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON medications(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_user_id ON medication_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_medication_id ON medication_schedules(medication_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_schedule_id ON medication_logs(schedule_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_user_id ON medication_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_health_records_user_id ON health_records(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_history_answers_user_id ON medical_history_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);
CREATE INDEX IF NOT EXISTS idx_drug_interactions_drug_a ON drug_interactions(drug_a);
CREATE INDEX IF NOT EXISTS idx_drug_interactions_drug_b ON drug_interactions(drug_b);

-- 启用RLS (行级安全策略)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_contraindications ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_history_answers ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- profiles: 用户只能访问自己的数据
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- medications: 用户只能访问自己的药品
CREATE POLICY "Users can view own medications" ON medications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own medications" ON medications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own medications" ON medications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own medications" ON medications
  FOR DELETE USING (auth.uid() = user_id);

-- medication_schedules: 用户只能访问自己的用药计划
CREATE POLICY "Users can view own schedules" ON medication_schedules
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own schedules" ON medication_schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own schedules" ON medication_schedules
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own schedules" ON medication_schedules
  FOR DELETE USING (auth.uid() = user_id);

-- medication_logs: 用户只能访问自己的用药记录
CREATE POLICY "Users can view own logs" ON medication_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON medication_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own logs" ON medication_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- health_records: 用户只能访问自己的健康记录
CREATE POLICY "Users can view own health records" ON health_records
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own health records" ON health_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own health records" ON health_records
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own health records" ON health_records
  FOR DELETE USING (auth.uid() = user_id);

-- medical_history_answers: 用户只能访问自己的病史答案
CREATE POLICY "Users can view own history answers" ON medical_history_answers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history answers" ON medical_history_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own history answers" ON medical_history_answers
  FOR UPDATE USING (auth.uid() = user_id);

-- 创建自动更新 updated_at 的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要自动更新 updated_at 的表创建触发器
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 创建新用户时自动创建profile的触发器
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- admin_users: 管理员可访问
CREATE POLICY "Admin users can view admin_users" ON admin_users
  FOR SELECT USING (true);

-- app_settings: 所有用户可读，仅管理员可写
CREATE POLICY "Anyone can view app_settings" ON app_settings
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert app_settings" ON app_settings
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update app_settings" ON app_settings
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- drug_interactions: 所有人可读
CREATE POLICY "Anyone can view drug_interactions" ON drug_interactions
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert drug_interactions" ON drug_interactions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update drug_interactions" ON drug_interactions
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- 为 app_settings 和 drug_interactions 添加自动更新触发器
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drug_interactions_updated_at
  BEFORE UPDATE ON drug_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
