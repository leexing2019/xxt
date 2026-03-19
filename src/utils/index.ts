/**
 * AI用药助手 - 工具函数
 */

/**
 * 格式化日期
 * @param date 日期对象或日期字符串
 * @param format 格式化字符串
 */
export function formatDate(date: Date | string, format: string = 'YYYY-MM-DD'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化时间（只显示时分）
 * @param time 时间字符串 (HH:mm)
 */
export function formatTime(time: string): string {
  return time.substring(0, 5)
}

/**
 * 获取今日日期字符串
 */
export function getToday(): string {
  return formatDate(new Date(), 'YYYY-MM-DD')
}

/**
 * 获取星期几
 * @param dateNum 1-7 (周一到周日)
 */
export function getWeekdayName(dateNum: number): string {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekdays[dateNum - 1] || ''
}

/**
 * 验证手机号
 */
export function validatePhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

/**
 * 验证验证码
 */
export function validateCode(code: string): boolean {
  return /^\d{6}$/.test(code)
}

/**
 * 计算时间差（分钟）
 */
export function timeDiff(time1: string, time2: string): number {
  const [h1, m1] = time1.split(':').map(Number)
  const [h2, m2] = time2.split(':').map(Number)
  return (h1 * 60 + m1) - (h2 * 60 + m2)
}

/**
 * 获取最近的提醒时间
 */
export function getNextReminderTime(times: string[]): string | null {
  if (!times || times.length === 0) return null
  
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  
  const sortedTimes = [...times].sort()
  
  for (const time of sortedTimes) {
    const [h, m] = time.split(':').map(Number)
    const timeMinutes = h * 60 + m
    
    if (timeMinutes > currentMinutes) {
      return time
    }
  }
  
  // 如果没有找到，说明今天的已过，返回明天第一个
  return sortedTimes[0]
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  
  return function (this: any, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    
    timeout = setTimeout(() => {
      func.apply(this, args)
    }, wait)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0
  
  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now()
    
    if (now - lastTime >= wait) {
      lastTime = now
      func.apply(this, args)
    }
  }
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

/**
 * 深拷贝
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T
  }
  
  const cloned: any = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  return cloned
}

/**
 * 存储到本地
 */
export function setStorage(key: string, value: any): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const data = typeof value === 'string' ? value : JSON.stringify(value)
      uni.setStorageSync(key, data)
      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * 从本地获取
 */
export function getStorage<T>(key: string, defaultValue?: T): T | null {
  try {
    const data = uni.getStorageSync(key)
    if (!data) return defaultValue || null
    
    // 尝试解析JSON
    try {
      return JSON.parse(data) as T
    } catch {
      return data as unknown as T
    }
  } catch {
    return defaultValue || null
  }
}

/**
 * 删除本地存储
 */
export function removeStorage(key: string): void {
  uni.removeStorageSync(key)
}

/**
 * 显示加载提示
 */
export function showLoading(title: string = '加载中...'): void {
  uni.showLoading({
    title,
    mask: true
  })
}

/**
 * 隐藏加载提示
 */
export function hideLoading(): void {
  uni.hideLoading()
}

/**
 * 显示成功提示
 */
export function showSuccess(title: string = '成功'): void {
  uni.showToast({
    title,
    icon: 'success',
    duration: 2000
  })
}

/**
 * 显示错误提示
 */
export function showError(title: string = '错误'): void {
  uni.showToast({
    title,
    icon: 'none',
    duration: 2000
  })
}

/**
 * 获取相对时间描述
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}
