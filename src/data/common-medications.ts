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
  pinyin?: string        // 拼音首字母
  pinyinFull?: string    // 完整拼音
}

// 常见同音字/近音字映射（用于语音识别纠错）
const SIMILAR_SOUND_MAP: Record<string, string[]> = {
  '门': ['孟', '蒙', '锰'],
  '冬': ['东', '冬', '董'],
  '氨': ['安', '氨', '胺'],
  '氯': ['绿', '氯', '吕'],
  '硝': ['消', '硝', '小'],
  '厄': ['饿', '厄', '恶'],
  '缬': ['协', '缬', '谢'],
  '吲': ['引', '吲', '隐'],
  '格': ['哥', '格', '革'],
  '阿卡波糖': ['阿卡波糖', '阿卡宝糖', '阿卡博糖'],
  '二甲双胍': ['二甲双胍', '二甲双瓜', '二甲双瓜'],
  '阿司匹林': ['阿司匹林', '阿四匹林', '阿司比林'],
  '奥美拉唑': ['奥美拉唑', '奥美拉错', '傲美拉唑'],
  '布洛芬': ['布洛芬', '布洛分', '不落芬'],
  '对乙酰氨基酚': ['对乙酰氨基酚', '对已先氨基酚', '对乙酰安基酚']
}

// 拼音首字母映射（简化版，覆盖常用药）
const PINYIN_MAP: Record<string, string> = {
  '硝苯地平缓释片': 'xbdp',
  '氨氯地平片': 'aldp',
  '厄贝沙坦片': 'ebst',
  '缬沙坦胶囊': 'xstjn',
  '美托洛尔缓释片': 'mtle',
  '非洛地平缓释片': 'fldp',
  '吲达帕胺片': 'ydaa',
  '氯沙坦钾片': 'cstk',
  '替米沙坦片': 'tmst',
  '比索洛尔片': 'bsle',
  '二甲双胍片': 'emsg',
  '格列美脲片': 'glmh',
  '阿卡波糖片': 'akbt',
  '格列齐特缓释片': 'glqt',
  '瑞格列奈片': 'rgln',
  '西格列汀片': 'xglt',
  '沙格列汀片': 'sglt',
  '达格列净片': 'dglj',
  '恩格列净片': 'eglj',
  '利拉鲁肽注射液': 'lllt',
  '阿托伐他汀钙片': 'atvt',
  '瑞舒伐他汀钙片': 'rsvt',
  '辛伐他汀片': 'xvt',
  '普伐他汀钠片': 'pvtn',
  '非诺贝特胶囊': 'fnbt',
  '依折麦布片': 'yzmb',
  '普罗布考片': 'plbk',
  '血脂康胶囊': 'xzk',
  '阿司匹林肠溶片': 'aspl',
  '氯吡格雷片': 'cpls',
  '华法林钠片': 'hfln',
  '单硝酸异山梨酯片': 'dxss',
  '硝酸甘油片': 'xgy',
  '奥美拉唑肠溶胶囊': 'amlz',
  '雷贝拉唑钠肠溶片': 'lblz',
  '泮托拉唑钠肠溶片': 'ptlz',
  '兰索拉唑肠溶胶囊': 'lslz',
  '铝碳酸镁咀嚼片': 'ltsm',
  '氨溴索片': 'axs',
  '溴己新片': 'xjx',
  '右美沙芬片': 'ymsf',
  '喷托维林片': 'ptwl',
  '布洛芬缓释胶囊': 'blf',
  '对乙酰氨基酚片': 'dyxa',
  '双氯芬酸钠肠溶片': 'slfs',
  '塞来昔布胶囊': 'slxb',
  '复合维生素片': 'fhws',
  '碳酸钙 D3 片': 'tgs',
  '维生素 B1 片': 'ws',
  '甲钴胺片': 'jga'
}

// 生成药品占位图 URL - 使用不同的背景色区分
function getPlaceholderImage(name: string, index: number): string {
  const colors = ['4CAF50', '2196F3', 'FF9800', 'E91E63', '9C27B0', '00BCD4', 'FFC107', '795548']
  const color = colors[index % colors.length]
  const text = encodeURIComponent(name.charAt(0))
  return `https://via.placeholder.com/200x200/${color}/ffffff?text=${text}`
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
    image: getPlaceholderImage('硝', 0),
    usage: '每次 1 片，每日 2 次'
  },
  {
    id: 'common_002',
    name: '氨氯地平片',
    genericName: '苯磺酸氨氯地平',
    category: '降压药',
    indications: '降血压',
    appearanceDesc: '白色圆形片剂，直径约 9mm',
    image: getPlaceholderImage('氨', 1),
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_003',
    name: '厄贝沙坦片',
    genericName: '厄贝沙坦',
    category: '降压药',
    indications: '降血压',
    appearanceDesc: '白色椭圆形片剂，一面刻有标识',
    image: getPlaceholderImage('厄', 2),
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_004',
    name: '缬沙坦胶囊',
    genericName: '缬沙坦',
    category: '降压药',
    indications: '降血压',
    appearanceDesc: '蓝白胶囊，内含白色颗粒',
    image: getPlaceholderImage('缬', 3),
    usage: '每次 1 粒，每日 1 次'
  },
  {
    id: 'common_005',
    name: '美托洛尔缓释片',
    genericName: '酒石酸美托洛尔',
    category: '降压药',
    indications: '降血压/心率',
    appearanceDesc: '淡黄色圆形片剂',
    image: getPlaceholderImage('美', 4),
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_020',
    name: '非洛地平缓释片',
    genericName: '非洛地平',
    category: '降压药',
    indications: '降血压',
    appearanceDesc: '白色椭圆形薄膜衣片',
    image: getPlaceholderImage('非', 5),
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_021',
    name: '吲达帕胺片',
    genericName: '吲达帕胺',
    category: '降压药',
    indications: '降血压',
    appearanceDesc: '白色片剂',
    image: getPlaceholderImage('吲', 6),
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_022',
    name: '氯沙坦钾片',
    genericName: '氯沙坦',
    category: '降压药',
    indications: '降血压',
    appearanceDesc: '白色椭圆形薄膜衣片',
    image: getPlaceholderImage('氯', 7),
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_023',
    name: '替米沙坦片',
    genericName: '替米沙坦',
    category: '降压药',
    indications: '降血压',
    appearanceDesc: '淡黄色圆形片剂',
    image: getPlaceholderImage('替', 0),
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_024',
    name: '比索洛尔片',
    genericName: '富马酸比索洛尔',
    category: '降压药',
    indications: '降血压/心率',
    appearanceDesc: '淡黄色圆形薄膜衣片',
    image: getPlaceholderImage('比', 1),
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
    image: getPlaceholderImage('二', 2),
    usage: '每次 1 片，每日 2 次，餐中服用'
  },
  {
    id: 'common_007',
    name: '格列美脲片',
    genericName: '格列美脲',
    category: '降糖药',
    indications: '降血糖',
    appearanceDesc: '粉红色椭圆形片剂',
    image: getPlaceholderImage('格', 3),
    usage: '每次 1 片，每日 1 次，早餐前'
  },
  {
    id: 'common_008',
    name: '阿卡波糖片',
    genericName: '阿卡波糖',
    category: '降糖药',
    indications: '降餐后血糖',
    appearanceDesc: '白色类圆形片剂',
    image: getPlaceholderImage('阿', 4),
    usage: '每次 1 片，每日 3 次，餐前服用'
  },
  {
    id: 'common_025',
    name: '格列齐特缓释片',
    genericName: '格列齐特',
    category: '降糖药',
    indications: '降血糖',
    appearanceDesc: '白色椭圆形片剂',
    image: getPlaceholderImage('列', 5),
    usage: '每次 1 片，每日 1 次，早餐时'
  },
  {
    id: 'common_026',
    name: '瑞格列奈片',
    genericName: '瑞格列奈',
    category: '降糖药',
    indications: '降餐后血糖',
    appearanceDesc: '白色圆形片剂',
    image: getPlaceholderImage('瑞', 6),
    usage: '每次 1 片，每日 3 次，餐前 15 分钟'
  },
  {
    id: 'common_027',
    name: '西格列汀片',
    genericName: '磷酸西格列汀',
    category: '降糖药',
    indications: '降血糖',
    appearanceDesc: '淡粉色圆形薄膜衣片',
    image: getPlaceholderImage('西', 7),
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_028',
    name: '沙格列汀片',
    genericName: '沙格列汀',
    category: '降糖药',
    indications: '降血糖',
    appearanceDesc: '淡黄色圆形片剂',
    image: getPlaceholderImage('沙', 0),
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_029',
    name: '达格列净片',
    genericName: '达格列净',
    category: '降糖药',
    indications: '降血糖',
    appearanceDesc: '黄色椭圆形薄膜衣片',
    image: getPlaceholderImage('达', 1),
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_030',
    name: '恩格列净片',
    genericName: '恩格列净',
    category: '降糖药',
    indications: '降血糖',
    appearanceDesc: '淡黄色椭圆形片剂',
    image: getPlaceholderImage('恩', 2),
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_031',
    name: '利拉鲁肽注射液',
    genericName: '利拉鲁肽',
    category: '降糖药',
    indications: '降血糖',
    appearanceDesc: '无色澄明注射液',
    image: getPlaceholderImage('利', 3),
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
    image: getPlaceholderImage('阿', 4),
    usage: '每次 1 片，每日 1 次，睡前服用'
  },
  {
    id: 'common_010',
    name: '瑞舒伐他汀钙片',
    genericName: '瑞舒伐他汀',
    category: '降脂药',
    indications: '降血脂',
    appearanceDesc: '粉色圆形片剂',
    image: getPlaceholderImage('瑞', 5),
    usage: '每次 1 片，每日 1 次，睡前服用'
  },
  {
    id: 'common_032',
    name: '辛伐他汀片',
    genericName: '辛伐他汀',
    category: '降脂药',
    indications: '降血脂',
    appearanceDesc: '白色或类白色片剂',
    image: getPlaceholderImage('辛', 6),
    usage: '每次 1 片，每日 1 次，晚上服用'
  },
  {
    id: 'common_033',
    name: '普伐他汀钠片',
    genericName: '普伐他汀',
    category: '降脂药',
    indications: '降血脂',
    appearanceDesc: '淡橙色椭圆形片剂',
    image: getPlaceholderImage('普', 7),
    usage: '每次 1 片，每日 1 次，睡前服用'
  },
  {
    id: 'common_034',
    name: '非诺贝特胶囊',
    genericName: '非诺贝特',
    category: '降脂药',
    indications: '降甘油三酯',
    appearanceDesc: '黄白相间胶囊',
    image: getPlaceholderImage('非', 0),
    usage: '每次 1 粒，每日 1 次'
  },
  {
    id: 'common_035',
    name: '依折麦布片',
    genericName: '依折麦布',
    category: '降脂药',
    indications: '降胆固醇',
    appearanceDesc: '白色椭圆形片剂',
    image: getPlaceholderImage('依', 1),
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_036',
    name: '普罗布考片',
    genericName: '普罗布考',
    category: '降脂药',
    indications: '降血脂',
    appearanceDesc: '白色片剂',
    image: getPlaceholderImage('普', 2),
    usage: '每次 1 片，每日 2 次'
  },
  {
    id: 'common_037',
    name: '血脂康胶囊',
    genericName: '红曲提取物',
    category: '降脂药',
    indications: '降血脂',
    appearanceDesc: '紫红色胶囊',
    image: getPlaceholderImage('血', 3),
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
    image: getPlaceholderImage('阿', 4),
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_012',
    name: '氯吡格雷片',
    genericName: '硫酸氢氯吡格雷',
    category: '心血管药',
    indications: '预防血栓',
    appearanceDesc: '黄色圆形片剂',
    image: getPlaceholderImage('氯', 5),
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_038',
    name: '华法林钠片',
    genericName: '华法林',
    category: '心血管药',
    indications: '抗凝血',
    appearanceDesc: '白色片剂，有不同颜色标识',
    image: getPlaceholderImage('华', 6),
    usage: '遵医嘱，每日 1 次'
  },
  {
    id: 'common_039',
    name: '单硝酸异山梨酯片',
    genericName: '单硝酸异山梨酯',
    category: '心血管药',
    indications: '心绞痛',
    appearanceDesc: '白色圆形片剂',
    image: getPlaceholderImage('单', 7),
    usage: '每次 1 片，每日 2 次'
  },
  {
    id: 'common_040',
    name: '硝酸甘油片',
    genericName: '硝酸甘油',
    category: '心血管药',
    indications: '心绞痛急救',
    appearanceDesc: '白色小片剂',
    image: getPlaceholderImage('硝', 0),
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
    image: getPlaceholderImage('奥', 1),
    usage: '每次 1 粒，每日 1 次，早餐前'
  },
  {
    id: 'common_014',
    name: '雷贝拉唑钠肠溶片',
    genericName: '雷贝拉唑',
    category: '胃药',
    indications: '抑制胃酸',
    appearanceDesc: '黄色薄膜衣片',
    image: getPlaceholderImage('雷', 2),
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_041',
    name: '泮托拉唑钠肠溶片',
    genericName: '泮托拉唑',
    category: '胃药',
    indications: '抑制胃酸',
    appearanceDesc: '类白色肠溶衣片',
    image: getPlaceholderImage('泮', 3),
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_042',
    name: '兰索拉唑肠溶胶囊',
    genericName: '兰索拉唑',
    category: '胃药',
    indications: '抑制胃酸',
    appearanceDesc: '透明胶囊，内含白色颗粒',
    image: getPlaceholderImage('兰', 4),
    usage: '每次 1 粒，每日 1 次'
  },
  {
    id: 'common_043',
    name: '铝碳酸镁咀嚼片',
    genericName: '铝碳酸镁',
    category: '胃药',
    indications: '中和胃酸',
    appearanceDesc: '白色或类白色片剂',
    image: getPlaceholderImage('铝', 5),
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
    image: getPlaceholderImage('氨', 6),
    usage: '每次 1 片，每日 3 次'
  },
  {
    id: 'common_044',
    name: '溴己新片',
    genericName: '溴己新',
    category: '止咳药',
    indications: '化痰',
    appearanceDesc: '白色片剂',
    image: getPlaceholderImage('溴', 7),
    usage: '每次 1 片，每日 3 次'
  },
  {
    id: 'common_045',
    name: '右美沙芬片',
    genericName: '氢溴酸右美沙芬',
    category: '止咳药',
    indications: '止咳',
    appearanceDesc: '白色片剂',
    image: getPlaceholderImage('右', 0),
    usage: '每次 1 片，每日 3 次'
  },
  {
    id: 'common_046',
    name: '喷托维林片',
    genericName: '枸橼酸喷托维林',
    category: '止咳药',
    indications: '止咳',
    appearanceDesc: '白色片剂',
    image: getPlaceholderImage('喷', 1),
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
    image: getPlaceholderImage('布', 2),
    usage: '每次 1 粒，每日 2 次'
  },
  {
    id: 'common_017',
    name: '对乙酰氨基酚片',
    genericName: '对乙酰氨基酚',
    category: '止痛药',
    indications: '止痛退烧',
    appearanceDesc: '白色圆形片剂',
    image: getPlaceholderImage('对', 3),
    usage: '每次 1 片，需要时服用'
  },
  {
    id: 'common_047',
    name: '双氯芬酸钠肠溶片',
    genericName: '双氯芬酸',
    category: '止痛药',
    indications: '止痛消炎',
    appearanceDesc: '肠溶衣片',
    image: getPlaceholderImage('双', 4),
    usage: '每次 1 片，每日 3 次'
  },
  {
    id: 'common_048',
    name: '塞来昔布胶囊',
    genericName: '塞来昔布',
    category: '止痛药',
    indications: '止痛消炎',
    appearanceDesc: '蓝白胶囊',
    image: getPlaceholderImage('塞', 5),
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
    image: getPlaceholderImage('复', 6),
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_019',
    name: '碳酸钙 D3 片',
    genericName: '碳酸钙',
    category: '钙片',
    indications: '补钙',
    appearanceDesc: '白色或类白色片剂',
    image: getPlaceholderImage('碳', 7),
    usage: '每次 1 片，每日 1-2 次'
  },
  {
    id: 'common_049',
    name: '维生素 B1 片',
    genericName: '维生素 B1',
    category: '维生素',
    indications: '补充维生素 B1',
    appearanceDesc: '白色片剂',
    image: getPlaceholderImage('维', 0),
    usage: '每次 1 片，每日 3 次'
  },
  {
    id: 'common_050',
    name: '甲钴胺片',
    genericName: '甲钴胺',
    category: '维生素',
    indications: '营养神经',
    appearanceDesc: '淡红色圆形糖衣片',
    image: getPlaceholderImage('甲', 1),
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
 * 搜索药品 - 支持拼音、模糊匹配、同音字
 */
export function searchMedications(keyword: string): CommonMedication[] {
  const kw = keyword.toLowerCase().trim()
  if (!kw) return []

  const scoredResults: Array<{ med: CommonMedication; score: number }> = []

  for (const med of COMMON_MEDICATIONS) {
    let score = 0

    // 1. 精确匹配药名
    if (med.name === keyword) {
      score += 100
    }

    // 2. 药名包含关键词
    if (med.name.toLowerCase().includes(kw)) {
      score += 50
    }

    // 3. 通用名包含关键词
    if (med.genericName.toLowerCase().includes(kw)) {
      score += 40
    }

    // 4. 分类包含关键词
    if (med.category.toLowerCase().includes(kw)) {
      score += 30
    }

    // 5. 适应症包含关键词
    if (med.indications.toLowerCase().includes(kw)) {
      score += 20
    }

    // 6. 拼音首字母匹配
    const pinyinFirst = PINYIN_MAP[med.name]
    if (pinyinFirst && pinyinFirst.toLowerCase().includes(kw)) {
      score += 45
    }

    // 7. 药名单字拼音首字母匹配
    const namePinyin = med.name.split('').map(c => PINYIN_MAP_SIMPLE[c] || '').join('')
    if (namePinyin.toLowerCase().includes(kw)) {
      score += 35
    }

    // 8. 同音字/近音字匹配
    for (const [correct, sounds] of Object.entries(SIMILAR_SOUND_MAP)) {
      if (sounds.some(s => keyword.includes(s))) {
        if (med.name.includes(correct) || med.genericName.includes(correct)) {
          score += 25
        }
      }
    }

    // 9. 常见药品别名匹配
    const aliases = getMedicationAliases(med.name)
    if (aliases.some(alias => alias.toLowerCase().includes(kw))) {
      score += 30
    }

    if (score > 0) {
      scoredResults.push({ med, score })
    }
  }

  // 按分数排序
  scoredResults.sort((a, b) => b.score - a.score)

  // 返回前 10 个结果
  return scoredResults.slice(0, 10).map(r => r.med)
}

/**
 * 获取药品常见别名
 */
function getMedicationAliases(name: string): string[] {
  const aliasMap: Record<string, string[]> = {
    '阿司匹林肠溶片': ['阿司匹林', '阿斯匹林', '阿四匹林', 'ASP'],
    '硝苯地平缓释片': ['硝苯地平', '心痛定'],
    '二甲双胍片': ['二甲双胍', '二甲双瓜', '降糖片'],
    '阿托伐他汀钙片': ['阿托伐他汀', '立普妥'],
    '瑞舒伐他汀钙片': ['瑞舒伐他汀', '可定'],
    '奥美拉唑肠溶胶囊': ['奥美拉唑', '洛赛克'],
    '布洛芬缓释胶囊': ['布洛芬', '芬必得'],
    '对乙酰氨基酚片': ['对乙酰氨基酚', '扑热息痛', '泰诺'],
    '氨氯地平片': ['氨氯地平', '络活喜'],
    '厄贝沙坦片': ['厄贝沙坦', '安博维'],
    '缬沙坦胶囊': ['缬沙坦', '代文'],
    '美托洛尔缓释片': ['美托洛尔', '倍他乐克'],
    '格列美脲片': ['格列美脲', '亚莫利'],
    '阿卡波糖片': ['阿卡波糖', '拜唐苹'],
    '氯吡格雷片': ['氯吡格雷', '波立维'],
    '硝酸甘油片': ['硝酸甘油', '救心丸']
  }

  return aliasMap[name] || [name]
}

// 单个汉字的简单拼音首字母
const PINYIN_MAP_SIMPLE: Record<string, string> = {
  '阿': 'a', '氨': 'a', '奥': 'a', '安': 'a',
  '苯': 'b', '贝': 'b', '比': 'b', '布': 'b', '白': 'b',
  '碳': 't', '替': 't', '托': 't', '特': 't',
  '达': 'd', '单': 'd', '地': 'd',
  '厄': 'e', '恩': 'e',
  '非': 'f', '法': 'f', '伐': 'f', '复': 'f', '芬': 'f',
  '格': 'g', '甘': 'g', '钙': 'g', '硅': 'g',
  '华': 'h',
  '氯': 'l', '洛': 'l', '拉': 'l', '铝': 'l', '利': 'l', '列': 'l', '兰': 'l', '雷': 'l',
  '美': 'm', '麦': 'm', '蒙': 'm', '门': 'm',
  '硝': 'x', '西': 'x', '辛': 'x', '血': 'x', '沙': 's', '塞': 's', '泮': 'p', '喷': 'p',
  '吲': 'y', '依': 'y', '右': 'y', '异': 'y',
  '普': 'p',
  '瑞': 'r',
  '缬': 'x', '消': 'x',
  '甲': 'j', '剂': 'j',
  '维': 'w',
  '酮': 't', '肽': 't',
  '磺': 'h', '环': 'h',
  '左': 'z', '唑': 'z', '净': 'j', '汀': 't', '脲': 'n', '酯': 'z', '钾': 'j', '溴': 'x'
}
