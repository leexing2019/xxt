/**
 * 第三方 API 配置管理
 *
 * 本文件管理所有需要接入的第三方 API 配置
 * API 配置从后端 Supabase 数据库获取，由管理员在后台系统统一配置
 */

import { getApiConfigFromBackend, clearApiConfigCache } from '@/services/api-config'

// API 配置接口
export interface ApiConfig {
  // 百度 OCR API
  baiduOcrApiKey: string
  baiduOcrSecretKey: string

  // 百度语音识别 API
  baiduSpeechAppId: string
  baiduSpeechApiKey: string
  baiduSpeechSecretKey: string

  // 药品数据库 API（可选）
  drugApiBaseUrl?: string
  drugApiKey?: string

  // 其他 API 配置
  [key: string]: string | undefined
}

// 默认配置（空值）
export const DEFAULT_API_CONFIG: ApiConfig = {
  baiduOcrApiKey: '',
  baiduOcrSecretKey: '',
  baiduSpeechAppId: '',
  baiduSpeechApiKey: '',
  baiduSpeechSecretKey: '',
  drugApiBaseUrl: '',
  drugApiKey: ''
}

// 获取 API 配置（从后端）
export async function fetchApiConfig(): Promise<ApiConfig> {
  const config = await getApiConfigFromBackend()
  return config || { ...DEFAULT_API_CONFIG }
}

// 清除配置缓存
export function invalidateApiConfig() {
  clearApiConfigCache()
}

// API 基础 URL
export const API_ENDPOINTS = {
  // 百度 OCR
  BAIDU_OCR: 'https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic',
  BAIDU_OCR_TOKEN: 'https://aip.baidubce.com/oauth/2.0/token',

  // 百度语音
  BAIDU_SPEECH_ASR: 'https://vop.baidu.com/server_api',
  BAIDU_SPEECH_TOKEN: 'https://openapi.baidu.com/oauth/2.0/token',

  // 药品数据（可选，可使用免费公开 API）
  DRUG_INFO: 'https://api.example.com/drugs' // 待替换
}
