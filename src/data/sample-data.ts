// 示例药品数据 - 用于APP演示
export interface SampleMedication {
  id: string
  name: string
  genericName: string
  specification: string
  manufacturer: string
  form: string
  appearance: string
  color: string
  dosage: string
  instructions: string
  category: string
  contraindications: string[]
  interactions: string[]
  sideEffects: string[]
}

export const sampleMedications: SampleMedication[] = [
  {
    id: 'med001',
    name: '阿司匹林肠溶片',
    genericName: 'Aspirin',
    specification: '50mg × 30片/盒',
    manufacturer: '拜耳医药保健有限公司',
    form: '肠溶片',
    appearance: '白色圆形药片，一面有十字刻痕',
    color: '白色',
    dosage: '50-100mg',
    instructions: '早餐后半小时服用，用温水送服',
    category: '心脑血管',
    contraindications: ['对阿司匹林过敏', '活动性消化道溃疡', '血友病', '孕妇后三个月'],
    interactions: ['华法林', '布洛芬', 'ACEI类降压药'],
    sideEffects: ['胃肠道不适', '出血风险增加', '过敏反应']
  },
  {
    id: 'med002',
    name: '硝苯地平缓释片',
    genericName: 'Nifedipine',
    specification: '20mg × 20片/盒',
    manufacturer: '拜耳医药保健有限公司',
    form: '缓释片',
    appearance: '黄色椭圆形薄膜衣片',
    color: '黄色',
    dosage: '20mg',
    instructions: '早餐后服用，不可咀嚼或掰开',
    category: '心脑血管',
    contraindications: ['严重低血压', '心源性休克', '主动脉瓣狭窄', '妊娠期'],
    interactions: ['地高辛', '奎尼丁', '西咪替丁', '利福平'],
    sideEffects: ['头痛', '踝部水肿', '面色潮红', '心悸']
  },
  {
    id: 'med003',
    name: '二甲双胍片',
    genericName: 'Metformin',
    specification: '500mg × 40片/盒',
    manufacturer: '中美上海施贵宝制药有限公司',
    form: '片剂',
    appearance: '白色薄膜衣片，圆形',
    color: '白色',
    dosage: '500mg',
    instructions: '随餐服用，用餐时或餐后立即服用',
    category: '糖尿病',
    contraindications: ['严重肝肾功能不全', '酗酒', '妊娠期', '酮症酸中毒'],
    interactions: ['碘造影剂', '酒精', '利尿剂'],
    sideEffects: ['胃肠道反应', '维生素B12缺乏', '乳酸酸中毒（罕见）']
  },
  {
    id: 'med004',
    name: '阿托伐他汀钙片',
    genericName: 'Atorvastatin',
    specification: '20mg × 7片/盒',
    manufacturer: '辉瑞制药有限公司',
    form: '薄膜衣片',
    appearance: '白色椭圆形药片',
    color: '白色',
    dosage: '20mg',
    instructions: '睡前服用效果更佳',
    category: '心脑血管',
    contraindications: ['活动性肝病', '妊娠期', '哺乳期'],
    interactions: ['环孢素', '红霉素', '伊曲康唑', '葡萄柚汁'],
    sideEffects: ['肌肉疼痛', '肝功能异常', '消化不良']
  },
  {
    id: 'med005',
    name: '复方氨酚烷胺胶囊',
    genericName: 'Compound Paracetamol and Amantadine',
    specification: '12粒/盒',
    manufacturer: '海南康力制药有限公司',
    form: '胶囊剂',
    appearance: '红白相间胶囊',
    color: '红白',
    dosage: '1粒',
    instructions: '每日2次，餐后服用，多饮水',
    category: '感冒用药',
    contraindications: ['对本品过敏', '严重肝肾功能不全', '孕妇哺乳期'],
    interactions: ['其他解热镇痛药', '抗病毒药'],
    sideEffects: ['轻度头晕', '乏力', '恶心']
  },
  {
    id: 'med006',
    name: '奥美拉唑肠溶胶囊',
    genericName: 'Omeprazole',
    specification: '20mg × 14粒/盒',
    manufacturer: '阿斯利康制药有限公司',
    form: '肠溶胶囊',
    appearance: '红褐相间胶囊',
    color: '红褐',
    dosage: '20mg',
    instructions: '早餐前30分钟服用，用温水送服',
    category: '消化系统',
    contraindications: ['对本品过敏', '哺乳期'],
    interactions: ['氯吡格雷', '阿普斯特', '甲氨蝶呤'],
    sideEffects: ['头痛', '腹泻', '恶心', '皮疹']
  },
  {
    id: 'med007',
    name: '左氧氟沙星片',
    genericName: 'Levofloxacin',
    specification: '0.5g × 6片/盒',
    manufacturer: '第一三共制药有限公司',
    form: '片剂',
    appearance: '淡黄色薄膜衣片，椭圆形',
    color: '淡黄色',
    dosage: '0.5g',
    instructions: '每日1次，餐后2小时或餐前1小时服用',
    category: '抗菌药',
    contraindications: ['对喹诺酮类过敏', '癫痫患者', '妊娠期', '18岁以下儿童'],
    interactions: ['抗酸药', '金属离子', '华法林', '茶碱类'],
    sideEffects: ['胃肠道反应', '头晕', '光敏反应', '肌腱损伤']
  },
  {
    id: 'med008',
    name: '氯雷他定片',
    genericName: 'Loratadine',
    specification: '10mg × 12片/盒',
    manufacturer: '拜耳医药保健有限公司',
    form: '片剂',
    appearance: '白色椭圆形片剂，一面有分割线',
    color: '白色',
    dosage: '10mg',
    instructions: '每日1次，空腹或餐后服用均可',
    category: '抗过敏',
    contraindications: ['对本品过敏'],
    interactions: ['大环内酯类抗生素', '西咪替丁', '酮康唑'],
    sideEffects: ['口干', '头痛', '乏力', '嗜睡（少见）']
  },
  {
    id: 'med009',
    name: '氨氯地平贝那普利片',
    genericName: 'Amlodipine Besylate and Benazepril',
    specification: '10mg:20mg × 7片/盒',
    manufacturer: '北京诺华制药有限公司',
    form: '片剂',
    appearance: '浅黄色薄膜衣片',
    color: '浅黄色',
    dosage: '1片',
    instructions: '每日1次，餐后服用',
    category: '心脑血管',
    contraindications: ['血管性水肿病史', '妊娠期', '双侧肾动脉狭窄'],
    interactions: ['钾补充剂', '保钾利尿剂', '锂剂', '非甾体抗炎药'],
    sideEffects: ['咳嗽', '头痛', '眩晕', '踝部水肿']
  },
  {
    id: 'med010',
    name: '蒙脱石散',
    genericName: 'Montmorillonite Powder',
    specification: '3g × 10袋/盒',
    manufacturer: '博福-益普生（天津）制药有限公司',
    form: '散剂',
    appearance: '灰白色或微黄色粉末',
    color: '灰白色',
    dosage: '3g（1袋）',
    instructions: '用温水冲服，急性腹泻首剂加倍',
    category: '消化系统',
    contraindications: ['对小肠消化酶损害'],
    interactions: ['其他口服药物（需间隔1-2小时）'],
    sideEffects: ['便秘（少见）', '腹胀']
  }
]

// 药品分类
export const medicationCategories = [
  { id: 'cardiovascular', name: '心脑血管', icon: '❤️', color: '#E91E63' },
  { id: 'diabetes', name: '糖尿病', icon: '🩸', color: '#F44336' },
  { id: 'digestive', name: '消化系统', icon: '🫁', color: '#FF9800' },
  { id: 'respiratory', name: '呼吸系统', icon: '🫁', color: '#2196F3' },
  { id: 'antibiotic', name: '抗菌药', icon: '💊', color: '#9C27B0' },
  { id: 'allergy', name: '抗过敏', icon: '🤧', color: '#00BCD4' },
  { id: 'cold', name: '感冒用药', icon: '🤒', color: '#4CAF50' },
  { id: 'pain', name: '镇痛药', icon: '💪', color: '#795548' },
  { id: 'other', name: '其他', icon: '💊', color: '#607D8B' }
]

// 紧急情况类型
export const emergencyTypes = [
  {
    id: 'overdose',
    title: '药物过量',
    icon: '💊',
    severity: 'critical',
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
    ]
  },
  {
    id: 'allergy',
    title: '过敏反应',
    icon: '😰',
    severity: 'critical',
    symptoms: ['皮疹', '瘙痒', '面部肿胀', '呼吸困难', '喉咙紧缩'],
    actions: [
      '立即停药',
      '如有抗过敏药可服用',
      '拨打120急救电话',
      '保持呼吸道通畅',
      '如有肾上腺素笔可按医嘱使用'
    ],
    warnings: [
      '严重过敏可能危及生命',
      '不要抓挠皮疹',
      '就医时告知过敏药物'
    ]
  },
  {
    id: 'hypoglycemia',
    title: '低血糖',
    icon: '😵',
    severity: 'high',
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
    ]
  },
  {
    id: 'hypertension',
    title: '高血压危象',
    icon: '💢',
    severity: 'high',
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
    ]
  },
  {
    id: 'missed',
    title: '漏服药物',
    icon: '⏰',
    severity: 'medium',
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
      '某些特殊药物不可补服',
      '遵循医嘱处理'
    ]
  }
]

// 用药提醒模板
export const reminderTemplates = [
  { id: 'before_meal', label: '饭前30分钟', icon: '🍽️' },
  { id: 'after_meal', label: '饭后30分钟', icon: '🍚' },
  { id: 'with_meal', label: '随餐服用', icon: '🥗' },
  { id: 'before_sleep', label: '睡前', icon: '😴' },
  { id: 'morning', label: '早上空腹', icon: '🌅' },
  { id: 'no_food', label: '与食物间隔2小时', icon: '⏰' }
]

// 症状记录选项
export const symptomOptions = [
  { id: 'headache', label: '头痛', icon: '🤕' },
  { id: 'dizziness', label: '头晕', icon: '💫' },
  { id: 'nausea', label: '恶心', icon: '🤢' },
  { id: 'fatigue', label: '乏力', icon: '😫' },
  { id: 'insomnia', label: '失眠', icon: '😣' },
  { id: 'chest_pain', label: '胸闷', icon: '😰' },
  { id: 'breathing', label: '呼吸困难', icon: '😮' },
  { id: 'rash', label: '皮疹', icon: '🔴' }
]

// 健康感觉选项
export const feelingOptions = [
  { value: 'better', label: '好转', icon: '😊', color: '#4CAF50' },
  { value: 'same', label: '无变化', icon: '😐', color: '#2196F3' },
  { value: 'worse', label: '加重', icon: '😟', color: '#FF9800' }
]
