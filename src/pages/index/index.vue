<template>
  <view class="container page-fade-in">
    <!-- 顶部问候卡片 -->
    <view class="header-card">
      <view class="greeting-section">
        <text class="greeting-text">{{ greeting }}</text>
        <text class="date-text">{{ currentDate }}</text>
      </view>
    </view>

    <!-- 进度卡片 -->
    <view class="progress-card">
      <view class="progress-row">
        <text class="progress-label">今日进度</text>
        <text class="progress-value">{{ progressPercent }}%</text>
      </view>
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
      </view>
      <view class="progress-stats">
        <view class="stat">
          <text class="stat-value">{{ takenCount }}</text>
          <text class="stat-label">已服用</text>
        </view>
        <view class="stat">
          <text class="stat-value">{{ totalCount }}</text>
          <text class="stat-label">总计划</text>
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
      <view class="section-header">
        <text class="section-icon">⏰</text>
        <text class="section-title">待服用</text>
        <text class="section-count">{{ pendingMedications.length }}</text>
      </view>
      <view v-for="item in pendingMedications" :key="item.id" class="med-card pending">
        <view class="med-header">
          <view class="med-avatar">
            <image
              v-if="item.common_medications?.image_url"
              :src="getImageUrl(item.common_medications.image_url)"
              class="med-image"
              mode="aspectFill"
              @error="handleImageError(item)"
            />
            <text v-else class="med-avatar-emoji">💊</text>
          </view>
          <view class="med-info">
            <text class="med-name">{{ item.common_medications?.name }}</text>
            <view class="med-meta">
              <text class="med-time-badge">⏰ {{ item.time_of_day }}</text>
              <text class="med-dose">{{ item.dosage }}</text>
            </view>
          </view>
          <view class="status-badge" :class="getPendingStatusClass(item)">
            <text>{{ getPendingStatusLabel(item) }}</text>
          </view>
        </view>
        <view class="med-content">
          <view class="med-row" v-if="item.common_medications?.appearance_desc">
            <text class="med-row-icon">🔍</text>
            <view class="med-row-content">
              <text class="med-row-label">外观</text>
              <text class="med-row-text">{{ item.common_medications.appearance_desc }}</text>
            </view>
          </view>
          <view class="med-row">
            <text class="med-row-icon">💡</text>
            <view class="med-row-content">
              <text class="med-row-label">注意事项</text>
              <text class="med-row-text">{{ item.instructions || '请遵医嘱使用' }}</text>
            </view>
          </view>
        </view>
        <view class="med-actions">
          <button class="btn btn-detail" @click="goDetail(item)">📋 详情</button>
          <button class="btn btn-take" @click="takeMedication(item)">✅ 服用</button>
        </view>
      </view>
    </view>

    <!-- 用药列表 - 已服用区域 -->
    <view v-if="takenMedications.length > 0" class="medications-section taken-section">
      <view class="section-header">
        <text class="section-icon">✅</text>
        <text class="section-title">已服用</text>
        <text class="section-count taken-count">{{ takenMedications.length }}</text>
      </view>
      <view v-for="item in takenMedications" :key="item.id" class="med-card taken">
        <view class="med-header">
          <view class="med-avatar taken-avatar">
            <image
              v-if="item.common_medications?.image_url"
              :src="getImageUrl(item.common_medications.image_url)"
              class="med-image"
              mode="aspectFill"
              @error="handleImageError(item)"
            />
            <text v-else class="med-avatar-emoji">💊</text>
          </view>
          <view class="med-info">
            <text class="med-name">{{ item.common_medications?.name }}</text>
            <view class="med-meta">
              <text class="med-time-badge">⏰ {{ item.time_of_day }}</text>
              <text class="med-dose">{{ item.dosage }}</text>
            </view>
          </view>
          <view class="status-badge" :class="getMedicationStatus(item).class">
            <text v-if="getMedicationStatus(item).class === 'early'">🕐</text>
            <text v-else-if="getMedicationStatus(item).class === 'ontime'">✅</text>
            <text v-else-if="getMedicationStatus(item).class === 'late'">⏰</text>
            <text>{{ getMedicationStatus(item).label }}</text>
          </view>
        </view>
        <view class="taken-badge">
          <text>✓ 已于 {{ formatTakenTime(item.taken_time) }} 服用</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import { useMedicationStore } from '@/store/medication'
import { showImmediateNotification, vibrate } from '@/services/reminder'
import type { MedicationSchedule } from '@/store/medication'
import MedicationIcon from '@/components/MedicationIcon.vue'
import { startLocalMedicationReminder, stopLocalMedicationReminder } from '@/services/local-reminder'

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

    // 启动本地服药提醒监听
    startLocalMedicationReminder(authStore.userId!)
  }
})

// 页面卸载时停止本地提醒监听
onUnmounted(() => {
  stopLocalMedicationReminder()
  uni.$off('pageShow')
  uni.$off('userLoggedOut')
})

// 从 store 加载真实数据（24 小时动态窗口 + 漏服检测）
const todayMedications = computed(() => {
  if (!medicationStore.schedules.length) return []

  const now = new Date()
  const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay() // 周一=1，周日=7
  const currentHour = now.getHours()
  const currentMinutes = currentHour * 60 + now.getMinutes() // 当前时间的分钟数（0-1439）

  return medicationStore.schedules
    .filter(s => s.is_active && s.weekdays.includes(currentDayOfWeek))
    .map(schedule => {
      const log = medicationStore.todayLogs.find(log => log.schedule_id === schedule.id && log.status === 'taken')

      // 解析服药时间
      const [scheduleHour, scheduleMinute] = schedule.time_of_day.split(':').map(Number)
      const scheduledMinutes = scheduleHour * 60 + scheduleMinute // 计划时间的分钟数

      // 计算时间差（分钟）
      let timeDiff = currentMinutes - scheduledMinutes

      // 处理跨天情况（如果当前时间在计划时间之前，说明是第二天的计划）
      if (timeDiff < 0) {
        timeDiff += 24 * 60 // 加上 24 小时的分钟数
      }

      // 24 小时窗口判定：只显示 24 小时内的计划
      const isInWindow = timeDiff < 24 * 60

      // 漏服判定：超过 4 小时（240 分钟）未服用
      const isMissed = !log && timeDiff > 240

      return {
        ...schedule,
        taken: !!log,
        taken_time: log?.taken_time,
        isMissed, // 是否已漏服
        isInWindow, // 是否在 24 小时窗口内
        timeDiff // 距离计划时间的分钟差
      }
    })
    .filter(item => {
      // 过滤条件：
      // 1. 必须在 24 小时窗口内
      // 2. 如果已漏服，也过滤掉（不再展示）
      return item.isInWindow && !item.isMissed
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

// 获取待服用状态标签 class
const getPendingStatusClass = (item: any) => {
  const now = new Date()
  const scheduled = new Date(`1970-01-01T${item.time_of_day}`)
  const diffMinutes = (now.getTime() - scheduled.getTime()) / 60000

  if (diffMinutes < -15) return 'early'
  if (diffMinutes <= 15) return 'ontime'
  return 'late'
}

// 获取待服用状态标签文字
const getPendingStatusLabel = (item: any) => {
  const now = new Date()
  const scheduled = new Date(`1970-01-01T${item.time_of_day}`)
  const diffMinutes = (now.getTime() - scheduled.getTime()) / 60000

  if (diffMinutes < -15) return '🕐 提前'
  if (diffMinutes <= 15) return '✅ 准点'
  return '⏰ 过时'
}

// 格式化服用时间
const formatTakenTime = (takenTime: string) => {
  if (!takenTime) return ''
  const date = new Date(takenTime)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

// 跳转详情页
function goDetail(item: any) {
  uni.navigateTo({
    url: `/pages/medication-detail/medication-detail?id=${item.id}`
  })
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

// 跳转紧急页面
function goEmergency() {
  uni.navigateTo({ url: '/pages/emergency/emergency' })
}

// 跳转添加药品
function goAddMedication() {
  uni.navigateTo({ url: '/pages/add-medication/add-medication' })
}

// 图片加载错误处理
function handleImageError(item: any) {
  // 图片加载失败时静默处理，显示占位符
  console.log('药品图片加载失败，显示默认图标')
}

// 获取图片 URL（处理 Base64 和 URL）
function getImageUrl(imageUrl: string): string {
  if (!imageUrl) return ''
  // 如果是 Base64，直接返回
  if (imageUrl.startsWith('data:image')) return imageUrl
  return imageUrl
}

// 下拉刷新
async function onPullDownRefresh() {
  try {
    console.log('[首页] 开始下拉刷新...')
    await medicationStore.fetchSchedules()
    await medicationStore.fetchTodayLogs()
    uni.showToast({
      title: '刷新成功',
      icon: 'success'
    })
  } catch (error) {
    console.error('[首页] 下拉刷新失败:', error)
    uni.showToast({
      title: '刷新失败',
      icon: 'error'
    })
  } finally {
    uni.stopPullDownRefresh()
  }
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

// 导出 uni-app 生命周期函数
defineExpose({
  onPullDownRefresh,
  onShow
})
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #F5F7FA;
  padding-bottom: 140px;
}

.header-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px;
  background: linear-gradient(135deg, #3B82F6, #1D4ED8);
  margin-bottom: 12px;
}

.greeting-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.greeting-text {
  font-size: 24px;
  font-weight: 700;
  color: white;
}

.date-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
}

/* 进度卡片 - 新设计 */
.progress-card {
  margin: 12px;
  background: linear-gradient(135deg, #10B981, #059669);
  border-radius: 16px;
  padding: 16px;
  color: white;
  box-shadow: 0 4px 12px rgba(16,185,129,0.2);
}

.progress-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-label {
  font-size: 14px;
  opacity: 0.9;
}

.progress-value {
  font-size: 32px;
  font-weight: 700;
}

.progress-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: #fff;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-stats {
  display: flex;
  gap: 20px;
}

.stat {
  font-size: 12px;
  display: flex;
  flex-direction: column;

  .stat-value {
    font-size: 18px;
    font-weight: 700;
  }

  .stat-label {
    opacity: 0.9;
    margin-top: 2px;
  }
}

/* 分区标题 */
.medications-section {
  padding: 0 16px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding: 6px 12px;
}

.section-icon {
  font-size: 18px;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
}

.section-count {
  background: linear-gradient(135deg, #3B82F6, #1D4ED8);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 12px;
  margin-left: auto;
}

.taken-section {
  margin-top: 16px;
}

.taken-count {
  background: linear-gradient(135deg, #10B981, #059669);
}

/* 服药卡片 - 新设计 */
.med-card {
  background: #fff;
  border-radius: 16px;
  padding: 14px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border-left: 4px solid #3B82F6;
  transition: all 0.2s ease;
}

.med-card.pending {
  border-left-color: #3B82F6;
  background: linear-gradient(135deg, #fff, #EFF6FF);
}

.med-card.taken {
  border-left-color: #10B981;
  background: linear-gradient(135deg, #fff, #ECFDF5);
  opacity: 0.95;
}

/* 卡片头部 */
.med-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

/* 药品头像 */
.med-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3B82F6, #1D4ED8);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(59,130,246,0.3);
}

.med-avatar.taken-avatar {
  background: linear-gradient(135deg, #06b6d4, #0891b2);
}

.med-avatar-emoji {
  font-size: 26px;
}

.med-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 药品信息 */
.med-info {
  flex: 1;
  min-width: 0;
}

.med-name {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 6px;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.med-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.med-time-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #EFF6FF;
  color: #1D4ED8;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
}

.med-dose {
  font-size: 11px;
  color: #64748b;
}

/* 状态标签 */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.status-badge.early {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.ontime {
  background: #dcfce7;
  color: #166534;
}

.status-badge.late {
  background: #fee2e2;
  color: #991b1b;
}

/* 卡片内容 */
.med-content {
  background: #f8fafc;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
}

.med-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;

  &:last-child {
    margin-bottom: 0;
  }
}

.med-row-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.med-row-content {
  flex: 1;
  min-width: 0;
}

.med-row-label {
  display: block;
  font-size: 11px;
  color: #64748b;
  margin-bottom: 2px;
}

.med-row-text {
  display: block;
  color: #475569;
  line-height: 1.5;
}

/* 底部按钮 */
.med-actions {
  display: flex;
  gap: 8px;
}

.btn {
  flex: 1;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-detail {
  background: #f1f5f9;
  color: #475569;
}

.btn-detail:active {
  background: #e2e8f0;
}

.btn-take {
  background: linear-gradient(135deg, #10B981, #059669);
  color: #fff;
  box-shadow: 0 2px 8px rgba(16,185,129,0.3);
}

.btn-take:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(16,185,129,0.3);
}

/* 已服用标记 */
.taken-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: linear-gradient(135deg, #dcfce7, #86efac);
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  color: #166534;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
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

.btn-primary {
  background-color: #2196F3;
}

.mt-20 {
  margin-top: 20px;
}

/* 加载状态 */
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
