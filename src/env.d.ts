/**
 * AI用药助手 - TypeScript类型声明
 */

// Vue3 Composition API
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $refs: any
  }
}

// uni-app 全局方法
declare const uni: UniApp.Uni

// 环境变量
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 页面参数
interface PageOptions {
  id?: string
  [key: string]: any
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 语音识别结果
interface SpeechResult {
  success: boolean
  text?: string
  error?: string
}

// OCR识别结果
interface OCRResult {
  name?: string
  specification?: string
  manufacturer?: string
  dosage?: string
  form?: string
  barcode?: string
  confidence?: number
}

// 药品信息
interface Medication {
  id: string
  user_id: string
  name: string
  generic_name?: string
  manufacturer?: string
  specification?: string
  form?: string
  appearance_desc?: string
  dosage_unit?: string
  color?: string
  shape?: string
  barcode?: string
  image_url?: string
  created_at: string
}

// 用药计划
interface MedicationSchedule {
  id: string
  medication_id: string
  user_id: string
  time_of_day: string
  dosage: string
  instructions?: string
  weekdays: number[]
  start_date: string
  end_date?: string
  is_active: boolean
  medication?: Medication
}

// 用药记录
interface MedicationLog {
  id: string
  schedule_id: string
  user_id: string
  scheduled_time: string
  taken_time?: string
  status: 'taken' | 'missed' | 'delayed'
  side_effects?: string
  notes?: string
  created_at: string
}

// 健康记录
interface HealthRecord {
  id: string
  user_id: string
  date: string
  symptoms?: any
  vital_signs?: any
  overall_feeling?: string
  notes?: string
  created_at: string
}

// 病史问答答案
interface MedicalHistoryAnswer {
  id: string
  user_id: string
  question_id: string
  answer: string
  updated_at: string
}

// 病史问答题目
interface MedicalHistoryQuestion {
  id: string
  question: string
  type: 'text' | 'number' | 'select' | 'textarea'
  options?: string[]
}

// 紧急情况信息
interface EmergencyInfo {
  type: string
  title: string
  symptoms: string[]
  actions: string[]
  warnings: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
}

// 提醒数据
interface ReminderData {
  id: string
  title: string
  content: string
  time: string
  medicationName: string
  dosage: string
  medicationId?: string
  scheduleId?: string
}

// Supabase响应类型
interface SupabaseResponse<T> {
  data: T | null
  error: any
}

interface SupabaseQueryResponse<T> {
  data: T[] | null
  error: any
}
