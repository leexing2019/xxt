/**
 * API 配置服务
 *
 * 从后端获取和保存 API 配置
 */
import { supabase } from './supabase'
import type { ApiConfig } from '@/config/api'

const STORAGE_KEY = 'admin_api_config_cache'

// 从 Supabase 获取 API 配置
export async function getApiConfigFromBackend(): Promise<ApiConfig | null> {
  try {
    const { data, error } = await supabase
      .from('api_config')
      .select('*')
      .eq('id', 1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // 记录不存在，返回空配置
        return null
      }
      throw error
    }

    // 解密配置（实际生产中应该在服务端解密）
    const config: ApiConfig = {
      baiduOcrApiKey: data?.baidu_ocr_api_key || '',
      baiduOcrSecretKey: data?.baidu_ocr_secret || '',
      baiduSpeechAppId: data?.baidu_speech_app_id || '',
      baiduSpeechApiKey: data?.baidu_speech_api_key || '',
      baiduSpeechSecretKey: data?.baidu_speech_secret || '',
      drugApiBaseUrl: data?.drug_api_base_url || '',
      drugApiKey: data?.drug_api_key || ''
    }

    // 缓存到本地
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))

    return config
  } catch (error) {
    console.error('获取 API 配置失败:', error)
    // 尝试从缓存读取
    const cached = localStorage.getItem(STORAGE_KEY)
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch {
        return null
      }
    }
    return null
  }
}

// 保存 API 配置到 Supabase
export async function saveApiConfigToBackend(config: ApiConfig): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('api_config')
      .upsert({
        id: 1,
        baidu_ocr_api_key: config.baiduOcrApiKey,
        baidu_ocr_secret: config.baiduOcrSecretKey,
        baidu_speech_app_id: config.baiduSpeechAppId,
        baidu_speech_api_key: config.baiduSpeechApiKey,
        baidu_speech_secret: config.baiduSpeechSecretKey,
        drug_api_base_url: config.drugApiBaseUrl || '',
        drug_api_key: config.drugApiKey || '',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })

    if (error) throw error

    // 更新缓存
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))

    return true
  } catch (error) {
    console.error('保存 API 配置失败:', error)
    return false
  }
}

// 测试 OCR 连接
export async function testOcrConnection(apiKey: string, secretKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`

    const response = await fetch(tokenUrl, {
      method: 'POST'
    })

    const data = await response.json()

    if (data.access_token) {
      return { success: true, message: '百度 OCR API 连接正常！' }
    } else {
      return { success: false, message: '无法获取 access_token，请检查 API Key 和 Secret Key' }
    }
  } catch (error: any) {
    return { success: false, message: error.message || '连接失败' }
  }
}

// 测试语音连接
export async function testSpeechConnection(apiKey: string, secretKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const tokenUrl = `https://openapi.baidu.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`

    const response = await fetch(tokenUrl, {
      method: 'POST'
    })

    const data = await response.json()

    if (data.access_token) {
      return { success: true, message: '百度语音 API 连接正常！' }
    } else {
      return { success: false, message: '无法获取 access_token，请检查 API 配置' }
    }
  } catch (error: any) {
    return { success: false, message: error.message || '连接失败' }
  }
}
