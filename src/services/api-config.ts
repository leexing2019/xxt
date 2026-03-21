/**
 * API 配置服务 - 从后端获取 API 配置
 *
 * 前端通过此服务从 Supabase 获取 API 配置
 * 配置存储在 app_settings 表中
 */
import { supabase } from './supabase'

export interface ApiConfig {
  baiduOcrApiKey: string
  baiduOcrSecretKey: string
  baiduSpeechAppId: string
  baiduSpeechApiKey: string
  baiduSpeechSecretKey: string
  drugApiBaseUrl?: string
  drugApiKey?: string
}

const CACHE_KEY = 'api_config_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 分钟缓存
let lastFetchTime = 0
let cachedConfig: ApiConfig | null = null

// 从后端获取 API 配置
export async function getApiConfigFromBackend(): Promise<ApiConfig | null> {
  // 检查缓存
  const now = Date.now()
  if (cachedConfig && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedConfig
  }

  try {
    // 从 app_settings 表读取配置
    const { data: speechData, error: speechError } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'baidu_speech_config')
      .single()

    const { data: ocrData, error: ocrError } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'baidu_ocr_config')
      .single()

    const { data: drugData, error: drugError } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'drug_api_config')
      .single()

    // 忽略 PGRST116 错误（记录不存在）
    if (speechError && speechError.code !== 'PGRST116') throw speechError
    if (ocrError && ocrError.code !== 'PGRST116') throw ocrError
    if (drugError && drugError.code !== 'PGRST116') throw drugError

    const config: ApiConfig = {
      baiduOcrApiKey: (ocrData?.value as any)?.apiKey || '',
      baiduOcrSecretKey: (ocrData?.value as any)?.secretKey || '',
      baiduSpeechAppId: (speechData?.value as any)?.appId || '',
      baiduSpeechApiKey: (speechData?.value as any)?.apiKey || '',
      baiduSpeechSecretKey: (speechData?.value as any)?.secretKey || '',
      drugApiBaseUrl: (drugData?.value as any)?.baseUrl || '',
      drugApiKey: (drugData?.value as any)?.apiKey || ''
    }

    cachedConfig = config
    lastFetchTime = now

    // 也存储到本地存储作为备用
    try {
      uni.setStorageSync(CACHE_KEY, JSON.stringify(config))
    } catch (e) {
      console.warn('存储 API 配置缓存失败:', e)
    }

    return config
  } catch (error) {
    console.error('获取 API 配置失败:', error)

    // 尝试从本地缓存读取
    try {
      const stored = uni.getStorageSync(CACHE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (cacheError) {
      console.warn('读取本地缓存失败:', cacheError)
    }

    return null
  }
}

// 清除缓存
export function clearApiConfigCache() {
  cachedConfig = null
  lastFetchTime = 0
  try {
    uni.removeStorageSync(CACHE_KEY)
  } catch (e) {
    console.warn('清除缓存失败:', e)
  }
}
