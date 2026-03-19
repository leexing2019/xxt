// 药品识别服务 - 使用OCR识别药品信息
export interface OCRResult {
  name?: string
  specification?: string
  manufacturer?: string
  dosage?: string
  form?: string
  barcode?: string
}

// 模拟OCR识别 - 实际项目中应调用真实的OCR API
export async function recognizeMedication(imagePath: string): Promise<OCRResult> {
  // 这里可以集成百度OCR、腾讯OCR等服务
  // 暂时返回模拟数据，实际使用时替换为真实API调用
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // 模拟识别结果
      resolve({
        name: '阿司匹林肠溶片',
        specification: '50mg × 30片',
        manufacturer: '拜耳医药保健有限公司',
        dosage: '50mg',
        form: '片剂'
      })
    }, 1500)
  })
}

// 识别处方图片
export async function recognizePrescription(imagePath: string): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        medications: [
          {
            name: '阿司匹林',
            dosage: '100mg',
            frequency: '每日一次',
            duration: '30天'
          },
          {
            name: '降压药',
            dosage: '50mg',
            frequency: '每日两次',
            duration: '30天'
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
    interactions: ['华法林', '布洛芬', 'ACEI类降压药']
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
    indications: '2型糖尿病',
    dosage: '500mg，每日两次',
    contraindications: ['严重肝肾功能不全', '酗酒', '妊娠'],
    sideEffects: ['胃肠道反应', '维生素B12缺乏'],
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
