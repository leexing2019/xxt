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
 * 药品名称转拼音首字母映射表（覆盖常用药品）
 */
const MEDICATION_PINYIN_MAP: Record<string, string> = {
  '硝苯地平缓释片': 'xbdp',
  '氨氯地平片': 'aldp',
  '厄贝沙坦片': 'ebst',
  '缬沙坦胶囊': 'xstjn',
  '美托洛尔缓释片': 'mtle',
  '非洛地平缓释片': 'fldp',
  '吲达帕胺片': 'ydaa',
  '氯沙坦钾片': 'cstk',
  '替米沙坦片': 'tmst',
  '比索洛尔片': 'bsle',
  '二甲双胍片': 'emsg',
  '格列美脲片': 'glmh',
  '阿卡波糖片': 'akbt',
  '格列齐特缓释片': 'glqt',
  '瑞格列奈片': 'rgln',
  '西格列汀片': 'xglt',
  '沙格列汀片': 'sglt',
  '达格列净片': 'dglj',
  '恩格列净片': 'eglj',
  '利拉鲁肽注射液': 'lllt',
  '阿托伐他汀钙片': 'atvt',
  '瑞舒伐他汀钙片': 'rsvt',
  '辛伐他汀片': 'xvt',
  '普伐他汀钠片': 'pvtn',
  '非诺贝特胶囊': 'fnbt',
  '依折麦布片': 'yzmb',
  '普罗布考片': 'plbk',
  '血脂康胶囊': 'xzk',
  '阿司匹林肠溶片': 'aspl',
  '氯吡格雷片': 'cpls',
  '华法林钠片': 'hfln',
  '单硝酸异山梨酯片': 'dxss',
  '硝酸甘油片': 'xgy',
  '奥美拉唑肠溶胶囊': 'amlz',
  '雷贝拉唑钠肠溶片': 'lblz',
  '泮托拉唑钠肠溶片': 'ptlz',
  '兰索拉唑肠溶胶囊': 'lslz',
  '铝碳酸镁咀嚼片': 'ltsm',
  '氨溴索片': 'axs',
  '溴己新片': 'xjx',
  '右美沙芬片': 'ymsf',
  '喷托维林片': 'ptwl',
  '布洛芬缓释胶囊': 'blf',
  '对乙酰氨基酚片': 'dyxa',
  '双氯芬酸钠肠溶片': 'slfs',
  '塞来昔布胶囊': 'slxb',
  '复合维生素片': 'fhws',
  '碳酸钙 D3 片': 'tgs',
  '维生素 B1 片': 'ws',
  '甲钴胺片': 'jga'
}

/**
 * 将中文文本转换为拼音首字母（简易版）
 */
export function toPinyinFirst(text: string): string {
  // 先检查完整映射
  const fullMatch = MEDICATION_PINYIN_MAP[text]
  if (fullMatch) return fullMatch

  // 逐字转换
  const pinyinMap: Record<string, string> = {
    '华': 'h', '法': 'f', '林': 'l', '钠': 'n', '片': 'p',
    '硝': 'x', '苯': 'b', '地': 'd', '平': 'p', '缓': 'h', '释': 's',
    '氨': 'a', '氯': 'l', '地': 'd', '平': 'p',
    '厄': 'e', '贝': 'b', '沙': 's', '坦': 't',
    '缬': 'x', '沙': 's', '坦': 't',
    '美': 'm', '托': 't', '洛': 'l', '尔': 'e',
    '非': 'f', '洛': 'l', '地': 'd', '平': 'p',
    '吲': 'y', '达': 'd', '帕': 'p', '胺': 'a',
    '替': 't', '米': 'm', '沙': 's', '坦': 't',
    '比': 'b', '索': 's', '洛': 'l', '尔': 'e',
    '二': 'e', '甲': 'j', '双': 's', '胍': 'g',
    '格': 'g', '列': 'l', '美': 'm', '脲': 'n',
    '阿': 'a', '卡': 'k', '波': 'b', '糖': 't',
    '瑞': 'r', '格': 'g', '列': 'l', '奈': 'n',
    '西': 'x', '格': 'g', '列': 'l', '汀': 't',
    '沙': 's', '格': 'g', '列': 'l', '汀': 't',
    '达': 'd', '格': 'g', '列': 'l', '净': 'j',
    '恩': 'e', '格': 'g', '列': 'l', '净': 'j',
    '利': 'l', '拉': 'l', '鲁': 'l', '肽': 't',
    '托': 't', '伐': 'f', '他': 't', '汀': 't',
    '舒': 's', '伐': 'f', '他': 't', '汀': 't',
    '辛': 'x', '伐': 'f', '他': 't', '汀': 't',
    '普': 'p', '伐': 'f', '他': 't', '汀': 't',
    '诺': 'n', '贝': 'b', '特': 't',
    '依': 'y', '折': 'z', '麦': 'm', '布': 'b',
    '普': 'p', '罗': 'l', '布': 'b', '考': 'k',
    '血': 'x', '脂': 'z', '康': 'k',
    '司': 's', '匹': 'p', '林': 'l',
    '吡': 'b', '雷': 'l',
    '单': 'd', '硝': 'x', '酸': 's', '异': 'y', '山': 's', '梨': 'l', '酯': 'z',
    '硝': 'x', '酸': 's', '甘': 'g', '油': 'y',
    '奥': 'a', '美': 'm', '拉': 'l', '唑': 'z',
    '雷': 'l', '贝': 'b', '拉': 'l', '唑': 'z',
    '泮': 'p', '托': 't', '拉': 'l', '唑': 'z',
    '兰': 'l', '索': 's', '拉': 'l', '唑': 'z',
    '铝': 'l', '碳': 't', '酸': 's', '镁': 'm',
    '溴': 'x', '己': 'j', '新': 'x',
    '右': 'y', '美': 'm', '沙': 's', '芬': 'f',
    '喷': 'p', '托': 't', '维': 'w',
    '布': 'b', '洛': 'l', '芬': 'f',
    '对': 'd', '乙': 'y', '酰': 'x', '氨': 'a', '基': 'j', '酚': 'f',
    '双': 's', '氯': 'l', '芬': 'f',
    '塞': 's', '来': 'l', '昔': 'x',
    '复': 'f', '合': 'h', '维': 'w', '生': 's',
    '碳': 't', '酸': 's', '钙': 'g',
    '维': 'w', '生': 's', '素': 's',
    '甲': 'j', '钴': 'g', '胺': 'a'
  }

  let result = ''
  for (const char of text) {
    result += pinyinMap[char] || ''
  }
  return result
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

    // 本地拼音首字母映射匹配（支持 hfln -> 华法林钠片）
    const namePinyin = toPinyinFirst(med.name).toLowerCase()
    const genericPinyin = med.genericName ? toPinyinFirst(med.genericName).toLowerCase() : ''

    if (namePinyin.includes(kw) || genericPinyin.includes(kw)) {
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
