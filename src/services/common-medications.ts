/**
 * 公共药品库服务 - 从 Supabase 读取公共药品数据
 *
 * 所有用户都可以查看公共药品库中的药品
 * 管理员可以在管理后台添加/编辑/删除公共药品
 */

import { supabase } from './supabase'
import PinyinMatch from 'pinyin-match'

/**
 * 公共药品接口（与数据库 common_medications 表对应）
 */
export interface CommonMedication {
  id: string
  name: string
  generic_name?: string
  category: string
  manufacturer?: string
  specification?: string
  form?: string
  appearance_desc?: string
  dosage_unit?: string
  color?: string
  shape?: string
  barcode?: string
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * 前端展示的药品接口（兼容现有代码）
 */
export interface DisplayMedication {
  id: string
  name: string
  genericName: string
  category: string
  indications: string
  appearanceDesc: string
  image: string
  usage: string
}

// 内存缓存
let cachedMedications: CommonMedication[] | null = null
let lastFetchTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 分钟缓存

/**
 * 从 Supabase 获取公共药品库
 */
export async function fetchCommonMedications(): Promise<CommonMedication[]> {
  const now = Date.now()

  // 检查缓存
  if (cachedMedications && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedMedications
  }

  try {
    const { data, error } = await supabase
      .from('common_medications')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) throw error

    cachedMedications = data || []
    lastFetchTime = now

    return cachedMedications
  } catch (error) {
    console.error('获取公共药品库失败:', error)
    // 失败时返回空数组
    return []
  }
}

/**
 * 获取前端展示格式的药品列表
 */
export async function getDisplayMedications(): Promise<DisplayMedication[]> {
  const commonMeds = await fetchCommonMedications()

  return commonMeds.map(med => ({
    id: med.id,
    name: med.name,
    genericName: med.generic_name || med.name,
    category: med.category,
    indications: getCategoryIndication(med.category),
    appearanceDesc: med.appearance_desc || '请确认外观',
    image: med.image_url || getPlaceholderImage(med.name),
    usage: getDefaultUsage(med.category, med.form)
  }))
}

/**
 * 根据分类获取药品
 */
export async function getMedicationsByCategory(categoryId: string): Promise<DisplayMedication[]> {
  const allMeds = await getDisplayMedications()

  if (categoryId === 'all') {
    return allMeds
  }

  return allMeds.filter(med => med.category === categoryId)
}

/**
 * 搜索药品（支持中文、拼音首字母搜索）
 */
export async function searchMedications(keyword: string): Promise<DisplayMedication[]> {
  const allMeds = await getDisplayMedications()
  const kw = keyword.toLowerCase().trim()

  if (!kw) return []

  return allMeds.filter(med => {
    // 中文搜索
    if (med.name.toLowerCase().includes(kw) ||
        med.genericName.toLowerCase().includes(kw) ||
        med.category.toLowerCase().includes(kw)) {
      return true
    }

    // 拼音首字母搜索（使用 pinyin-match 库）
    if (PinyinMatch.match(med.name, keyword)) {
      return true
    }
    if (med.generic_name && PinyinMatch.match(med.generic_name, keyword)) {
      return true
    }

    return false
  }).slice(0, 10)
}

/**
 * 获取分类对应的适应症（简化版）
 */
function getCategoryIndication(category: string): string {
  const indications: Record<string, string> = {
    '降压药': '降血压',
    '降糖药': '降血糖',
    '降脂药': '降血脂',
    '心血管药': '心血管疾病',
    '胃药': '胃部不适',
    '止咳药': '止咳化痰',
    '止痛药': '止痛',
    '维生素': '补充维生素',
    '钙片': '补钙'
  }
  return indications[category] || '请确认用途'
}

/**
 * 获取默认用法用量（简化版）
 */
function getDefaultUsage(category: string, form?: string): string {
  const defaultUsage: Record<string, string> = {
    '降压药': '每次 1 片，每日 1 次',
    '降糖药': '每次 1 片，每日 2-3 次',
    '降脂药': '每次 1 片，每日 1 次，睡前服用',
    '心血管药': '遵医嘱服用',
    '胃药': '每次 1 片/粒，每日 1-2 次',
    '止咳药': '每次 1 片，每日 3 次',
    '止痛药': '需要时服用',
    '维生素': '每次 1 片，每日 1 次',
    '钙片': '每次 1 片，每日 1-2 次'
  }
  return defaultUsage[category] || '每次 1 片，每日 1 次'
}

/**
 * 生成药品占位图
 */
function getPlaceholderImage(name: string): string {
  const colors = ['4CAF50', '2196F3', 'FF9800', 'E91E63', '9C27B0', '00BCD4', 'FFC107', '795548']
  const color = colors[name.length % colors.length]
  const text = encodeURIComponent(name.charAt(0))
  return `https://via.placeholder.com/200x200/${color}/ffffff?text=${text}`
}

/**
 * 清除缓存
 */
export function clearCache() {
  cachedMedications = null
  lastFetchTime = 0
}
