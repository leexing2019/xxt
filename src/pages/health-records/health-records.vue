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
        <view class="progress-animation-hint"></view>
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
          v-for="(option, index) in feelingOptions"
          :key="option.value"
          :class="[`feeling-btn stagger-in-${index + 1}`, { selected: todayFeeling === option.value }]"
          @click="selectFeeling(option.value)"
        >
          <view class="feeling-icon-wrapper">
            <text class="feeling-icon">{{ option.icon }}</text>
          </view>
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

  // 监听退出登录，清除用户数据
  uni.$on('userLoggedOut', () => {
    healthStore.healthRecords = []
    healthStore.medicalHistoryAnswers = []
  })
})
</script>

<style lang="scss" scoped>
.health-records-page {
  min-height: 100vh;
  background: var(--bg-color);
}

.header {
  background: linear-gradient(135deg, #43A047 0%, #2E7D32 100%);
  padding: 40rpx 32rpx;
  border-radius: 0 0 24rpx 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(67, 160, 71, 0.4);
}

.stats-card {
  background: rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(12px);
  border-radius: 16rpx;
  padding: 32rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.stat-label {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 1);
  font-weight: 500;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
}

.stat-value {
  font-size: 56rpx;
  font-weight: bold;
  color: white;
  text-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.25);
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
  background: linear-gradient(90deg, #fff 0%, #e8f5e9 100%);
  border-radius: 6rpx;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-animation-hint {
  height: 2rpx;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 50%, transparent 100%);
  margin-top: 4rpx;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.3;
  }
}

.stat-tips {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 1);
  font-weight: 500;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
}

.today-section {
  background: var(--card-bg);
  padding: 32rpx;
  margin: 32rpx;
  border-radius: 16rpx;
  box-shadow: var(--shadow-md);
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: var(--text-primary);
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
  padding: 28rpx 36rpx;
  min-width: 140rpx;
  background: var(--bg-color);
  border-radius: 20rpx;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.selected {
    background: var(--success-bg);
    border: 3rpx solid var(--success-color);
    transform: translateY(-4rpx);
    box-shadow: 0 8rpx 16rpx rgba(76, 175, 80, 0.2);
  }
}

.feeling-icon-wrapper {
  width: 88rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(46, 125, 50, 0.1) 100%);
  border-radius: 50%;
  transition: all 0.3s ease;

  .feeling-btn.selected & {
    background: linear-gradient(135deg, var(--success-color) 0%, var(--success-dark) 100%);
    transform: scale(1.1);
  }
}

.feeling-icon {
  font-size: 48rpx;
  line-height: 1;
}

.feeling-label {
  font-size: 26rpx;
  color: var(--text-secondary);
  font-weight: 500;
}

.note-section {
  margin-top: 16rpx;
}

.note-input {
  width: 100%;
  min-height: 120rpx;
  padding: 20rpx;
  background: var(--bg-color);
  border-radius: 12rpx;
  font-size: 28rpx;
  color: var(--text-primary);
  box-sizing: border-box;
  border: 2rpx solid transparent;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: var(--success-color);
  }
}

.save-btn {
  margin-top: 16rpx;
  background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
  color: white;
  border: none;
  border-radius: 12rpx;
  padding: 24rpx 48rpx;
  font-size: 30rpx;
  font-weight: 600;
  box-shadow: 0 6rpx 16rpx rgba(76, 175, 80, 0.4);
  transition: all 0.2s ease;
  letter-spacing: 1px;

  &:active {
    transform: scale(0.96);
    box-shadow: 0 3rpx 10rpx rgba(76, 175, 80, 0.3);
  }
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
  color: var(--text-primary);
}

.section-link {
  font-size: 24rpx;
  color: var(--success-color);
}

.empty-state {
  text-align: center;
  padding: 80rpx 40rpx;
  background: var(--card-bg);
  border-radius: 16rpx;
  box-shadow: var(--shadow-md);
}

.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 28rpx;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 12rpx;
}

.empty-hint {
  font-size: 24rpx;
  color: var(--text-disabled);
  display: block;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.record-card {
  background: var(--card-bg);
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  box-shadow: var(--shadow-md);
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.98);
    box-shadow: var(--shadow-sm);
  }
}

.record-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 96rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--success-bg) 0%, rgba(76, 175, 80, 0.05) 100%);
  border-radius: 12rpx;
  padding: 16rpx 8rpx;
  border: 2rpx solid rgba(76, 175, 80, 0.1);
}

.record-day {
  font-size: 48rpx;
  font-weight: bold;
  color: var(--success-color);
  line-height: 1;
}

.record-month {
  font-size: 22rpx;
  color: var(--text-secondary);
  margin-top: 4rpx;
}

.record-content {
  flex: 1;
}

.record-feeling {
  font-size: 28rpx;
  margin-bottom: 8rpx;
  color: var(--text-primary);
}

.record-notes {
  font-size: 26rpx;
  color: var(--text-secondary);
  margin-bottom: 8rpx;
  line-height: 1.5;
}

.record-symptoms {
  font-size: 24rpx;
  color: var(--text-disabled);
}

.symptom-label {
  font-weight: bold;
  color: var(--text-secondary);
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
  background: var(--card-bg);
  border-radius: 16rpx;
  box-shadow: var(--shadow-md);
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.98);
    box-shadow: var(--shadow-sm);
  }

  &.emergency {
    background: linear-gradient(135deg, #FF6B6B 0%, #C62828 100%);
    box-shadow: 0 4rpx 16rpx rgba(255, 107, 107, 0.3);

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
  color: var(--text-secondary);
  font-weight: 500;
}
</style>
