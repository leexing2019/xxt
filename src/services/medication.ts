/**
 * 药品识别服务 - 使用百度 OCR 识别药品图片
 */

import { API_ENDPOINTS } from '@/config/api'

interface OCRResult {
  name?: string
  specification?: string
  manufacturer?: string
  dosage?: string
  form?: string
}

// 获取 OCR Token
async function getOcrToken(config?: any): Promise<string> {
  // TODO: 从后端获取 token
  return ''
}

/**
 * 识别药品图片
 */
export async function recognizeMedication(imagePath: string): Promise<OCRResult> {
  const config = await getOcrToken()

  // 如果没有配置 token，返回模拟数据
  if (!config) {
    console.log('[OCR] 未配置 token，使用模拟数据')
    // 返回模拟数据
    return getMockOCRResult()
  }

  try {
    // 获取 access_token
    const token = await getOcrToken(config)
    if (!token) {
      return getMockOCRResult()
    }

    // 读取图片并转换为 base64
    const imageBase64 = await imagePathToBase64(imagePath)

    // 调用 OCR API
    const response = await new Promise<any>((resolve, reject) => {
      uni.request({
        url: `${API_ENDPOINTS.BAIDU_OCR}?access_token=${token}`,
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

    if (response.data?.words_result) {
      const text = response.data.words_result.map((item: any) => item.words).join('\n')
      return parseOCRText(text)
    }

    return getMockOCRResult()
  } catch (error) {
    console.error('OCR 识别失败:', error)
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

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue

    console.log('[OCR] 处理行:', JSON.stringify(trimmedLine))

    // 尝试匹配药品名称（通常是最长的文本，包含剂型）
    if (trimmedLine.length > 5 && /片 | 胶囊 | 口服液|颗粒|注射液 | 丸|散|膏|酊/.test(trimmedLine)) {
      result.name = trimmedLine
    }
    // 匹配规格（数字 + 单位）
    if (/\d+mg|\d+g|\d+ml|\d+×/.test(trimmedLine)) {
      result.specification = trimmedLine
      // 如果没有名称，尝试从规格行提取
      if (!result.name) {
        // 处理冒号分隔的多个药品，如":门冬氨酸钾 79mg:无水门冬氨酸镁 70mg:"
        const parts = trimmedLine.split(':').filter(p => p.trim())
        for (const part of parts) {
          // 排除日期格式（如 2025/11/03）
          if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(part)) continue
          // 提取数字前的中文作为药品名称（去掉^因为可能有前导冒号）
          const match = part.match(/([a-zA-Z\u4e00-\u9fa5]+)\s*\d+/)
          if (match && match[1].length > 2) {
            result.name = match[1].trim()
            break
          }
        }
      }
    }
    // 匹配厂家
    if (/公司 | 制药|药业 | 制药厂|生物/.test(trimmedLine)) {
      result.manufacturer = trimmedLine
    }
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
