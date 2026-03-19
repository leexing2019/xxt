/**
 * 初始化示例数据服务
 * 用于在用户首次使用时填充演示数据
 */

import { sampleMedications } from './sample-data'
import { useMedicationStore } from '@/store/medication'
import { useHealthStore } from '@/store/health'

export interface InitResult {
  success: boolean
  message: string
  dataCount?: number
}

/**
 * 初始化演示数据
 */
export async function initDemoData(): Promise<InitResult> {
  try {
    const medicationStore = useMedicationStore()
    
    // 添加示例药品
    let addedCount = 0
    
    for (const med of sampleMedications) {
      const result = await medicationStore.addMedication({
        name: med.name,
        generic_name: med.genericName,
        specification: med.specification,
        manufacturer: med.manufacturer,
        form: med.form,
        appearance_desc: med.appearance,
        dosage_unit: med.dosage
      })
      
      if (result.success && result.data) {
        // 添加用药计划
        const times = ['08:00', '20:00']
        for (const time of times) {
          await medicationStore.addSchedule({
            medication_id: result.data.id,
            time_of_day: time,
            dosage: '1片',
            instructions: med.instructions,
            weekdays: [1, 2, 3, 4, 5, 6, 7],
            start_date: new Date().toISOString().split('T')[0]
          })
        }
        addedCount++
      }
    }
    
    // 添加健康记录示例
    const healthStore = useHealthStore()
    const today = new Date()
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      await healthStore.addHealthRecord({
        date: date.toISOString().split('T')[0],
        overall_feeling: ['better', 'same', 'same', 'better', 'same', 'worse', 'same'][i],
        notes: ['', '服药后感觉良好', '', '头晕症状减轻', '', '今日忘记服药', ''][i],
        symptoms: {},
        vital_signs: {}
      })
    }
    
    return {
      success: true,
      message: '演示数据初始化成功',
      dataCount: addedCount
    }
  } catch (error) {
    console.error('初始化演示数据失败:', error)
    return {
      success: false,
      message: '演示数据初始化失败'
    }
  }
}

/**
 * 检查是否需要显示演示数据引导
 */
export function shouldShowDemoGuide(): boolean {
  try {
    const shown = uni.getStorageSync('demo_data_shown')
    return !shown
  } catch {
    return true
  }
}

/**
 * 标记演示数据已显示
 */
export function markDemoDataShown(): void {
  try {
    uni.setStorageSync('demo_data_shown', true)
  } catch {
    console.error('标记演示数据失败')
  }
}

/**
 * 重置演示数据
 */
export async function resetDemoData(): Promise<InitResult> {
  try {
    const medicationStore = useMedicationStore()
    const healthStore = useHealthStore()
    
    // 清空现有数据
    for (const med of medicationStore.medications) {
      await medicationStore.deleteMedication(med.id)
    }
    
    // 标记为未显示
    markDemoDataShown()
    
    return {
      success: true,
      message: '数据已重置'
    }
  } catch (error) {
    return {
      success: false,
      message: '重置失败'
    }
  }
}
