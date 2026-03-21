<template>
  <view class="api-config-page">
    <!-- 页面标题 -->
    <view class="page-header">
      <view class="header-content">
        <text class="header-icon">🔧</text>
        <text class="header-title">API 配置管理</text>
      </view>
      <text class="header-subtitle">管理百度 API 密钥和应用功能开关</text>
    </view>

    <!-- 百度语音识别 API 配置 -->
    <view class="config-section">
      <view class="section-header">
        <text class="section-icon">🎤</text>
        <text class="section-title">百度语音识别 API</text>
      </view>

      <view class="form-card">
        <!-- App ID -->
        <view class="form-item">
          <view class="form-label">
            <text class="label-text">App ID</text>
            <text class="label-tip">百度智能云应用 ID</text>
          </view>
          <view class="input-wrapper">
            <input
              v-model="baiduConfig.appId"
              class="form-input"
              placeholder="请输入百度 App ID"
              placeholder-class="input-placeholder"
            />
          </view>
        </view>

        <!-- API Key -->
        <view class="form-item">
          <view class="form-label">
            <text class="label-text">API Key</text>
            <text class="label-tip">百度智能云 API 密钥</text>
          </view>
          <view class="input-wrapper">
            <input
              v-model="baiduConfig.apiKey"
              class="form-input"
              placeholder="请输入 API Key"
              placeholder-class="input-placeholder"
              :password="!showApiKey"
            />
            <text
              class="eye-icon"
              @click="showApiKey = !showApiKey"
            >
              {{ showApiKey ? '👁️' : '👁️‍🗨️' }}
            </text>
          </view>
        </view>

        <!-- Secret Key -->
        <view class="form-item">
          <view class="form-label">
            <text class="label-text">Secret Key</text>
            <text class="label-tip">百度智能云安全密钥</text>
          </view>
          <view class="input-wrapper">
            <input
              v-model="baiduConfig.secretKey"
              class="form-input"
              placeholder="请输入 Secret Key"
              placeholder-class="input-placeholder"
              :password="!showSecretKey"
            />
            <text
              class="eye-icon"
              @click="showSecretKey = !showSecretKey"
            >
              {{ showSecretKey ? '👁️' : '👁️‍🗨️' }}
            </text>
          </view>
        </view>

        <!-- 测试连接 -->
        <view class="test-section">
          <button
            class="test-btn"
            :disabled="testing"
            @click="testBaiduSpeechConnection"
          >
            {{ testing ? '测试中...' : '📡 测试语音 API 连接' }}
          </button>
          <view v-if="testResult" :class="['test-result', testResult.success ? 'success' : 'error']">
            <text class="test-icon">{{ testResult.success ? '✅' : '❌' }}</text>
            <text class="test-text">{{ testResult.message }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 应用功能开关 -->
    <view class="config-section">
      <view class="section-header">
        <text class="section-icon">⚙️</text>
        <text class="section-title">应用功能开关</text>
      </view>

      <view class="form-card">
        <!-- 语音识别 -->
        <view class="switch-item">
          <view class="switch-info">
            <text class="switch-name">语音识别</text>
            <text class="switch-desc">启用后可使用语音输入功能</text>
          </view>
          <switch
            :checked="appConfig.voice_recognition_enabled"
            color="#2196F3"
            @change="onAppConfigChange('voice_recognition_enabled', $event)"
          />
        </view>

        <!-- 图片识别 -->
        <view class="switch-item">
          <view class="switch-info">
            <text class="switch-name">图片识别</text>
            <text class="switch-desc">启用后可使用图片 OCR 识别药品</text>
          </view>
          <switch
            :checked="appConfig.image_recognition_enabled"
            color="#2196F3"
            @change="onAppConfigChange('image_recognition_enabled', $event)"
          />
        </view>

        <!-- 语音引导 -->
        <view class="switch-item">
          <view class="switch-info">
            <text class="switch-name">语音引导</text>
            <text class="switch-desc">启用后操作时有语音提示</text>
          </view>
          <switch
            :checked="appConfig.voice_guidance_enabled"
            color="#2196F3"
            @change="onAppConfigChange('voice_guidance_enabled', $event)"
          />
        </view>

        <!-- 老年模式 -->
        <view class="switch-item">
          <view class="switch-info">
            <text class="switch-name">老年模式</text>
            <text class="switch-desc">启用后字体更大，界面更简洁</text>
          </view>
          <switch
            :checked="appConfig.elderly_mode_enabled"
            color="#2196F3"
            @change="onAppConfigChange('elderly_mode_enabled', $event)"
          />
        </view>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="footer-actions">
      <button class="btn-cancel" @click="resetConfig">重置</button>
      <button class="btn-save" :disabled="saving" @click="saveConfig">
        {{ saving ? '保存中...' : '💾 保存配置' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import { clearApiConfigCache } from '@/services/api-config'
import { clearAppConfigCache } from '@/services/app-config'

// 百度语音 API 配置
interface BaiduSpeechConfig {
  appId: string
  apiKey: string
  secretKey: string
}

// 应用配置
interface AppConfig {
  voice_recognition_enabled: boolean
  image_recognition_enabled: boolean
  voice_guidance_enabled: boolean
  elderly_mode_enabled: boolean
}

// 测试连接结果
interface TestResult {
  success: boolean
  message: string
}

// 状态
const baiduConfig = ref<BaiduSpeechConfig>({
  appId: '',
  apiKey: '',
  secretKey: ''
})

const appConfig = ref<AppConfig>({
  voice_recognition_enabled: true,
  image_recognition_enabled: true,
  voice_guidance_enabled: true,
  elderly_mode_enabled: false
})

// UI 状态
const showApiKey = ref(false)
const showSecretKey = ref(false)
const testing = ref(false)
const saving = ref(false)
const testResult = ref<TestResult | null>(null)

// 加载配置
async function loadConfig() {
  try {
    // 加载百度语音配置
    const { data: speechData } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'baidu_speech_config')
      .single()

    if (speechData?.value) {
      baiduConfig.value = {
        appId: speechData.value.appId || '',
        apiKey: speechData.value.apiKey || '',
        secretKey: speechData.value.secretKey || ''
      }
    }

    // 加载应用配置
    const { data: appData } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'app_config')
      .single()

    if (appData?.value) {
      appConfig.value = {
        voice_recognition_enabled: appData.value.voice_recognition_enabled ?? true,
        image_recognition_enabled: appData.value.image_recognition_enabled ?? true,
        voice_guidance_enabled: appData.value.voice_guidance_enabled ?? true,
        elderly_mode_enabled: appData.value.elderly_mode_enabled ?? false
      }
    }
  } catch (error) {
    console.error('加载配置失败:', error)
    uni.showToast({ title: '加载配置失败', icon: 'none' })
  }
}

// 应用配置变更
function onAppConfigChange(key: keyof AppConfig, event: any) {
  appConfig.value[key] = event.detail.value
}

// 测试百度语音 API 连接
async function testBaiduSpeechConnection() {
  const { appId, apiKey, secretKey } = baiduConfig.value

  // 验证必填项
  if (!apiKey || !secretKey) {
    testResult.value = {
      success: false,
      message: '请先填写 API Key 和 Secret Key'
    }
    return
  }

  testing.value = true
  testResult.value = null

  try {
    // 调用百度 API 获取 access_token
    const response = await fetch(
      `https://openapi.baidu.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.access_token) {
      testResult.value = {
        success: true,
        message: '连接成功！API 密钥有效，Token 获取成功'
      }
      uni.showToast({ title: '测试成功', icon: 'success' })
    } else {
      testResult.value = {
        success: false,
        message: data.error_description || 'API Key 或 Secret Key 无效'
      }
      uni.showToast({ title: '测试失败', icon: 'none' })
    }
  } catch (error) {
    testResult.value = {
      success: false,
      message: error instanceof Error ? error.message : '连接失败，请检查网络和配置'
    }
    uni.showToast({ title: '测试失败', icon: 'none' })
  } finally {
    testing.value = false
  }
}

// 保存配置
async function saveConfig() {
  // 验证必填项
  if (!baiduConfig.value.apiKey || !baiduConfig.value.secretKey) {
    uni.showToast({ title: '请填写完整的 API 配置', icon: 'none' })
    return
  }

  saving.value = true

  try {
    // 保存百度语音配置
    const { error: speechError } = await supabase
      .from('app_settings')
      .upsert({
        key: 'baidu_speech_config',
        value: {
          appId: baiduConfig.value.appId,
          apiKey: baiduConfig.value.apiKey,
          secretKey: baiduConfig.value.secretKey
        },
        description: '百度语音识别 API 配置'
      }, {
        onConflict: 'key'
      })

    if (speechError) throw speechError

    // 保存应用配置
    const { error: appError } = await supabase
      .from('app_settings')
      .upsert({
        key: 'app_config',
        value: {
          voice_recognition_enabled: appConfig.value.voice_recognition_enabled,
          image_recognition_enabled: appConfig.value.image_recognition_enabled,
          voice_guidance_enabled: appConfig.value.voice_guidance_enabled,
          elderly_mode_enabled: appConfig.value.elderly_mode_enabled
        },
        description: '应用功能开关配置'
      }, {
        onConflict: 'key'
      })

    if (appError) throw appError

    // 清除缓存，让前端重新读取配置
    clearApiConfigCache()
    clearAppConfigCache()

    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (error: any) {
    console.error('保存配置失败:', error)
    uni.showToast({ title: error.message || '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

// 重置配置
async function resetConfig() {
  uni.showModal({
    title: '确认重置',
    content: '确定要重置为已保存的配置吗？未保存的更改将丢失。',
    confirmText: '重置',
    confirmColor: '#E53935',
    success: async (res) => {
      if (res.confirm) {
        await loadConfig()
        uni.showToast({ title: '已重置', icon: 'success' })
      }
    }
  })
}

// 页面加载时读取配置
onMounted(() => {
  loadConfig()
})
</script>

<style lang="scss" scoped>
.api-config-page {
  min-height: 100vh;
  background: #F5F5F5;
  padding-bottom: 120rpx;
}

// 页面头部
.page-header {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  padding: 40rpx 32rpx;
}

.header-content {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.header-icon {
  font-size: 48rpx;
  margin-right: 16rpx;
}

.header-title {
  font-size: 40rpx;
  font-weight: bold;
  color: white;
}

.header-subtitle {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
}

// 配置区块
.config-section {
  margin: 24rpx 0;
  padding: 0 24rpx;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.section-icon {
  font-size: 36rpx;
  margin-right: 12rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: var(--text-primary);
}

// 表单卡片
.form-card {
  background: white;
  border-radius: 16rpx;
  padding: 28rpx;
  box-shadow: var(--shadow-md);
}

// 表单项
.form-item {
  margin-bottom: 28rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  display: flex;
  align-items: baseline;
  margin-bottom: 12rpx;
}

.label-text {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-right: 8rpx;
}

.label-tip {
  font-size: 24rpx;
  color: var(--text-secondary);
}

.input-wrapper {
  display: flex;
  align-items: center;
  position: relative;
}

.form-input {
  flex: 1;
  width: 100%;
  padding: 20rpx 24rpx;
  border: 2px solid #E0E0E0;
  border-radius: 12rpx;
  font-size: 28rpx;
  background: white;
  transition: all 0.2s ease;

  &:focus {
    border-color: var(--primary-color);
  }
}

.input-placeholder {
  color: #9E9E9E;
}

.eye-icon {
  position: absolute;
  right: 20rpx;
  font-size: 32rpx;
  cursor: pointer;
  padding: 8rpx;
  z-index: 10;
}

// 测试连接区域
.test-section {
  margin-top: 28rpx;
  padding-top: 24rpx;
  border-top: 1px solid #F0F0F0;
}

.test-btn {
  width: 100%;
  padding: 20rpx;
  background: var(--primary-color);
  color: white;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: 600;
  border: none;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.test-result {
  display: flex;
  align-items: center;
  margin-top: 16rpx;
  padding: 16rpx 20rpx;
  border-radius: 12rpx;
  font-size: 26rpx;

  &.success {
    background: var(--success-bg);
    color: var(--success-color);
  }

  &.error {
    background: var(--danger-bg);
    color: var(--danger-color);
  }
}

.test-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
}

.test-text {
  flex: 1;
}

// 开关项
.switch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1px solid #F0F0F0;

  &:last-child {
    border-bottom: none;
  }
}

.switch-info {
  flex: 1;
}

.switch-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6rpx;
}

.switch-desc {
  display: block;
  font-size: 24rpx;
  color: var(--text-secondary);
}

// 底部操作按钮
.footer-actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 20rpx;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: white;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.btn-cancel,
.btn-save {
  flex: 1;
  padding: 20rpx;
  border-radius: 12rpx;
  font-size: 30rpx;
  font-weight: 600;
  border: none;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-cancel {
  background: #F5F5F5;
  color: var(--text-secondary);
}

.btn-save {
  background: var(--primary-color);
  color: white;
}
</style>
