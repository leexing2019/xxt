/**
 * 第三方 API 配置管理
 *
 * 本文件管理所有需要接入的第三方 API 配置
 */

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

// 默认配置（空值，需要管理员填写）
export const DEFAULT_API_CONFIG: ApiConfig = {
  baiduOcrApiKey: '',
  baiduOcrSecretKey: '',
  baiduSpeechAppId: '',
  baiduSpeechApiKey: '',
  baiduSpeechSecretKey: '',
  drugApiBaseUrl: '',
  drugApiKey: ''
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

/**
 * API 申请引导信息
 */
export const API_GUIDES = {
  baiduOcr: {
    name: '百度 OCR',
    description: '用于识别药品包装盒上的文字信息',
    steps: [
      '访问百度智能云官网：https://cloud.baidu.com/',
      '注册/登录百度账号',
      '进入控制台 -> 人工智能 -> 文字识别 OCR',
      '创建应用，获取 AppID、API Key、Secret Key',
      '开通通用文字识别服务（有免费额度）'
    ],
    freeQuota: '每月 500 次免费调用',
    docUrl: 'https://cloud.baidu.com/doc/OCR/index.html'
  },
  baiduSpeech: {
    name: '百度语音',
    description: '用于语音输入药名和语音播报用药提醒',
    steps: [
      '访问百度智能云官网：https://cloud.baidu.com/',
      '注册/登录百度账号',
      '进入控制台 -> 人工智能 -> 语音技术',
      '创建应用，获取 AppID、API Key、Secret Key',
      '开通语音识别和语音合成功能（有免费额度）'
    ],
    freeQuota: '每月 10 万字符免费调用',
    docUrl: 'https://cloud.baidu.com/doc/SPEECH/index.html'
  },
  drugDatabase: {
    name: '药品数据库',
    description: '用于查询药品详细信息、禁忌、相互作用等',
    steps: [
      '可选：使用国家药监局公开数据',
      '或接入第三方药品数据 API 服务',
      '或使用项目内置的常用药品数据库（当前方案）'
    ],
    freeQuota: '项目内置数据库免费使用',
    docUrl: ''
  }
}
