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
 * 清除 Token 缓存（用于密钥更新后）
 */
export function forceRefreshToken(): void {
  accessToken = null
  tokenExpireTime = 0
  console.log('[语音] 强制刷新 Token 缓存')
}

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

  // 临时使用新密钥测试 MP3 格式
  const apiKey = 'Gk5SOw79mm0ROObNgZKdqZfF'
  const secretKey = 'y5lVWNlF5V9m02xKMnv2KcYsZJfTsLzq'

  if (!apiKey || !secretKey) {
    throw new Error('百度语音 API 配置缺失')
  }

  try {
    const response = await new Promise<any>((resolve, reject) => {
      uni.request({
        url: `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`,
        method: 'GET',
        success: resolve,
        fail: reject
      })
    })

    if (!response.data?.access_token) {
      throw new Error(response.data?.error_description || '获取访问令牌失败')
    }

    accessToken = response.data.access_token
    // expires_in 单位是秒，减去 300 秒 (5 分钟) 提前刷新
    tokenExpireTime = now + (response.data.expires_in - 300) * 1000

    console.log('百度语音 Token 获取成功，过期时间:', new Date(tokenExpireTime).toLocaleString())

    return accessToken
  } catch (error) {
    console.error('获取百度语音 Token 失败:', error)
    throw new Error('获取语音识别 Token 失败，请检查网络或 API 配置')
  }
}

/**
 * 百度语音识别 - 核心 API 调用
 *
 * @param audioBase64 音频 base64 字符串或 { base64, size } 对象
 * @returns 识别结果
 */
export async function recognizeSpeechBaidu(audioBase64: string | { base64: string; size: number }): Promise<{ text: string }> {
  try {
    const token = await getAccessToken()

    // 处理输入参数
    let base64Audio: string
    let audioSize: number
    if (typeof audioBase64 === 'string') {
      base64Audio = audioBase64
      audioSize = Math.round(audioBase64.length * 3 / 4)
    } else {
      base64Audio = audioBase64.base64
      audioSize = audioBase64.size
    }

    console.log('[语音] 调用百度 API，audioSize:', audioSize)

    // 生成 cuid - 必须是 32 位十六进制字符串（参考百度官方示例）
    const cuid = generateCuid()
    console.log('[语音] 使用 cuid:', cuid, '(长度:', cuid.length, ')')

    // 打印 base64 音频前 100 字符（用于检查 WAV 头）
    const base64Preview = typeof audioBase64 === 'string'
      ? audioBase64.slice(0, 100)
      : audioBase64.base64.slice(0, 100)
    console.log('[语音] base64 前 100 字符:', base64Preview)

    // 使用 uni.request 调用百度 API
    // 参考官方示例：https://ai.baidu.com/ai-doc/SPEECH/4l9mh6qf9
    // 百度支持格式：pcm/wav/amr/m4a
    // uni-app x 实际输出 AMR 格式（即使设置 format: 'PCM'）
    const format = 'amr'  // 与 uni-app x 实际输出格式一致
    console.log('[语音] 发送格式:', format)
    const response = await new Promise<any>((resolve, reject) => {
      uni.request({
        url: 'http://vop.baidu.com/server_api',
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: {
          format: format,
          rate: 16000,
          channel: 1,
          cuid: cuid,
          token: token,
          speech: base64Audio,
          len: audioSize
        },
        success: resolve,
        fail: reject
      })
    })

    const result = response.data

    if (!result) {
      throw new Error('API 返回数据为空')
    }

    console.log('[语音] 百度 API 返回:', JSON.stringify(result))

    if (result.err_no !== 0) {
      const errorMsg = getErrorMessage(result.err_no)
      console.error('百度语音识别失败:', {
        err_no: result.err_no,
        err_msg: result.err_msg,
        detail: errorMsg
      })
      throw new Error(errorMsg)
    }

    const text = result.result?.[0] || ''
    // 去除标点符号和末尾语气词
    const cleanedText = text.replace(/[.,.!?!,.:;"'"'""''（）()【】\[\]]/g, '').trim()
    console.log('百度语音识别结果:', cleanedText)

    return { text: cleanedText }
  } catch (error) {
    console.error('recognizeSpeechBaidu 错误:', error)
    throw error
  }
}

/**
 * 生成唯一用户标识 (cuid)
 * 百度 API 要求：cuid 应为设备唯一标识，长度建议在 10-32 位
 * 推荐格式：MAC 地址 (12 位十六进制) 或 IMEI(15 位数字)
 */
function generateCuid(): string {
  let cuid = ''

  // #ifdef APP-PLUS
  // 1. 优先使用 MAC 地址（12 位十六进制）- 百度最认可的格式
  try {
    if (plus.networkinfo && typeof plus.networkinfo.getCurrent === 'function') {
      const netInfo = plus.networkinfo.getCurrent()
      const macAddress = netInfo?.macAddress || ''
      // 排除无效 MAC：空值、全零、蓝牙 MAC
      if (macAddress && macAddress !== '02:00:00:00:00:00' && macAddress !== '00:00:00:00:00:00') {
        cuid = macAddress.replace(/:/g, '').toUpperCase()
        if (cuid.length === 12 && /^[0-9A-F]+$/.test(cuid)) {
          console.log('[cuid] 使用 MAC 地址:', cuid)
          return cuid
        }
      }
    } else {
      console.log('[cuid] plus.networkinfo.getCurrent 不可用')
    }
  } catch (e) {
    console.log('[cuid] 获取 MAC 失败:', e)
  }

  // 2. 使用 IMEI（15 位数字）
  try {
    const imei = plus.device.imei
    if (imei && imei !== 'unknown' && imei !== '' && imei.length === 15 && /^\d+$/.test(imei)) {
      console.log('[cuid] 使用 IMEI:', imei)
      return imei
    } else {
      console.log('[cuid] IMEI 无效:', imei)
    }
  } catch (e) {
    console.log('[cuid] 获取 IMEI 失败:', e)
  }

  // 3. 使用 Android ID（16 位十六进制）
  try {
    const androidId = plus.device.androidid
    if (androidId && androidId !== 'unknown' && androidId !== '' && androidId.length === 16) {
      cuid = androidId.toUpperCase()
      console.log('[cuid] 使用 Android ID:', cuid)
      return cuid
    } else {
      console.log('[cuid] Android ID 无效:', androidId)
    }
  } catch (e) {
    console.log('[cuid] 获取 Android ID 失败:', e)
  }

  // 4. 使用设备序列号（如果格式合理）
  try {
    const serialNumber = plus.device.serialnumber
    if (serialNumber && serialNumber !== 'unknown' && serialNumber !== '' && serialNumber.length >= 8 && serialNumber.length <= 32) {
      console.log('[cuid] 使用序列号:', serialNumber)
      return serialNumber
    } else {
      console.log('[cuid] 序列号无效:', serialNumber)
    }
  } catch (e) {
    console.log('[cuid] 获取序列号失败:', e)
  }

  // 5. 使用 plus.device.id（如果格式合理）
  try {
    const deviceId = plus.device.id
    if (deviceId && deviceId !== 'unknown' && deviceId !== '') {
      // 移除非字母数字字符
      const cleanId = deviceId.replace(/[^a-zA-Z0-9]/g, '')
      if (cleanId.length >= 10) {
        console.log('[cuid] 使用 plus.device.id:', cleanId)
        return cleanId
      } else {
        console.log('[cuid] plus.device.id 太短:', deviceId, '->', cleanId)
      }
    } else {
      console.log('[cuid] plus.device.id 无效:', deviceId)
    }
  } catch (e) {
    console.log('[cuid] 获取 plus.device.id 失败:', e)
  }

  // 6. 尝试使用 uni.getSystemInfoSync 获取 deviceId
  try {
    const sysInfo = uni.getSystemInfoSync() as any
    if (sysInfo?.deviceId && sysInfo.deviceId !== 'unknown') {
      // 使用 32 位，保持原始大小写（官方示例是混合大小写）
      const cleanId = sysInfo.deviceId.replace(/[^a-zA-Z0-9]/g, '')
      if (cleanId.length >= 32) {
        const result = cleanId.slice(0, 32)
        console.log('[cuid] 使用 uni deviceId(32 位混合):', result)
        return result
      } else {
        // 补齐到 32 位，使用原始 deviceId 填充
        const padded = (cleanId + cleanId.slice(0, 32 - cleanId.length)).slice(0, 32)
        console.log('[cuid] 使用 deviceId 补齐 32 位:', padded)
        return padded
      }
    }
  } catch (e) {
    console.log('[cuid] 获取 uni deviceId 失败:', e)
  }
  // #endif

  // 降级方案：参考百度官方示例格式 C3ji019IQnplNN9noSiNa0rIrwHJvbaB
  // 使用 H5 前缀 + 时间戳 + 随机数，混合大小写
  const h5Prefix = 'H5'
  const timestamp = Date.now().toString(16) // 小写十六进制
  const randomPart = Math.random().toString(36).slice(2, 12) // 小写字母数字
  const padding = 'ABCDEFGH' // 大写字母填充
  const fallbackCuid = (h5Prefix + timestamp + randomPart + padding).slice(0, 32)
  console.log('[cuid] 使用降级方案 (H5 格式):', fallbackCuid)
  return fallbackCuid
}

/**
 * 简单哈希函数（用于生成固定长度的设备特征）
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  // 返回 23 位十六进制字符串，加上 appid 9 位 = 32 位
  return Math.abs(hash).toString(16).padStart(23, '0').slice(0, 23)
}

/**
 * 简单的 MD5 哈希函数（降级方案）
 */
function md5(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(32, '0')
}

/**
 * 完整的语音识别接口 (带错误处理)
 */
export async function recognizeSpeechBaiduWithResult(
  audioBase64: string | { base64: string; size: number }
): Promise<SpeechRecognitionResult> {
  try {
    const result = await recognizeSpeechBaidu(audioBase64)
    return {
      success: true,
      text: result.text,
      confidence: 1.0
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
    const recorderManager = uni.getRecorderManager()

    if (!recorderManager) {
      console.error('[语音] uni.getRecorderManager 不可用')
      resolve({
        success: false,
        error: '当前环境不支持录音功能'
      })
      return
    }

    console.log('[语音] 环境检测:')
    console.log('[语音] - plus:', typeof plus)
    console.log('[语音] - plus.io:', typeof plus?.io)

    let isRecording = false
    let audioDataBuffer: ArrayBuffer[] = []

    // onFrameRecorded 回调 - 收集音频帧数据
    recorderManager.onFrameRecorded((frameData: any) => {
      console.log('[onFrameRecorded] 收到音频帧，大小:', frameData.frameBuffer?.byteLength || 0)
      if (frameData.frameBuffer) {
        audioDataBuffer.push(frameData.frameBuffer)
      }
    })

    const timeoutTimer = setTimeout(() => {
      if (isRecording) {
        recorderManager.stop()
        resolve({
          success: false,
          error: '录音超时，请重试'
        })
      }
    }, 10000)

    recorderManager.onStart(() => {
      console.log('[语音] 开始录音...')
      isRecording = true
      audioDataBuffer = []
      uni.showToast({
        title: '请说话...',
        icon: 'none',
        duration: 2000
      })
    })

    recorderManager.onStop(async (res) => {
      console.log('[语音] 录音结束:', res)
      clearTimeout(timeoutTimer)
      isRecording = false

      // 检查录音时长
      const duration = res.duration || 0
      console.log('[语音] 录音时长:', duration, 'ms')

      // 计算预期文件大小（16k 采样率 * 16bit * 单声道）
      const expectedSize = Math.round((duration / 1000) * 16000 * 2)
      console.log('[语音] 预期文件大小:', expectedSize, '字节')

      if (duration < 1000) {
        console.warn('[语音] 录音时间太短，可能无法识别')
        resolve({
          success: false,
          error: '录音时间太短，请按住说话 3 秒以上'
        })
        return
      }

      if (!res.tempFilePath) {
        resolve({
          success: false,
          error: '录音文件为空'
        })
        return
      }

      try {
        const { tempFilePath } = res
        console.log('[语音] 录音文件路径:', tempFilePath)
        console.log('[语音] 录音文件大小:', res.fileSize)

        // 使用 plus.io 读取（参考 OCR 代码）
        const audioData = await readAudioFileWithPlusIO(tempFilePath)
        console.log('[语音] 音频数据大小:', audioData.size)
        const result = await recognizeSpeechBaidu(audioData)
        console.log('[语音] 识别成功:', result.text)
        resolve({ success: true, text: result.text, confidence: 1.0 })
      } catch (error) {
        console.error('[语音] 识别失败:', error)
        resolve({
          success: false,
          error: error instanceof Error ? error.message : '识别失败'
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

    recorderManager.start({
      duration: 10000,
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitrate: 0,
      format: 'amr'  // uni-app x 实际输出 AMR 格式
    })
  })
}

/**
 * 使用 plus.io 读取音频文件（参考 OCR 代码）
 */
async function readAudioFileWithPlusIO(filePath: string): Promise<{ base64: string; size: number }> {
  if (typeof plus === 'undefined' || !plus.io) {
    throw new Error('plus.io 不可用')
  }

  console.log('[语音] 开始读取音频文件:', filePath)

  return new Promise((resolve, reject) => {
    // 直接使用路径解析（参考 OCR 代码）
    plus.io.resolveLocalFileSystemURL(filePath, (entry: any) => {
      console.log('[语音] plus.io 路径解析成功')

      entry.file((file: any) => {
        console.log('[语音] file 对象获取成功，大小:', file.size, '字节')

        const reader = new plus.io.FileReader()
        reader.onloadend = () => {
          console.log('[语音] FileReader onloadend 触发')
          try {
            const base64 = (reader.result as string).split(',')[1]
            console.log('[语音] base64 长度:', base64.length)

            console.log('[语音] 开始 base64 解码')
            const binary = atob(base64)
            console.log('[语音] base64 解码完成，长度:', binary.length)

            console.log('[语音] 开始创建 Uint8Array')
            const bytes = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i)
            }
            console.log('[语音] Uint8Array 创建完成，大小:', bytes.byteLength, '字节')

            // 直接使用 base64 字符串发送给百度 API
            console.log('[语音] 直接使用 base64 数据')
            resolve({ base64, size: bytes.byteLength })
          } catch (e) {
            console.error('[语音] 数据处理失败:', e)
            reject(e)
          }
        }
        reader.onerror = (e: any) => {
          console.error('[语音] FileReader 读取错误:', e)
          reject(new Error('读取失败'))
        }
        console.log('[语音] 开始 readAsDataURL')
        reader.readAsDataURL(file)
      }, (fileErr: any) => {
        console.error('[语音] entry.file 失败:', fileErr)
        reject(fileErr)
      })
    }, (resolveErr: any) => {
      console.error('[语音] resolveLocalFileSystemURL 失败:', resolveErr)

      // 尝试备用路径（参考 OCR）
      const altPath = filePath.startsWith('_doc/')
        ? filePath.substring(5)
        : `_doc/${filePath}`
      console.log('[语音] 尝试备用路径:', altPath)

      plus.io.resolveLocalFileSystemURL(altPath, (entry2: any) => {
        console.log('[语音] 备用路径解析成功')
        entry2.file((file: any) => {
          const reader = new plus.io.FileReader()
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1]
            const binary = atob(base64)
            const bytes = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i)
            }
            resolve({ base64, size: bytes.byteLength })
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        }, reject)
      }, (err2: any) => {
        console.error('[语音] 备用路径也失败:', err2)
        reject(err2)
      })
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
    3602: '音频数据不能大于 60s',
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

/**
 * 语音识别控制器 - 用于按住说话模式
 */
export class SpeechRecorder {
  private recorderManager: any
  private resolveCallback: ((result: SpeechRecognitionResult) => void) | null = null
  private isRecording = false
  private startTime = 0
  private minDuration = 1000
  private maxDuration = 10000

  constructor() {
    this.recorderManager = uni.getRecorderManager()
  }

  start(): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (!this.recorderManager) {
        resolve({ success: false, error: '录音功能不可用' })
        return
      }

      if (this.isRecording) {
        resolve({ success: false, error: '正在录音中' })
        return
      }

      this.startTime = Date.now()
      this.isRecording = true

      setTimeout(() => {
        if (this.isRecording) {
          console.log('[语音] 达到最长录音时间，自动停止')
          this.stop()
        }
      }, this.maxDuration)

      this.recorderManager.onStart(() => {
        console.log('[语音] 开始录音...')
        resolve({ success: true })
      })

      this.recorderManager.onError((err: any) => {
        console.error('[语音] 录音错误:', err)
        this.isRecording = false
        if (this.resolveCallback) {
          this.resolveCallback({ success: false, error: `录音错误：${err.errMsg}` })
          this.resolveCallback = null
        }
      })

      this.recorderManager.start({
        duration: this.maxDuration,
        sampleRate: 16000,
        numberOfChannels: 1,
        encodeBitrate: 0,
        format: 'amr'  // uni-app x 实际输出 AMR 格式
      })
    })
  }

  stop(): Promise<SpeechRecognitionResult> {
    return new Promise((resolve) => {
      if (!this.isRecording) {
        resolve({ success: false, error: '未在录音' })
        return
      }

      const duration = Date.now() - this.startTime
      if (duration < this.minDuration) {
        console.log('[语音] 录音时间太短:', duration, 'ms')
      }

      this.resolveCallback = resolve

      this.recorderManager.onStop(async (res: any) => {
        console.log('[语音] 录音结束，时长:', duration, 'ms, 文件:', res.tempFilePath)
        this.isRecording = false

        if (!res.tempFilePath) {
          resolve({ success: false, error: '录音文件为空' })
          return
        }

        try {
          const { tempFilePath } = res
          console.log('[语音] 录音文件路径:', tempFilePath)

          // 使用 plus.io 读取（参考 OCR 代码）
          const audioData = await readAudioFileWithPlusIO(tempFilePath)
          const result = await recognizeSpeechBaidu(audioData)
          console.log('[语音] 识别成功:', result.text)
          resolve({ success: true, text: result.text, confidence: 1.0 })
        } catch (error) {
          console.error('[语音] 识别失败:', error)
          resolve({
            success: false,
            error: error instanceof Error ? error.message : '识别失败'
          })
        }
      })

      this.recorderManager.stop()
    })
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording
  }

  getRecordingDuration(): number {
    return this.isRecording ? Date.now() - this.startTime : 0
  }
}
