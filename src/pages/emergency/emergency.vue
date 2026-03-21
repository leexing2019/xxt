<template>
  <view class="emergency-page">
    <!-- 顶部警告 -->
    <view class="emergency-header">
      <view class="header-left">
        <view class="back-btn" @click="goBack">
          <text class="back-icon">←</text>
        </view>
      </view>
      <view class="header-center">
        <text class="emergency-title">紧急求助</text>
        <text class="emergency-subtitle">如遇紧急情况，请保持冷静</text>
      </view>
    </view>

    <!-- 大号紧急按钮 -->
    <view class="main-emergency">
      <view class="emergency-btn-large" @click="call120">
        <text class="btn-icon">📞</text>
        <text class="btn-text">拨打 120</text>
        <text class="btn-sub">急救电话</text>
      </view>
    </view>

    <!-- 紧急联系人 -->
    <view class="contact-section">
      <text class="section-title">紧急联系人</text>
      
      <view v-if="emergencyContact" class="contact-card">
        <view class="contact-info">
          <text class="contact-name">{{ emergencyContact.name }}</text>
          <text class="contact-phone">{{ emergencyContact.phone }}</text>
        </view>
        <view class="contact-actions">
          <view class="action-item" @click="callContact">
            <text>📞</text>
            <text class="action-text">拨打</text>
          </view>
          <view class="action-item" @click="sendLocation">
            <text>📍</text>
            <text class="action-text">发位置</text>
          </view>
        </view>
      </view>

      <view v-else class="empty-contact" @click="setEmergencyContact">
        <text class="empty-icon">👤</text>
        <text class="empty-text">点击设置紧急联系人</text>
      </view>
    </view>

    <!-- 紧急情况处理 -->
    <view class="emergency-scenarios">
      <text class="section-title">常见紧急情况</text>
      
      <view
        v-for="scenario in emergencyScenarios"
        :key="scenario.type"
        class="scenario-card"
        @click="showScenarioDetail(scenario)"
      >
        <view class="scenario-header">
          <text class="scenario-icon">{{ scenario.icon }}</text>
          <view class="scenario-info">
            <text class="scenario-title">{{ scenario.title }}</text>
            <text class="scenario-severity" :class="scenario.severity">
              {{ getSeverityLabel(scenario.severity) }}
            </text>
          </view>
        </view>
        <text class="scenario-arrow">></text>
      </view>
    </view>

    <!-- 紧急处理详情弹窗 -->
    <view v-if="showDetail" class="detail-overlay" @click="closeDetail">
      <view class="detail-modal" @click.stop>
        <view class="detail-header">
          <text class="detail-title">{{ currentScenario?.title }}</text>
          <text class="detail-close" @click="closeDetail">×</text>
        </view>
        
        <view class="detail-content">
          <view class="detail-section">
            <text class="detail-section-title">📋 症状表现</text>
            <view v-for="symptom in currentScenario?.symptoms" :key="symptom" class="symptom-item">
              {{ symptom }}
            </view>
          </view>
          
          <view class="detail-section action-section">
            <text class="detail-section-title">✅ 应对措施</text>
            <view v-for="(action, index) in currentScenario?.actions" :key="index" class="action-item">
              <text class="action-number">{{ index + 1 }}</text>
              <text class="action-text">{{ action }}</text>
            </view>
          </view>
          
          <view class="detail-section warning-section">
            <text class="detail-section-title">⚠️ 注意事项</text>
            <view v-for="warning in currentScenario?.warnings" :key="warning" class="warning-item">
              {{ warning }}
            </view>
          </view>
        </view>
        
        <view class="detail-footer">
          <button class="btn btn-danger btn-large" @click="call120">
            立即拨打 120
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/store/auth'
import { emergencyDatabase, sendEmergencySMS, getNearbyHospitals } from '@/services/emergency'
import { speakText } from '@/services/voice'

const authStore = useAuthStore()

const showDetail = ref(false)
const currentScenario = ref<any>(null)

const emergencyScenarios = emergencyDatabase.slice(0, 4)

const emergencyContact = ref({
  name: '家人',
  phone: '13800138000'
})

// 返回上一页
function goBack() {
  // 尝试返回上一页，如果失败则跳转到首页
  uni.navigateBack({
    fail: () => {
      // 如果没有上一页（如从 tabBar 直接进入），跳转到首页
      uni.switchTab({
        url: '/pages/index/index'
      })
    }
  })
}

// 获取严重程度标签
function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    critical: '危急',
    high: '严重',
    medium: '中等',
    low: '轻微'
  }
  return labels[severity] || severity
}

// 拨打120
function call120() {
  uni.makePhoneCall({
    phoneNumber: '120',
    success: () => {
      speakText('正在拨打120急救电话')
    },
    fail: () => {
      uni.showToast({ title: '拨打电话失败', icon: 'none' })
    }
  })
}

// 拨打联系人
function callContact() {
  if (emergencyContact.value?.phone) {
    uni.makePhoneCall({
      phoneNumber: emergencyContact.value.phone
    })
  }
}

// 发送位置
async function sendLocation() {
  uni.getLocation({
    type: 'gcj02',
    success: (res) => {
      const location = `${res.latitude},${res.longitude}`
      if (emergencyContact.value?.phone) {
        sendEmergencySMS(emergencyContact.value.phone, location)
      }
    },
    fail: () => {
      uni.showToast({ title: '获取位置失败', icon: 'none' })
    }
  })
}

// 设置紧急联系人
function setEmergencyContact() {
  uni.showModal({
    title: '设置紧急联系人',
    content: '请在设置页面中配置紧急联系人',
    confirmText: '去设置',
    success: (res) => {
      if (res.confirm) {
        uni.navigateTo({ url: '/pages/settings/settings' })
      }
    }
  })
}

// 显示场景详情
function showScenarioDetail(scenario: any) {
  currentScenario.value = scenario
  showDetail.value = true
}

// 关闭详情
function closeDetail() {
  showDetail.value = false
}
</script>

<style lang="scss" scoped>
.emergency-page {
  min-height: 100vh;
  background: var(--bg-color);
}

.emergency-header {
  background: linear-gradient(135deg, #FF6B6B 0%, #C62828 100%);
  padding: 48rpx 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4rpx 24rpx rgba(255, 107, 107, 0.4);
}

.header-left {
  width: 64rpx;
  flex-shrink: 0;
}

.back-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;

  &:active {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(0.9);
  }
}

.back-icon {
  font-size: 40rpx;
  color: white;
  font-weight: bold;
  line-height: 1;
}

.header-center {
  flex: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.emergency-title {
  display: block;
  font-size: 48rpx;
  font-weight: 800;
  color: white;
  margin-bottom: 12rpx;
  letter-spacing: 2px;
}

.emergency-subtitle {
  color: rgba(255, 255, 255, 0.95);
  font-size: 28rpx;
  font-weight: 500;
}

.main-emergency {
  padding: 32rpx 32rpx 48rpx;
}

/* SOS 紧急按钮 - 更大更明显 */
.emergency-btn-large {
  background: linear-gradient(135deg, #FF6B6B 0%, #C62828 100%);
  border-radius: 32rpx;
  padding: 72rpx 48rpx;
  text-align: center;
  box-shadow: 0 12rpx 40rpx rgba(255, 107, 107, 0.5);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:active {
    transform: scale(0.95);
    box-shadow: 0 6rpx 20rpx rgba(255, 107, 107, 0.4);
  }

  &:active::before {
    opacity: 1;
  }
}

.btn-icon {
  font-size: 96rpx;
  display: block;
  margin-bottom: 24rpx;
  animation: pulse 2s ease-in-out infinite;
}

.btn-text {
  font-size: 52rpx;
  font-weight: 800;
  color: white;
  letter-spacing: 4px;
  display: block;
}

.btn-sub {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.95);
  margin-top: 12rpx;
  display: block;
  font-weight: 500;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.9;
  }
}

.contact-section,
.emergency-scenarios {
  padding: 0 32rpx 32rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;

  &::before {
    content: '';
    width: 6rpx;
    height: 32rpx;
    background: linear-gradient(180deg, #FF6B6B 0%, #C62828 100%);
    border-radius: 3rpx;
    margin-right: 12rpx;
  }
}

/* 紧急联系人卡片优化 */
.contact-card {
  background: var(--card-bg);
  border-radius: 20rpx;
  padding: 32rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.1);
  border-left: 6rpx solid #FF6B6B;
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  }
}

.contact-info {
  flex: 1;
  min-width: 0;
}

.contact-name {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--text-primary);
  display: block;
}

.contact-phone {
  font-size: 30rpx;
  color: var(--text-secondary);
  margin-top: 8rpx;
  display: block;
  font-weight: 500;
}

.contact-actions {
  display: flex;
  gap: 20rpx;
  margin-left: 20rpx;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 20rpx;
  background: var(--primary-light-bg);
  border-radius: 16rpx;
  transition: all 0.2s ease;
  min-width: 80rpx;

  &:active {
    transform: scale(0.9);
    background: var(--primary-bg);
  }
}

.action-item .action-icon {
  font-size: 44rpx;
  margin-bottom: 4rpx;
}

.action-text {
  font-size: 22rpx;
  color: var(--primary-color);
  margin-top: 4rpx;
  font-weight: 600;
}

/* 空状态优化 */
.empty-contact {
  background: var(--card-bg);
  border-radius: 20rpx;
  padding: 64rpx 48rpx;
  text-align: center;
  border: 3rpx dashed var(--border-color);
  transition: all 0.2s ease;
  cursor: pointer;

  &:active {
    transform: scale(0.98);
    border-color: var(--primary-color);
    background: var(--primary-light-bg);
  }
}

.empty-icon {
  font-size: 72rpx;
  display: block;
  margin-bottom: 20rpx;
  opacity: 0.6;
}

.empty-text {
  font-size: 28rpx;
  color: var(--text-secondary);
  font-weight: 500;
}

/* 紧急情况场景卡片 */
.scenario-card {
  background: var(--card-bg);
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  min-height: 120rpx;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
  }
}

.scenario-header {
  display: flex;
  align-items: center;
  flex: 1;
}

.scenario-icon {
  font-size: 52rpx;
  margin-right: 24rpx;
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FFEBEE 0%, rgba(255, 107, 107, 0.1) 100%);
  border-radius: 20rpx;
  flex-shrink: 0;
}

.scenario-info {
  flex: 1;
  min-width: 0;
}

.scenario-title {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--text-primary);
  display: block;
}

.scenario-severity {
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
  margin-top: 10rpx;
  display: inline-block;
  font-weight: 600;

  &.critical {
    background: #FFEBEE;
    color: #C62828;
  }

  &.high {
    background: var(--warning-bg);
    color: var(--warning-color);
  }

  &.medium {
    background: var(--primary-light-bg);
    color: var(--primary-color);
  }
}

.scenario-arrow {
  font-size: 34rpx;
  color: var(--text-disabled);
  margin-left: 16rpx;
  transition: transform 0.2s ease;
}

.scenario-card:active .scenario-arrow {
  transform: translateX(4rpx);
}

/* 详情弹窗优化 */
.detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
  display: flex;
  align-items: flex-end;
  animation: fadeIn 0.2s ease-out;
}

.detail-modal {
  background: var(--card-bg);
  width: 100%;
  max-height: 85vh;
  border-radius: 32rpx 32rpx 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 36rpx 32rpx;
  border-bottom: 1px solid var(--border-color);
  background: linear-gradient(90deg, #FFEBEE 0%, transparent 100%);
}

.detail-title {
  font-size: 36rpx;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: 1px;
}

.detail-close {
  font-size: 52rpx;
  color: var(--text-disabled);
  padding: 0 16rpx;
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--bg-color);
  transition: all 0.2s ease;

  &:active {
    background: #FFEBEE;
    color: #C62828;
    transform: scale(0.9);
  }
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 32rpx;
  background: var(--bg-color);
}

.detail-section {
  margin-bottom: 36rpx;
  background: var(--card-bg);
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: var(--shadow-sm);
}

.detail-section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 20rpx;
  display: block;
  padding-bottom: 16rpx;
  border-bottom: 2rpx solid var(--border-color);
}

.symptom-item,
.action-item,
.warning-item {
  font-size: 28rpx;
  color: var(--text-secondary);
  padding: 16rpx 0;
  border-bottom: 1px solid var(--border-color);
  line-height: 1.6;

  &:last-child {
    border-bottom: none;
  }
}

.action-section .action-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
}

.action-number {
  width: 48rpx;
  height: 48rpx;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 2rpx 8rpx rgba(30, 136, 229, 0.3);
}

.action-text {
  flex: 1;
  line-height: 1.6;
}

.warning-section {
  background: var(--warning-bg);
  border-radius: 16rpx;
  padding: 24rpx;
  border-left: 6rpx solid var(--warning-color);
}

.warning-item {
  color: #E65100;
  border-bottom-color: #FFE0B2;
  font-weight: 500;
}

.detail-footer {
  padding: 28rpx 32rpx;
  padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
  border-top: 1px solid var(--border-color);
  background: var(--card-bg);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
