// 常用药品库 - 50 种高频药品
// 用于适老化添加药品功能的快捷选择

export interface CommonMedication {
  id: string
  name: string           // 商品名
  genericName: string    // 通用名
  category: string       // 分类：降压药/降糖药等
  indications: string    // 适应症/用途
  appearanceDesc: string // 外观描述
  image: string          // 标准图片 URL
  usage: string          // 常用法用量
}

export const COMMON_MEDICATIONS: CommonMedication[] = [
  // ===== 降压药 (10 种) =====
  {
    id: 'common_001',
    name: '硝苯地平缓释片',
    genericName: '硝苯地平',
    category: '降压药',
    indications: '降血压',
    appearanceDesc: '黄色椭圆形薄膜衣片，长约 12mm',
    image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 2 次'
  },
  {
    id: 'common_002',
    name: '氨氯地平片',
    genericName: '苯磺酸氨氯地平',
    category: '降压药',
    indications: '降血压',
    appearanceDesc: '白色圆形片剂，直径约 9mm',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_003',
    name: '厄贝沙坦片',
    genericName: '厄贝沙坦',
    category: '降压药',
    indications: '降血压',
    appearanceDesc: '白色椭圆形片剂，一面刻有标识',
    image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_004',
    name: '缬沙坦胶囊',
    genericName: '缬沙坦',
    category: '降压药',
    indications: '降血压',
    appearanceDesc: '蓝白胶囊，内含白色颗粒',
    image: 'https://images.unsplash.com/photo-1583912267670-6bdd75a7e1fd?w=200&h=200&fit=crop',
    usage: '每次 1 粒，每日 1 次'
  },
  {
    id: 'common_005',
    name: '美托洛尔缓释片',
    genericName: '酒石酸美托洛尔',
    category: '降压药',
    indications: '降血压/心率',
    appearanceDesc: '淡黄色圆形片剂',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_020',
    name: '非洛地平缓释片',
    genericName: '非洛地平',
    category: '降压药',
    indications: '降血压',
    appearanceDesc: '白色椭圆形薄膜衣片',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_021',
    name: '吲达帕胺片',
    genericName: '吲达帕胺',
    category: '降压药',
    indications: '降血压',
    appearanceDesc: '白色片剂',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_022',
    name: '氯沙坦钾片',
    genericName: '氯沙坦',
    category: '降压药',
    indications: '降血压',
    appearanceDesc: '白色椭圆形薄膜衣片',
    image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_023',
    name: '替米沙坦片',
    genericName: '替米沙坦',
    category: '降压药',
    indications: '降血压',
    appearanceDesc: '淡黄色圆形片剂',
    image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_024',
    name: '比索洛尔片',
    genericName: '富马酸比索洛尔',
    category: '降压药',
    indications: '降血压/心率',
    appearanceDesc: '淡黄色圆形薄膜衣片',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次'
  },

  // ===== 降糖药 (10 种) =====
  {
    id: 'common_006',
    name: '二甲双胍片',
    genericName: '盐酸二甲双胍',
    category: '降糖药',
    indications: '降血糖',
    appearanceDesc: '白色圆形片剂，直径约 10mm',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 2 次，餐中服用'
  },
  {
    id: 'common_007',
    name: '格列美脲片',
    genericName: '格列美脲',
    category: '降糖药',
    indications: '降血糖',
    appearanceDesc: '粉红色椭圆形片剂',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次，早餐前'
  },
  {
    id: 'common_008',
    name: '阿卡波糖片',
    genericName: '阿卡波糖',
    category: '降糖药',
    indications: '降餐后血糖',
    appearanceDesc: '白色类圆形片剂',
    image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 3 次，餐前服用'
  },
  {
    id: 'common_025',
    name: '格列齐特缓释片',
    genericName: '格列齐特',
    category: '降糖药',
    indications: '降血糖',
    appearanceDesc: '白色椭圆形片剂',
    image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次，早餐时'
  },
  {
    id: 'common_026',
    name: '瑞格列奈片',
    genericName: '瑞格列奈',
    category: '降糖药',
    indications: '降餐后血糖',
    appearanceDesc: '白色圆形片剂',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 3 次，餐前 15 分钟'
  },
  {
    id: 'common_027',
    name: '西格列汀片',
    genericName: '磷酸西格列汀',
    category: '降糖药',
    indications: '降血糖',
    appearanceDesc: '淡粉色圆形薄膜衣片',
    image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_028',
    name: '沙格列汀片',
    genericName: '沙格列汀',
    category: '降糖药',
    indications: '降血糖',
    appearanceDesc: '淡黄色圆形片剂',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_029',
    name: '达格列净片',
    genericName: '达格列净',
    category: '降糖药',
    indications: '降血糖',
    appearanceDesc: '黄色椭圆形薄膜衣片',
    image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_030',
    name: '恩格列净片',
    genericName: '恩格列净',
    category: '降糖药',
    indications: '降血糖',
    appearanceDesc: '淡黄色椭圆形片剂',
    image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_031',
    name: '利拉鲁肽注射液',
    genericName: '利拉鲁肽',
    category: '降糖药',
    indications: '降血糖',
    appearanceDesc: '无色澄明注射液',
    image: 'https://images.unsplash.com/photo-1583912267670-6bdd75a7e1fd?w=200&h=200&fit=crop',
    usage: '每日 1 次，皮下注射'
  },

  // ===== 降脂药 (8 种) =====
  {
    id: 'common_009',
    name: '阿托伐他汀钙片',
    genericName: '阿托伐他汀',
    category: '降脂药',
    indications: '降胆固醇',
    appearanceDesc: '白色椭圆形薄膜衣片，长约 14mm',
    image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次，睡前服用'
  },
  {
    id: 'common_010',
    name: '瑞舒伐他汀钙片',
    genericName: '瑞舒伐他汀',
    category: '降脂药',
    indications: '降血脂',
    appearanceDesc: '粉色圆形片剂',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次，睡前服用'
  },
  {
    id: 'common_032',
    name: '辛伐他汀片',
    genericName: '辛伐他汀',
    category: '降脂药',
    indications: '降血脂',
    appearanceDesc: '白色或类白色片剂',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次，晚上服用'
  },
  {
    id: 'common_033',
    name: '普伐他汀钠片',
    genericName: '普伐他汀',
    category: '降脂药',
    indications: '降血脂',
    appearanceDesc: '淡橙色椭圆形片剂',
    image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次，睡前服用'
  },
  {
    id: 'common_034',
    name: '非诺贝特胶囊',
    genericName: '非诺贝特',
    category: '降脂药',
    indications: '降甘油三酯',
    appearanceDesc: '黄白相间胶囊',
    image: 'https://images.unsplash.com/photo-1583912267670-6bdd75a7e1fd?w=200&h=200&fit=crop',
    usage: '每次 1 粒，每日 1 次'
  },
  {
    id: 'common_035',
    name: '依折麦布片',
    genericName: '依折麦布',
    category: '降脂药',
    indications: '降胆固醇',
    appearanceDesc: '白色椭圆形片剂',
    image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_036',
    name: '普罗布考片',
    genericName: '普罗布考',
    category: '降脂药',
    indications: '降血脂',
    appearanceDesc: '白色片剂',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 2 次'
  },
  {
    id: 'common_037',
    name: '血脂康胶囊',
    genericName: '红曲提取物',
    category: '降脂药',
    indications: '降血脂',
    appearanceDesc: '紫红色胶囊',
    image: 'https://images.unsplash.com/photo-1583912267670-6bdd75a7e1fd?w=200&h=200&fit=crop',
    usage: '每次 2 粒，每日 2 次'
  },

  // ===== 心血管药 (5 种) =====
  {
    id: 'common_011',
    name: '阿司匹林肠溶片',
    genericName: '阿司匹林',
    category: '心血管药',
    indications: '预防血栓',
    appearanceDesc: '白色圆形小药片，直径约 8mm，刻有"100"',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_012',
    name: '氯吡格雷片',
    genericName: '硫酸氢氯吡格雷',
    category: '心血管药',
    indications: '预防血栓',
    appearanceDesc: '黄色圆形片剂',
    image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_038',
    name: '华法林钠片',
    genericName: '华法林',
    category: '心血管药',
    indications: '抗凝血',
    appearanceDesc: '白色片剂，有不同颜色标识',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop',
    usage: '遵医嘱，每日 1 次'
  },
  {
    id: 'common_039',
    name: '单硝酸异山梨酯片',
    genericName: '单硝酸异山梨酯',
    category: '心血管药',
    indications: '心绞痛',
    appearanceDesc: '白色圆形片剂',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 2 次'
  },
  {
    id: 'common_040',
    name: '硝酸甘油片',
    genericName: '硝酸甘油',
    category: '心血管药',
    indications: '心绞痛急救',
    appearanceDesc: '白色小片剂',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop',
    usage: '舌下含服，需要时使用'
  },

  // ===== 胃药 (5 种) =====
  {
    id: 'common_013',
    name: '奥美拉唑肠溶胶囊',
    genericName: '奥美拉唑',
    category: '胃药',
    indications: '抑制胃酸',
    appearanceDesc: '透明胶囊，内含白色小丸',
    image: 'https://images.unsplash.com/photo-1583912267670-6bdd75a7e1fd?w=200&h=200&fit=crop',
    usage: '每次 1 粒，每日 1 次，早餐前'
  },
  {
    id: 'common_014',
    name: '雷贝拉唑钠肠溶片',
    genericName: '雷贝拉唑',
    category: '胃药',
    indications: '抑制胃酸',
    appearanceDesc: '黄色薄膜衣片',
    image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_041',
    name: '泮托拉唑钠肠溶片',
    genericName: '泮托拉唑',
    category: '胃药',
    indications: '抑制胃酸',
    appearanceDesc: '类白色肠溶衣片',
    image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_042',
    name: '兰索拉唑肠溶胶囊',
    genericName: '兰索拉唑',
    category: '胃药',
    indications: '抑制胃酸',
    appearanceDesc: '透明胶囊，内含白色颗粒',
    image: 'https://images.unsplash.com/photo-1583912267670-6bdd75a7e1fd?w=200&h=200&fit=crop',
    usage: '每次 1 粒，每日 1 次'
  },
  {
    id: 'common_043',
    name: '铝碳酸镁咀嚼片',
    genericName: '铝碳酸镁',
    category: '胃药',
    indications: '中和胃酸',
    appearanceDesc: '白色或类白色片剂',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=200&h=200&fit=crop',
    usage: '每次 1-2 片，嚼服，每日 3 次'
  },

  // ===== 止咳药 (4 种) =====
  {
    id: 'common_015',
    name: '氨溴索片',
    genericName: '盐酸氨溴索',
    category: '止咳药',
    indications: '化痰止咳',
    appearanceDesc: '白色圆形片剂',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 3 次'
  },
  {
    id: 'common_044',
    name: '溴己新片',
    genericName: '溴己新',
    category: '止咳药',
    indications: '化痰',
    appearanceDesc: '白色片剂',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 3 次'
  },
  {
    id: 'common_045',
    name: '右美沙芬片',
    genericName: '氢溴酸右美沙芬',
    category: '止咳药',
    indications: '止咳',
    appearanceDesc: '白色片剂',
    image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 3 次'
  },
  {
    id: 'common_046',
    name: '喷托维林片',
    genericName: '枸橼酸喷托维林',
    category: '止咳药',
    indications: '止咳',
    appearanceDesc: '白色片剂',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 3 次'
  },

  // ===== 止痛药 (4 种) =====
  {
    id: 'common_016',
    name: '布洛芬缓释胶囊',
    genericName: '布洛芬',
    category: '止痛药',
    indications: '止痛退烧',
    appearanceDesc: '透明胶囊，内含白色粉末',
    image: 'https://images.unsplash.com/photo-1583912267670-6bdd75a7e1fd?w=200&h=200&fit=crop',
    usage: '每次 1 粒，每日 2 次'
  },
  {
    id: 'common_017',
    name: '对乙酰氨基酚片',
    genericName: '对乙酰氨基酚',
    category: '止痛药',
    indications: '止痛退烧',
    appearanceDesc: '白色圆形片剂',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop',
    usage: '每次 1 片，需要时服用'
  },
  {
    id: 'common_047',
    name: '双氯芬酸钠肠溶片',
    genericName: '双氯芬酸',
    category: '止痛药',
    indications: '止痛消炎',
    appearanceDesc: '肠溶衣片',
    image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 3 次'
  },
  {
    id: 'common_048',
    name: '塞来昔布胶囊',
    genericName: '塞来昔布',
    category: '止痛药',
    indications: '止痛消炎',
    appearanceDesc: '蓝白胶囊',
    image: 'https://images.unsplash.com/photo-1583912267670-6bdd75a7e1fd?w=200&h=200&fit=crop',
    usage: '每次 1 粒，每日 1-2 次'
  },

  // ===== 维生素/钙片 (4 种) =====
  {
    id: 'common_018',
    name: '复合维生素片',
    genericName: '复合维生素',
    category: '维生素',
    indications: '补充维生素',
    appearanceDesc: '橙色椭圆形片剂',
    image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_019',
    name: '碳酸钙 D3 片',
    genericName: '碳酸钙',
    category: '钙片',
    indications: '补钙',
    appearanceDesc: '白色或类白色片剂',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1-2 次'
  },
  {
    id: 'common_049',
    name: '维生素 B1 片',
    genericName: '维生素 B1',
    category: '维生素',
    indications: '补充维生素 B1',
    appearanceDesc: '白色片剂',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 3 次'
  },
  {
    id: 'common_050',
    name: '甲钴胺片',
    genericName: '甲钴胺',
    category: '维生素',
    indications: '营养神经',
    appearanceDesc: '淡红色圆形糖衣片',
    image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 3 次'
  }
]

// 分类列表
export const MEDICATION_CATEGORIES = [
  { id: 'all', name: '全部' },
  { id: '降压药', name: '降压药' },
  { id: '降糖药', name: '降糖药' },
  { id: '降脂药', name: '降脂药' },
  { id: '心血管药', name: '心血管' },
  { id: '胃药', name: '胃药' },
  { id: '止咳药', name: '止咳药' },
  { id: '止痛药', name: '止痛药' },
  { id: '维生素', name: '维生素' },
  { id: '钙片', name: '钙片' }
]

/**
 * 根据分类筛选药品
 */
export function getMedicationsByCategory(categoryId: string): CommonMedication[] {
  if (categoryId === 'all') {
    return COMMON_MEDICATIONS
  }
  return COMMON_MEDICATIONS.filter(med => med.category === categoryId)
}

/**
 * 搜索药品
 */
export function searchMedications(keyword: string): CommonMedication[] {
  const kw = keyword.toLowerCase().trim()
  if (!kw) return []

  return COMMON_MEDICATIONS.filter(med =>
    med.name.toLowerCase().includes(kw) ||
    med.genericName.toLowerCase().includes(kw) ||
    med.category.toLowerCase().includes(kw) ||
    med.indications.toLowerCase().includes(kw)
  )
}
