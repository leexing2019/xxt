import { supabase } from '@/services/supabase'
import { playReminderSound, vibrate } from './reminder'

let reminderTimers: Map<string, number> = new Map()
let currentUserId: string | null = null
let scheduledPushNotifications: Map<string, any> = new Map()
let lastCheckedNotificationId: string | null = null

/**
 * 请求通知权限
 */
export async function requestNotificationPermission(): Promise<boolean> {
  // #ifdef APP-PLUS
  try {
    const plusObj = plus as any
    console.log('[Permission] plus 对象:', !!plusObj)
    console.log('[Permission] plus.push 对象:', !!plusObj?.push)

    if (plusObj.push) {
      console.log('[Permission] plus.push.createMessage:', typeof plusObj.push.createMessage)

      // 测试推送是否可用
      try {
        plusObj.push.createMessage(
          '测试消息',
          '权限请求',
          {
            cover: true,
            sound: 'system'
          },
          () => console.log('[Permission] 测试推送成功'),
          (error: any) => console.error('[Permission] 测试推送失败:', error)
        )
        console.log('[Permission] 测试推送已发送')
        return true
      } catch (e) {
        console.error('[Permission] createMessage 异常:', e)
      }
    }
  } catch (error) {
    console.error('[Permission] 请求通知权限失败:', error)
  }
  // #endif

  // #ifdef H5
  if ('Notification' in window) {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  // #endif

  return true
}

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

  // 先请求通知权限
  requestNotificationPermission()

  // 立即检查并设置提醒
  setupMedicationReminders(userId)

  // 每 5 秒检查一次是否有新的服药计划
  const checkInterval = setInterval(() => {
    setupMedicationReminders(userId)
    checkRemoteNotifications(userId)
  }, 5000)

  // 立即检查一次远程通知
  checkRemoteNotifications(userId)

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

  // 清除所有已调度的推送通知
  for (const [taskId, task] of scheduledPushNotifications.entries()) {
    clearPushNotification(taskId)
  }
  scheduledPushNotifications.clear()

  currentUserId = null
  lastCheckedNotificationId = null
  console.log('[LocalReminder] 监听已停止')
}

/**
 * 检查远程通知
 */
async function checkRemoteNotifications(userId: string) {
  try {
    const { data, error } = await supabase
      .from('remote_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)

    if (error) {
      console.error('[RemoteNotification] 查询失败:', error)
      return
    }

    if (!data || data.length === 0) {
      return
    }

    const notification = data[0]

    // 防止重复处理
    if (lastCheckedNotificationId === notification.id) {
      return
    }
    lastCheckedNotificationId = notification.id

    console.log('[RemoteNotification] 收到远程通知:', notification)

    // 触发提醒
    triggerImmediateReminder({
      id: notification.id,
      time_of_day: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      common_medications: {
        name: notification.message || '药品',
        dosage_unit: ''
      },
      dosage: ''
    })

    // 标记为已发送
    await supabase
      .from('remote_notifications')
      .update({ status: 'sent' })
      .eq('id', notification.id)
  } catch (error) {
    console.error('[RemoteNotification] 检查失败:', error)
  }
}

/**
 * 设置服药提醒
 */
async function setupMedicationReminders(userId: string) {
  try {
    const now = new Date()
    const today = getTodayDateString()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    console.log('[LocalReminder] 设置提醒，当前时间:', `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)

    // 获取用户的服药计划
    const { data: schedules, error } = await supabase
      .from('medication_schedules')
      .select('*, common_medications(id, name, dosage_unit)')
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

    // 为每个计划设置提醒
    for (const schedule of schedules) {
      const [hour, minute] = schedule.time_of_day.split(':').map(Number)
      const scheduleMinutes = hour * 60 + minute
      const reminderKey = `reminder_${schedule.id}_${today}`

      // 检查今天是否已经提醒过
      const hasReminded = uni.getStorageSync(reminderKey)
      if (hasReminded) {
        continue
      }

      // 计算距离提醒时间的分钟差
      let diffMinutes = scheduleMinutes - currentMinutes

      // 如果时间已过，计算明天的时间
      if (diffMinutes < 0) {
        diffMinutes += 24 * 60
      }

      // 如果提醒时间在 5 分钟到 24 小时内，设置推送通知
      if (diffMinutes >= 0 && diffMinutes < 24 * 60) {
        const reminderTime = new Date()
        reminderTime.setHours(hour, minute, 0, 0)

        // 如果提醒时间已过，设置为明天
        if (reminderTime.getTime() < now.getTime()) {
          reminderTime.setDate(reminderTime.getDate() + 1)
        }

        // 设置提前 5 分钟提醒
        const notifyTime = new Date(reminderTime.getTime() - 5 * 60 * 1000)

        // 如果提前提醒的时间还没过，就设置提醒
        if (notifyTime.getTime() > now.getTime()) {
          const dosageUnit = schedule.common_medications?.dosage_unit || ''
          const dosage = schedule.dosage || ''
          let dosageDesc = ''
          if (dosage && dosageUnit) {
            dosageDesc = ` ${dosage}${dosageUnit}`
          } else if (dosage) {
            dosageDesc = ` ${dosage}`
          }

          schedulePushNotification(
            schedule.id.toString(),
            {
              title: '⏰ 服药提醒',
              content: `该服用 ${schedule.common_medications?.name || '药品'}${dosageDesc} 了`,
              time: schedule.time_of_day,
              scheduleId: schedule.id
            },
            notifyTime
          )
          console.log('[LocalReminder] 设置提醒:', schedule.time_of_day, '提前 5 分钟通知')
        }
      }
    }
  } catch (error) {
    console.error('[LocalReminder] 设置提醒失败:', error)
  }
}

/**
 * 调度本地推送通知
 */
function schedulePushNotification(taskId: string, options: {
  title: string
  content: string
  time?: string
  scheduleId?: number
}, notifyTime: Date) {
  // #ifdef APP-PLUS
  const plusObj = plus as any

  // 清除旧的提醒
  if (scheduledPushNotifications.has(taskId)) {
    clearPushNotification(taskId)
  }

  const delay = notifyTime.getTime() - Date.now()
  console.log('[LocalReminder] 调度推送，延迟:', Math.round(delay / 1000), '秒')

  // 检查 plus.push 是否可用
  if (!plusObj || !plusObj.push || !plusObj.push.createMessage) {
    console.warn('[LocalReminder] plus.push.createMessage 不可用，使用 setTimeout 降级方案')
    // 降级方案：使用 setTimeout 定时触发
    const timeoutId = setTimeout(() => {
      console.log('[LocalReminder] 定时器触发提醒')
      triggerImmediateReminder({
        id: options.scheduleId,
        time_of_day: options.time,
        common_medications: { name: options.content.replace('该服用', '').replace(' 了', '') }
      })
    }, delay)
    scheduledPushNotifications.set(taskId, { timeoutId, type: 'fallback' })
    return
  }

  // 创建推送消息
  try {
    const pushMsg = plusObj.push.createMessage(
      options.content,
      options.title,
      {
        cover: true,
        sound: 'system',
        when: notifyTime,
        data: {
          scheduleId: options.scheduleId,
          time: options.time
        }
      },
      (result: any) => {
        console.log('[LocalReminder] 用户点击了通知')
        // 点击通知后打开 App
        plusObj.runtime.launchInfo()
      },
      (error: any) => {
        console.error('[LocalReminder] 推送失败:', error)
      }
    )

    scheduledPushNotifications.set(taskId, pushMsg)
    console.log('[LocalReminder] 推送消息创建成功')
  } catch (error) {
    console.error('[LocalReminder] createMessage 异常:', error)
    // 降级方案
    const timeoutId = setTimeout(() => {
      triggerImmediateReminder({
        id: options.scheduleId,
        time_of_day: options.time,
        common_medications: { name: options.content.replace('该服用', '').replace(' 了', '') }
      })
    }, delay)
    scheduledPushNotifications.set(taskId, { timeoutId, type: 'fallback' })
  }
  // #endif

  // #ifdef H5
  if ('Notification' in window && Notification.permission === 'granted') {
    const timeoutId = setTimeout(() => {
      new Notification(options.title, {
        body: options.content,
        icon: '/static/logo.png',
        tag: `reminder_${taskId}`,
        requireInteraction: true
      })
      playReminderSound()
    }, notifyTime.getTime() - Date.now())

    scheduledPushNotifications.set(taskId, { timeoutId })
  }
  // #endif
}

/**
 * 清除推送通知
 */
function clearPushNotification(taskId: string) {
  // #ifdef APP-PLUS
  const task = scheduledPushNotifications.get(taskId)
  if (task) {
    const plusObj = plus as any
    plusObj.push.clearMessage(task)
  }
  // #endif

  // #ifdef H5
  const task = scheduledPushNotifications.get(taskId)
  if (task && task.timeoutId) {
    clearTimeout(task.timeoutId)
  }
  // #endif

  scheduledPushNotifications.delete(taskId)
}

/**
 * 获取今日日期字符串
 */
function getTodayDateString(): string {
  const now = new Date()
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
}

/**
 * 立即触发服药提醒（用于测试或准点提醒）
 */
export async function triggerImmediateReminder(schedule: any) {
  const medicationName = schedule.common_medications?.name || '药品'
  const dosageUnit = schedule.common_medications?.dosage_unit || ''
  const dosage = schedule.dosage || ''
  const time = schedule.time_of_day
  const today = getTodayDateString()

  // 构建剂量描述
  let dosageDesc = ''
  if (dosage && dosageUnit) {
    dosageDesc = `${dosage}${dosageUnit}`
  } else if (dosage) {
    dosageDesc = dosage
  } else if (dosageUnit) {
    dosageDesc = dosageUnit
  }

  console.log('[LocalReminder] 触发提醒:', medicationName, dosageDesc, time)

  // 播放声音提醒
  playReminderSound()

  // 震动提醒
  vibrate()

  // 显示推送通知
  // #ifdef APP-PLUS
  const plusObj = plus as any
  plusObj.push.createMessage(
    `该服用 ${medicationName} ${dosageDesc}了`,
    '⏰ 服药提醒',
    {
      cover: true,
      sound: 'system',
      data: {
        scheduleId: schedule.id,
        time: time
      }
    },
    (result: any) => {
      console.log('[LocalReminder] 用户点击了提醒通知')
      // 点击后记录服药
      recordMedication(schedule.id, today)
    }
  )
  // #endif

  // #ifdef H5
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('⏰ 服药提醒', {
      body: `该服用 ${medicationName} ${dosageDesc}了`,
      icon: '/static/logo.png',
      requireInteraction: true,
      tag: `immediate_${schedule.id}`
    })
  }
  // #endif

  // 显示弹窗
  uni.showModal({
    title: '⏰ 服药提醒',
    content: `该服用 ${medicationName} ${dosageDesc}了\n计划时间：${time}`,
    confirmText: '我已服用',
    cancelText: '稍后提醒',
    success: async (res) => {
      if (res.confirm) {
        console.log('[LocalReminder] 用户确认服药')
        recordMedication(schedule.id, today)
        uni.showToast({
          title: '已记录服药',
          icon: 'success'
        })
      } else if (res.cancel) {
        console.log('[LocalReminder] 用户选择稍后提醒')
        // 10 分钟后再次提醒
        setTimeout(() => {
          triggerImmediateReminder(schedule)
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
 * 记录服药
 */
async function recordMedication(scheduleId: number, date: string) {
  try {
    // 标记今天已提醒
    uni.setStorageSync(`reminder_${scheduleId}_${date}`, true)

    // TODO: 调用后端 API 记录服药日志
    console.log('[LocalReminder] 记录服药:', scheduleId, date)
  } catch (error) {
    console.error('[LocalReminder] 记录服药失败:', error)
  }
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

  const notifyTime = new Date(Date.now() + delayMinutes * 60 * 1000)

  schedulePushNotification(
    `onetime_${medicationName}`,
    {
      title: '⏰ 服药提醒',
      content: `该服用 ${medicationName} ${dosage} 了`
    },
    notifyTime
  )

  return () => {
    clearPushNotification(`onetime_${medicationName}`)
  }
}
