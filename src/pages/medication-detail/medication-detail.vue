<template>
  <view class="medication-detail-page">
    <!-- 顶部药品信息卡片 -->
    <view class="medication-header card">
      <view class="medication-avatar">
        <image v-if="medication?.image_url" :src="medication.image_url" class="med-image" mode="aspectFill" />
        <text v-else class="med-placeholder">💊</text>
      </view>
      <view class="medication-info">
        <text class="medication-name">{{ medication?.name || '未知药品' }}</text>
        <text v-if="medication?.generic_name" class="generic-name">通用名：{{ medication.generic_name }}</text>
        <text v-if="medication?.specification" class="specification">规格：{{ medication.specification }}</text>
      </view>
    </view>

    <!-- 用药计划列表 -->
    <view class="schedules-section">
      <text class="section-title">用药计划</text>
      <view v-if="schedules.length === 0" class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无用药计划</text>
      </view>
      <view v-else v-for="schedule in schedules" :key="schedule.id" class="schedule-card card">
        <view class="schedule-header">
          <text class="schedule-time">⏰ {{ formatTime(schedule.time_of_day) }}</text>
          <text class="schedule-dosage">{{ schedule.dosage }}</text>
        </view>
        <view class="schedule-footer">
          <text class="schedule-weekdays">{{ formatWeekdays(schedule.weekdays) }}</text>
          <text v-if="schedule.instructions" class="schedule-instructions">💡 {{ schedule.instructions }}</text>
        </view>
      </view>
    </view>

    <!-- 用药统计 -->
    <view class="stats-section card">
      <view class="stat-item">
        <text class="stat-value">{{ takenCount }}</text>
        <text class="stat-label">已服用</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ missedCount }}</text>
        <text class="stat-label">漏服</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ complianceRate }}%</text>
        <text class="stat-label">依从性</text>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="bottom-actions">
      <button class="btn btn-outline" @click="editMedication">✏️ 编辑</button>
      <button class="btn btn-primary" @click="takeMedication">💊 确认服药</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMedicationStore } from '@/store/medication'

const medicationStore = useMedicationStore()

const medicationId = ref('')
const medication = ref<any>(null)
const schedules = ref<any[]>([])
const recentLogs = ref<any[]>([])

// 模拟数据
const contraindications = ref('对阿司匹林过敏者禁用')
const interactions = ref('与华法林同用可能增加出血风险')

// 计算属性
const complianceRate = computed(() => 85)
const takenCount = computed(() => 17)
const missedCount = computed(() => 3)

// 判断是否为今天
function isToday(dayOfWeek: number): boolean {
  const today = new Date().getDay()
  return today === dayOfWeek || (today === 0 && dayOfWeek === 7)
}

// 格式化时间
function formatTime(time: string): string {
  return time.slice(0, 5) // "08:00"
}

// 格式化日期
function formatDate(time: string): string {
  return new Date(time).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  })
}

// 格式化星期数组
function formatWeekdays(weekdays: number[]): string {
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return weekdays.map(d => `周${days[d]}`).join('、')
}

// 编辑药品
function editMedication() {
  uni.navigateTo({
    url: `/pages/add-medication/add-medication?id=${medicationId.value}`
  })
}

// 添加用药计划
function addSchedule() {
  uni.showToast({ title: '添加计划功能', icon: 'none' })
}

// 确认服药
function takeMedication() {
  uni.showModal({
    title: '确认服药',
    content: `确认已服用 ${medication.value?.name || '该药品'}？`,
    confirmText: '确认',
    success: async (res) => {
      if (res.confirm && schedules.value.length > 0) {
        await medicationStore.logMedication(schedules.value[0].id, 'taken')
        uni.showToast({ title: '已记录', icon: 'success' })
      }
    }
  })
}

onMounted(async () => {
  // 获取页面参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.options || {}
  medicationId.value = options.id || ''

  if (medicationId.value) {
    await medicationStore.fetchMedications()
    medication.value = medicationStore.medications.find(m => m.id === medicationId.value)
    await medicationStore.fetchSchedules()
    schedules.value = medicationStore.schedules.filter(
      s => s.medication_id === medicationId.value
    )
  }
})
</script>

<style lang="scss" scoped>
.medication-detail-page {
  min-height: 100vh;
  background: #F5F5F5;
  padding-bottom: 80px;
}

.card {
  background: white;
  border-radius: 16rpx;
  padding: 24rpx;
  margin: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.medication-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.medication-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #2196F3, #1976D2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.med-image {
  width: 100%;
  height: 100%;
}

.med-placeholder {
  font-size: 48rpx;
}

.medication-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.medication-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.generic-name, .specification {
  font-size: 24rpx;
  color: #666;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 16rpx;
  padding: 0 24rpx;
}

.schedule-card {
  margin-bottom: 16rpx;
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.schedule-time {
  font-size: 28rpx;
  font-weight: bold;
  color: #2196F3;
}

.schedule-dosage {
  font-size: 26rpx;
  color: #333;
}

.schedule-footer {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.schedule-weekdays, .schedule-instructions {
  font-size: 24rpx;
  color: #666;
}

.stats-section {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #2196F3;
}

.stat-label {
  font-size: 22rpx;
  color: #666;
  margin-top: 8rpx;
}

.stat-divider {
  width: 2rpx;
  height: 60rpx;
  background: #E0E0E0;
}

.empty-state {
  text-align: center;
  padding: 60rpx 24rpx;
}

.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 26rpx;
  color: #666;
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: white;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.08);
  display: flex;
  gap: 20rpx;
}

.bottom-actions .btn {
  flex: 1;
  padding: 16rpx 24rpx;
  font-size: 28rpx;
  border-radius: 12rpx;
}

.btn-outline {
  background: transparent;
  border: 2rpx solid #2196F3;
  color: #2196F3;
}

.btn-primary {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
  border: none;
}
</style>
