/**
 * API 配置服务 - 从后端获取 API 配置
 *
 * 前端通过此服务从 Supabase 获取 API 配置
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
    const { data, error } = await supabase
      .from('api_config')
      .select('*')
      .eq('id', 1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // 记录不存在，返回 null
        return null
      }
      throw error
    }

    const config: ApiConfig = {
      baiduOcrApiKey: data?.baidu_ocr_api_key || '',
      baiduOcrSecretKey: data?.baidu_ocr_secret || '',
      baiduSpeechAppId: data?.baidu_speech_app_id || '',
      baiduSpeechApiKey: data?.baidu_speech_api_key || '',
      baiduSpeechSecretKey: data?.baidu_speech_secret || '',
      drugApiBaseUrl: data?.drug_api_base_url || '',
      drugApiKey: data?.drug_api_key || ''
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
