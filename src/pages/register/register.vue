<template>
  <view class="register-page">
    <!-- 顶部背景 -->
    <view class="header">
      <view class="logo-area">
        <image class="logo" src="/static/logo.png" mode="aspectFit" />
        <text class="app-name">AI 用药助手</text>
      </view>
      <text class="slogan">智能用药，安心生活</text>
    </view>

    <!-- 注册表单 -->
    <view class="register-form">
      <view class="form-title">
        <text class="h2-title">注册账号</text>
      </view>

      <!-- 用户名输入 -->
      <view class="input-group">
        <text class="input-label">用户名</text>
        <input
          v-model="username"
          type="text"
          placeholder="请设置用户名"
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
            placeholder="请设置密码（至少 6 位）"
            class="input password-field"
            maxlength="20"
          />
          <text class="toggle-password" @click="togglePassword">
            {{ showPassword ? '👁️' : '👁️‍🗨️' }}
          </text>
        </view>
      </view>

      <!-- 确认密码 -->
      <view class="input-group">
        <text class="input-label">确认密码</text>
        <view class="password-input">
          <input
            v-model="confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            placeholder="请再次输入密码"
            class="input password-field"
            maxlength="20"
          />
          <text class="toggle-password" @click="toggleConfirmPassword">
            {{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
          </text>
        </view>
      </view>

      <!-- 注册按钮 -->
      <button
        class="btn btn-primary btn-large"
        :disabled="!username || !password || !confirmPassword || loading"
        @click="handleRegister"
      >
        {{ loading ? '注册中...' : '立即注册' }}
      </button>

      <!-- 返回登录 -->
      <view class="login-hint">
        <text class="text-secondary">已有账号？</text>
        <text class="text-primary" @click="goLogin">返回登录</text>
      </view>
    </view>

    <!-- 免责声明 -->
    <view class="disclaimer">
      <text class="text-secondary">
        注册即表示同意
        <text class="text-primary" @click="showTerms">《用户协议》</text>
        和
        <text class="text-primary" @click="showPrivacy">《隐私政策》</text>
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/store/auth'
import { speakText } from '@/services/voice'

const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)

// 切换密码显示
function togglePassword() {
  showPassword.value = !showPassword.value
}

function toggleConfirmPassword() {
  showConfirmPassword.value = !showConfirmPassword.value
}

// 注册
async function handleRegister() {
  if (!username.value || username.value.length < 2) {
    uni.showToast({ title: '用户名至少 2 位', icon: 'none' })
    return
  }

  if (!password.value || password.value.length < 6) {
    uni.showToast({ title: '密码至少 6 位', icon: 'none' })
    return
  }

  if (password.value !== confirmPassword.value) {
    uni.showToast({ title: '两次密码输入不一致', icon: 'none' })
    return
  }

  loading.value = true
  const result = await authStore.register(username.value, password.value)
  loading.value = false

  if (result.success) {
    uni.showToast({ title: '注册成功', icon: 'success' })
    speakText('注册成功，欢迎使用 AI 用药助手')

    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 1000)
  } else {
    uni.showToast({ title: result.error || '注册失败', icon: 'none' })
  }
}

// 返回登录
function goLogin() {
  uni.redirectTo({ url: '/pages/login/login' })
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
</script>

<style lang="scss" scoped>
.register-page {
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

.register-form {
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

.login-hint {
  text-align: center;
  margin-top: 32rpx;
  font-size: 28rpx;
}

.disclaimer {
  text-align: center;
  padding: 24rpx 40rpx 40rpx;
  font-size: 22rpx;
}

.text-primary {
  color: #2196F3;
}

.text-secondary {
  color: #999;
}
</style>
