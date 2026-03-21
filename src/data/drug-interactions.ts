// 药物相互作用数据库 - 50 种常用药
// 用于检查用户药品组合中的潜在相互作用风险

export interface DrugInteraction {
  drug: string           // 药品名（支持模糊匹配）
  interactions: string[] // 相互作用的药物列表
}

// 50 种常用药的相互作用数据
export const DRUG_INTERACTIONS: DrugInteraction[] = [
  // ===== 降压药 (10 种) =====
  {
    drug: '硝苯地平',
    interactions: ['地高辛', '奎尼丁', '西咪替丁', '利福平', '葡萄柚']
  },
  {
    drug: '氨氯地平',
    interactions: ['辛伐他汀', '环孢素', '地尔硫卓']
  },
  {
    drug: '厄贝沙坦',
    interactions: ['保钾利尿剂', '补钾剂', '锂盐', 'NSAIDs']
  },
  {
    drug: '缬沙坦',
    interactions: ['保钾利尿剂', '补钾剂', '锂盐', 'NSAIDs']
  },
  {
    drug: '美托洛尔',
    interactions: ['维拉帕米', '地尔硫卓', '可乐定', '利血平', '胺碘酮']
  },
  {
    drug: '非洛地平',
    interactions: ['地高辛', '西咪替丁', '酮康唑', '葡萄柚']
  },
  {
    drug: '吲达帕胺',
    interactions: ['地高辛', '锂盐', '糖皮质激素', 'NSAIDs']
  },
  {
    drug: '氯沙坦',
    interactions: ['保钾利尿剂', '补钾剂', '锂盐', 'NSAIDs', '华法林']
  },
  {
    drug: '替米沙坦',
    interactions: ['地高辛', '保钾利尿剂', '补钾剂', '锂盐']
  },
  {
    drug: '比索洛尔',
    interactions: ['维拉帕米', '地尔硫卓', '可乐定', '胺碘酮', '胰岛素']
  },

  // ===== 降糖药 (10 种) =====
  {
    drug: '二甲双胍',
    interactions: ['碘造影剂', '酒精', '糖皮质激素', '呋塞米', '西咪替丁']
  },
  {
    drug: '格列美脲',
    interactions: ['酒精', '华法林', '磺胺类', 'β受体阻滞剂', '糖皮质激素']
  },
  {
    drug: '阿卡波糖',
    interactions: ['消化酶制剂', '氢氧化铝', '新霉素', '考来烯胺']
  },
  {
    drug: '格列齐特',
    interactions: ['酒精', '华法林', '磺胺类', 'β受体阻滞剂', '氟康唑']
  },
  {
    drug: '瑞格列奈',
    interactions: ['吉非罗齐', '酮康唑', '利福平', '糖皮质激素']
  },
  {
    drug: '西格列汀',
    interactions: ['地高辛', '环孢素', '酮康唑']
  },
  {
    drug: '沙格列汀',
    interactions: ['酮康唑', '地尔硫卓', '维拉帕米']
  },
  {
    drug: '达格列净',
    interactions: ['利尿剂', '胰岛素', '磺脲类']
  },
  {
    drug: '恩格列净',
    interactions: ['利尿剂', '胰岛素', '磺脲类']
  },
  {
    drug: '利拉鲁肽',
    interactions: ['华法林', '阿司匹林', '对乙酰氨基酚']
  },

  // ===== 降脂药 (8 种) =====
  {
    drug: '阿托伐他汀',
    interactions: ['吉非罗齐', '烟酸', '红霉素', '环孢素', '酮康唑', '葡萄柚']
  },
  {
    drug: '瑞舒伐他汀',
    interactions: ['吉非罗齐', '烟酸', '环孢素', '氢氧化铝']
  },
  {
    drug: '辛伐他汀',
    interactions: ['吉非罗齐', '红霉素', '酮康唑', '环孢素', '葡萄柚', '氨氯地平']
  },
  {
    drug: '普伐他汀',
    interactions: ['吉非罗齐', '烟酸', '红霉素', '环孢素']
  },
  {
    drug: '非诺贝特',
    interactions: ['华法林', '辛伐他汀', '阿托伐他汀', '环孢素']
  },
  {
    drug: '依折麦布',
    interactions: ['环孢素', '考来烯胺', '非诺贝特']
  },
  {
    drug: '普罗布考',
    interactions: ['华法林', '环孢素', '普罗布考']
  },
  {
    drug: '血脂康',
    interactions: ['他汀类', '吉非罗齐', '烟酸', '环孢素']
  },

  // ===== 心血管药 (5 种) =====
  {
    drug: '阿司匹林',
    interactions: ['华法林', '布洛芬', '肝素', 'ACEI 类', '硝酸甘油', '糖皮质激素']
  },
  {
    drug: '氯吡格雷',
    interactions: ['奥美拉唑', '华法林', '阿司匹林', 'NSAIDs', '氟西汀']
  },
  {
    drug: '华法林',
    interactions: ['阿司匹林', '布洛芬', '维生素 K', '酒精', '头孢类', '氟康唑']
  },
  {
    drug: '单硝酸异山梨酯',
    interactions: ['西地那非', '他达拉非', '酒精', '降压药']
  },
  {
    drug: '硝酸甘油',
    interactions: ['西地那非', '他达拉非', '酒精', '阿司匹林']
  },

  // ===== 胃药 (5 种) =====
  {
    drug: '奥美拉唑',
    interactions: ['氯吡格雷', '华法林', '地高辛', '铁剂', '维生素 B12']
  },
  {
    drug: '雷贝拉唑',
    interactions: ['地高辛', '铁剂', '酮康唑', '氨苄西林']
  },
  {
    drug: '泮托拉唑',
    interactions: ['氯吡格雷', '地高辛', '铁剂', '酮康唑']
  },
  {
    drug: '兰索拉唑',
    interactions: ['地高辛', '铁剂', '酮康唑', '氨苄西林']
  },
  {
    drug: '铝碳酸镁',
    interactions: ['四环素', '铁剂', '地高辛', '华法林', '喹诺酮类']
  },

  // ===== 止咳药 (4 种) =====
  {
    drug: '氨溴索',
    interactions: ['抗生素', '镇咳药', '阿托品']
  },
  {
    drug: '溴己新',
    interactions: ['抗生素', '镇咳药']
  },
  {
    drug: '右美沙芬',
    interactions: ['MAOIs', 'SSRIs', '酒精', '镇静催眠药']
  },
  {
    drug: '喷托维林',
    interactions: ['单胺氧化酶抑制剂', '酒精', '镇静催眠药']
  },

  // ===== 止痛药 (4 种) =====
  {
    drug: '布洛芬',
    interactions: ['阿司匹林', '华法林', 'ACEI 类', '锂盐', '甲氨蝶呤', '酒精']
  },
  {
    drug: '对乙酰氨基酚',
    interactions: ['华法林', '酒精', '异烟肼', '卡马西平']
  },
  {
    drug: '双氯芬酸',
    interactions: ['阿司匹林', '华法林', 'ACEI 类', '锂盐', '环孢素']
  },
  {
    drug: '塞来昔布',
    interactions: ['华法林', '阿司匹林', '氟康唑', '锂盐', 'ACEI 类']
  },

  // ===== 维生素/钙片 (4 种) =====
  {
    drug: '复合维生素',
    interactions: ['华法林', '左甲状腺素', '四环素', '喹诺酮类']
  },
  {
    drug: '碳酸钙',
    interactions: ['左甲状腺素', '四环素', '喹诺酮类', '铁剂', '地高辛']
  },
  {
    drug: '维生素 B1',
    interactions: ['氟尿嘧啶', '左旋多巴']
  },
  {
    drug: '甲钴胺',
    interactions: ['二甲双胍', '质子泵抑制剂', '酒精']
  }
]

// 常见相互作用类型说明
export const INTERACTION_TYPES = {
  '增加出血风险': ['阿司匹林', '华法林', '布洛芬', '氯吡格雷', '肝素'],
  '增加低血糖风险': ['二甲双胍', '格列美脲', '格列齐特', '胰岛素', '酒精'],
  '影响药物吸收': ['铝碳酸镁', '碳酸钙', '奥美拉唑', '考来烯胺'],
  '增加肝肾毒性': ['他汀类', '吉非罗齐', '环孢素', '酮康唑', '红霉素'],
  '增加降压效果': ['ACEI 类', 'ARB 类', '利尿剂', 'β受体阻滞剂', '酒精'],
  '降低药效': ['质子泵抑制剂', '抗生素', '维生素 K']
}

/**
 * 获取药品的相互作用列表
 * @param drugName 药品名称
 */
export function getDrugInteractions(drugName: string): string[] {
  const interaction = DRUG_INTERACTIONS.find(d => d.drug === drugName || d.drug.includes(drugName) || drugName.includes(d.drug))
  return interaction?.interactions || []
}

/**
 * 检查两种药物是否存在相互作用
 * @param drug1 药物 1
 * @param drug2 药物 2
 */
export function hasInteraction(drug1: string, drug2: string): boolean {
  const interactions1 = getDrugInteractions(drug1)
  const interactions2 = getDrugInteractions(drug2)

  // 检查 drug1 的相互作用是否包含 drug2
  if (interactions1.some(int => drug2.includes(int) || int.includes(drug2))) {
    return true
  }

  // 检查 drug2 的相互作用是否包含 drug1
  if (interactions2.some(int => drug1.includes(int) || int.includes(drug1))) {
    return true
  }

  return false
}

/**
 * 检查多种药物之间的相互作用
 * @param drugs 药物名称数组
 * @returns 相互作用的药物对列表
 */
export function checkDrugInteractions(drugs: string[]): { drug1: string; drug2: string; description: string }[] {
  const foundInteractions: { drug1: string; drug2: string; description: string }[] = []
  const checkedPairs = new Set<string>()

  for (let i = 0; i < drugs.length; i++) {
    for (let j = i + 1; j < drugs.length; j++) {
      const pairKey = [drugs[i], drugs[j]].sort().join('+')
      if (checkedPairs.has(pairKey)) continue

      if (hasInteraction(drugs[i], drugs[j])) {
        foundInteractions.push({
          drug1: drugs[i],
          drug2: drugs[j],
          description: getInteractionDescription(drugs[i], drugs[j])
        })
      }

      checkedPairs.add(pairKey)
    }
  }

  return foundInteractions
}

/**
 * 获取相互作用的描述信息
 */
function getInteractionDescription(drug1: string, drug2: string): string {
  // 检查是否属于已知的相互作用类型
  for (const [type, drugs] of Object.entries(INTERACTION_TYPES)) {
    if (drugs.some(d => drug1.includes(d) || drug2.includes(d))) {
      const relatedDrugs = drugs.filter(d => drug1.includes(d) || drug2.includes(d))
      if (relatedDrugs.length >= 2) {
        return `${type}：${relatedDrugs.join(' + ')}`
      }
    }
  }

  return '可能存在药物相互作用，建议咨询医师或药师'
}

/**
 * 获取药品的禁忌症
 */
export function getContraindications(drugName: string): string[] {
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
