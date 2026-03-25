<template>
  <view class="container page-fade-in">
    <!-- 顶部问候卡片 -->
    <view class="header-card">
      <view class="greeting-section">
        <text class="greeting-text">{{ greeting }}</text>
        <text class="date-text">{{ currentDate }}</text>
      </view>
      <view class="voice-btn" @click="startVoiceInput">
        <text class="voice-icon">🎤</text>
      </view>
    </view>

    <!-- 进度环形卡片 -->
    <view class="progress-card card">
      <view class="progress-content">
        <view class="progress-ring-container">
          <svg class="progress-ring" width="120" height="120" viewBox="0 0 120 120">
            <!-- 背景圆环 -->
            <circle
              class="progress-ring-bg"
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke="#E0E0E0"
              stroke-width="12"
            />
            <!-- 进度圆环 -->
            <circle
              class="progress-ring-fill"
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke="url(#progressGradient)"
              stroke-width="12"
              stroke-linecap="round"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="dashOffset"
              transform="rotate(-90 60 60)"
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#4CAF50" />
                <stop offset="100%" stop-color="#45a049" />
              </linearGradient>
            </defs>
          </svg>
          <view class="progress-center-text">
            <text class="center-percent">{{ progressPercent }}%</text>
            <text class="center-label">已完成</text>
          </view>
        </view>
        <view class="progress-details">
          <view class="detail-item">
            <text class="detail-value">{{ takenCount }}</text>
            <text class="detail-label">已服用</text>
          </view>
          <view class="detail-divider" />
          <view class="detail-item">
            <text class="detail-value">{{ totalCount }}</text>
            <text class="detail-label">总计划</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 加载中 -->
    <view v-if="medicationStore.loading" class="loading-state">
      <text class="loading-icon">⏳</text>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 空状态 - 没有用药计划 -->
    <view v-else-if="todayMedications.length === 0" class="empty-state">
      <text class="empty-state-icon">💊</text>
      <text class="empty-state-text">暂无用药计划</text>
      <text class="empty-state-hint">添加您的第一个服药计划吧</text>
      <button class="btn btn-primary mt-20" @click="goAddMedication">添加服药计划</button>
    </view>

    <!-- 用药列表 - 待服用区域 -->
    <view v-if="pendingMedications.length > 0" class="medications-section">
      <text class="section-title">待服用</text>
      <view v-for="item in pendingMedications" :key="item.id" class="medication-item card pending">
        <view class="medication-header">
          <view class="medication-time">
            <text class="time-icon">⏰</text>
            <text class="time-text">{{ item.time_of_day }}</text>
          </view>
          <view class="medication-action">
            <button
              class="btn btn-primary btn-take"
              @click="takeMedication(item)"
            >
              服用
            </button>
          </view>
        </view>
        <view class="medication-content">
          <!-- 药品图标 -->
          <view class="medication-icon-wrapper">
            <MedicationIcon
              :name="item.common_medications?.name || '药'"
              :appearance-desc="item.common_medications?.appearance_desc"
              :size="100"
            />
          </view>
          <!-- 药品信息 -->
          <view class="medication-details">
            <text class="medication-name">{{ item.common_medications?.name }}</text>
            <view class="medication-appearance">
              <text class="appearance-icon">🔍</text>
              <text class="appearance-text">{{ item.common_medications?.appearance_desc || '请遵医嘱使用' }}</text>
            </view>
            <text class="medication-dosage">用量：{{ item.dosage }}</text>
            <text class="medication-instructions">💡 {{ item.instructions || '请遵医嘱使用' }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 用药列表 - 已服用区域 -->
    <view v-if="takenMedications.length > 0" class="medications-section taken-section">
      <text class="section-title">已服用</text>
      <view v-for="item in takenMedications" :key="item.id" class="medication-item card taken">
        <view class="medication-header">
          <view class="medication-time">
            <text class="time-icon">⏰</text>
            <text class="time-text">{{ item.time_of_day }}</text>
          </view>
          <view class="medication-action">
            <view class="status-tag" :class="getMedicationStatus(item).class">
              <text v-if="getMedicationStatus(item).class === 'early'">🕐</text>
              <text v-else-if="getMedicationStatus(item).class === 'ontime'">✅</text>
              <text v-else-if="getMedicationStatus(item).class === 'late'">⏰</text>
              {{ getMedicationStatus(item).label }}
            </view>
          </view>
        </view>
        <view class="medication-content">
          <!-- 药品图标 -->
          <view class="medication-icon-wrapper">
            <MedicationIcon
              :name="item.common_medications?.name || '药'"
              :appearance-desc="item.common_medications?.appearance_desc"
              :size="100"
            />
          </view>
          <!-- 药品信息 -->
          <view class="medication-details">
            <text class="medication-name">{{ item.common_medications?.name }}</text>
            <view class="medication-appearance">
              <text class="appearance-icon">🔍</text>
              <text class="appearance-text">{{ item.common_medications?.appearance_desc || '请遵医嘱使用' }}</text>
            </view>
            <text class="medication-dosage">用量：{{ item.dosage }}</text>
            <text class="medication-instructions">💡 {{ item.instructions || '请遵医嘱使用' }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import { useMedicationStore } from '@/store/medication'
import { speakText, recognizeSpeech } from '@/services/voice'
import { showImmediateNotification, vibrate } from '@/services/reminder'
import type { MedicationSchedule } from '@/store/medication'
import MedicationIcon from '@/components/MedicationIcon.vue'

const authStore = useAuthStore()
const medicationStore = useMedicationStore()

// 记录上一次的用户 ID，检测用户切换
let lastUserId: string | null = null

// 页面加载时检查登录状态
onMounted(async () => {
  // 等待认证初始化完成
  let waitCount = 0
  while (!authStore.initialized && waitCount < 50) {
    await new Promise(resolve => setTimeout(resolve, 100))
    waitCount++
  }

  // 如果未登录，跳转到登录页
  if (!authStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/login' })
  } else {
    // 已登录，加载数据
    lastUserId = authStore.userId
    await medicationStore.fetchSchedules()
    await medicationStore.fetchTodayLogs()
  }
})

// 从 store 加载真实数据
const todayMedications = computed(() => {
  if (!medicationStore.schedules.length) return []

  const now = new Date()
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay() // 周一=1, 周日=7

  return medicationStore.schedules
    .filter(s => s.is_active && s.weekdays.includes(dayOfWeek))
    .map(schedule => {
      const log = medicationStore.todayLogs.find(log => log.schedule_id === schedule.id && log.status === 'taken')
      return {
        ...schedule,
        taken: !!log,
        taken_time: log?.taken_time
      }
    })
})

// 分离未服用和已服用的药品
const pendingMedications = computed(() => {
  return todayMedications.value
    .filter(m => !m.taken)
    .sort((a, b) => a.time_of_day.localeCompare(b.time_of_day))
})

const takenMedications = computed(() => {
  return todayMedications.value
    .filter(m => m.taken)
    .sort((a, b) => a.time_of_day.localeCompare(b.time_of_day))
})

// 获取服药状态标签
const getMedicationStatus = (item: any) => {
  if (!item.taken) {
    return { label: '待服用', class: 'pending', isLate: false }
  }

  if (!item.taken_time) {
    return { label: '已服用', class: 'taken', isLate: false }
  }

  const scheduled = new Date(`1970-01-01T${item.time_of_day}`)
  const taken = new Date(item.taken_time)
  const diffMinutes = (taken.getTime() - scheduled.getTime()) / 60000

  if (diffMinutes < -15) {
    return { label: '提前', class: 'early', isLate: false }
  } else if (diffMinutes > 15) {
    return { label: '过时', class: 'late', isLate: true }
  } else {
    return { label: '准点', class: 'ontime', isLate: false }
  }
}

// 计算属性
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '凌晨好'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  if (hour < 22) return '晚上好'
  return '夜深了'
})

const currentDate = computed(() => {
  const date = new Date()
  return `${date.getMonth() + 1}月${date.getDate()}日 ${['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]}`
})

const totalCount = computed(() => todayMedications.value.length)
const takenCount = computed(() => todayMedications.value.filter(m => m.taken).length)
const progressPercent = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((takenCount.value / totalCount.value) * 100)
})

// 进度环计算
const radius = 48
const circumference = computed(() => 2 * Math.PI * radius)
const dashOffset = computed(() => circumference.value - (progressPercent.value / 100) * circumference.value)

// 服用药品
async function takeMedication(item: any) {
  if (item.taken) {
    uni.showToast({ title: '已确认服药', icon: 'success' })
    return
  }

  // 检查是否过时
  const status = getMedicationStatus(item)
  if (status.isLate) {
    // 计算超时分钟数
    const scheduled = new Date(`1970-01-01T${item.time_of_day}`)
    const now = new Date(`1970-01-01T${new Date().toTimeString().slice(0, 8)}`)
    const diffMinutes = Math.floor((now.getTime() - scheduled.getTime()) / 60000)

    const confirmed = await new Promise<boolean>((resolve) => {
      uni.showModal({
        title: '超时提醒',
        content: `您已超时${diffMinutes}分钟，是否确认服药？`,
        confirmText: '确认',
        cancelText: '取消',
        success: (res) => {
          resolve(res.confirm)
        }
      })
    })

    if (!confirmed) return
  }

  uni.showModal({
    title: '确认服药',
    content: `确认已服用 ${item.common_medications?.name} ${item.dosage}？`,
    confirmText: '确认',
    cancelText: '取消',
    success: async (res) => {
      if (res.confirm) {
        item.taken = true
        vibrate()
        uni.vibrateShort()

        // 创建或更新日志
        const existingLog = medicationStore.todayLogs.find(log => log.schedule_id === item.id)
        if (!existingLog) {
          await medicationStore.logMedication(item.id, 'taken')
        }

        if (takenCount.value + 1 === totalCount.value) {
          speakText('太棒了！今日用药已全部完成')
          showImmediateNotification('🎉 今日完成', '您已完成今日所有用药计划')
        } else {
          speakText(`已记录。还剩${totalCount.value - takenCount.value - 1}次用药`)
        }

        uni.showToast({ title: '已确认服药', icon: 'success' })
      }
    }
  })
}

// 语音输入
async function startVoiceInput() {
  uni.showToast({ title: '请说话...', icon: 'none', duration: 2000 })

  const result = await recognizeSpeech()

  if (result.success && result.text) {
    handleVoiceCommand(result.text)
  } else {
    uni.showToast({ title: result.error || '语音识别失败', icon: 'none' })
  }
}

// 处理语音命令
function handleVoiceCommand(text: string) {
  const lowerText = text.toLowerCase()

  if (lowerText.includes('添加') || lowerText.includes('新药')) {
    goAddMedication()
  } else if (lowerText.includes('紧急') || lowerText.includes('帮助')) {
    goEmergency()
  } else if (lowerText.includes('提醒') || lowerText.includes('几点')) {
    speakText(`今天共有${totalCount.value}次用药计划，已完成${takenCount.value}次`)
  } else {
    speakText(`您说的是：${text}`)
    uni.showToast({ title: `识别：${text}`, icon: 'none' })
  }
}

// 跳转紧急页面
function goEmergency() {
  uni.navigateTo({ url: '/pages/emergency/emergency' })
}

// 跳转添加药品
function goAddMedication() {
  uni.navigateTo({ url: '/pages/add-medication/add-medication' })
}

// 图片加载错误处理
function handleImageError() {
  // 图片加载失败时静默处理，显示占位符
  console.log('药品图片加载失败，显示占位符')
}

// 检测用户切换 - uni-app onShow 生命周期
async function onShow() {
  // 等待认证初始化
  if (!authStore.initialized) {
    let waitCount = 0
    while (!authStore.initialized && waitCount < 50) {
      await new Promise(resolve => setTimeout(resolve, 100))
      waitCount++
    }
  }

  // 检查用户是否切换
  if (authStore.userId !== lastUserId) {
    // 清除旧数据并重新加载
    medicationStore.schedules = []
    medicationStore.todayLogs = []
    medicationStore.medications = []
    lastUserId = authStore.userId

    if (authStore.isLoggedIn) {
      await medicationStore.fetchSchedules()
      await medicationStore.fetchTodayLogs()
    }
  }
}

onMounted(() => {
  if (!authStore.isLoggedIn) {
    uni.redirectTo({ url: '/pages/login/login' })
  } else {
    medicationStore.fetchSchedules()
    medicationStore.fetchTodayLogs()
  }

  // 监听页面显示
  uni.$on('pageShow', () => {
    if (authStore.isLoggedIn) {
      medicationStore.fetchSchedules()
      medicationStore.fetchTodayLogs()
    }
  })

  // 监听退出登录，清除用户数据
  uni.$on('userLoggedOut', () => {
    medicationStore.schedules = []
    medicationStore.todayLogs = []
    medicationStore.medications = []
  })
})
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #F5F5F5;
  padding-bottom: 140px;
}

.header-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 20px;
  background: linear-gradient(135deg, #2196F3, #1976D2);
  border-radius: 0 0 24px 24px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.greeting-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.greeting-text {
  font-size: 26px;
  font-weight: 700;
  color: white;
}

.date-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
}

.voice-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:active {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(0.95);
  }
}

.voice-icon {
  font-size: 24px;
}

.progress-card {
  margin: 12px;
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.progress-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.progress-ring-container {
  position: relative;
  width: 120px;
  height: 120px;
  margin-bottom: 12px;
}

.progress-ring {
  width: 120px;
  height: 120px;
}

.progress-ring-bg {
  stroke: #E0E0E0;
}

.progress-ring-fill {
  transition: stroke-dashoffset 0.5s ease;
}

.progress-center-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.center-percent {
  font-size: 24px;
  font-weight: 700;
  color: #4CAF50;
  line-height: 1;
}

.center-label {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.progress-details {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  width: 100%;
  padding-top: 12px;
  border-top: 1px solid #F0F0F0;
}

.detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.detail-value {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.detail-label {
  font-size: 12px;
  color: #666;
}

.detail-divider {
  width: 1px;
  height: 24px;
  background: #E0E0E0;
}

.medications-section {
  padding: 0 16px;
}

.section-title {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.medication-item {
  display: flex;
  flex-direction: column;
  padding: 16px;
  margin-bottom: 16px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.medication-item.pending {
  background: white;
  border-left: 4rpx solid #2196F3;
}

.medication-item.taken {
  background: linear-gradient(135deg, #E8F5E9 0%, #F5F5F5 100%);
  border-left: 4rpx solid #A5D6A7;
  opacity: 0.85;
}

.taken-section {
  margin-top: 8px;
}

.medication-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #F0F0F0;
}

.medication-time {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-icon {
  font-size: 18px;
}

.time-text {
  font-size: 18px;
  font-weight: 600;
  color: #2196F3;
}

.medication-action {
  display: flex;
  align-items: center;
}

.btn-take {
  padding: 10px 28px;
  font-size: 16px;
  min-height: 42px;
  border-radius: 20px;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.taken-badge {
  font-size: 15px;
  color: #4CAF50;
  font-weight: 600;
  padding: 8px 16px;
  background: #E8F5E9;
  border-radius: 16px;
}

/* 状态标签样式 */
.status-tag {
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4rpx;

  &.pending {
    background: #E3F2FD;
    color: #1565C0;
  }

  &.early {
    background: #FFF3E0;
    color: #E65100;
  }

  &.ontime {
    background: #E8F5E9;
    color: #1B5E20;
  }

  &.late {
    background: #FFEBEE;
    color: #B71C1C;
  }

  &.taken {
    background: #E8F5E9;
    color: #1B5E20;
  }
}

.medication-content {
  display: flex;
  gap: 16px;
}

.medication-icon-wrapper {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.medication-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.medication-name {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  line-height: 1.3;
}

.medication-appearance {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%);
  border-radius: 8px;
  margin: 4px 0;
}

.appearance-icon {
  font-size: 14px;
}

.appearance-text {
  font-size: 13px;
  color: #E65100;
  line-height: 1.4;
  flex: 1;
}

.medication-dosage {
  font-size: 15px;
  color: #333;
  font-weight: 500;
}

.medication-instructions {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  padding: 8px 10px;
  background: #F5F5F5;
  border-radius: 8px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-state-icon {
  font-size: 56px;
  display: block;
  margin-bottom: 12px;
}

.empty-state-text {
  font-size: 17px;
  color: #666;
  display: block;
  margin-bottom: 6px;
}

.empty-state-hint {
  font-size: 13px;
  color: #999;
  display: block;
  margin-bottom: 16px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 28px;
  border-radius: 10px;
  font-size: 18px;
  border: none;
  cursor: pointer;
  background-color: #2196F3;
  color: white;
}

.btn-primary {
  background-color: #2196F3;
}

.mt-20 {
  margin-top: 20px;
}

.loading-state {
  text-align: center;
  padding: 80px 20px;
}

.loading-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
  animation: pulse 1.5s ease-in-out infinite;
}

.loading-text {
  font-size: 18px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-state-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
}

.empty-state-text {
  font-size: 18px;
  color: #666;
  display: block;
  margin-bottom: 8px;
}

.empty-state-hint {
  font-size: 14px;
  color: #999;
  display: block;
  margin-bottom: 20px;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}
</style>
