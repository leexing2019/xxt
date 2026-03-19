import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/services/supabase'
import { useAuthStore } from './auth'

export interface HealthRecord {
  id: string
  user_id: string
  date: string
  symptoms: any
  vital_signs: any
  overall_feeling: string
  notes?: string
  created_at: string
}

export interface MedicalHistoryAnswer {
  id: string
  question_id: string
  answer: string
}

// 病史问答题目
export const medicalHistoryQuestions = [
  { id: 'name', question: '您的姓名？', type: 'text' },
  { id: 'age', question: '您的年龄？', type: 'number' },
  { id: 'gender', question: '您的性别？', type: 'select', options: ['男', '女'] },
  { id: 'chief_complaint', question: '这次就诊主要想解决什么问题？', type: 'textarea' },
  { id: 'symptoms_duration', question: '症状持续多长时间了？', type: 'text' },
  { id: 'symptoms_description', question: '请描述一下您的症状', type: 'textarea' },
  { id: 'current_medications', question: '目前正在服用哪些药物？', type: 'textarea' },
  { id: 'allergies', question: '您有哪些药物过敏？', type: 'textarea' },
  { id: 'chronic_diseases', question: '您有哪些慢性病？', type: 'textarea' },
  { id: 'previous_surgeries', question: '您做过哪些手术？', type: 'textarea' },
  { id: 'family_history', question: '家族中有什么遗传病史吗？', type: 'textarea' },
  { id: 'recent_checkups', question: '最近有什么检查结果？', type: 'textarea' },
  { id: 'lifestyle', question: '您的生活习惯（饮食、运动、睡眠）？', type: 'textarea' }
]

export const useHealthStore = defineStore('health', () => {
  const authStore = useAuthStore()
  
  // 状态
  const healthRecords = ref<HealthRecord[]>([])
  const medicalHistoryAnswers = ref<MedicalHistoryAnswer[]>([])
  const loading = ref(false)

  // 获取健康记录
  async function fetchHealthRecords() {
    if (!authStore.userId) return
    
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('health_records')
        .select('*')
        .eq('user_id', authStore.userId)
        .order('date', { ascending: false })
      
      if (error) throw error
      healthRecords.value = data || []
    } catch (error) {
      console.error('获取健康记录失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 添加健康记录
  async function addHealthRecord(record: Partial<HealthRecord>) {
    if (!authStore.userId) return { success: false, error: '未登录' }
    
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('health_records')
        .insert({
          ...record,
          user_id: authStore.userId
        })
        .select()
        .single()
      
      if (error) throw error
      
      healthRecords.value.unshift(data)
      return { success: true, data }
    } catch (error: any) {
      console.error('添加健康记录失败:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // 获取病史问答
  async function fetchMedicalHistoryAnswers() {
    if (!authStore.userId) return
    
    try {
      const { data, error } = await supabase
        .from('medical_history_answers')
        .select('*')
        .eq('user_id', authStore.userId)
      
      if (error) throw error
      medicalHistoryAnswers.value = data || []
    } catch (error) {
      console.error('获取病史问答失败:', error)
    }
  }

  // 保存病史问答答案
  async function saveMedicalHistoryAnswer(questionId: string, answer: string) {
    if (!authStore.userId) return { success: false, error: '未登录' }
    
    try {
      const existing = medicalHistoryAnswers.value.find(a => a.question_id === questionId)
      
      if (existing) {
        const { error } = await supabase
          .from('medical_history_answers')
          .update({ answer, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
        
        if (error) throw error
        existing.answer = answer
      } else {
        const { data, error } = await supabase
          .from('medical_history_answers')
          .insert({
            user_id: authStore.userId,
            question_id: questionId,
            answer
          })
          .select()
          .single()
        
        if (error) throw error
        medicalHistoryAnswers.value.push(data)
      }
      
      return { success: true }
    } catch (error: any) {
      console.error('保存病史问答失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 生成病史报告
  function generateMedicalHistoryReport(): string {
    const answers = medicalHistoryAnswers.value
    const records = healthRecords.value
    
    let report = '=== 病史摘要 ===\n\n'
    
    // 基本信息
    const name = answers.find(a => a.question_id === 'name')?.answer || '未填写'
    const age = answers.find(a => a.question_id === 'age')?.answer || '未填写'
    const gender = answers.find(a => a.question_id === 'gender')?.answer || '未填写'
    
    report += `姓名：${name}\n`
    report += `年龄：${age}岁\n`
    report += `性别：${gender}\n\n`
    
    // 主诉
    const chiefComplaint = answers.find(a => a.question_id === 'chief_complaint')?.answer
    if (chiefComplaint) {
      report += `【主诉】\n${chiefComplaint}\n\n`
    }
    
    // 症状
    const symptomsDuration = answers.find(a => a.question_id === 'symptoms_duration')?.answer
    const symptomsDescription = answers.find(a => a.question_id === 'symptoms_description')?.answer
    if (symptomsDescription) {
      report += `【症状描述】\n持续时间：${symptomsDuration || '未填写'}\n详情：${symptomsDescription}\n\n`
    }
    
    // 用药情况
    const currentMeds = answers.find(a => a.question_id === 'current_medications')?.answer
    if (currentMeds) {
      report += `【当前用药】\n${currentMeds}\n\n`
    }
    
    // 过敏史
    const allergies = answers.find(a => a.question_id === 'allergies')?.answer
    if (allergies) {
      report += `【药物过敏史】\n${allergies}\n\n`
    }
    
    // 慢性病
    const chronicDiseases = answers.find(a => a.question_id === 'chronic_diseases')?.answer
    if (chronicDiseases) {
      report += `【慢性病史】\n${chronicDiseases}\n\n`
    }
    
    // 手术史
    const surgeries = answers.find(a => a.question_id === 'previous_surgeries')?.answer
    if (surgeries) {
      report += `【手术史】\n${surgeries}\n\n`
    }
    
    // 家族史
    const familyHistory = answers.find(a => a.question_id === 'family_history')?.answer
    if (familyHistory) {
      report += `【家族史】\n${familyHistory}\n\n`
    }
    
    // 最近检查
    const recentCheckups = answers.find(a => a.question_id === 'recent_checkups')?.answer
    if (recentCheckups) {
      report += `【近期检查结果】\n${recentCheckups}\n\n`
    }
    
    // 生活习惯
    const lifestyle = answers.find(a => a.question_id === 'lifestyle')?.answer
    if (lifestyle) {
      report += `【生活习惯】\n${lifestyle}\n\n`
    }
    
    // 健康记录摘要
    if (records.length > 0) {
      report += `【近期健康记录】\n`
      const recentRecords = records.slice(0, 7) // 最近7条
      recentRecords.forEach(record => {
        report += `- ${record.date}：${record.overall_feeling || '一般'}\n`
      })
    }
    
    report += '\n=== 报告生成时间 ===\n'
    report += new Date().toLocaleString('zh-CN')
    
    return report
  }

  // 获取用药依从性统计
  function getComplianceStats() {
    // 实际项目中从medication_logs计算
    return {
      total: 30,
      taken: 25,
      missed: 3,
      delayed: 2,
      rate: 83.3
    }
  }

  return {
    // 状态
    healthRecords,
    medicalHistoryAnswers,
    loading,
    // 方法
    fetchHealthRecords,
    addHealthRecord,
    fetchMedicalHistoryAnswers,
    saveMedicalHistoryAnswer,
    generateMedicalHistoryReport,
    getComplianceStats
  }
})
