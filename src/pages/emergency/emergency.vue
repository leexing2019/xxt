<template>
  <view class="emergency-page">
    <!-- 顶部警告 -->
    <view class="emergency-header">
      <text class="emergency-title">紧急求助</text>
      <text class="emergency-subtitle">如遇紧急情况，请保持冷静</text>
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
  background: #F5F5F5;
}

.emergency-header {
  background: linear-gradient(135deg, #F44336, #D32F2F);
  padding: 48rpx 32rpx;
  text-align: center;
}

.emergency-title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: white;
  margin-bottom: 12rpx;
}

.emergency-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 28rpx;
}

.main-emergency {
  padding: 40rpx 32rpx;
}

.emergency-btn-large {
  background: linear-gradient(135deg, #F44336, #D32F2F);
  border-radius: 24rpx;
  padding: 60rpx;
  text-align: center;
  box-shadow: 0 8rpx 24rpx rgba(244, 67, 54, 0.4);
}

.btn-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 16rpx;
}

.btn-text {
  font-size: 48rpx;
  font-weight: bold;
  color: white;
}

.btn-sub {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 8rpx;
}

.contact-section,
.emergency-scenarios {
  padding: 0 32rpx 32rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

.contact-card {
  background: white;
  border-radius: 16rpx;
  padding: 28rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.contact-info {
  flex: 1;
}

.contact-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.contact-phone {
  font-size: 28rpx;
  color: #666;
  margin-top: 8rpx;
}

.contact-actions {
  display: flex;
  gap: 24rpx;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 40rpx;
}

.action-text {
  font-size: 22rpx;
  color: #666;
  margin-top: 4rpx;
}

.empty-contact {
  background: white;
  border-radius: 16rpx;
  padding: 48rpx;
  text-align: center;
  border: 2px dashed #E0E0E0;
}

.empty-icon {
  font-size: 64rpx;
  display: block;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.scenario-card {
  background: white;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.scenario-header {
  display: flex;
  align-items: center;
}

.scenario-icon {
  font-size: 48rpx;
  margin-right: 20rpx;
}

.scenario-info {
  flex: 1;
}

.scenario-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.scenario-severity {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  margin-top: 8rpx;
  display: inline-block;
}

.scenario-severity.critical {
  background: #FFEBEE;
  color: #F44336;
}

.scenario-severity.high {
  background: #FFF3E0;
  color: #FF9800;
}

.scenario-severity.medium {
  background: #E3F2FD;
  color: #2196F3;
}

.scenario-arrow {
  font-size: 32rpx;
  color: #CCC;
}

/* 详情弹窗 */
.detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}

.detail-modal {
  background: white;
  width: 100%;
  max-height: 85vh;
  border-radius: 32rpx 32rpx 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1px solid #F0F0F0;
}

.detail-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
}

.detail-close {
  font-size: 48rpx;
  color: #999;
  padding: 0 16rpx;
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 32rpx;
}

.detail-section {
  margin-bottom: 32rpx;
}

.detail-section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.symptom-item,
.action-item,
.warning-item {
  font-size: 28rpx;
  color: #666;
  padding: 12rpx 0;
  border-bottom: 1px solid #F5F5F5;
}

.action-section .action-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
}

.action-number {
  width: 40rpx;
  height: 40rpx;
  background: #2196F3;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  flex-shrink: 0;
}

.action-text {
  flex: 1;
}

.warning-section {
  background: #FFF3E0;
  border-radius: 12rpx;
  padding: 20rpx;
}

.warning-item {
  color: #E65100;
  border-bottom-color: #FFE0B2;
}

.detail-footer {
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  border-top: 1px solid #F0F0F0;
}
</style>
