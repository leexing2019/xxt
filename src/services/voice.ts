// 语音服务 - 处理语音识别和语音播报
export interface VoiceResult {
  success: boolean
  text?: string
  error?: string
}

// 语音识别
export async function recognizeSpeech(): Promise<VoiceResult> {
  // #ifdef APP-PLUS
  return new Promise((resolve) => {
    const speechRecognizer = uni.requireNativePlugin('speech') as any
    
    if (!speechRecognizer) {
      // 降级处理：使用H5语音API
      resolve(recognizeSpeechH5())
      return
    }
    
    speechRecognizer.startRecognize({
      lang: 'zh-CN',
      success: (res: any) => {
        resolve({ success: true, text: res.result })
      },
      fail: (err: any) => {
        resolve({ success: false, error: err.errMsg || '语音识别失败' })
      }
    })
  })
  // #endif
  
  // #ifndef APP-PLUS
  return recognizeSpeechH5()
  // #endif
}

// H5语音识别（降级方案）
function recognizeSpeechH5(): Promise<VoiceResult> {
  return new Promise((resolve) => {
    // 使用浏览器原生语音识别
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      resolve({ success: false, error: '当前浏览器不支持语音识别' })
      return
    }
    
    const recognition = new SpeechRecognition()
    recognition.lang = 'zh-CN'
    recognition.continuous = false
    recognition.interimResults = false
    
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript
      resolve({ success: true, text })
    }
    
    recognition.onerror = (event: any) => {
      resolve({ success: false, error: event.error })
    }
    
    // 提示用户开始说话
    uni.showToast({
      title: '请说话...',
      icon: 'none',
      duration: 2000
    })
    
    recognition.start()
  })
}

// 语音播报
export function speakText(text: string, options?: { lang?: string; speed?: number }): Promise<void> {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    const speechSynthesizer = uni.requireNativePlugin('speech') as any
    
    if (speechSynthesizer) {
      speechSynthesizer.startSpeak({
        text,
        lang: options?.lang || 'zh-CN',
        success: () => resolve(),
        fail: (err: any) => reject(err)
      })
      return
    }
    // #endif
    
    // H5/降级方案：使用Web Speech API
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = options?.lang || 'zh-CN'
      utterance.rate = options?.speed || 1
      utterance.onend = () => resolve()
      utterance.onerror = (err) => reject(err)
      window.speechSynthesis.speak(utterance)
    } else {
      reject(new Error('浏览器不支持语音播报'))
    }
  })
}

// 停止语音播报
export function stopSpeak(): void {
  // #ifdef APP-PLUS
  const speechSynthesizer = uni.requireNativePlugin('speech') as any
  if (speechSynthesizer) {
    speechSynthesizer.stopSpeak()
  }
  // #endif
  
  // H5
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

// 拨打紧急电话
export function makePhoneCall(phoneNumber: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    uni.makePhoneCall({
      phoneNumber,
      success: () => resolve(),
      fail: (err) => reject(err)
    })
    // #endif
    
    // #ifdef H5
    window.location.href = `tel:${phoneNumber}`
    resolve()
    // #endif
  })
}

// 发送短信
export function sendSMS(phoneNumber: string, content?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    uni.sendSms({
      phoneNumber,
      content: content || '紧急求助！',
      success: () => resolve(),
      fail: (err) => reject(err)
    })
    // #endif
    
    // #ifdef H5
    window.location.href = `sms:${phoneNumber}${content ? `?body=${encodeURIComponent(content)}` : ''}`
    resolve()
    // #endif
  })
}
