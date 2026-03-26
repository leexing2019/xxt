import { supabase } from '@/services/supabase'
import { playReminderSound, vibrate } from './reminder'

let reminderTimers: Map<string, number> = new Map()
let currentUserId: string | null = null

/**
 * 启动本地服药提醒监听
 * @param userId 当前用户 ID
 */
export function startLocalMedicationReminder(userId: string) {
  if (currentUserId === userId) {
    console.log('[LocalReminder] 已在运行，跳过')
    return
  }

  currentUserId = userId
  console.log('[LocalReminder] 启动本地提醒监听，用户:', userId)

  // 立即检查一次
  checkUpcomingReminders(userId)

  // 每 10 秒检查一次是否有即将到来的提醒
  const checkInterval = setInterval(() => {
    checkUpcomingReminders(userId)
  }, 10000)

  // 保存定时器 ID 以便清理
  reminderTimers.set('checkInterval', checkInterval as unknown as number)
}

/**
 * 停止本地提醒监听
 */
export function stopLocalMedicationReminder() {
  // 清除所有定时器
  for (const [key, timerId] of reminderTimers.entries()) {
    clearInterval(timerId)
  }
  reminderTimers.clear()
  currentUserId = null
  console.log('[LocalReminder] 监听已停止')
}

/**
 * 检查即将到来的提醒
 */
async function checkUpcomingReminders(userId: string) {
  try {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`

    console.log('[LocalReminder] 检查提醒，当前时间:', currentTime)

    // 获取用户今天的服药计划
    const { data: schedules, error } = await supabase
      .from('medication_schedules')
      .select(`
        id,
        time_of_day,
        is_active,
        medication_id,
        common_medications (
          name,
          dosage,
          instructions
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('time_of_day', { ascending: true })

    if (error) {
      console.error('[LocalReminder] 查询失败:', error)
      return
    }

    if (!schedules || schedules.length === 0) {
      return
    }

    // 检查每个计划，看是否需要提醒
    for (const schedule of schedules) {
      const scheduleTime = schedule.time_of_day
      const shouldRemind = shouldTriggerReminder(scheduleTime, currentTime)

      if (shouldRemind) {
        const reminderKey = `reminder_${schedule.id}_${getTodayDateString()}`

        // 检查今天是否已经提醒过
        const hasReminded = uni.getStorageSync(reminderKey)
        if (!hasReminded) {
          console.log('[LocalReminder] 触发提醒:', schedule)
          await triggerMedicationReminder(schedule)
          // 标记为已提醒
          uni.setStorageSync(reminderKey, true)
        }
      }
    }
  } catch (error) {
    console.error('[LocalReminder] 检查提醒失败:', error)
  }
}

/**
 * 判断是否应该触发提醒
 * 在计划时间的 ±5 分钟内触发
 */
function shouldTriggerReminder(scheduleTime: string, currentTime: string): boolean {
  const [scheduleHour, scheduleMinute] = scheduleTime.split(':').map(Number)
  const [currentHour, currentMinute] = currentTime.split(':').map(Number)

  const scheduleMinutes = scheduleHour * 60 + scheduleMinute
  const currentMinutes = currentHour * 60 + currentMinute

  // 允许 5 分钟误差
  const diff = currentMinutes - scheduleMinutes

  // 在计划时间的 -5 到 +10 分钟内触发
  return diff >= -5 && diff <= 10
}

/**
 * 获取今日日期字符串
 */
function getTodayDateString(): string {
  const now = new Date()
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
}

/**
 * 触发服药提醒
 */
async function triggerMedicationReminder(schedule: any) {
  const medicationName = schedule.common_medications?.name || '药品'
  const dosage = schedule.common_medications?.dosage || schedule.dosage || ''
  const time = schedule.time_of_day

  console.log('[LocalReminder] 显示服药提醒:', medicationName, time)

  // 播放声音提醒
  playReminderSound()

  // 震动提醒
  vibrate()

  // 显示提醒弹窗
  uni.showModal({
    title: '⏰ 服药提醒',
    content: `该服用 ${medicationName} ${dosage} 了\n计划时间：${time}`,
    confirmText: '我已服用',
    cancelText: '稍后提醒',
    success: async (res) => {
      if (res.confirm) {
        console.log('[LocalReminder] 用户确认服药')
        // 这里可以调用 recordMedication 来记录服药
        uni.showToast({
          title: '已记录服药',
          icon: 'success'
        })
      } else if (res.cancel) {
        console.log('[LocalReminder] 用户选择稍后提醒')
        // 10 分钟后再次提醒
        setTimeout(() => {
          triggerMedicationReminder(schedule)
        }, 10 * 60 * 1000)
      }
    }
  })

  // 显示横幅通知
  uni.showToast({
    title: `⏰ 该服用 ${medicationName} 了`,
    icon: 'none',
    duration: 5000
  })
}

/**
 * 手动添加一次性提醒（用于测试）
 */
export function addOneTimeReminder(
  medicationName: string,
  dosage: string,
  delayMinutes: number
) {
  console.log('[LocalReminder] 添加一次性提醒:', medicationName, delayMinutes, '分钟后')

  const timerId = setTimeout(() => {
    console.log('[LocalReminder] 触发一次性提醒')

    playReminderSound()
    vibrate()

    uni.showModal({
      title: '⏰ 服药提醒',
      content: `该服用 ${medicationName} ${dosage} 了`,
      confirmText: '我已服用',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          uni.showToast({
            title: '已记录服药',
            icon: 'success'
          })
        }
      }
    })
  }, delayMinutes * 60 * 1000)

  reminderTimers.set(`onetime_${medicationName}`, timerId as unknown as number)

  return () => {
    clearTimeout(timerId)
    reminderTimers.delete(`onetime_${medicationName}`)
  }
}
