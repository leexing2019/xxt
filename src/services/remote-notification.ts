import { supabase } from './supabase'
import { playReminderSound, vibrate } from './reminder'

let notificationChannel: any = null
let currentUserId: string | null = null

/**
 * 启动远程通知监听
 * @param userId 当前用户 ID
 */
export function startRemoteNotificationListener(userId: string) {
  if (notificationChannel) {
    console.warn('[RemoteNotification] 监听已存在，先停止')
    stopRemoteNotificationListener()
  }

  currentUserId = userId

  notificationChannel = supabase
    .channel('remote-notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'remote_notifications',
        filter: `user_id=eq.${userId}`
      },
      async (payload: any) => {
        const notif = payload.new
        console.log('[RemoteNotification] 收到远程通知:', notif)

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
        try {
          await supabase
            .from('remote_notifications')
            .update({ status: 'delivered' })
            .eq('id', notif.id)
        } catch (error) {
          console.error('[RemoteNotification] 更新状态失败:', error)
        }
      }
    )
    .subscribe()

  console.log('[RemoteNotification] 监听已启动')
}

/**
 * 停止远程通知监听
 */
export function stopRemoteNotificationListener() {
  if (notificationChannel) {
    supabase.removeChannel(notificationChannel)
    notificationChannel = null
    console.log('[RemoteNotification] 监听已停止')
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
