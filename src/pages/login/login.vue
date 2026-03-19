<template>
  <view class="login-page">
    <!-- 顶部背景 -->
    <view class="header">
      <view class="logo-area">
        <image class="logo" src="/static/logo.png" mode="aspectFit" />
        <text class="app-name">AI 用药助手</text>
      </view>
      <text class="slogan">智能用药，安心生活</text>
    </view>

    <!-- 登录表单 -->
    <view class="login-form">
      <view class="form-title">
        <text class="h2-title">用户名登录</text>
      </view>

      <!-- 用户名输入 -->
      <view class="input-group">
        <text class="input-label">用户名</text>
        <input
          v-model="username"
          type="text"
          placeholder="请输入用户名"
          class="input"
        />
      </view>

      <!-- 密码输入 -->
      <view class="input-group">
        <text class="input-label">密码</text>
        <view class="password-input">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="请输入密码"
            class="input password-field"
          />
          <text class="toggle-password" @click="togglePassword">
            {{ showPassword ? '👁️' : '👁️‍🗨️' }}
          </text>
        </view>
      </view>

      <!-- 登录按钮 -->
      <button
        class="btn btn-primary btn-large"
        :disabled="!username || !password || loading"
        @click="handleLogin"
      >
        {{ loading ? '登录中...' : '登录' }}
      </button>

      <!-- 注册提示 -->
      <view class="register-hint">
        <text class="text-secondary">还没有账号？</text>
        <text class="text-primary" @click="goRegister">立即注册</text>
      </view>

      <!-- 演示账号快捷登录 -->
      <view class="demo-login-section">
        <view class="demo-login-btn" @click="useDemoAccount">
          <text class="demo-icon">👤</text>
          <text class="demo-text">演示账号快速登录</text>
        </view>
        <text class="demo-hint">账号：demo / 密码：123456</text>
      </view>

      <!-- 语音登录提示 -->
      <view class="voice-hint">
        <text class="text-secondary">💡 也可以点击底部麦克风图标，用语音输入</text>
      </view>
    </view>

    <!-- 免责声明 -->
    <view class="disclaimer">
      <text class="text-secondary">
        登录即表示同意
        <text class="text-primary" @click="showTerms">《用户协议》</text>
        和
        <text class="text-primary" @click="showPrivacy">《隐私政策》</text>
      </text>
    </view>

    <!-- 紧急求助按钮 -->
    <view class="emergency-section" @click="goEmergency">
      <text class="emergency-text">🆘 紧急求助</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/store/auth'
import { speakText } from '@/services/voice'
import { supabase } from '@/services/supabase'

const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)

// 切换密码显示
function togglePassword() {
  showPassword.value = !showPassword.value
}

// 登录
async function handleLogin() {
  if (!username.value || !password.value) {
    uni.showToast({ title: '请输入用户名和密码', icon: 'none' })
    return
  }

  loading.value = true
  const result = await authStore.login(username.value, password.value)
  loading.value = false

  if (result.success) {
    uni.showToast({ title: '登录成功', icon: 'success' })
    speakText('登录成功，欢迎使用 AI 用药助手')

    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 1000)
  } else {
    uni.showToast({ title: result.error || '登录失败', icon: 'none' })
  }
}

// 去注册
function goRegister() {
  uni.navigateTo({ url: '/pages/register/register' })
}

// 演示账号快速登录
function useDemoAccount() {
  loading.value = true
  // 演示账号：自动登录，跳过邮箱验证检查
  supabase.auth.signInWithPassword({
    email: 'demo@local.dev',
    password: '123456'
  }).then(({ data, error }) => {
    loading.value = false
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        uni.showModal({
          title: '提示',
          content: '演示账号邮箱尚未确认。请开发者前往 Supabase 控制台确认 demo@local.dev 邮箱，或在 Authentication 设置中关闭邮箱验证要求。',
          showCancel: false,
          confirmText: '知道了'
        })
      } else {
        uni.showToast({ title: error.message || '登录失败', icon: 'none' })
      }
      return
    }
    if (data.user) {
      uni.showToast({ title: '登录成功', icon: 'success' })
      speakText('欢迎使用 AI 用药助手')
      setTimeout(() => {
        uni.switchTab({ url: '/pages/index/index' })
      }, 1000)
    }
  })
}

// 显示用户协议
function showTerms() {
  uni.showModal({
    title: '用户协议',
    content: '这里是用户协议内容...',
    showCancel: false
  })
}

// 显示隐私政策
function showPrivacy() {
  uni.showModal({
    title: '隐私政策',
    content: '这里是隐私政策内容...',
    showCancel: false
  })
}

// 紧急求助
function goEmergency() {
  uni.navigateTo({ url: '/pages/emergency/emergency' })
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #2196F3 0%, #1976D2 100%);
  display: flex;
  flex-direction: column;
}

.header {
  padding: 80rpx 40rpx 60rpx;
  text-align: center;
}

.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo {
  width: 160rpx;
  height: 160rpx;
  background: white;
  border-radius: 40rpx;
  margin-bottom: 24rpx;
}

.app-name {
  font-size: 48rpx;
  font-weight: bold;
  color: white;
  margin-bottom: 16rpx;
}

.slogan {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
}

.login-form {
  flex: 1;
  background: white;
  border-radius: 40rpx 40rpx 0 0;
  padding: 48rpx 40rpx;
}

.form-title {
  text-align: center;
  margin-bottom: 48rpx;
}

.input-group {
  margin-bottom: 32rpx;
}

.input-label {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.input {
  width: 100%;
  padding: 24rpx 32rpx;
  background: #F5F5F5;
  border-radius: 16rpx;
  font-size: 32rpx;
  color: #333;
}

.password-input {
  display: flex;
  align-items: center;
  background: #F5F5F5;
  border-radius: 16rpx;
  padding: 0 24rpx;
}

.password-field {
  flex: 1;
  padding: 24rpx 0;
}

.toggle-password {
  font-size: 36rpx;
  padding: 24rpx;
  cursor: pointer;
}

.btn-large {
  margin-top: 48rpx;
}

.register-hint {
  text-align: center;
  margin-top: 32rpx;
  font-size: 28rpx;
}

.demo-login-section {
  margin-top: 24rpx;
  text-align: center;
}

.demo-login-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 16rpx 32rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 32rpx;
  cursor: pointer;
  opacity: 0.9;
}

.demo-icon {
  font-size: 32rpx;
  margin-right: 8rpx;
}

.demo-text {
  color: white;
  font-size: 26rpx;
  font-weight: 500;
}

.demo-hint {
  display: block;
  margin-top: 8rpx;
  color: #999;
  font-size: 22rpx;
}

.voice-hint {
  text-align: center;
  margin-top: 32rpx;
  font-size: 24rpx;
}

.disclaimer {
  text-align: center;
  padding: 24rpx 40rpx 40rpx;
  font-size: 22rpx;
}

.emergency-section {
  text-align: center;
  padding: 24rpx 40rpx;
}

.emergency-text {
  color: white;
  font-size: 28rpx;
  text-decoration: underline;
}

.text-primary {
  color: #2196F3;
}

.text-secondary {
  color: #999;
}
</style>
