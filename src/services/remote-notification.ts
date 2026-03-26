import { supabase } from '@/services/supabase'
import { playReminderSound, vibrate } from './reminder'

let pollTimer: number | null = null
let currentUserId: string | null = null
let lastCheckTime: Date | null = null

/**
 * 启动远程通知轮询监听
 * @param userId 当前用户 ID
 */
export function startRemoteNotificationListener(userId: string) {
  if (pollTimer) {
    console.warn('[RemoteNotification] 轮询已存在，先停止')
    stopRemoteNotificationListener()
  }

  currentUserId = userId
  lastCheckTime = new Date()

  console.log('[RemoteNotification] 开始轮询监听用户:', userId)

  // 每 3 秒轮询一次
  pollTimer = setInterval(() => {
    checkNewNotifications(userId)
  }, 3000) as unknown as number

  console.log('[RemoteNotification] 轮询已启动')
}

/**
 * 停止远程通知轮询
 */
export function stopRemoteNotificationListener() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
    console.log('[RemoteNotification] 轮询已停止')
  }
}

/**
 * 检查新通知
 */
async function checkNewNotifications(userId: string) {
  try {
    const { data, error } = await supabase
      .from('remote_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('[RemoteNotification] 查询失败:', error)
      return
    }

    if (data && data.length > 0) {
      const notif = data[0]
      console.log('[RemoteNotification] 收到远程通知:', notif)

      // 显示系统通知作为调试
      uni.showModal({
        title: '收到远程通知',
        content: `类型：${JSON.stringify(notif.notification_type)}\n消息：${notif.message}`,
        showCancel: false
      })

      // 根据类型触发提醒
      const types = Array.isArray(notif.notification_type)
        ? notif.notification_type
        : [notif.notification_type]

      for (const type of types) {
        switch (type) {
          case 'sound':
            playSoundAlert()
            break
          case 'vibration':
            playVibrationAlert()
            break
          case 'banner':
            showBannerAlert(notif.message)
            break
          case 'system':
            showSystemAlert(notif.title, notif.message)
            break
        }
      }

      // 标记为已送达
      await markAsDelivered(notif.id)
    }
  } catch (error) {
    console.error('[RemoteNotification] 检查通知失败:', error)
  }
}

/**
 * 标记通知为已送达
 */
async function markAsDelivered(notificationId: string) {
  try {
    await supabase
      .from('remote_notifications')
      .update({ status: 'delivered' })
      .eq('id', notificationId)
    console.log('[RemoteNotification] 通知已标记为已送达:', notificationId)
  } catch (error) {
    console.error('[RemoteNotification] 更新状态失败:', error)
  }
}

/**
 * 播放声音提醒（循环 3 次）
 */
async function playSoundAlert() {
  for (let i = 0; i < 3; i++) {
    playReminderSound()
    await new Promise(resolve => setTimeout(resolve, 500))
  }
}

/**
 * 播放震动提醒（连续 3 次）
 */
async function playVibrationAlert() {
  for (let i = 0; i < 3; i++) {
    vibrate()
    await new Promise(resolve => setTimeout(resolve, 300))
  }
}

/**
 * 显示横幅提醒
 */
function showBannerAlert(message: string) {
  uni.showToast({
    title: message,
    icon: 'none',
    duration: 3000
  })
}

/**
 * 显示系统通知
 */
function showSystemAlert(title: string | null, message: string) {
  // #ifdef APP-PLUS
  const UE = uni.requireNativePlugin('UENotification')
  if (UE) {
    UE.showLocalNotification({
      title: title || '远程通知',
      content: message,
      payload: '',
      trigger: {
        type: 'once'
      }
    })
  }
  // #endif

  // H5 降级
  // #ifdef H5
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title || '远程通知', {
      body: message,
      icon: '/static/logo.png'
    })
  }
  // #endif
}
