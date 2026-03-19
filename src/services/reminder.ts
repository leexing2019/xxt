// 用药提醒服务 - 本地通知管理
export interface ReminderData {
  id: string
  title: string
  content: string
  time: string
  medicationName: string
  dosage: string
  medicationId?: string
  scheduleId?: string
}

// 请求通知权限
export async function requestNotificationPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    // #ifdef APP-PLUS
    const UE = uni.requireNativePlugin('UENotification')
    if (UE) {
      UE.requestPermission((result: any) => {
        resolve(result.granted === true || result === true)
      })
    } else {
      resolve(true)
    }
    // #endif
    
    // #ifdef H5
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        resolve(true)
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          resolve(permission === 'granted')
        })
      } else {
        resolve(false)
      }
    } else {
      resolve(false)
    }
    // #endif
  })
}

// 显示本地通知
export function showLocalNotification(data: ReminderData): void {
  // #ifdef APP-PLUS
  const UE = uni.requireNativePlugin('UENotification')
  if (UE) {
    UE.showLocalNotification({
      title: data.title,
      content: data.content,
      payload: JSON.stringify(data),
      trigger: {
        type: 'time',
        time: data.time
      }
    })
  }
  // #endif
  
  // H5通知
  // #ifdef H5
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(data.title, {
      body: data.content,
      icon: '/static/logo.png',
      tag: data.id
    })
  }
  // #endif
}

// 立即显示通知
export function showImmediateNotification(title: string, content: string): void {
  // #ifdef APP-PLUS
  const UE = uni.requireNativePlugin('UENotification')
  if (UE) {
    UE.showLocalNotification({
      title,
      content,
      payload: '',
      trigger: {
        type: 'once'
      }
    })
  }
  // #endif
  
  // H5
  // #ifdef H5
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body: content,
      icon: '/static/logo.png'
    })
  } else {
    uni.showToast({ title, icon: 'none' })
  }
  // #endif
}

// 取消通知
export function cancelNotification(id: string): void {
  // #ifdef APP-PLUS
  const UE = uni.requireNativePlugin('UENotification')
  if (UE) {
    UE.cancelNotification({ id })
  }
  // #endif
}

// 取消所有通知
export function cancelAllNotifications(): void {
  // #ifdef APP-PLUS
  const UE = uni.requireNativePlugin('UENotification')
  if (UE) {
    UE.cancelAllNotifications()
  }
  // #endif
}

// 设置定时提醒
export function scheduleReminder(reminder: ReminderData): void {
  // 计算距离目标时间的时间差
  const now = new Date()
  const targetTime = new Date(reminder.time)
  const diff = targetTime.getTime() - now.getTime()
  
  if (diff <= 0) {
    console.log('提醒时间已过')
    return
  }
  
  // #ifdef APP-PLUS
  const UE = uni.requireNativePlugin('UENotification')
  if (UE) {
    UE.addNotification({
      id: reminder.id,
      title: reminder.title,
      content: reminder.content,
      payload: JSON.stringify(reminder),
      trigger: {
        type: 'time',
        time: diff / 1000 // 秒
      }
    })
  }
  // #endif
}

// 监听通知点击
export function onNotificationClick(callback: (data: ReminderData) => void): void {
  // #ifdef APP-PLUS
  const UE = uni.requireNativePlugin('UENotification')
  if (UE) {
    UE.onClick((result: any) => {
      try {
        const data = JSON.parse(result.payload) as ReminderData
        callback(data)
      } catch (e) {
        console.error('解析通知数据失败')
      }
    })
  }
  // #endif
}

// 震动提示
export function vibrate(): void {
  // #ifdef APP-PLUS
  uni.vibrateShort()
  // #endif
  
  // H5
  // #ifdef H5
  if ('vibrate' in navigator) {
    navigator.vibrate(200)
  }
  // #endif
}

// 播放提示音
export function playReminderSound(): void {
  // #ifdef APP-PLUS
  const audio = uni.createInnerAudioContext()
  audio.src = '/static/sounds/reminder.mp3'
  audio.play()
  audio.onEnded(() => {
    audio.destroy()
  })
  // #endif
  
  // H5
  // #ifdef H5
  const audio = new Audio('/static/sounds/reminder.mp3')
  audio.play()
  // #endif
}
