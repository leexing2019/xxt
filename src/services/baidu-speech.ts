/**
 * 百度语音识别 API 服务
 *
 * 集成百度语音识别 API，支持普通话识别
 * 使用百度智能云语音识别服务 (Dev PID: 1936)
 */
import { getApiConfigFromBackend } from './api-config'

/**
 * 语音识别结果接口
 */
export interface SpeechRecognitionResult {
  success: boolean
  text?: string
  error?: string
  confidence?: number
}

/**
 * Token 缓存
 */
let accessToken: string | null = null
let tokenExpireTime: number = 0

/**
 * 获取百度 API 访问 Token
 * 使用 OAuth 2.0 客户端凭证模式
 * Token 有效期通常为 30 天，提前 5 分钟刷新
 */
async function getAccessToken(): Promise<string> {
  const now = Date.now()

  // 检查缓存是否有效
  if (accessToken && now < tokenExpireTime) {
    return accessToken
  }

  const config = await getApiConfigFromBackend()

  if (!config?.baiduSpeechApiKey || !config?.baiduSpeechSecretKey) {
    throw new Error('百度语音 API 配置缺失，请在管理后台配置 API Key 和 Secret Key')
  }

  try {
    const response = await fetch(
      `https://openapi.baidu.com/oauth/2.0/token?grant_type=client_credentials&client_id=${config.baiduSpeechApiKey}&client_secret=${config.baiduSpeechSecretKey}`
    )

    if (!response.ok) {
      throw new Error(`获取 Token 失败：${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.access_token) {
      throw new Error(data.error_description || '获取访问令牌失败')
    }

    accessToken = data.access_token
    // expires_in 单位是秒，减去 300 秒 (5 分钟) 提前刷新
    tokenExpireTime = now + (data.expires_in - 300) * 1000

    console.log('百度语音 Token 获取成功，过期时间:', new Date(tokenExpireTime).toLocaleString())

    return accessToken
  } catch (error) {
    console.error('获取百度语音 Token 失败:', error)
    throw new Error('获取语音识别 Token 失败，请检查网络或 API 配置')
  }
}

/**
 * Blob 转 Base64
 * 用于将音频数据转换为百度 API 要求的格式
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      // 移除 data:image/xxx;base64, 前缀
      const base64 = result.split(',')[1] || result
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * 百度语音识别 - 核心 API 调用
 *
 * @param audioBlob 音频 Blob 对象 (WAV 格式，16kHz 采样率)
 * @returns 识别结果
 */
export async function recognizeSpeechBaidu(audioBlob: Blob): Promise<{ text: string }> {
  try {
    const token = await getAccessToken()
    const base64Audio = await blobToBase64(audioBlob)

    // 百度语音识别 API 参数
    // dev_pid: 1936 = 普通话 (支持简单英文识别)
    // 其他 dev_pid: 1537(普通话), 1536(粤语), 1737(英语)
    const response = await fetch(
      `https://vop.baidu.com/server_api?dev_pid=1936&token=${token}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          format: 'wav',           // 音频格式
          rate: 16000,             // 采样率 (8000/16000)
          channel: 1,              // 声道数 (1=单声道，2=双声道)
          cuid: 'medication-app',  // 用户唯一标识 (用于区分不同用户)
          speech: base64Audio,     // 音频 base64 编码
          len: audioBlob.size,     // 音频字节数
          lan: 'zh'                // 语言类型
        })
      }
    )

    if (!response.ok) {
      throw new Error(`API 请求失败：${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    // 百度 API 错误处理
    if (result.err_no !== 0) {
      const errorMsg = getErrorMessage(result.err_no)
      console.error('百度语音识别失败:', {
        err_no: result.err_no,
        err_msg: result.err_msg,
        detail: errorMsg
      })
      throw new Error(errorMsg)
    }

    // 返回识别结果
    const text = result.result?.[0] || ''
    console.log('百度语音识别结果:', text)

    return { text }
  } catch (error) {
    console.error('recognizeSpeechBaidu 错误:', error)
    throw error
  }
}

/**
 * 完整的语音识别接口 (带错误处理)
 * 适用于 H5 和 App 端
 *
 * @param audioBlob 音频 Blob 对象
 * @returns 识别结果
 */
export async function recognizeSpeechBaiduWithResult(
  audioBlob: Blob
): Promise<SpeechRecognitionResult> {
  try {
    const result = await recognizeSpeechBaidu(audioBlob)
    return {
      success: true,
      text: result.text,
      confidence: 1.0 // 百度 API 不返回置信度，默认设为 1.0
    }
  } catch (error) {
    console.error('语音识别失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '语音识别失败，请重试'
    }
  }
}

/**
 * 录音并识别 (封装 uni-app 录音 API)
 * 适用于 App 端
 */
export async function recordAndRecognize(): Promise<SpeechRecognitionResult> {
  return new Promise((resolve) => {
    // 检查录音 API 可用性
    const recorderManager = uni.getRecorderManager()

    if (!recorderManager) {
      resolve({
        success: false,
        error: '当前环境不支持录音功能'
      })
      return
    }

    let isRecording = false
    const timeoutTimer = setTimeout(() => {
      if (isRecording) {
        recorderManager.stop()
        resolve({
          success: false,
          error: '录音超时，请重试'
        })
      }
    }, 10000) // 10 秒超时

    recorderManager.onStart(() => {
      console.log('开始录音...')
      isRecording = true
      uni.showToast({
        title: '请说话...',
        icon: 'none',
        duration: 2000
      })
    })

    recorderManager.onStop(async (res) => {
      console.log('录音结束:', res)
      clearTimeout(timeoutTimer)
      isRecording = false

      if (!res.tempFilePath) {
        resolve({
          success: false,
          error: '录音文件为空'
        })
        return
      }

      try {
        const { tempFilePath } = res
        console.log('开始读取录音文件:', tempFilePath)

        // H5 端处理 - 使用 base64 方式读取
        // #ifdef H5
        try {
          // 使用 uni.getFileSystemManager 读取
          const fs = uni.getFileSystemManager()
          fs.readFile({
            filePath: tempFilePath,
            encoding: undefined,
            success: (fileRes) => {
              console.log('录音文件读取成功:', fileRes.data)
              const blob = new Blob([fileRes.data as ArrayBuffer], { type: 'audio/wav' })
              recognizeSpeechBaidu(blob)
                .then(result => {
                  console.log('百度语音识别成功:', result.text)
                  resolve({ success: true, text: result.text, confidence: 1.0 })
                })
                .catch(err => {
                  console.error('百度语音识别失败:', err)
                  resolve({ success: false, error: `识别失败：${err.message}` })
                })
            },
            fail: (readErr) => {
              console.error('读取录音文件失败:', readErr)
              resolve({ success: false, error: `读取文件失败：${readErr.errMsg}` })
            }
          })
        } catch (e) {
          console.error('H5 文件读取异常:', e)
          resolve({ success: false, error: `H5 读取异常：${e.message}` })
        }
        // #endif

        // App 端处理
        // #ifdef APP-PLUS
        const fs = uni.getFileSystemManager()
        fs.readFile({
          filePath: tempFilePath,
          encoding: undefined,
          success: async (fileRes) => {
            const blob = new Blob([fileRes.data as ArrayBuffer], { type: 'audio/wav' })
            const result = await recognizeSpeechBaidu(blob)
            resolve({ success: true, text: result.text, confidence: 1.0 })
          },
          fail: (err) => {
            resolve({ success: false, error: `读取文件失败：${err.errMsg}` })
          }
        })
        // #endif
      } catch (error) {
        console.error('录音后处理异常:', error)
        resolve({
          success: false,
          error: error instanceof Error ? error.message : '语音识别失败'
        })
      }
    })

    recorderManager.onError((err) => {
      console.error('录音错误:', err)
      clearTimeout(timeoutTimer)
      isRecording = false
      resolve({
        success: false,
        error: `录音错误：${err.errMsg || '未知错误'}`
      })
    })

    // 开始录音
    recorderManager.start({
      duration: 10000, // 最长录音 10 秒
      sampleRate: 16000, // 采样率 16kHz
      numberOfChannels: 1, // 单声道
      encodeBitrate: 48000, // 编码码率
      format: 'wav' // 音频格式
    })
  })
}

/**
 * 百度语音识别错误码映射
 */
function getErrorMessage(errNo: number): string {
  const errorMap: Record<number, string> = {
    0: '请求成功',
    3300: '请求参数格式错误',
    3301: '语音质量有问题，请稍后重试',
    3302: '未知错误',
    3303: '语料过长',
    3304: '语料数据有问题',
    3305: '语料格式错误',
    3306: '音频压缩失败',
    3307: '后端服务器内部错误',
    3308: '后端服务器错误',
    3309: '后端服务器内部错误',
    3310: '后端数据库错误',
    3311: '后端网络错误',
    3312: '后端 FTP 下载失败',
    3313: '后端 FTP 上传失败',
    3314: '后端 DB 连接失败',
    3315: '语言环境配置失败',
    3316: '授权码无效',
    3317: '授权码解析失败',
    3400: 'API 不存在',
    3401: '无权限调用 API',
    3402: '参数错误',
    3403: '后端服务器错误',
    3500: '用户 QPS 超限',
    3501: '用户总并发数超限',
    3502: '用户请求并发数超限',
    3600: '音频时长超限',
    3601: '音频数据太小',
    3602: '音频数据不能大于 60 s',
    3603: '音频时长不能为 0',
    3604: '音频采样率不正确',
    3605: '音频声道数不正确',
    3606: '音频格式不支持',
    3607: '音频数据损坏',
    50000: '内部错误',
    50001: '后端服务器错误',
    50002: '后端服务器错误',
    50003: '后端服务器错误'
  }

  return errorMap[errNo] || `未知错误码：${errNo}`
}

/**
 * 清除 Token 缓存
 * 用于在配置更新后强制刷新 Token
 */
export function clearAccessTokenCache(): void {
  accessToken = null
  tokenExpireTime = 0
  console.log('百度语音 Token 缓存已清除')
}

/**
 * 检查配置是否完整
 */
export async function checkBaiduSpeechConfig(): Promise<{
  configured: boolean
  message: string
}> {
  const config = await getApiConfigFromBackend()

  if (!config) {
    return {
      configured: false,
      message: '无法获取 API 配置'
    }
  }

  const hasApiKey = !!config.baiduSpeechApiKey
  const hasSecretKey = !!config.baiduSpeechSecretKey

  if (!hasApiKey || !hasSecretKey) {
    return {
      configured: false,
      message: hasApiKey
        ? '缺少 Secret Key 配置'
        : hasSecretKey
          ? '缺少 API Key 配置'
          : '缺少 API Key 和 Secret Key 配置'
    }
  }

  return {
    configured: true,
    message: '配置完整'
  }
}
