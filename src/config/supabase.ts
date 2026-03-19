// Supabase 配置
// 请替换为您自己的Supabase项目配置

export const SUPABASE_URL = 'https://vqtrfkigzqtcthrivbzn.supabase.co'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxdHJma2lnenF0Y3Rocml2YnpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTUxOTUsImV4cCI6MjA4OTQ3MTE5NX0.YznHv4aNl7WpH4s8cjoYRR0_IH1guoBbLl6zRrdsb3s'

// 表名常量
export const TABLE_NAMES = {
  PROFILES: 'profiles',
  MEDICATIONS: 'medications',
  MEDICATION_SCHEDULES: 'medication_schedules',
  MEDICATION_LOGS: 'medication_logs',
  DRUG_CONTRAINDICATIONS: 'drug_contraindications',
  HEALTH_RECORDS: 'health_records',
  MEDICAL_HISTORY_ANSWERS: 'medical_history_answers'
}

// 存储键名
export const STORAGE_KEYS = {
  USER: 'user',
  TOKEN: 'token',
  SETTINGS: 'settings'
}
