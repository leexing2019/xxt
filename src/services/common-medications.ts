/**
 * 公共药品库服务 - 从 Supabase 读取公共药品数据
 *
 * 所有用户都可以查看公共药品库中的药品
 * 管理员可以在管理后台添加/编辑/删除公共药品
 */

import { supabase } from './supabase'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase'
import PinyinMatch from 'pinyin-match'
import { identifyForm, getMedicationColor } from '@/utils/medication-icon'

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
  pinyin_initials?: string  // 拼音首字母
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
  form?: string  // 剂型
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
    console.log('[CommonMedications] 使用缓存，数量:', cachedMedications.length)
    return cachedMedications
  }

  try {
    // 使用 uni.request 直接调用 Supabase REST API
    const url = `${SUPABASE_URL}/rest/v1/common_medications`
    const params = 'select=*&is_active=eq.true&order=category.asc&order=name.asc'
    const fullUrl = `${url}?${params}`

    console.log('[CommonMedications] 请求 URL:', fullUrl)

    const response = await new Promise<any>((resolve, reject) => {
      uni.request({
        url: fullUrl,
        method: 'GET',
        header: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000,
        success: resolve,
        fail: reject
      })
    })

    console.log('[CommonMedications] 响应状态:', response.statusCode, '数据:', response.data)

    if (response.statusCode === 200 && response.data && response.data.length > 0) {
      cachedMedications = response.data
      lastFetchTime = now
      console.log('[CommonMedications] 加载成功，数量:', cachedMedications.length)
      return cachedMedications
    } else {
      // 数据库为空时，使用本地默认数据
      console.log('[CommonMedications] 数据库为空，使用本地默认数据')
      cachedMedications = getFallbackMedications()
      lastFetchTime = now
      return cachedMedications
    }
  } catch (error: any) {
    console.error('获取公共药品库失败:', error)
    // 失败时使用本地默认数据
    if (!cachedMedications || cachedMedications.length === 0) {
      cachedMedications = getFallbackMedications()
      console.log('[CommonMedications] 使用本地默认数据，数量:', cachedMedications.length)
    }
    return cachedMedications
  }
}

/**
 * 本地默认药品数据（降级方案）
 */
function getFallbackMedications(): CommonMedication[] {
  const now = new Date().toISOString()
  return [
    { id: 'fb_1', name: '阿司匹林肠溶片', generic_name: '阿司匹林', category: '心血管药', manufacturer: '拜耳医药保健有限公司', specification: '100mg × 30 片', form: '片剂', appearance_desc: '白色肠溶片', dosage_unit: '片', color: '#FFFFFF', shape: '圆形', is_active: true, created_at: now, updated_at: now, pinyin_initials: 'asplcrp' },
    { id: 'fb_2', name: '硝苯地平缓释片', generic_name: '硝苯地平', category: '降压药', manufacturer: '拜耳医药', specification: '30mg × 7 片', form: '片剂', appearance_desc: '黄色缓释片', dosage_unit: '片', color: '#FFEB3B', shape: '圆形', is_active: true, created_at: now, updated_at: now, pinyin_initials: 'xbdphsp' },
    { id: 'fb_3', name: '二甲双胍片', generic_name: '二甲双胍', category: '降糖药', manufacturer: '中美上海施贵宝', specification: '500mg × 20 片', form: '片剂', appearance_desc: '白色片剂', dosage_unit: '片', color: '#FFFFFF', shape: '圆形', is_active: true, created_at: now, updated_at: now, pinyin_initials: 'emsgp' },
    { id: 'fb_4', name: '阿托伐他汀钙片', generic_name: '阿托伐他汀', category: '降脂药', manufacturer: '辉瑞制药', specification: '20mg × 7 片', form: '片剂', appearance_desc: '白色薄膜衣片', dosage_unit: '片', color: '#FFFFFF', shape: '椭圆形', is_active: true, created_at: now, updated_at: now, pinyin_initials: 'atvtgtp' },
    { id: 'fb_5', name: '氨氯地平片', generic_name: '氨氯地平', category: '降压药', manufacturer: '辉瑞制药', specification: '5mg × 7 片', form: '片剂', appearance_desc: '白色片剂', dosage_unit: '片', color: '#FFFFFF', shape: '圆形', is_active: true, created_at: now, updated_at: now, pinyin_initials: 'aldp' },
    { id: 'fb_6', name: '布洛芬缓释胶囊', generic_name: '布洛芬', category: '止痛药', manufacturer: '中美天津史克', specification: '300mg × 20 粒', form: '胶囊', appearance_desc: '缓释胶囊', dosage_unit: '粒', color: '#FF9800', shape: '胶囊', is_active: true, created_at: now, updated_at: now, pinyin_initials: 'blfhsn' },
    { id: 'fb_7', name: '奥美拉唑肠溶胶囊', generic_name: '奥美拉唑', category: '胃药', manufacturer: '阿斯利康', specification: '20mg × 7 粒', form: '胶囊', appearance_desc: '肠溶胶囊', dosage_unit: '粒', color: '#2196F3', shape: '胶囊', is_active: true, created_at: now, updated_at: now, pinyin_initials: 'amlzr' },
    { id: 'fb_8', name: '复合维生素片', generic_name: '复合维生素', category: '维生素', manufacturer: '拜耳医药', specification: '60 片', form: '片剂', appearance_desc: '复合维生素片', dosage_unit: '片', color: '#FFC107', shape: '圆形', is_active: true, created_at: now, updated_at: now, pinyin_initials: 'fhws' },
    { id: 'fb_9', name: '碳酸钙 D3 片', generic_name: '碳酸钙 D3', category: '钙片', manufacturer: '惠氏制药', specification: '600mg × 30 片', form: '片剂', appearance_desc: '咀嚼片', dosage_unit: '片', color: '#FFFFFF', shape: '圆形', is_active: true, created_at: now, updated_at: now, pinyin_initials: 'tgsD3' }
  ]
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
    image: generateMedicationSvg(med.name, med.form, med.appearance_desc, med.color),
    usage: getDefaultUsage(med.category, med.form),
    form: med.form
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
 * 优先使用数据库的 pinyin_initials 字段， fallback 到本地计算
 */
export async function searchMedications(keyword: string): Promise<DisplayMedication[]> {
  // 先确保数据已加载
  const allMeds = await getDisplayMedications()
  console.log('[searchMedications] 总药品数量:', allMeds.length)

  const kw = keyword.toLowerCase().trim()

  if (!kw) return []

  return allMeds.filter(med => {
    // 中文搜索
    if (med.name.toLowerCase().includes(kw) ||
        med.genericName.toLowerCase().includes(kw) ||
        med.category.toLowerCase().includes(kw)) {
      return true
    }

    // 拼音首字母搜索（优先使用数据库字段）
    const pinyinInitials = med.pinyin_initials?.toLowerCase() || toPinyinFirst(med.name).toLowerCase()
    const genericPinyin = med.genericName ? (toPinyinFirst(med.genericName).toLowerCase()) : ''

    if (pinyinInitials.includes(kw) || genericPinyin.includes(kw)) {
      return true
    }

    // 拼音匹配（使用 pinyin-match 库）
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
 * 生成药品 SVG 图标（Data URL 格式）
 */
function generateMedicationSvg(
  name: string,
  form?: string,
  appearanceDesc?: string,
  colorOverride?: string
): string {
  const medicationForm = identifyForm(form, appearanceDesc)
  // 优先使用指定的 color 字段，其次从外观描述提取，最后使用名称哈希
  const color = colorOverride || getMedicationColor(name, appearanceDesc)
  const firstChar = name.charAt(0)

  // 计算文字颜色（根据背景亮度）
  const luminance = getLuminance(color)
  const textColor = luminance > 0.6 ? '#333333' : '#FFFFFF'

  // 加深颜色（用于描边）
  const darkColor = darkenColor(color, 20)

  // 变浅颜色（用于胶囊双色效果）
  const lightColor = lightenColor(color, 30)

  let shapePath = ''

  switch (medicationForm) {
    case 'liquid':
      // 口服液
      shapePath = `
        <path d="M814.88 881.9H515.79a76.8 76.8 0 0 1-76.8-76.62V413.77a76.8 76.8 0 0 1 76.8-76.6h278.89v71.8H515.79a4.81 4.81 0 0 0-4.81 4.79v386.74a4.77 4.77 0 0 0 2.96 4.44c0.59 0.24 1.21 0.37 1.85 0.37h299.1v71.8z" fill="${color}"/>
        <path d="M782.77 200.3h-28.58v-15.25a56.37 56.37 0 0 0 50.27-55.97V56.32A56.37 56.37 0 0 0 748.16 0H273.37a56.36 56.36 0 0 0-56.3 56.32v72.78a56.32 56.32 0 0 0 54.13 56.19v14.99h-29.95a76.75 76.75 0 0 0-76.67 76.69v629.58A117.56 117.56 0 0 0 281.97 1024h460.07A117.54 117.54 0 0 0 859.43 906.57v-629.58a76.76 76.76 0 0 0-76.65-76.69z" fill="#333333"/>
      `
      break
    case 'capsule':
      // 胶囊
      shapePath = `
        <path d="M590.6 601.4L398.9 409.7c-1.1-1.1-1.1-2.9 0-4l147.3-147.3c54-54 141.6-54 195.6 0s54 141.6 0 195.6L594.5 601.4c-1.1 1.1-2.8 1.1-3.9 0z" fill="${lightColor}"/>
        <path d="M581.3 610.6L389.7 419c-1.1-1.1-2.9-1.1-4 0L238.4 566.3c-54 54-54 141.6 0 195.6s141.6 54 195.6 0l147.3-147.3c1.1-1.1 1.1-2.9 0-4z" fill="${color}"/>
      `
      break
    case 'tablet':
    default:
      // 药片
      shapePath = `
        <path d="M641 280.7C780.6 315 832.3 433.9 756.5 546.2 680.7 658.5 506 721.8 366.4 687.5 226.8 653.2 175.1 534.4 250.9 422 326.7 309.7 501.4 246.5 641 280.7z" fill="${color}"/>
      `
  }

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="200" height="200">${shapePath}</svg>`

  // 使用 base64 编码，兼容性更好
  const base64 = btoa(unescape(encodeURIComponent(svgContent)))
  return `data:image/svg+xml;base64,${base64}`
}

/**
 * 计算颜色亮度
 */
function getLuminance(hexColor: string): number {
  const r = parseInt(hexColor.slice(1, 3), 16) / 255
  const g = parseInt(hexColor.slice(3, 5), 16) / 255
  const b = parseInt(hexColor.slice(5, 7), 16) / 255
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/**
 * 加深颜色
 */
function darkenColor(hexColor: string, percent: number): string {
  const num = parseInt(hexColor.slice(1), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.max((num >> 16) - amt, 0)
  const G = Math.max((num >> 8 & 0x00FF) - amt, 0)
  const B = Math.max((num & 0x0000FF) - amt, 0)
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
}

/**
 * 变浅颜色
 */
function lightenColor(hexColor: string, percent: number): string {
  const num = parseInt(hexColor.slice(1), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min((num >> 16) + amt, 255)
  const G = Math.min((num >> 8 & 0x00FF) + amt, 255)
  const B = Math.min((num & 0x0000FF) + amt, 255)
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
}

/**
 * 生成药品占位图（保留向后兼容）
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
  console.log('[CommonMedications] 清除缓存')
  cachedMedications = null
  lastFetchTime = 0
}

/**
 * 刷新缓存（强制重新获取）
 */
export async function refreshCache(): Promise<CommonMedication[]> {
  console.log('[CommonMedications] 强制刷新缓存')
  cachedMedications = null
  lastFetchTime = 0
  return fetchCommonMedications()
}

/**
 * 添加药品到公共库（仅管理员可用）
 */
export async function addMedicationToCommon(
  name: string,
  genericName: string,
  category: string,
  form?: string,
  appearanceDesc?: string,
  manufacturer?: string,
  specification?: string,
  dosageUnit?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('common_medications')
      .insert([{
        name,
        generic_name: genericName || name,
        category,
        form,
        appearance_desc: appearanceDesc,
        manufacturer,
        specification,
        dosage_unit: dosageUnit,
        is_active: true
      }])
      .select()
      .single()

    if (error) throw error

    // 清除缓存
    clearCache()

    return { success: true, id: data.id }
  } catch (error) {
    console.error('添加药品到公共库失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '添加失败'
    }
  }
}
