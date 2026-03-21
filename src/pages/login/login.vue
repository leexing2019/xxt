<template>
  <view class="login-page page-fade-in">
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
        <view class="input-wrapper">
          <input
            v-model="username"
            type="text"
            placeholder="请输入用户名"
            class="input"
          />
        </view>
      </view>

      <!-- 密码输入 -->
      <view class="input-group">
        <text class="input-label">密码</text>
        <view class="input-wrapper password-wrapper">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="请输入密码"
            class="input"
          />
          <text class="toggle-password" @click="togglePassword">
            {{ showPassword ? '👁️' : '👁️‍🗨️' }}
          </text>
        </view>
      </view>

      <!-- 登录按钮 -->
      <button
        class="btn btn-primary btn-large login-btn"
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
      <!-- 已移除：底部麦克风图标语音输入提示 -->
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
  padding: 60rpx 40rpx 40rpx;
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
  background: rgba(255, 255, 255, 0.2);
  border-radius: 30rpx;
  margin-bottom: 20rpx;
  backdrop-filter: blur(10px);
}

.app-name {
  font-size: 44rpx;
  font-weight: bold;
  color: white;
  margin-bottom: 12rpx;
}

.slogan {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
}

.login-form {
  flex: 1;
  background: white;
  border-radius: 40rpx 40rpx 0 0;
  padding: 40rpx 40rpx 30rpx;
  overflow-y: auto;
}

.form-title {
  text-align: center;
  margin-bottom: 36rpx;
}

.input-group {
  margin-bottom: 28rpx;
}

.input-label {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 12rpx;
}

.input-wrapper {
  width: 100%;
  display: flex;
  align-items: center;
  background: #F5F5F5;
  border-radius: 16rpx;
  padding: 0 24rpx;
  box-sizing: border-box;
}

.input-wrapper.password-wrapper {
  justify-content: space-between;
}

.input {
  flex: 1;
  padding: 24rpx 0;
  background: transparent;
  font-size: 30rpx;
  color: #333;
  height: 48rpx;
  line-height: 48rpx;
}

.toggle-password {
  font-size: 36rpx;
  padding: 12rpx 0;
  margin-left: 16rpx;
  cursor: pointer;
  flex-shrink: 0;
}

.btn-large {
  margin-top: 36rpx;
}

.register-hint {
  text-align: center;
  margin-top: 24rpx;
  font-size: 26rpx;
}

.demo-login-section {
  margin-top: 28rpx;
  padding: 20rpx 24rpx;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 20rpx;
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
  transition: all 0.2s ease-out;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

  &:active {
    transform: scale(0.95);
    box-shadow: 0 2px 6px rgba(102, 126, 234, 0.2);
  }
}

.demo-icon {
  font-size: 28rpx;
  margin-right: 8rpx;
}

.demo-text {
  color: white;
  font-size: 24rpx;
  font-weight: 500;
}

.demo-hint {
  display: block;
  margin-top: 8rpx;
  color: #999;
  font-size: 20rpx;
}

/* 语音提示样式已移除 */

.disclaimer {
  text-align: center;
  padding: 20rpx 40rpx 30rpx;
  font-size: 20rpx;
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
