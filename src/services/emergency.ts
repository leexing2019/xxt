// 紧急处理服务 - 紧急情况和处理方案
export interface EmergencyInfo {
  type: string
  title: string
  symptoms: string[]
  actions: string[]
  warnings: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
}

// 常见紧急情况处理方案
export const emergencyDatabase: EmergencyInfo[] = [
  {
    type: 'overdose',
    title: '药物过量',
    symptoms: ['恶心呕吐', '头晕头痛', '心悸', '呼吸困难', '意识模糊'],
    actions: [
      '立即停止服药',
      '保留药品包装和说明书',
      '拨打120急救电话',
      '联系家人或紧急联系人',
      '记录服药时间和剂量'
    ],
    warnings: [
      '不要催吐，除非医护人员指示',
      '不要服用其他药物',
      '保持安静，避免剧烈活动'
    ],
    severity: 'critical'
  },
  {
    type: 'allergic_reaction',
    title: '过敏反应',
    symptoms: ['皮疹', '瘙痒', '面部肿胀', '呼吸困难', '喉咙紧缩'],
    actions: [
      '立即停药',
      '如有抗过敏药（如扑尔敏）可服用',
      '拨打120急救电话',
      '保持呼吸道通畅',
      '如有肾上腺素笔可按医嘱使用'
    ],
    warnings: [
      '严重过敏可能危及生命',
      '不要抓挠皮疹',
      '就医时告知过敏药物'
    ],
    severity: 'critical'
  },
  {
    type: 'hypoglycemia',
    title: '低血糖',
    symptoms: ['出汗', '颤抖', '饥饿感', '乏力', '意识模糊', '昏迷'],
    actions: [
      '立即口服葡萄糖或含糖食物',
      '如意识清醒可补充糖分',
      '如无法口服请立即就医',
      '联系家人或拨打120'
    ],
    warnings: [
      '糖尿病患者尤其注意',
      '随身携带糖果',
      '定期监测血糖'
    ],
    severity: 'high'
  },
  {
    type: 'hypertension_crisis',
    title: '高血压危象',
    symptoms: ['剧烈头痛', '视力模糊', '胸痛', '呼吸困难', '流鼻血'],
    actions: [
      '保持安静，坐下休息',
      '如有降压药按医嘱服用',
      '拨打120急救电话',
      '联系家人',
      '记录血压和症状'
    ],
    warnings: [
      '不要突然起身',
      '不要服用额外剂量的降压药',
      '监测血压变化'
    ],
    severity: 'high'
  },
  {
    type: 'missed_dose',
    title: '漏服药物',
    symptoms: ['病情波动', '不适感'],
    actions: [
      '尽快补服漏掉的药物',
      '如已接近下次服药时间，跳过本次',
      '不要加倍服用',
      '记录漏服情况',
      '下次就诊时告知医生'
    ],
    warnings: [
      '切勿一次服用双倍剂量',
      '某些特殊药物不可补服（如抗凝药）',
      '遵循医嘱处理'
    ],
    severity: 'medium'
  },
  {
    type: 'side_effects',
    title: '药物不良反应',
    symptoms: ['恶心', '腹泻', '皮疹', '头晕', '乏力'],
    actions: [
      '记录症状和服药时间',
      '轻微反应可继续观察',
      '严重反应立即停药',
      '联系医生或药师',
      '如有需要拨打120'
    ],
    warnings: [
      '不要擅自停药',
      '不要擅自换药',
      '就医时携带药品包装'
    ],
    severity: 'medium'
  }
]

// 获取紧急处理方案
export function getEmergencyInfo(type: string): EmergencyInfo | undefined {
  return emergencyDatabase.find(e => e.type === type)
}

// 获取所有紧急情况类型
export function getAllEmergencyTypes(): { type: string; title: string; severity: string }[] {
  return emergencyDatabase.map(e => ({
    type: e.type,
    title: e.title,
    severity: e.severity
  }))
}

// 拨打急救电话
export function callEmergency(): void {
  // #ifdef APP-PLUS
  uni.makePhoneCall({
    phoneNumber: '120',
    success: () => console.log('拨打电话成功'),
    fail: () => uni.showToast({ title: '拨打电话失败', icon: 'none' })
  })
  // #endif
  
  // H5
  // #ifdef H5
  window.location.href = 'tel:120'
  // #endif
}

// 拨打报警电话
export function callPolice(): void {
  // #ifdef APP-PLUS
  uni.makePhoneCall({
    phoneNumber: '110'
  })
  // #endif
  
  // H5
  // #ifdef H5
  window.location.href = 'tel:110'
  // #endif
}

// 获取位置并搜索附近医院
export function getNearbyHospitals(): Promise<any[]> {
  return new Promise((resolve) => {
    uni.getLocation({
      type: 'gcj02',
      success: (res) => {
        // 实际项目中可调用地图API搜索附近医院
        // 这里返回模拟数据
        resolve([
          {
            name: '市第一人民医院',
            distance: '1.5km',
            address: 'xx路xx号',
            phone: '120'
          },
          {
            name: '市中心医院',
            distance: '2.3km',
            address: 'xx大道xx号',
            phone: '120'
          },
          {
            name: '区人民医院',
            distance: '3.1km',
            address: 'xx街xx号',
            phone: '120'
          }
        ])
      },
      fail: () => {
        uni.showToast({ title: '无法获取位置', icon: 'none' })
        resolve([])
      }
    })
  })
}

// 发送紧急求助短信
export function sendEmergencySMS(emergencyContact: string, location?: string): void {
  const message = `【紧急求助】您的家人/朋友需要帮助${location ? `，位置：${location}` : ''}。请尽快联系或拨打120。`
  
  // #ifdef APP-PLUS
  uni.sendSms({
    phoneNumber: emergencyContact,
    content: message,
    success: () => uni.showToast({ title: '短信已发送', icon: 'success' }),
    fail: () => uni.showToast({ title: '短信发送失败', icon: 'none' })
  })
  // #endif
}
