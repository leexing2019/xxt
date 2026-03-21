<template>
  <view class="admin-page">
    <view class="admin-header">
      <text class="title">用药助手管理后台</text>
      <text class="subtitle">AI Medication Assistant</text>
    </view>

    <view class="admin-grid">
      <view class="admin-card" @click="goTo('medication-list')">
        <text class="card-icon">💊</text>
        <text class="card-title">用药计划管理</text>
        <text class="card-desc">查看和管理用户用药计划</text>
      </view>

      <view class="admin-card" @click="goTo('stats-report')">
        <text class="card-icon">📊</text>
        <text class="card-title">统计报告</text>
        <text class="card-desc">用药依从性统计</text>
      </view>

      <view class="admin-card" @click="goTo('api-config')">
        <text class="card-icon">⚙️</text>
        <text class="card-title">API 配置</text>
        <text class="card-desc">百度 API 密钥配置</text>
      </view>
    </view>

    <view class="admin-footer">
      <text class="footer-text">仅供管理员使用</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  // 检查是否为管理员（简化版，实际应该检查用户角色）
  const userData = uni.getStorageSync('userData')
  if (!userData) {
    uni.showModal({
      title: '提示',
      content: '请先登录',
      showCancel: false,
      success: () => {
        uni.redirectTo({ url: '/pages/login/login' })
      }
    })
  }
})

function goTo(page: string) {
  uni.navigateTo({
    url: `/pages/admin/${page}`
  })
}
</script>

<style lang="scss" scoped>
.admin-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.admin-header {
  text-align: center;
  padding: 40px 20px;
  color: #fff;

  .title {
    display: block;
    font-size: 48rpx;
    font-weight: bold;
    margin-bottom: 10rpx;
  }

  .subtitle {
    display: block;
    font-size: 28rpx;
    opacity: 0.9;
  }
}

.admin-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 0;
}

.admin-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 40px 30px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);

  &:active {
    transform: scale(0.98);
  }

  .card-icon {
    display: block;
    font-size: 80rpx;
    margin-bottom: 20rpx;
  }

  .card-title {
    display: block;
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 10rpx;
  }

  .card-desc {
    display: block;
    font-size: 26rpx;
    color: #999;
  }
}

.admin-footer {
  text-align: center;
  padding: 40px 20px;

  .footer-text {
    color: rgba(255, 255, 255, 0.8);
    font-size: 24rpx;
  }
}
</style>
