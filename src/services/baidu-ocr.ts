/**
 * 百度 OCR 图片识别 API 服务
 *
 * 集成百度 OCR 图片识别 API，支持药品图片识别
 * 使用百度智能云通用 OCR 服务
 */
import { getApiConfigFromBackend } from './api-config'

/**
 * OCR 识别结果接口
 */
export interface OCRRecognitionResult {
  success: boolean
  name?: string
  specification?: string
  manufacturer?: string
  form?: string
  rawText: string[]
  error?: string
}

/**
 * Token 缓存
 */
let accessToken: string | null = null
let tokenExpireTime: number = 0

/**
 * 获取百度 API 访问 Token
 * 使用 OAuth 2.0 客户端凭证模式
 */
async function getAccessToken(): Promise<string> {
  const now = Date.now()

  // 检查缓存是否有效
  if (accessToken && now < tokenExpireTime) {
    return accessToken
  }

  const config = await getApiConfigFromBackend()

  if (!config?.baiduOcrApiKey || !config?.baiduOcrSecretKey) {
    throw new Error('百度 OCR API 配置缺失，请在管理后台配置 API Key 和 Secret Key')
  }

  try {
    const response = await fetch(
      `https://openapi.baidu.com/oauth/2.0/token?grant_type=client_credentials&client_id=${config.baiduOcrApiKey}&client_secret=${config.baiduOcrSecretKey}`
    )

    if (!response.ok) {
      throw new Error(`获取 Token 失败：${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(`获取 Token 失败：${data.error}`)
    }

    accessToken = data.access_token
    // 有效期 30 天，提前 5 分钟刷新
    tokenExpireTime = now + (data.expires_in - 300) * 1000

    return accessToken
  } catch (error: any) {
    console.error('获取百度 OCR Token 失败:', error)
    throw error
  }
}

/**
 * 识别药品图片
 * @param imagePath - 图片路径（临时文件路径）
 * @returns OCR 识别结果
 */
export async function recognizeImage(imagePath: string): Promise<OCRRecognitionResult> {
  try {
    const token = await getAccessToken()
    const base64Image = await imageToBase64(imagePath)

    const response = await fetch(
      `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${token}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `image=${encodeURIComponent(base64Image)}`
      }
    )

    const result = await response.json()

    if (result.error_code) {
      throw new Error(`OCR 识别失败：${result.error_msg}`)
    }

    const words = result.words_result?.map((item: any) => item.words) || []

    return {
      success: true,
      rawText: words,
      name: extractMedicineName(words),
      specification: extractSpecification(words),
      manufacturer: extractManufacturer(words),
      form: extractMedicineForm(words)
    }
  } catch (error: any) {
    console.error('药品图片识别失败:', error)
    return {
      success: false,
      rawText: [],
      error: error.message || '图片识别失败'
    }
  }
}

/**
 * 提取药品名称
 * 基于常见剂型后缀匹配
 */
function extractMedicineName(words: string[]): string | undefined {
  if (!words || words.length === 0) return undefined

  const patterns = [
    /(.+?) 片/,
    /(.+?) 胶囊/,
    /(.+?) 口服液/,
    /(.+?) 颗粒/,
    /(.+?) 注射液/,
    /(.+?) 软膏/,
    /(.+?) 喷雾剂/,
    /(.+?) 滴眼液/,
    /(.+?) 贴膏/
  ]

  for (const word of words) {
    for (const pattern of patterns) {
      const match = word.match(pattern)
      if (match && match[1].length >= 2) {
        return match[1]
      }
    }
  }

  // 如果没有匹配到，返回第一行文字
  return words[0]?.substring(0, 20) || undefined
}

/**
 * 提取药品规格
 * 匹配常见规格格式
 */
function extractSpecification(words: string[]): string | undefined {
  if (!words || words.length === 0) return undefined

  const patterns = [
    /(\d+\.?\d*(mg|g|ml|ug))/i,
    /(\d+ 片)/,
    /(\d+ 粒)/,
    /(\d+ 支)/,
    /(\d+ 瓶)/,
    /(\d+ 袋)/,
    /(\d+ 包)/
  ]

  for (const word of words) {
    for (const pattern of patterns) {
      const match = word.match(pattern)
      if (match) {
        return match[0]
      }
    }
  }

  return undefined
}

/**
 * 提取生产厂家
 * 匹配公司/制药等关键词
 */
function extractManufacturer(words: string[]): string | undefined {
  if (!words || words.length === 0) return undefined

  const keywords = ['公司', '制药', '药业', '有限公司', '药厂', '制药厂']

  for (const word of words) {
    if (keywords.some(k => word.includes(k))) {
      return word
    }
  }

  return undefined
}

/**
 * 提取药品剂型
 */
function extractMedicineForm(words: string[]): string | undefined {
  if (!words || words.length === 0) return undefined

  const forms = [
    '片剂', '胶囊', '口服液', '颗粒', '注射液',
    '软膏', '喷雾剂', '滴眼液', '贴膏', '丸剂',
    '散剂', '酊剂', '洗剂', '栓剂'
  ]

  for (const word of words) {
    for (const form of forms) {
      if (word.includes(form)) {
        return form
      }
    }
  }

  return undefined
}

/**
 * 图片转 Base64
 * 支持 H5 和 App 端
 */
async function imageToBase64(imagePath: string): Promise<string> {
  // #ifdef H5
  // H5 端使用 Canvas 转换
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas 不支持'))
        return
      }
      ctx.drawImage(img, 0, 0)
      const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1]
      resolve(base64)
    }
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = imagePath
  })
  // #endif

  // #ifdef APP-PLUS
  // App 端使用 uni.getFileSystemManager
  return new Promise((resolve, reject) => {
    const fs = uni.getFileSystemManager()
    fs.readFile({
      filePath: imagePath,
      encoding: 'base64',
      success: (res: any) => {
        resolve(res.data)
      },
      fail: (err: any) => {
        reject(new Error(err.errMsg || '读取图片失败'))
      }
    })
  })
  // #endif
}

/**
 * 清除 Token 缓存
 */
export function clearAccessTokenCache() {
  accessToken = null
  tokenExpireTime = 0
}

/**
 * 带错误处理的包装函数
 */
export async function recognizeImageWithResult(imagePath: string): Promise<OCRRecognitionResult> {
  try {
    return await recognizeImage(imagePath)
  } catch (error: any) {
    console.error('OCR 识别异常:', error)
    return {
      success: false,
      rawText: [],
      error: error.message || '识别失败'
    }
  }
}
