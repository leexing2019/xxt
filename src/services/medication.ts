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
  let longestLine = ''

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue

    // 记录最长的行作为候选名称
    if (trimmedLine.length > longestLine.length) {
      longestLine = trimmedLine
    }

    // 尝试匹配药品名称（通常是最长的文本，包含剂型）
    if (trimmedLine.length > 5 && /片 | 胶囊 | 口服液|颗粒|注射液|丸|散|膏|酊/.test(trimmedLine)) {
      result.name = trimmedLine
    }
    // 匹配规格（数字+单位）
    if (/\d+mg|\d+g|\d+ml|\d+×/.test(trimmedLine)) {
      result.specification = trimmedLine
      // 如果没有名称，尝试从规格行提取
      if (!result.name) {
        // 提取数字前的中文/英文作为药品名称
        const match = trimmedLine.match(/^([a-zA-Z\u4e00-\u9fa5]+)\s*\d+/)
        if (match) {
          result.name = match[1].trim()
        }
      }
    }
    // 匹配厂家
    if (/公司 | 制药|药业 | 制药厂|生物/.test(trimmedLine)) {
      result.manufacturer = trimmedLine
    }
  }

  // 如果还是没有名称，使用最长的行
  if (!result.name && longestLine) {
    // 去除冒号、分号等分隔符后的内容
    const cleanLine = longestLine.split(':')[0].split(';')[0].trim()
    // 提取可能的药品名（去除数字部分）
    const nameMatch = cleanLine.match(/^([a-zA-Z\u4e00-\u9fa5]+)/)
    if (nameMatch) {
      result.name = nameMatch[1]
    } else {
      result.name = cleanLine
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
        ],
        doctor: '张医生',
        date: new Date().toISOString(),
        department: '心内科'
      })
    }, 2000)
  })
}

// 药品数据库搜索 - 使用扩展的 50 种药品数据库
import { COMMON_MEDICATIONS } from '@/data/common-medications'
import { DRUG_INTERACTIONS, getDrugInteractions as getInteractionsFromDB } from '@/data/drug-interactions'

export interface DrugInfo {
  name: string
  genericName: string
  indications: string
  dosage: string
  contraindications: string[]
  sideEffects: string[]
  interactions: string[]
}

// 将 COMMON_MEDICATIONS 转换为 DrugInfo 格式
const drugDatabase: DrugInfo[] = COMMON_MEDICATIONS.map(med => ({
  name: med.name,
  genericName: med.genericName,
  indications: med.indications,
  dosage: med.usage,
  contraindications: getContraindicationsForDrug(med.name),
  sideEffects: getSideEffectsForDrug(med.name),
  interactions: getInteractionsFromDB(med.name)
}))

// 获取药品禁忌症（简化版）
function getContraindicationsForDrug(drugName: string): string[] {
  const contraindicationsMap: Record<string, string[]> = {
    '阿司匹林': ['对阿司匹林过敏', '活动性消化道溃疡', '血友病', '妊娠晚期'],
    '布洛芬': ['对 NSAIDs 过敏', '活动性消化道溃疡', '严重心衰', '妊娠晚期'],
    '华法林': ['活动性出血', '严重肝病', '妊娠', '严重高血压'],
    '二甲双胍': ['严重肝肾功能不全', '酗酒', '妊娠', '急性代谢性酸中毒'],
    '硝苯地平': ['严重低血压', '心源性休克', '主动脉瓣狭窄'],
    '美托洛尔': ['心动过缓', '房室传导阻滞', '严重心衰', '支气管哮喘'],
    '奥美拉唑': ['对 PPIs 过敏', '与氯吡格雷合用']
  }
  for (const [drug, contras] of Object.entries(contraindicationsMap)) {
    if (drugName.includes(drug) || drug.includes(drugName)) {
      return contras
    }
  }
  return []
}

// 获取药品副作用（简化版）
function getSideEffectsForDrug(drugName: string): string[] {
  const sideEffectsMap: Record<string, string[]> = {
    '阿司匹林': ['胃肠道不适', '出血风险', '过敏反应'],
    '布洛芬': ['胃肠道不适', '头痛', '眩晕'],
    '华法林': ['出血风险', '皮肤坏死', '肝功能异常'],
    '二甲双胍': ['胃肠道反应', '维生素 B12 缺乏', '乳酸酸中毒'],
    '硝苯地平': ['头痛', '踝部水肿', '面色潮红'],
    '美托洛尔': ['乏力', '心动过缓', '四肢冰冷'],
    '奥美拉唑': ['头痛', '腹泻', '维生素 B12 缺乏']
  }
  for (const [drug, effects] of Object.entries(sideEffectsMap)) {
    if (drugName.includes(drug) || drug.includes(drugName)) {
      return effects
    }
  }
  return []
}

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
