/**
 * 应用配置服务 - 从后端获取应用功能开关配置
 *
 * 前端通过此服务从 Supabase 获取应用配置
 * 配置存储在 app_settings 表的 app_config 配置项中
 */
import { supabase } from './supabase'

export interface AppConfig {
  voice_recognition_enabled?: boolean
  image_recognition_enabled?: boolean
  voice_guidance_enabled?: boolean
  elderly_mode_enabled?: boolean
}

const CACHE_KEY = 'app_config_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 分钟缓存
let cachedConfig: AppConfig | null = null
let lastFetchTime = 0

/**
 * 从后端获取应用配置
 * @returns 应用配置对象，包含各个功能开关状态
 */
export async function getAppConfig(): Promise<AppConfig | null> {
  // 检查内存缓存
  const now = Date.now()
  if (cachedConfig && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedConfig
  }

  try {
    // 从 app_settings 表读取配置
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'app_config')
      .single()

    // 忽略 PGRST116 错误（记录不存在）
    if (error && error.code !== 'PGRST116') {
      throw error
    }

    const config: AppConfig = {
      voice_recognition_enabled: (data?.value as any)?.voice_recognition_enabled ?? true,
      image_recognition_enabled: (data?.value as any)?.image_recognition_enabled ?? true,
      voice_guidance_enabled: (data?.value as any)?.voice_guidance_enabled ?? true,
      elderly_mode_enabled: (data?.value as any)?.elderly_mode_enabled ?? false
    }

    cachedConfig = config
    lastFetchTime = now

    // 也存储到本地存储作为备用
    try {
      uni.setStorageSync(CACHE_KEY, JSON.stringify(config))
    } catch (e) {
      console.warn('存储应用配置缓存失败:', e)
    }

    return config
  } catch (error) {
    console.error('获取应用配置失败:', error)

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

/**
 * 获取单个配置项
 * @param key 配置项键名
 * @param defaultValue 默认值
 * @returns 配置项值
 */
export async function getAppConfigItem<K extends keyof AppConfig>(
  key: K,
  defaultValue: AppConfig[K]
): Promise<AppConfig[K]> {
  const config = await getAppConfig()
  return config?.[key] ?? defaultValue
}

/**
 * 清除应用配置缓存
 */
export function clearAppConfigCache() {
  cachedConfig = null
  lastFetchTime = 0
  try {
    uni.removeStorageSync(CACHE_KEY)
  } catch (e) {
    console.warn('清除应用配置缓存失败:', e)
  }
}
