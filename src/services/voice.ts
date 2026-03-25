// 语音服务 - 处理语音识别和语音播报
import { recordAndRecognize } from './baidu-speech'

export interface VoiceResult {
  success: boolean
  text?: string
  error?: string
}

// 语音识别 - 使用百度语音 API
export async function recognizeSpeech(): Promise<VoiceResult> {
  try {
    // 使用百度语音 API（通过 recordAndRecognize 函数）
    const result = await recordAndRecognize()
    return {
      success: result.success,
      text: result.text,
      error: result.error
    }
  } catch (error: any) {
    console.error('语音识别失败:', error)
    return {
      success: false,
      error: error.message || '语音识别失败，请检查 API 配置'
    }
  }
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

    // H5/降级方案：使用 Web Speech API
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
