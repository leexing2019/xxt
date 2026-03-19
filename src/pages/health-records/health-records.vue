<template>
  <view class="health-records-page">
    <!-- 顶部统计卡片 -->
    <view class="header">
      <view class="stats-card">
        <view class="stat-row">
          <text class="stat-label">本周服药依从性</text>
          <text class="stat-value">{{ complianceRate }}%</text>
        </view>
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: complianceRate + '%' }"></view>
        </view>
        <view class="stat-tips">
          <text v-if="complianceRate >= 90">👍 非常好，继续保持！</text>
          <text v-else-if="complianceRate >= 70">💪 不错，可以做得更好</text>
          <text v-else>⚠️ 请按时服药哦</text>
        </view>
      </view>
    </view>

    <!-- 今日感觉 -->
    <view class="today-section">
      <view class="section-title">今天感觉怎么样？</view>
      <view class="feeling-options">
        <view
          v-for="option in feelingOptions"
          :key="option.value"
          class="feeling-btn"
          :class="{ selected: todayFeeling === option.value }"
          @click="selectFeeling(option.value)"
        >
          <text class="feeling-icon">{{ option.icon }}</text>
          <text class="feeling-label">{{ option.label }}</text>
        </view>
      </view>
      <view v-if="todayFeeling" class="note-section">
        <textarea
          v-model="todayNote"
          class="note-input"
          placeholder="记录一下今天的身体状况或注意事项（可选）"
          maxlength="200"
        />
        <button class="save-btn" @click="saveTodayFeeling">保存记录</button>
      </view>
    </view>

    <!-- 健康记录列表 -->
    <view class="records-section">
      <view class="section-header">
        <text class="section-title">最近记录</text>
        <text class="section-link" @click="showAllRecords">查看全部</text>
      </view>

      <view v-if="recentRecords.length === 0" class="empty-state">
        <text class="empty-icon">📊</text>
        <text class="empty-text">暂无健康记录</text>
        <text class="empty-hint">记录每天的身体状况，更好地管理健康</text>
      </view>

      <view v-else class="records-list">
        <view v-for="record in recentRecords" :key="record.id" class="record-card">
          <view class="record-date">
            <text class="record-day">{{ formatDay(record.date) }}</text>
            <text class="record-month">{{ formatMonth(record.date) }}</text>
          </view>
          <view class="record-content">
            <view v-if="record.overall_feeling" class="record-feeling">
              {{ getFeelingLabel(record.overall_feeling) }}
            </view>
            <view v-if="record.notes" class="record-notes">{{ record.notes }}</view>
            <view v-if="record.symptoms && Object.keys(record.symptoms).length > 0" class="record-symptoms">
              <text class="symptom-label">症状：</text>
              <text class="symptom-list">{{ Object.values(record.symptoms).join('、') }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 快捷入口 -->
    <view class="quick-actions">
      <view class="quick-btn" @click="goMedicalHistory">
        <text class="quick-icon">📋</text>
        <text class="quick-label">病史小结</text>
      </view>
      <view class="quick-btn emergency" @click="goEmergency">
        <text class="quick-icon">🆘</text>
        <text class="quick-label">紧急求助</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useHealthStore } from '@/store/health'
import { useMedicationStore } from '@/store/medication'

const healthStore = useHealthStore()
const medicationStore = useMedicationStore()

const todayFeeling = ref('')
const todayNote = ref('')
const recentRecords = computed(() => healthStore.healthRecords.slice(0, 7))

const feelingOptions = [
  { value: 'better', label: '好转', icon: '😊' },
  { value: 'same', label: '无变化', icon: '😐' },
  { value: 'worse', label: '加重', icon: '😟' }
]

const compliance = computed(() => healthStore.getComplianceStats())
const complianceRate = computed(() => compliance.value.rate)

// 选择今日感觉
async function selectFeeling(value: string) {
  todayFeeling.value = value
  if (!todayNote.value) {
    todayNote.value = ''
  }
}

// 保存今日感觉
async function saveTodayFeeling() {
  const today = new Date().toISOString().split('T')[0]

  const result = await healthStore.addHealthRecord({
    date: today,
    overall_feeling: todayFeeling.value,
    notes: todayNote.value || undefined,
    symptoms: {},
    vital_signs: {}
  })

  if (result.success) {
    uni.showToast({ title: '已保存', icon: 'success' })
    todayFeeling.value = ''
    todayNote.value = ''
  }
}

// 格式化日期
function formatDay(date: string): string {
  return new Date(date).getDate().toString()
}

function formatMonth(date: string): string {
  return `${new Date(date).getMonth() + 1}月`
}

function getFeelingLabel(feeling: string): string {
  const option = feelingOptions.find(o => o.value === feeling)
  return option ? `${option.icon} ${option.label}` : feeling
}

// 跳转病史问答
function goMedicalHistory() {
  uni.navigateTo({ url: '/pages/medical-history/medical-history' })
}

// 查看全部记录
function showAllRecords() {
  uni.showToast({ title: '查看全部记录', icon: 'none' })
}

// 跳转紧急页面
function goEmergency() {
  uni.navigateTo({ url: '/pages/emergency/emergency' })
}

onMounted(() => {
  healthStore.fetchHealthRecords()
  medicationStore.fetchTodayLogs()
})
</script>

<style lang="scss" scoped>
.health-records-page {
  min-height: 100vh;
  background: #F5F5F5;
}

.header {
  background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
  padding: 40rpx 32rpx;
}

.stats-card {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16rpx;
  padding: 32rpx;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.stat-label {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
}

.stat-value {
  font-size: 56rpx;
  font-weight: bold;
  color: white;
}

.progress-bar {
  height: 12rpx;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 6rpx;
  margin-bottom: 16rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: white;
  border-radius: 6rpx;
  transition: width 0.3s ease;
}

.stat-tips {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.95);
}

.today-section {
  background: white;
  padding: 32rpx;
  margin: 32rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
}

.feeling-options {
  display: flex;
  justify-content: space-around;
  margin-bottom: 24rpx;
}

.feeling-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 28rpx;
  background: #F5F5F5;
  border-radius: 16rpx;
  transition: all 0.2s ease;

  &.selected {
    background: #E8F5E9;
    border: 2rpx solid #4CAF50;
  }
}

.feeling-icon {
  font-size: 48rpx;
  margin-bottom: 8rpx;
}

.feeling-label {
  font-size: 24rpx;
  color: #666;
}

.note-section {
  margin-top: 16rpx;
}

.note-input {
  width: 100%;
  min-height: 120rpx;
  padding: 20rpx;
  background: #F5F5F5;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
}

.save-btn {
  margin-top: 16rpx;
  background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
  color: white;
  border: none;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
  font-weight: bold;
}

.records-section {
  padding: 0 32rpx 32rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.section-link {
  font-size: 24rpx;
  color: #4CAF50;
}

.empty-state {
  text-align: center;
  padding: 80rpx 40rpx;
  background: white;
  border-radius: 16rpx;
}

.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #666;
  display: block;
  margin-bottom: 12rpx;
}

.empty-hint {
  font-size: 24rpx;
  color: #999;
  display: block;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.record-card {
  background: white;
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.record-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.record-day {
  font-size: 40rpx;
  font-weight: bold;
  color: #4CAF50;
}

.record-month {
  font-size: 22rpx;
  color: #999;
}

.record-content {
  flex: 1;
}

.record-feeling {
  font-size: 28rpx;
  margin-bottom: 8rpx;
}

.record-notes {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 8rpx;
  line-height: 1.5;
}

.record-symptoms {
  font-size: 24rpx;
  color: #999;
}

.symptom-label {
  font-weight: bold;
  color: #666;
}

.quick-actions {
  padding: 0 32rpx 40rpx;
  display: flex;
  gap: 20rpx;
}

.quick-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx;
  background: white;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

  &.emergency {
    background: linear-gradient(135deg, #F44336 0%, #D32F2F 100%);

    .quick-icon,
    .quick-label {
      color: white;
    }
  }
}

.quick-icon {
  font-size: 48rpx;
  margin-bottom: 12rpx;
}

.quick-label {
  font-size: 26rpx;
  color: #666;
}
</style>
