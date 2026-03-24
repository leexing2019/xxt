<template>
  <view class="stats-report-page">
    <!-- 顶部统计卡片 -->
    <view class="header">
      <view class="stats-grid">
        <view class="stat-card primary">
          <view class="stat-icon">👥</view>
          <view class="stat-content">
            <text class="stat-value">{{ stats.totalUsers }}</text>
            <text class="stat-label">总用户数</text>
          </view>
        </view>
        <view class="stat-card success">
          <view class="stat-icon">🔥</view>
          <view class="stat-content">
            <text class="stat-value">{{ stats.activeUsers }}</text>
            <text class="stat-label">活跃用户</text>
          </view>
        </view>
        <view class="stat-card warning">
          <view class="stat-icon">📋</view>
          <view class="stat-content">
            <text class="stat-value">{{ stats.totalSchedules }}</text>
            <text class="stat-label">用药计划</text>
          </view>
        </view>
        <view class="stat-card info">
          <view class="stat-icon">💊</view>
          <view class="stat-content">
            <text class="stat-value">{{ stats.todayLogs }}</text>
            <text class="stat-label">今日服药</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 时间筛选 -->
    <view class="filter-section">
      <view class="time-filters">
        <view
          :class="['time-filter', timeRange === 'today' ? 'active' : '']"
          @click="timeRange = 'today'"
        >
          今日
        </view>
        <view
          :class="['time-filter', timeRange === 'week' ? 'active' : '']"
          @click="timeRange = 'week'"
        >
          本周
        </view>
        <view
          :class="['time-filter', timeRange === 'month' ? 'active' : '']"
          @click="timeRange = 'month'"
        >
          本月
        </view>
      </view>
    </view>

    <!-- 服药记录统计 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">服药记录</text>
      </view>
      <view class="logs-card">
        <view class="log-stat">
          <view class="log-value taken">{{ logsStats.taken }}</view>
          <view class="log-label">已服药</view>
        </view>
        <view class="log-stat">
          <view class="log-value delayed">{{ logsStats.delayed }}</view>
          <view class="log-label">延迟服药</view>
        </view>
        <view class="log-stat">
          <view class="log-value missed">{{ logsStats.missed }}</view>
          <view class="log-label">漏服</view>
        </view>
      </view>
    </view>

    <!-- 依从性统计 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">用药依从性</text>
        <text class="section-subtitle">按时服药比例</text>
      </view>
      <view class="compliance-card">
        <view class="compliance-rate">
          <text class="rate-value">{{ complianceData.rate }}%</text>
          <text class="rate-label">整体依从率</text>
        </view>
        <view class="compliance-bar">
          <view class="bar-bg">
            <view
              class="bar-fill"
              :style="{ width: complianceData.rate + '%' }"
              :class="{ 'bar-fill-good': complianceData.rate >= 80, 'bar-fill-warning': complianceData.rate >= 60 && complianceData.rate < 80, 'bar-fill-bad': complianceData.rate < 60 }"
            ></view>
          </view>
          <view class="bar-labels">
            <text class="bar-label">0%</text>
            <text class="bar-label">50%</text>
            <text class="bar-label">100%</text>
          </view>
        </view>
        <view class="compliance-details">
          <view class="detail-item">
            <view class="detail-dot taken"></view>
            <text class="detail-text">按时：{{ complianceData.onTime }}</text>
          </view>
          <view class="detail-item">
            <view class="detail-dot delayed"></view>
            <text class="detail-text">延迟：{{ complianceData.delayed }}</text>
          </view>
          <view class="detail-item">
            <view class="detail-dot missed"></view>
            <text class="detail-text">漏服：{{ complianceData.missed }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 依从性趋势图（折线图） -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">依从性趋势</text>
        <text class="section-subtitle">近 7 天变化</text>
      </view>
      <view class="chart-card">
        <view class="line-chart">
          <view class="chart-y-axis">
            <text class="y-label">100%</text>
            <text class="y-label">75%</text>
            <text class="y-label">50%</text>
            <text class="y-label">25%</text>
            <text class="y-label">0%</text>
          </view>
          <view class="chart-content">
            <view class="line-svg">
              <svg viewBox="0 0 400 200" preserveAspectRatio="none">
                <polyline
                  :points="lineChartPoints"
                  fill="none"
                  stroke="#2196F3"
                  stroke-width="3"
                />
                <!-- 数据点 -->
                <circle
                  v-for="(point, index) in trendData"
                  :key="index"
                  :cx="index * (400 / (trendData.length - 1))"
                  :cy="200 - (point.rate * 2)"
                  r="4"
                  fill="#2196F3"
                />
              </svg>
            </view>
            <view class="chart-x-axis">
              <text
                v-for="(day, index) in trendData"
                :key="index"
                class="x-label"
                :style="{ left: (index * (100 / (trendData.length - 1))) + '%' }"
              >
                {{ day.label }}
              </text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 药品分类占比（饼图） -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">药品分类占比</text>
        <text class="section-subtitle">按用药计划统计</text>
      </view>
      <view class="chart-card">
        <view class="pie-chart-container">
          <view class="pie-chart" :style="{ background: pieChartGradient }">
            <view class="pie-center">
              <text class="pie-total">{{ stats.totalSchedules }}</text>
              <text class="pie-total-label">种药品</text>
            </view>
          </view>
          <view class="pie-legend">
            <view
              v-for="(cat, index) in categoryData"
              :key="cat.category"
              class="legend-item"
            >
              <view class="legend-dot" :style="{ backgroundColor: categoryColors[index % categoryColors.length] }"></view>
              <text class="legend-text">{{ cat.category }}</text>
              <text class="legend-value">{{ cat.count }}种 ({{ cat.percentage }}%)</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 每日服药次数（柱状图） -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">每日服药统计</text>
        <text class="section-subtitle">近 7 天服药次数</text>
      </view>
      <view class="chart-card">
        <view class="bar-chart">
          <view class="bar-chart-bars">
            <view
              v-for="(day, index) in dailyData"
              :key="index"
              class="bar-item"
            >
              <view class="bar-wrapper">
                <view
                  class="bar"
                  :style="{ height: (day.count / maxDailyCount * 100) + '%' }"
                  :class="getBarClass(index)"
                >
                  <text class="bar-value">{{ day.count }}</text>
                </view>
              </view>
              <text class="bar-label">{{ day.label }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 热门药品排行 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">热门药品排行</text>
        <text class="section-subtitle">使用人数最多的药品</text>
      </view>
      <view class="ranking-card">
        <view
          v-for="(med, index) in popularMedications"
          :key="med.id"
          class="ranking-item"
        >
          <view class="ranking-rank" :class="'rank-' + (index + 1)">
            <text v-if="index < 3" class="rank-medal">{{ ['🥇', '🥈', '🥉'][index] }}</text>
            <text v-else class="rank-num">{{ index + 1 }}</text>
          </view>
          <view class="ranking-info">
            <text class="ranking-name">{{ med.name }}</text>
            <text class="ranking-generic">{{ med.genericName }}</text>
          </view>
          <view class="ranking-count">
            <text class="count-value">{{ med.userCount }}</text>
            <text class="count-unit">人使用</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-overlay">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import { COMMON_MEDICATIONS } from '@/data/common-medications'

// 时间范围
const timeRange = ref<'today' | 'week' | 'month'>('week')

// 加载状态
const loading = ref(false)

// 统计数据
const stats = ref({
  totalUsers: 0,
  activeUsers: 0,
  totalSchedules: 0,
  todayLogs: 0
})

// 服药记录统计
const logsStats = ref({
  taken: 0,
  delayed: 0,
  missed: 0
})

// 依从性数据
const complianceData = ref({
  rate: 0,
  onTime: 0,
  delayed: 0,
  missed: 0
})

// 趋势数据
const trendData = ref([
  { label: '一', rate: 0 },
  { label: '二', rate: 0 },
  { label: '三', rate: 0 },
  { label: '四', rate: 0 },
  { label: '五', rate: 0 },
  { label: '六', rate: 0 },
  { label: '日', rate: 0 }
])

// 分类数据
const categoryData = ref<{ category: string; count: number; percentage: number }[]>([])

// 每日数据
const dailyData = ref([
  { label: '一', count: 0 },
  { label: '二', count: 0 },
  { label: '三', count: 0 },
  { label: '四', count: 0 },
  { label: '五', count: 0 },
  { label: '六', count: 0 },
  { label: '日', count: 0 }
])

// 热门药品
const popularMedications = ref<Array<{ id: string; name: string; genericName: string; userCount: number }>>([])

// 折线图点
const lineChartPoints = computed(() => {
  const points = trendData.value.map((point, index) => {
    const x = index * (400 / (trendData.value.length - 1))
    const y = 200 - (point.rate * 2)
    return `${x},${y}`
  })
  return points.join(' ')
})

// 最大每日计数（用于柱状图缩放）
const maxDailyCount = computed(() => {
  return Math.max(...dailyData.value.map(d => d.count), 1)
})

// 饼图渐变
const pieChartGradient = computed(() => {
  const colors = categoryColors.slice(0, Math.min(categoryData.value.length, 8))
  const gradientParts = colors.map((color, index) => {
    const percentage = categoryData.value[index]?.percentage || 0
    const totalSoFar = categoryData.value.slice(0, index).reduce((sum, c) => sum + c.percentage, 0)
    return `${color} ${totalSoFar}% ${totalSoFar + percentage}%`
  })
  return `conic-gradient(${gradientParts.join(', ')})`
})

// 分类颜色
const categoryColors = [
  '#2196F3', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0',
  '#00BCD4', '#FFC107', '#795548', '#607D8B', '#3F51B5'
]

// 获取柱状图样式
function getBarClass(index: number): string {
  const classes = ['bar-1', 'bar-2', 'bar-3', 'bar-4', 'bar-5', 'bar-6', 'bar-7']
  return classes[index % classes.length]
}

// 获取统计数据
async function fetchStats() {
  loading.value = true
  try {
    // 获取用户数
    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    stats.value.totalUsers = userCount || 0

    // 获取活跃用户（最近 7 天有服药记录的用户）
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const { count: activeCount } = await supabase
      .from('medication_logs')
      .select('user_id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())
      .not('user_id', 'is', null)
    stats.value.activeUsers = activeCount || 0

    // 获取用药计划数
    const { count: scheduleCount } = await supabase
      .from('medication_schedules')
      .select('*', { count: 'exact', head: true })
    stats.value.totalSchedules = scheduleCount || 0

    // 获取今日服药记录数
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: todayCount } = await supabase
      .from('medication_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
    stats.value.todayLogs = todayCount || 0
  } catch (error) {
    console.error('获取统计数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取服药记录统计
async function fetchLogsStats() {
  try {
    let dateFilter = new Date()

    if (timeRange.value === 'today') {
      dateFilter.setHours(0, 0, 0, 0)
    } else if (timeRange.value === 'week') {
      const dayOfWeek = dateFilter.getDay()
      const diff = dateFilter.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      dateFilter.setDate(diff)
      dateFilter.setHours(0, 0, 0, 0)
    } else {
      dateFilter.setDate(1)
      dateFilter.setHours(0, 0, 0, 0)
    }

    const { data } = await supabase
      .from('medication_logs')
      .select('status')
      .gte('created_at', dateFilter.toISOString())

    logsStats.value = {
      taken: data?.filter(l => l.status === 'taken').length || 0,
      delayed: data?.filter(l => l.status === 'delayed').length || 0,
      missed: data?.filter(l => l.status === 'missed').length || 0
    }
  } catch (error) {
    console.error('获取服药记录失败:', error)
  }
}

// 获取依从性数据
async function fetchComplianceData() {
  try {
    let dateFilter = new Date()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data } = await supabase
      .from('medication_logs')
      .select('status, scheduled_time, taken_time')
      .gte('scheduled_time', sevenDaysAgo.toISOString())

    if (!data || data.length === 0) {
      complianceData.value = { rate: 0, onTime: 0, delayed: 0, missed: 0 }
      return
    }

    const onTime = data.filter(l => l.status === 'taken').length
    const delayed = data.filter(l => l.status === 'delayed').length
    const missed = data.filter(l => l.status === 'missed').length
    const total = data.length

    complianceData.value = {
      rate: total > 0 ? Math.round((onTime / total) * 100) : 0,
      onTime,
      delayed,
      missed
    }
  } catch (error) {
    console.error('获取依从性数据失败:', error)
  }
}

// 获取趋势数据
async function fetchTrendData() {
  try {
    const today = new Date()
    const trendDays: { label: string; rate: number }[] = []

    // 获取过去 7 天的数据
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayLabels = ['日', '一', '二', '三', '四', '五', '六']
      const label = dayLabels[date.getDay()]

      const { data } = await supabase
        .from('medication_logs')
        .select('status')
        .gte('scheduled_time', date.toISOString())
        .lt('scheduled_time', nextDate.toISOString())

      const total = data?.length || 0
      const taken = data?.filter(l => l.status === 'taken').length || 0
      const rate = total > 0 ? Math.round((taken / total) * 100) : 0

      trendDays.push({ label, rate })
    }

    trendData.value = trendDays
  } catch (error) {
    console.error('获取趋势数据失败:', error)
  }
}

// 获取分类数据
async function fetchCategoryData() {
  try {
    const { data } = await supabase
      .from('common_medications')
      .select('category')

    if (!data || data.length === 0) {
      categoryData.value = []
      return
    }

    const categoryMap = new Map<string, number>()
    data.forEach(med => {
      const category = med.category || '其他'
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1)
    })

    const total = data.length
    categoryData.value = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / total) * 100)
    })).sort((a, b) => b.count - a.count)
  } catch (error) {
    console.error('获取分类数据失败:', error)
  }
}

// 获取每日数据
async function fetchDailyData() {
  try {
    const today = new Date()
    const dailyCounts: { label: string; count: number }[] = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayLabels = ['日', '一', '二', '三', '四', '五', '六']
      const label = dayLabels[date.getDay()]

      const { count } = await supabase
        .from('medication_logs')
        .select('*', { count: 'exact', head: true })
        .gte('scheduled_time', date.toISOString())
        .lt('scheduled_time', nextDate.toISOString())

      dailyCounts.push({ label, count: count || 0 })
    }

    dailyData.value = dailyCounts
  } catch (error) {
    console.error('获取每日数据失败:', error)
  }
}

// 获取热门药品
async function fetchPopularMedications() {
  try {
    // 统计每个药品的用户数（通过 medication_schedules 关联）
    const { data } = await supabase
      .from('medication_schedules')
      .select('medication_id, user_id, common_medications(id, name, generic_name)')

    if (!data || data.length === 0) {
      popularMedications.value = []
      return
    }

    const medMap = new Map<string, { id: string; name: string; genericName: string; userCount: number }>()

    data.forEach(schedule => {
      const med = schedule.common_medications
      if (!med) return

      const key = med.id
      if (!medMap.has(key)) {
        medMap.set(key, {
          id: med.id,
          name: med.name,
          genericName: med.generic_name || '',
          userCount: 0
        })
      }
      const entry = medMap.get(key)
      if (entry) {
        entry.userCount++
      }
    })

    popularMedications.value = Array.from(medMap.values())
      .sort((a, b) => b.userCount - a.userCount)
      .slice(0, 10)
  } catch (error) {
    console.error('获取热门药品失败:', error)
  }
}

// 刷新数据
async function refreshAllData() {
  await Promise.all([
    fetchStats(),
    fetchLogsStats(),
    fetchComplianceData(),
    fetchTrendData(),
    fetchCategoryData(),
    fetchDailyData(),
    fetchPopularMedications()
  ])
}

// 监听时间范围变化
watch(timeRange, () => {
  fetchLogsStats()
})

onMounted(() => {
  refreshAllData()
})
</script>

<style lang="scss" scoped>
.stats-report-page {
  min-height: 100vh;
  background: #F5F5F5;
  padding-bottom: 40rpx;
}

.header {
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  padding: 32rpx 24rpx;
  padding-top: calc(32rpx + env(safe-area-inset-top));
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.stat-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;

  .stat-icon {
    font-size: 40rpx;
    line-height: 1;
  }

  .stat-content {
    display: flex;
    flex-direction: column;

    .stat-value {
      font-size: 36rpx;
      font-weight: bold;
      color: white;
      line-height: 1;
    }

    .stat-label {
      font-size: 22rpx;
      color: rgba(255, 255, 255, 0.9);
      margin-top: 4rpx;
    }
  }
}

.filter-section {
  background: white;
  padding: 24rpx 32rpx;
  margin-bottom: 20rpx;
}

.time-filters {
  display: flex;
  gap: 16rpx;
}

.time-filter {
  padding: 12rpx 32rpx;
  border-radius: 30rpx;
  font-size: 26rpx;
  color: #757575;
  background: #F5F5F5;
  transition: all 0.2s ease;

  &.active {
    background: #2196F3;
    color: white;
  }
}

.section {
  padding: 0 24rpx 24rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
  padding: 0 8rpx;

  .section-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #212121;
  }

  .section-subtitle {
    font-size: 24rpx;
    color: #9E9E9E;
    margin-left: 12rpx;
  }
}

.logs-card {
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.log-stat {
  display: flex;
  flex-direction: column;
  align-items: center;

  .log-value {
    font-size: 48rpx;
    font-weight: bold;
    line-height: 1;

    &.taken { color: #4CAF50; }
    &.delayed { color: #FF9800; }
    &.missed { color: #F44336; }
  }

  .log-label {
    font-size: 26rpx;
    color: #757575;
    margin-top: 8rpx;
  }
}

.compliance-card {
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
}

.compliance-rate {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32rpx;

  .rate-value {
    font-size: 72rpx;
    font-weight: bold;
    color: #2196F3;
    line-height: 1;

    &::after {
      content: '%';
      font-size: 36rpx;
    }
  }

  .rate-label {
    font-size: 26rpx;
    color: #757575;
    margin-top: 8rpx;
  }
}

.compliance-bar {
  margin-bottom: 24rpx;

  .bar-bg {
    height: 24rpx;
    background: #E0E0E0;
    border-radius: 12rpx;
    overflow: hidden;

    .bar-fill {
      height: 100%;
      border-radius: 12rpx;
      transition: width 0.5s ease;

      &.bar-fill-good { background: linear-gradient(90deg, #4CAF50, #8BC34A); }
      &.bar-fill-warning { background: linear-gradient(90deg, #FF9800, #FFC107); }
      &.bar-fill-bad { background: linear-gradient(90deg, #F44336, #FF5722); }
    }
  }

  .bar-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 12rpx;

    .bar-label {
      font-size: 22rpx;
      color: #9E9E9E;
    }
  }
}

.compliance-details {
  display: flex;
  justify-content: space-around;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8rpx;

  .detail-dot {
    width: 16rpx;
    height: 16rpx;
    border-radius: 50%;

    &.taken { background: #4CAF50; }
    &.delayed { background: #FF9800; }
    &.missed { background: #F44336; }
  }

  .detail-text {
    font-size: 26rpx;
    color: #616161;
  }
}

.chart-card {
  background: white;
  border-radius: 16rpx;
  padding: 24rpx;
}

.line-chart {
  display: flex;
  height: 240rpx;
}

.chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-right: 12rpx;

  .y-label {
    font-size: 20rpx;
    color: #9E9E9E;
    text-align: right;
  }
}

.chart-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.line-svg {
  flex: 1;
  position: relative;

  svg {
    width: 100%;
    height: 100%;
  }
}

.chart-x-axis {
  display: flex;
  justify-content: space-between;
  position: relative;
  padding-top: 12rpx;

  .x-label {
    position: absolute;
    transform: translateX(-50%);
    font-size: 22rpx;
    color: #757575;
  }
}

.pie-chart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pie-chart {
  width: 300rpx;
  height: 300rpx;
  border-radius: 50%;
  position: relative;
  margin-bottom: 32rpx;

  .pie-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 150rpx;
    height: 150rpx;
    background: white;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .pie-total {
      font-size: 48rpx;
      font-weight: bold;
      color: #212121;
      line-height: 1;
    }

    .pie-total-label {
      font-size: 24rpx;
      color: #757575;
      margin-top: 4rpx;
    }
  }
}

.pie-legend {
  width: 100%;
}

.legend-item {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1px solid #F0F0F0;

  &:last-child {
    border-bottom: none;
  }

  .legend-dot {
    width: 20rpx;
    height: 20rpx;
    border-radius: 4rpx;
    margin-right: 16rpx;
    flex-shrink: 0;
  }

  .legend-text {
    flex: 1;
    font-size: 28rpx;
    color: #424242;
  }

  .legend-value {
    font-size: 26rpx;
    color: #757575;
  }
}

.bar-chart {
  padding: 16rpx 0;
}

.bar-chart-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 200rpx;
  padding: 0 16rpx;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.bar-wrapper {
  height: 160rpx;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bar {
  width: 48rpx;
  border-radius: 8rpx 8rpx 0 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 8rpx;
  transition: height 0.3s ease;

  .bar-value {
    font-size: 22rpx;
    color: white;
    font-weight: bold;
  }

  &.bar-1 { background: linear-gradient(180deg, #2196F3, #1976D2); }
  &.bar-2 { background: linear-gradient(180deg, #4CAF50, #388E3C); }
  &.bar-3 { background: linear-gradient(180deg, #FF9800, #F57C00); }
  &.bar-4 { background: linear-gradient(180deg, #E91E63, #C2185B); }
  &.bar-5 { background: linear-gradient(180deg, #9C27B0, #7B1FA2); }
  &.bar-6 { background: linear-gradient(180deg, #00BCD4, #0097A7); }
  &.bar-7 { background: linear-gradient(180deg, #FFC107, #FFA000); }
}

.bar-label {
  font-size: 22rpx;
  color: #757575;
  margin-top: 12rpx;
}

.ranking-card {
  background: white;
  border-radius: 16rpx;
  overflow: hidden;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 24rpx 28rpx;
  border-bottom: 1px solid #F0F0F0;

  &:last-child {
    border-bottom: none;
  }

  .ranking-rank {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #F5F5F5;
    margin-right: 20rpx;
    flex-shrink: 0;

    .rank-medal {
      font-size: 36rpx;
    }

    .rank-num {
      font-size: 28rpx;
      font-weight: bold;
      color: #757575;
    }

    &.rank-1 { background: linear-gradient(135deg, #FFD700, #FFC107); }
    &.rank-2 { background: linear-gradient(135deg, #C0C0C0, #9E9E9E); }
    &.rank-3 { background: linear-gradient(135deg, #CD7F32, #8D6E63); }
  }

  .ranking-info {
    flex: 1;
    display: flex;
    flex-direction: column;

    .ranking-name {
      font-size: 30rpx;
      font-weight: 600;
      color: #212121;
    }

    .ranking-generic {
      font-size: 24rpx;
      color: #9E9E9E;
      margin-top: 4rpx;
    }
  }

  .ranking-count {
    text-align: right;

    .count-value {
      font-size: 36rpx;
      font-weight: bold;
      color: #2196F3;
      display: block;
    }

    .count-unit {
      font-size: 22rpx;
      color: #9E9E9E;
    }
  }
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .loading-spinner {
    width: 64rpx;
    height: 64rpx;
    border: 4rpx solid #E0E0E0;
    border-top-color: #2196F3;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loading-text {
    margin-top: 24rpx;
    font-size: 28rpx;
    color: #757575;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
