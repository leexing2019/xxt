/**
 * 药品图标生成工具
 * 根据药品剂型和颜色生成 SVG 图标
 */

// 剂型类型（简化为三种）
export type MedicationForm =
  | 'liquid'      // 口服液
  | 'capsule'     // 胶囊
  | 'tablet'      // 药片

// 颜色关键词映射
const COLOR_KEYWORDS: Record<string, string> = {
  // 白色系
  '白': '#FFFFFF',
  '白色': '#FFFFFF',
  '类白': '#F5F5F5',

  // 黄色系
  '黄': '#FFEB3B',
  '黄色': '#FFEB3B',
  '淡黄': '#FFF176',
  '深黄': '#FDD835',

  // 橙色系
  '橙': '#FF9800',
  '橙色': '#FF9800',
  '淡橙': '#FFB74D',

  // 粉/红色系
  '粉': '#F48FB1',
  '粉色': '#F48FB1',
  '淡粉': '#F8BBD0',
  '红': '#F44336',
  '红色': '#F44336',
  '淡红': '#EF9A9A',
  '紫红': '#BA68C8',

  // 蓝色系
  '蓝': '#2196F3',
  '蓝色': '#2196F3',
  '淡蓝': '#64B5F6',
  '深 blue': '#1976D2',

  // 绿色系
  '绿': '#4CAF50',
  '绿色': '#4CAF50',
  '淡绿': '#81C784',

  // 紫色系
  '紫': '#9C27B0',
  '紫色': '#9C27B0',
  '淡紫': '#BA68C8',

  // 其他
  '透明': '#E0E0E0',
  '无色': '#F5F5F5',
  '黑': '#424242',
  '黑色': '#424242',
  '灰': '#9E9E9E',
  '灰色': '#9E9E9E'
}


/**
 * 从外观描述中提取颜色
 */
export function extractColorFromDescription(description: string): string | null {
  if (!description) return null

  // 按优先级排序（长的关键词优先匹配）
  const keywords = Object.keys(COLOR_KEYWORDS).sort((a, b) => b.length - a.length)

  for (const keyword of keywords) {
    if (description.includes(keyword)) {
      return COLOR_KEYWORDS[keyword]
    }
  }

  return null
}

/**
 * 根据药品名称生成固定的哈希颜色
 * 确保同一药品总是返回相同颜色
 */
export function hashNameToColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }

  // 使用预设的柔和色系，避免生成过于刺眼的颜色
  const softColors = [
    '#2196F3', // 蓝
    '#4CAF50', // 绿
    '#FF9800', // 橙
    '#E91E63', // 粉红
    '#9C27B0', // 紫
    '#00BCD4', // 青
    '#FF5722', // 深橙
    '#795548', // 棕
    '#607D8B', // 蓝灰
    '#3F51B5'  // 靛蓝
  ]

  const index = Math.abs(hash) % softColors.length
  return softColors[index]
}

/**
 * 获取药品的颜色
 * 优先级：外观描述提取 > 名称哈希生成
 */
export function getMedicationColor(
  name: string,
  appearanceDesc?: string
): string {
  // 1. 尝试从外观描述提取颜色
  if (appearanceDesc) {
    const extractedColor = extractColorFromDescription(appearanceDesc)
    if (extractedColor) {
      return extractedColor
    }
  }

  // 2. 使用名称哈希生成固定颜色
  return hashNameToColor(name)
}

/**
 * 从外观描述或剂型字段识别剂型
 */
export function identifyForm(
  form?: string,
  appearanceDesc?: string
): MedicationForm {
  // 如果有明确的 form 字段，尝试映射中文剂型
  if (form) {
    const formLower = form.toLowerCase()

    // 中文剂型映射
    if (formLower.includes('胶囊') || formLower === 'capsule') {
      return 'capsule'
    }
    if (formLower.includes('口服') || formLower.includes('液') || formLower.includes('药水') || formLower === 'liquid') {
      return 'liquid'
    }
    // 默认药片
    return 'tablet'
  }

  // 从外观描述推断
  if (appearanceDesc) {
    const desc = appearanceDesc.toLowerCase()

    if (desc.includes('胶囊')) {
      return 'capsule'
    }
    if (desc.includes('口服') || desc.includes('液') || desc.includes('药水')) {
      return 'liquid'
    }
  }

  // 默认为药片
  return 'tablet'
}

/**
 * 生成药品 SVG 图标
 */
export function generateMedicationIcon(
  name: string,
  options: {
    form?: MedicationForm
    appearanceDesc?: string
    size?: number
    className?: string
  } = {}
): string {
  const {
    form,
    appearanceDesc,
    size = 80,
    className = 'medication-icon-svg'
  } = options

  // 获取颜色和剂型
  const color = getMedicationColor(name, appearanceDesc)
  const medicationForm = identifyForm(form, appearanceDesc)

  // 获取药品名称首字
  const firstChar = name.charAt(0)

  // 生成 SVG 路径
  let shapePath = ''
  let textColor = '#FFFFFF'

  // 判断颜色深浅，决定文字颜色
  const luminance = getLuminance(color)
  if (luminance > 0.6) {
    textColor = '#333333'
  }

  switch (medicationForm) {
    case 'tablet-round':
      // 圆形片剂
      shapePath = `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${color}" stroke="${darkenColor(color, 20)}" stroke-width="2"/>`
      break

    case 'tablet-oval':
      // 椭圆形片剂
      shapePath = `<ellipse cx="${size / 2}" cy="${size / 2}" rx="${size / 2 - 2}" ry="${size / 3}" fill="${color}" stroke="${darkenColor(color, 20)}" stroke-width="2"/>`
      break

    case 'capsule':
      // 胶囊（双色效果）
      const lighterColor = lightenColor(color, 30)
      shapePath = `
        <defs>
          <clipPath id="capsule-clip-${name}">
            <rect x="4" y="${size / 2 - 12}" width="${size - 8}" height="24" rx="12"/>
          </clipPath>
        </defs>
        <rect x="4" y="${size / 2 - 12}" width="${size - 8}" height="24" rx="12" fill="${color}" stroke="${darkenColor(color, 20)}" stroke-width="2"/>
        <rect x="4" y="${size / 2 - 12}" width="${size / 2 - 4}" height="24" fill="${lighterColor}" clip-path="url(#capsule-clip-${name})"/>
      `
      break

    case 'injection':
      // 注射液瓶
      shapePath = `
        <rect x="${size / 2 - 8}" y="${size / 2 - 20}" width="16" height="32" rx="4" fill="${color}" stroke="${darkenColor(color, 20)}" stroke-width="2"/>
        <rect x="${size / 2 - 6}" y="${size / 2 - 18}" width="12" height="28" fill="${lightenColor(color, 40)}" opacity="0.6"/>
      `
      break

    default:
      // 其他 - 圆角矩形
      shapePath = `<rect x="4" y="4" width="${size - 8}" height="${size - 8}" rx="8" fill="${color}" stroke="${darkenColor(color, 20)}" stroke-width="2"/>`
  }

  // 添加首字
  const textElement = `<text x="${size / 2}" y="${size / 2 + 8}" text-anchor="middle" fill="${textColor}" font-size="${size / 3}" font-weight="bold" font-family="sans-serif">${firstChar}</text>`

  return `<svg class="${className}" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">${shapePath}${textElement}</svg>`
}

/**
 * 生成 Vue 组件使用的内联 SVG 对象
 */
export function generateMedicationIconSvg(
  name: string,
  options: {
    form?: MedicationForm
    appearanceDesc?: string
    size?: number
  } = {}
): {
  width: number
  height: number
  viewBox: string
  children: Array<{
    tag: string
    attrs: Record<string, string | number>
  }>
} {
  const {
    form,
    appearanceDesc,
    size = 80
  } = options

  const color = getMedicationColor(name, appearanceDesc)
  const medicationForm = identifyForm(form, appearanceDesc)
  const firstChar = name.charAt(0)

  const textColor = getLuminance(color) > 0.6 ? '#333333' : '#FFFFFF'
  const darkColor = darkenColor(color, 20)

  const children: Array<{
    tag: string
    attrs: Record<string, string | number>
  }> = []

  switch (medicationForm) {
    case 'tablet-round':
      children.push({
        tag: 'circle',
        attrs: {
          cx: size / 2,
          cy: size / 2,
          r: size / 2 - 2,
          fill: color,
          stroke: darkColor,
          'stroke-width': 2
        }
      })
      break

    case 'tablet-oval':
      children.push({
        tag: 'ellipse',
        attrs: {
          cx: size / 2,
          cy: size / 2,
          rx: size / 2 - 2,
          ry: size / 3,
          fill: color,
          stroke: darkColor,
          'stroke-width': 2
        }
      })
      break

    case 'capsule':
      const lighterColor = lightenColor(color, 30)
      children.push({
        tag: 'rect',
        attrs: {
          x: 4,
          y: size / 2 - 12,
          width: size - 8,
          height: 24,
          rx: 12,
          fill: color,
          stroke: darkColor,
          'stroke-width': 2
        }
      })
      children.push({
        tag: 'rect',
        attrs: {
          x: 4,
          y: size / 2 - 12,
          width: size / 2 - 4,
          height: 24,
          fill: lighterColor
        }
      })
      break

    case 'injection':
      children.push({
        tag: 'rect',
        attrs: {
          x: size / 2 - 8,
          y: size / 2 - 20,
          width: 16,
          height: 32,
          rx: 4,
          fill: color,
          stroke: darkColor,
          'stroke-width': 2
        }
      })
      children.push({
        tag: 'rect',
        attrs: {
          x: size / 2 - 6,
          y: size / 2 - 18,
          width: 12,
          height: 28,
          fill: lightenColor(color, 40),
          opacity: 0.6
        }
      })
      break

    default:
      children.push({
        tag: 'rect',
        attrs: {
          x: 4,
          y: 4,
          width: size - 8,
          height: size - 8,
          rx: 8,
          fill: color,
          stroke: darkColor,
          'stroke-width': 2
        }
      })
  }

  children.push({
    tag: 'text',
    attrs: {
      x: size / 2,
      y: size / 2 + 8,
      'text-anchor': 'middle',
      fill: textColor,
      'font-size': size / 3,
      'font-weight': 'bold',
      'font-family': 'sans-serif'
    },
    children: firstChar
  })

  return {
    width: size,
    height: size,
    viewBox: `0 0 ${size} ${size}`,
    children
  }
}

/**
 * 计算颜色亮度
 */
function getLuminance(hexColor: string): number {
  const r = parseInt(hexColor.slice(1, 3), 16) / 255
  const g = parseInt(hexColor.slice(3, 5), 16) / 255
  const b = parseInt(hexColor.slice(5, 7), 16) / 255

  return 0.299 * r + 0.587 * g + 0.114 * b
}

/**
 * 加深颜色
 */
function darkenColor(hexColor: string, percent: number): string {
  const num = parseInt(hexColor.slice(1), 16)
  const amt = Math.round(2.55 * percent)

  const R = Math.max((num >> 16) - amt, 0)
  const G = Math.max((num >> 8 & 0x00FF) - amt, 0)
  const B = Math.max((num & 0x0000FF) - amt, 0)

  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
}

/**
 * 变浅颜色
 */
function lightenColor(hexColor: string, percent: number): string {
  const num = parseInt(hexColor.slice(1), 16)
  const amt = Math.round(2.55 * percent)

  const R = Math.min((num >> 16) + amt, 255)
  const G = Math.min((num >> 8 & 0x00FF) + amt, 255)
  const B = Math.min((num & 0x0000FF) + amt, 255)

  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
}
