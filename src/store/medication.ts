import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'
import { useAuthStore } from './auth'

export interface Medication {
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

export interface MedicationSchedule {
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
  created_at: string
  medication?: Medication
}

export interface MedicationLog {
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

export const useMedicationStore = defineStore('medication', () => {
  const authStore = useAuthStore()
  
  // 状态
  const medications = ref<Medication[]>([])
  const schedules = ref<MedicationSchedule[]>([])
  const todayLogs = ref<MedicationLog[]>([])
  const loading = ref(false)

  // 计算属性 - 获取今日待用药
  const todayMedications = computed(() => {
    const now = new Date()
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay() // 周一=1, 周日=7
    
    return schedules.value.filter(s => 
      s.is_active && 
      s.weekdays.includes(dayOfWeek)
    )
  })

  // 获取所有药品
  async function fetchMedications() {
    if (!authStore.userId) return
    
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', authStore.userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      medications.value = data || []
    } catch (error) {
      console.error('获取药品失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 添加药品
  async function addMedication(medication: Partial<Medication>) {
    if (!authStore.userId) return { success: false, error: '未登录' }
    
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('medications')
        .insert({
          ...medication,
          user_id: authStore.userId
        })
        .select()
        .single()
      
      if (error) throw error
      
      medications.value.unshift(data)
      return { success: true, data }
    } catch (error: any) {
      console.error('添加药品失败:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // 更新药品
  async function updateMedication(id: string, updates: Partial<Medication>) {
    loading.value = true
    try {
      const { error } = await supabase
        .from('medications')
        .update(updates)
        .eq('id', id)
      
      if (error) throw error
      
      const index = medications.value.findIndex(m => m.id === id)
      if (index !== -1) {
        medications.value[index] = { ...medications.value[index], ...updates }
      }
      
      return { success: true }
    } catch (error: any) {
      console.error('更新药品失败:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // 删除药品
  async function deleteMedication(id: string) {
    loading.value = true
    try {
      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      medications.value = medications.value.filter(m => m.id !== id)
      return { success: true }
    } catch (error: any) {
      console.error('删除药品失败:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // 获取用药计划
  async function fetchSchedules() {
    if (!authStore.userId) return
    
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('medication_schedules')
        .select('*, medications(*)')
        .eq('user_id', authStore.userId)
        .order('time_of_day')
      
      if (error) throw error
      schedules.value = data || []
    } catch (error) {
      console.error('获取用药计划失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 添加用药计划
  async function addSchedule(schedule: Partial<MedicationSchedule>) {
    if (!authStore.userId) return { success: false, error: '未登录' }
    
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('medication_schedules')
        .insert({
          ...schedule,
          user_id: authStore.userId
        })
        .select('*, medications(*)')
        .single()
      
      if (error) throw error
      
      schedules.value.push(data)
      schedules.value.sort((a, b) => a.time_of_day.localeCompare(b.time_of_day))
      
      return { success: true, data }
    } catch (error: any) {
      console.error('添加用药计划失败:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // 更新用药计划
  async function updateSchedule(id: string, updates: Partial<MedicationSchedule>) {
    loading.value = true
    try {
      const { error } = await supabase
        .from('medication_schedules')
        .update(updates)
        .eq('id', id)
      
      if (error) throw error
      
      const index = schedules.value.findIndex(s => s.id === id)
      if (index !== -1) {
        schedules.value[index] = { ...schedules.value[index], ...updates }
      }
      
      return { success: true }
    } catch (error: any) {
      console.error('更新用药计划失败:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // 删除用药计划
  async function deleteSchedule(id: string) {
    loading.value = true
    try {
      const { error } = await supabase
        .from('medication_schedules')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      schedules.value = schedules.value.filter(s => s.id !== id)
      return { success: true }
    } catch (error: any) {
      console.error('删除用药计划失败:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // 记录服药
  async function logMedication(scheduleId: string, status: 'taken' | 'missed' | 'delayed', notes?: string) {
    if (!authStore.userId) return { success: false, error: '未登录' }
    
    try {
      const { data, error } = await supabase
        .from('medication_logs')
        .insert({
          schedule_id: scheduleId,
          user_id: authStore.userId,
          scheduled_time: new Date().toISOString(),
          taken_time: status === 'taken' ? new Date().toISOString() : null,
          status,
          notes
        })
        .select()
        .single()
      
      if (error) throw error
      
      todayLogs.value.push(data)
      return { success: true, data }
    } catch (error: any) {
      console.error('记录服药失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 获取今日服药记录
  async function fetchTodayLogs() {
    if (!authStore.userId) return
    
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const { data, error } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('user_id', authStore.userId)
        .gte('scheduled_time', today.toISOString())
        .lt('scheduled_time', tomorrow.toISOString())
      
      if (error) throw error
      todayLogs.value = data || []
    } catch (error) {
      console.error('获取今日记录失败:', error)
    }
  }

  return {
    // 状态
    medications,
    schedules,
    todayLogs,
    loading,
    // 计算属性
    todayMedications,
    // 方法
    fetchMedications,
    addMedication,
    updateMedication,
    deleteMedication,
    fetchSchedules,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    logMedication,
    fetchTodayLogs
  }
})
