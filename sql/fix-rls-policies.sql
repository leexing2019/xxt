-- 修复 RLS 策略重复执行问题
-- 在 Supabase SQL Editor 中执行此脚本

-- 先删除现有的 profiles 策略（如果存在）
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

DROP POLICY IF EXISTS "Users can view own medications" ON medications;
DROP POLICY IF EXISTS "Users can insert own medications" ON medications;
DROP POLICY IF EXISTS "Users can update own medications" ON medications;
DROP POLICY IF EXISTS "Users can delete own medications" ON medications;

DROP POLICY IF EXISTS "Users can view own schedules" ON medication_schedules;
DROP POLICY IF EXISTS "Users can insert own schedules" ON medication_schedules;
DROP POLICY IF EXISTS "Users can update own schedules" ON medication_schedules;
DROP POLICY IF EXISTS "Users can delete own schedules" ON medication_schedules;

DROP POLICY IF EXISTS "Users can view own logs" ON medication_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON medication_logs;
DROP POLICY IF EXISTS "Users can update own logs" ON medication_logs;
DROP POLICY IF EXISTS "Users can delete own logs" ON medication_logs;

DROP POLICY IF EXISTS "Users can view own health records" ON health_records;
DROP POLICY IF EXISTS "Users can insert own health records" ON health_records;
DROP POLICY IF EXISTS "Users can update own health records" ON health_records;
DROP POLICY IF EXISTS "Users can delete own health records" ON health_records;

DROP POLICY IF EXISTS "Users can view own history answers" ON medical_history_answers;
DROP POLICY IF EXISTS "Users can insert own history answers" ON medical_history_answers;
DROP POLICY IF EXISTS "Users can update own history answers" ON medical_history_answers;
DROP POLICY IF EXISTS "Users can delete own history answers" ON medical_history_answers;

-- 重新创建策略
-- profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- medications
CREATE POLICY "Users can view own medications" ON medications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own medications" ON medications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own medications" ON medications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own medications" ON medications
  FOR DELETE USING (auth.uid() = user_id);

-- medication_schedules
CREATE POLICY "Users can view own schedules" ON medication_schedules
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own schedules" ON medication_schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own schedules" ON medication_schedules
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own schedules" ON medication_schedules
  FOR DELETE USING (auth.uid() = user_id);

-- medication_logs
CREATE POLICY "Users can view own logs" ON medication_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON medication_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own logs" ON medication_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- health_records
CREATE POLICY "Users can view own health records" ON health_records
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own health records" ON health_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own health records" ON health_records
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own health records" ON health_records
  FOR DELETE USING (auth.uid() = user_id);

-- medical_history_answers
CREATE POLICY "Users can view own history answers" ON medical_history_answers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history answers" ON medical_history_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own history answers" ON medical_history_answers
  FOR UPDATE USING (auth.uid() = user_id);
