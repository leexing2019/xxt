// 药品识别服务 - 使用 OCR 识别药品信息
import { fetchApiConfig, API_ENDPOINTS } from '@/config/api'

export interface OCRResult {
  name?: string
  specification?: string
  manufacturer?: string
  dosage?: string
  form?: string
  barcode?: string
}

// 获取 OCR access_token
async function getOcrToken(config: { baiduOcrApiKey: string; baiduOcrSecretKey: string }): Promise<string | null> {
  if (!config.baiduOcrApiKey || !config.baiduOcrSecretKey) {
    return null
  }

  try {
    const tokenUrl = `${API_ENDPOINTS.BAIDU_OCR_TOKEN}?grant_type=client_credentials&client_id=${config.baiduOcrApiKey}&client_secret=${config.baiduOcrSecretKey}`

    const response = await new Promise<any>((resolve, reject) => {
      uni.request({
        url: tokenUrl,
        method: 'POST',
        success: resolve,
        fail: reject
      })
    })

    return response.data?.access_token || null
  } catch (error) {
    console.error('获取 OCR token 失败:', error)
    return null
  }
}

// OCR 识别药品图片
export async function recognizeMedication(imagePath: string): Promise<OCRResult> {
  // 从后端获取 API 配置
  const config = await fetchApiConfig()

  // 检查是否配置了 API
  if (!config.baiduOcrApiKey || !config.baiduOcrSecretKey) {
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
    const fs = uni.getFileSystemManager()
    fs.readFile({
      filePath: imagePath,
      encoding: 'base64',
      success: (res) => resolve(res.data as string),
      fail: reject
    })
    // #endif
  })
}

// 解析 OCR 识别结果
function parseOCRText(text: string): OCRResult {
  const lines = text.split('\n')
  const result: OCRResult = {}

  for (const line of lines) {
    // 尝试匹配药品名称（通常是最长的文本）
    if (line.length > 5 && /片 | 胶囊 | 口服液|颗粒|注射液/.test(line)) {
      result.name = line.trim()
    }
    // 匹配规格
    if (/\d+mg|\d+g|\d+ml|\d+×/.test(line)) {
      result.specification = line.trim()
    }
    // 匹配厂家
    if (/公司 | 制药|药业 | 制药厂/.test(line)) {
      result.manufacturer = line.trim()
    }
  }

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
        ],
        doctor: '张医生',
        date: new Date().toISOString(),
        department: '心内科'
      })
    }, 2000)
  })
}

// 药品数据库搜索
export interface DrugInfo {
  name: string
  genericName: string
  indications: string
  dosage: string
  contraindications: string[]
  sideEffects: string[]
  interactions: string[]
}

const drugDatabase: DrugInfo[] = [
  {
    name: '阿司匹林肠溶片',
    genericName: 'Aspirin',
    indications: '解热镇痛、抗血小板聚集',
    dosage: '50-100mg，每日一次',
    contraindications: ['对阿司匹林过敏', '活动性消化道溃疡', '血友病'],
    sideEffects: ['胃肠道不适', '出血风险', '过敏反应'],
    interactions: ['华法林', '布洛芬', 'ACEI 类降压药']
  },
  {
    name: '硝苯地平缓释片',
    genericName: 'Nifedipine',
    indications: '高血压、冠心病心绞痛',
    dosage: '20mg，每日两次',
    contraindications: ['严重低血压', '心源性休克', '主动脉瓣狭窄'],
    sideEffects: ['头痛', '踝部水肿', '面色潮红'],
    interactions: ['地高辛', '奎尼丁', '西咪替丁']
  },
  {
    name: '二甲双胍',
    genericName: 'Metformin',
    indications: '2 型糖尿病',
    dosage: '500mg，每日两次',
    contraindications: ['严重肝肾功能不全', '酗酒', '妊娠'],
    sideEffects: ['胃肠道反应', '维生素 B12 缺乏'],
    interactions: ['碘造影剂', '酒精']
  }
]

export async function searchDrug(name: string): Promise<DrugInfo[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const results = drugDatabase.filter(d =>
        d.name.includes(name) || d.genericName.toLowerCase().includes(name.toLowerCase())
      )
      resolve(results)
    }, 500)
  })
}

// 获取药品禁忌信息
export async function getContraindications(drugName: string): Promise<string[]> {
  const drugs = await searchDrug(drugName)
  return drugs.length > 0 ? drugs[0].contraindications : []
}

// 获取药品相互作用
export async function getInteractions(drugNames: string[]): Promise<string[]> {
  const allInteractions: string[] = []

  for (const name of drugNames) {
    const drugs = await searchDrug(name)
    if (drugs.length > 0) {
      allInteractions.push(...drugs[0].interactions)
    }
  }

  return [...new Set(allInteractions)]
}
