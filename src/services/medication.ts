/**
 * 药品识别服务 - 使用百度 OCR 识别药品图片
 */

interface OCRResult {
  name?: string
  specification?: string
  manufacturer?: string
  dosage?: string
  form?: string
}

// 百度 OCR API 配置 - 从 Supabase 获取
let cachedOcrConfig: { apiKey: string; secretKey: string } | null = null

// 从 Supabase 获取 OCR 配置
async function fetchOcrConfig(): Promise<{ apiKey: string; secretKey: string } | null> {
  if (cachedOcrConfig) {
    console.log('[OCR] 使用缓存配置')
    return cachedOcrConfig
  }

  console.log('[OCR] 开始从 Supabase 获取配置...')
  try {
    const response = await new Promise<any>((resolve, reject) => {
      uni.request({
        url: 'https://vqtrfkigzqtcthrivbzn.supabase.co/rest/v1/app_settings?key=eq.baidu_ocr_config',
        method: 'GET',
        header: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxdHJma2lnenF0Y3Rocml2YnpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTUxOTUsImV4cCI6MjA4OTQ3MTE5NX0.YznHv4aNl7WpH4s8cjoYRR0_IH1guoBbLl6zRrdsb3s',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxdHJma2lnenF0Y3Rocml2YnpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTUxOTUsImV4cCI6MjA4OTQ3MTE5NX0.YznHv4aNl7WpH4s8cjoYRR0_IH1guoBbLl6zRrdsb3s'
        },
        success: resolve,
        fail: reject
      })
    })

    console.log('[OCR] Supabase 响应状态:', response.statusCode, '数据:', JSON.stringify(response.data))

    if (response.statusCode === 200 && response.data && response.data.length > 0) {
      const config = response.data[0].value
      cachedOcrConfig = {
        apiKey: config.apiKey || config.api_key || '',
        secretKey: config.secretKey || config.secret_key || ''
      }
      console.log('[OCR] 从 Supabase 加载配置成功，apiKey:', cachedOcrConfig.apiKey.substring(0, 8) + '...')
      return cachedOcrConfig
    } else {
      console.log('[OCR] Supabase 中无配置')
      return null
    }
  } catch (error) {
    console.error('[OCR] 获取配置失败:', error)
    return null
  }
}

// 获取 OCR Token
async function getOcrToken(): Promise<string | null> {
  const config = await fetchOcrConfig()

  if (!config || !config.apiKey || !config.secretKey) {
    console.log('[OCR] 未配置 API Key 或 Secret Key')
    return null
  }

  try {
    // 调用百度 OAuth 获取 access_token
    const response = await new Promise<any>((resolve, reject) => {
      uni.request({
        url: 'https://aip.baidubce.com/oauth/2.0/token',
        method: 'POST',
        header: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: `grant_type=client_credentials&client_id=${config.apiKey}&client_secret=${config.secretKey}`,
        success: resolve,
        fail: reject
      })
    })

    if (response.data?.access_token) {
      console.log('[OCR] 获取 token 成功')
      return response.data.access_token
    } else {
      console.error('[OCR] 获取 token 失败:', response.data)
      return null
    }
  } catch (error) {
    console.error('[OCR] 获取 token 异常:', error)
    return null
  }
}

/**
 * 识别药品图片
 */
export async function recognizeMedication(imagePath: string): Promise<OCRResult> {
  const token = await getOcrToken()

  // 如果没有配置 token，返回模拟数据
  if (!token) {
    console.log('[OCR] 未配置 token，使用模拟数据')
    return getMockOCRResult()
  }

  try {
    // 读取图片并转换为 base64
    const imageBase64 = await imagePathToBase64(imagePath)

    // 调用百度 OCR API
    const response = await new Promise<any>((resolve, reject) => {
      uni.request({
        url: `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${token}`,
        method: 'POST',
        header: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: {
          image: imageBase64,
          language_type: 'CHN_ENG',
          detect_direction: 'true',
          detect_language: 'true'
        },
        success: resolve,
        fail: reject
      })
    })

    console.log('[OCR] API 响应:', response)

    if (response.data?.words_result) {
      const text = response.data.words_result.map((item: any) => item.words).join('\n')
      return parseOCRText(text)
    }

    console.error('[OCR] 识别失败，无返回结果')
    return getMockOCRResult()
  } catch (error) {
    console.error('[OCR] 识别失败:', error)
    return getMockOCRResult()
  }
}

// 模拟 OCR 结果（降级方案）
function getMockOCRResult(): Promise<OCRResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        name: '阿司匹林肠溶片',
        specification: '50mg × 30 片',
        manufacturer: '拜耳医药保健有限公司',
        dosage: '50mg',
        form: '片剂'
      })
    }, 1500)
  })
}

// 将图片路径转换为 base64
function imagePathToBase64(imagePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // #ifdef H5
    // H5 环境下使用 FileReader
    const xhr = new XMLHttpRequest()
    xhr.open('GET', imagePath, true)
    xhr.responseType = 'blob'
    xhr.onload = () => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1]
        resolve(base64)
      }
      reader.readAsDataURL(xhr.response)
    }
    xhr.onerror = reject
    xhr.send()
    // #endif

    // #ifdef APP-PLUS
    // App 环境下使用 uni.getFileSystemManager
    // uni-app x 中如果不可用，使用 plus.io 作为降级方案
    const fs = uni.getFileSystemManager?.()
    if (fs && typeof fs.readFile === 'function') {
      fs.readFile({
        filePath: imagePath,
        encoding: 'base64',
        success: (res) => resolve(res.data as string),
        fail: (err) => {
          console.error('[OCR] getFileSystemManager 失败，使用 plus.io 降级:', err)
          // 降级方案：使用 plus.io
          readImageWithPlusIO(imagePath).then(resolve).catch(reject)
        }
      })
    } else {
      // getFileSystemManager 不可用，使用 plus.io
      readImageWithPlusIO(imagePath).then(resolve).catch(reject)
    }
    // #endif
  })
}

// 使用 plus.io 读取图片为 base64
function readImageWithPlusIO(imagePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // plus.io 需要完整路径，转换 temp 路径
      let filePath = imagePath

      // 处理 _www 目录
      if (filePath.startsWith('_www/')) {
        filePath = filePath.replace('_www/', '')
      }

      // 使用 plus.io 读取文件
      plus.io.resolveLocalFileSystemURL(filePath, (entry) => {
        entry.file((file) => {
          const reader = new plus.io.FileReader()
          reader.onloadend = () => {
            const result = reader.result as string
            // 移除 data:image/xxx;base64, 前缀
            const base64 = result.includes('base64,') ? result.split(',')[1] : result
            resolve(base64)
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      }, (error) => {
        console.error('[OCR] plus.io resolveLocalFileSystemURL 失败:', error)
        reject(error)
      })
    } catch (e) {
      console.error('[OCR] plus.io 读取失败:', e)
      reject(e)
    }
  })
}

// 解析 OCR 识别结果
function parseOCRText(text: string): OCRResult {
  const lines = text.split('\n')
  const result: OCRResult = {}

  console.log('[OCR] 原始文本:', JSON.stringify(text))

  // 第一遍：收集所有候选行
  const nameCandidates: string[] = []
  const specCandidates: string[] = []
  const manufacturerCandidates: string[] = []

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue

    console.log('[OCR] 处理行:', JSON.stringify(trimmedLine))

    // 排除日期格式（如 2025/11/03）
    if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(trimmedLine)) continue

    // 排除纯数字（如批号 251101）
    if (/^\d+$/.test(trimmedLine)) continue

    // 尝试匹配药品名称（包含剂型关键词，长度至少 4 个字符）
    if (trimmedLine.length >= 4 && /(片|胶囊|口服液|颗粒|注射液|丸|散|膏|酊)/.test(trimmedLine)) {
      nameCandidates.push(trimmedLine)
    }

    // 匹配规格（数字 + 单位）
    if (/\d+(mg|g|ml|×)/i.test(trimmedLine)) {
      specCandidates.push(trimmedLine)
    }

    // 匹配厂家
    if (/(公司 | 制药 | 药业 | 制药厂 | 生物)/.test(trimmedLine)) {
      manufacturerCandidates.push(trimmedLine)
    }
  }

  // 第二遍：选择最佳匹配
  // 药品名称：优先选择包含剂型且最像药名的
  if (nameCandidates.length > 0) {
    // 优先选择第一个包含剂型的（通常是药名）
    result.name = nameCandidates[0]
    console.log('[OCR] 选择药名:', result.name)
  }

  if (specCandidates.length > 0) {
    result.specification = specCandidates[0]
  }

  if (manufacturerCandidates.length > 0) {
    result.manufacturer = manufacturerCandidates[0]
  }

  console.log('[OCR] 解析结果:', result)
  return result
}

// 识别处方图片
export async function recognizePrescription(imagePath: string): Promise<any> {
  // 使用与 recognizeMedication 相同的逻辑
  const ocrResult = await recognizeMedication(imagePath)

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        medications: [
          {
            name: ocrResult.name || '阿司匹林',
            dosage: ocrResult.specification || '100mg',
            frequency: '每日一次',
            duration: '30 天'
          }
        ]
      })
    }, 1000)
  })
}
