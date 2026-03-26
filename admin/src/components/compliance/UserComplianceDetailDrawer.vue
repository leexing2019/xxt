<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { getUserDailyLogs, getUserMonthlyCompliance, type UserComplianceStats, type DailyLog } from '@/services/compliance'
import { CircleCheck, CircleClose, Warning, VideoPlay } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const props = defineProps<{
  modelValue: boolean
  user: UserComplianceStats
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const loading = ref(false)
const selectedDate = ref(new Date().toISOString().split('T')[0])
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)
const dailyLogs = ref<DailyLog[]>([])
const heatMapData = ref<any[]>([])
const chartInstance = ref<echarts.ECharts | null>(null)

const chartRef = ref<HTMLElement | null>(null)

async function fetchLogs() {
  loading.value = true
  try {
    dailyLogs.value = await getUserDailyLogs(props.user.user_id, selectedDate.value)
  } catch (error) {
    console.error('获取服药记录失败:', error)
    dailyLogs.value = []
  } finally {
    loading.value = false
  }
}

async function fetchHeatMapData() {
  try {
    const data = await getUserMonthlyCompliance(props.user.user_id, currentYear.value, currentMonth.value)
    // 转换为热力图格式：[day, week, rate]
    heatMapData.value = data.map(item => {
      const date = new Date(item.date)
      const day = date.getDate() - 1
      const week = Math.ceil(date.getDate() / 7) - 1
      return [day, week, item.rate]
    })
    await nextTick()
    renderChart()
  } catch (error) {
    console.error('获取热力图数据失败:', error)
  }
}

function renderChart() {
  if (!chartRef.value) return

  if (!chartInstance.value) {
    chartInstance.value = echarts.init(chartRef.value)

    chartInstance.value.on('click', (params: any) => {
      if (params.componentType === 'series') {
        const day = params.data[0] + 1
        const dateStr = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        selectedDate.value = dateStr
        fetchLogs()
      }
    })
  }

  const daysInMonth = new Date(currentYear.value, currentMonth.value, 0).getDate()
  const weeksInMonth = Math.ceil(daysInMonth / 7)

  chartInstance.value.setOption({
    title: {
      text: `${currentYear.value}年${currentMonth.value}月 依从性热力图`,
      left: 'center',
      top: '10px',
      textStyle: {
        fontSize: 14,
        color: '#374151'
      }
    },
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        if (params.componentType !== 'series') return ''
        const day = params.data[0] + 1
        const rate = params.data[2]
        return `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}<br/>依从率：${rate}%`
      }
    },
    grid: {
      top: '50px',
      bottom: '50px',
      left: '30px',
      right: '20px'
    },
    xAxis: {
      type: 'category',
      data: Array.from({ length: daysInMonth }, (_, i) => i + 1),
      splitArea: { show: true },
      axisLabel: {
        fontSize: 10,
        color: '#64748b'
      }
    },
    yAxis: {
      type: 'category',
      data: Array.from({ length: weeksInMonth }, (_, i) => `第${i + 1}周`),
      splitArea: { show: true },
      axisLabel: {
        fontSize: 10,
        color: '#64748b'
      }
    },
    visualMap: {
      min: 0,
      max: 100,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '10px',
      inRange: {
        color: ['#fef2f2', '#fef08a', '#86efac']
      },
      textStyle: {
        color: '#64748b'
      }
    },
    series: [{
      name: '依从率',
      type: 'heatmap',
      data: heatMapData.value,
      label: {
        show: true,
        fontSize: 10,
        color: '#374151',
        formatter: (params: any) => {
          const rate = params.data[2]
          return rate ? `${Math.round(rate)}%` : ''
        }
      },
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 1
      }
    }]
  })

  chartInstance.value.resize()
}

function handleDateChange() {
  fetchLogs()
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'taken': return CircleCheck
    case 'missed': return CircleClose
    case 'delayed': return Warning
    default: return VideoPlay
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'taken': return '#22c55e'
    case 'missed': return '#ef4444'
    case 'delayed': return '#eab308'
    default: return '#64748b'
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'taken': return '按时'
    case 'missed': return '漏服'
    case 'delayed': return '延迟'
    default: return '未知'
  }
}

function formatTime(time: string): string {
  return new Date(time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function getMedicationIcon(form: string): string {
  switch (form?.toLowerCase()) {
    case 'tablet':
    case 'tablets':
      return '💊'
    case 'capsule':
      return '💊'
    case 'liquid':
      return '🧴'
    default:
      return '💊'
  }
}

// 监听用户变化
watch(() => props.user, () => {
  fetchLogs()
  fetchHeatMapData()
}, { immediate: true })

// 监听月份变化
watch([currentYear, currentMonth], () => {
  fetchHeatMapData()
})

// 监听抽屉打开
watch(isOpen, (newVal) => {
  if (newVal) {
    nextTick(() => {
      if (chartRef.value && !chartInstance.value) {
        fetchHeatMapData()
      }
    })
  }
})

onMounted(() => {
  if (isOpen.value) {
    fetchHeatMapData()
  }
})
</script>

<template>
  <el-drawer
    v-model="isOpen"
    :title="user?.username || user?.phone || '用户详情'"
    size="800px"
    direction="rtl"
  >
    <div class="detail-drawer">
      <!-- 日期选择器 -->
      <div class="date-selector">
        <span class="label">查看日期：</span>
        <el-date-picker
          v-model="selectedDate"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          @change="handleDateChange"
        />
      </div>

      <!-- 日历热力图 -->
      <div class="chart-container">
        <div ref="chartRef" class="heatmap-chart"></div>
      </div>

      <!-- 当日摘要 -->
      <el-card class="summary-card">
        <template #header>
          <div class="card-header">
            <span>{{ selectedDate }} 服药摘要</span>
          </div>
        </template>
        <el-row :gutter="16">
          <el-col :span="6">
            <div class="summary-item">
              <el-icon :size="24" color="#3b82f6"><VideoPlay /></el-icon>
              <span class="summary-label">应服</span>
              <span class="summary-value">{{ dailyLogs.length }}次</span>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="summary-item">
              <el-icon :size="24" color="#22c55e"><CircleCheck /></el-icon>
              <span class="summary-label">实服</span>
              <span class="summary-value">{{ dailyLogs.filter(l => l.status === 'taken').length }}次</span>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="summary-item">
              <el-icon :size="24" color="#eab308"><Warning /></el-icon>
              <span class="summary-label">延迟</span>
              <span class="summary-value">{{ dailyLogs.filter(l => l.status === 'delayed').length }}次</span>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="summary-item">
              <el-icon :size="24" color="#ef4444"><CircleClose /></el-icon>
              <span class="summary-label">漏服</span>
              <span class="summary-value">{{ dailyLogs.filter(l => l.status === 'missed').length }}次</span>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 服药时间线 -->
      <div class="timeline-container">
        <h3 class="timeline-title">服药记录</h3>
        <el-timeline class="medication-timeline" v-if="dailyLogs.length > 0">
          <el-timeline-item
            v-for="log in dailyLogs"
            :key="log.id"
            :icon="getStatusIcon(log.status)"
            :color="getStatusColor(log.status)"
            size="large"
          >
            <el-card class="timeline-card">
              <div class="timeline-item">
                <div class="timeline-header">
                  <span class="time">{{ formatTime(log.scheduled_time) }}</span>
                  <el-tag :color="getStatusColor(log.status)" size="small" effect="dark">
                    {{ getStatusText(log.status) }}
                  </el-tag>
                </div>
                <div class="medication-info">
                  <div class="medication-icon" :style="{ background: log.medication_color || '#e2e8f0' }">
                    {{ getMedicationIcon(log.medication_form) }}
                  </div>
                  <div class="medication-details">
                    <span class="medication-name">{{ log.medication_name }}</span>
                    <span class="medication-form">{{ log.medication_form }}</span>
                  </div>
                </div>
                <div v-if="log.taken_time && log.status === 'taken'" class="actual-time">
                  <el-icon><CircleCheck /></el-icon>
                  实际服用：{{ formatTime(log.taken_time) }}
                </div>
                <div v-if="log.status === 'delayed'" class="actual-time delayed">
                  <el-icon><Warning /></el-icon>
                  实际服用：{{ log.taken_time ? formatTime(log.taken_time) : '未记录' }}
                </div>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>

        <div v-if="!loading && dailyLogs.length === 0" class="empty-state">
          <el-icon :size="48" color="#cbd5e1"><CircleCheck /></el-icon>
          <p>当日无服药记录</p>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<style scoped>
.detail-drawer {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.date-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-selector .label {
  font-size: 14px;
  color: #64748b;
}

.chart-container {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e2e8f0;
}

.heatmap-chart {
  width: 100%;
  height: 280px;
}

.summary-card {
  border: 1px solid #e2e8f0;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.summary-label {
  font-size: 13px;
  color: #64748b;
}

.summary-value {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.card-header {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.timeline-container {
  margin-top: 8px;
}

.timeline-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
}

.timeline-card {
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.timeline-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.timeline-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.time {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.medication-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.medication-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.medication-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.medication-name {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.medication-form {
  font-size: 12px;
  color: #64748b;
  text-transform: capitalize;
}

.actual-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #22c55e;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
}

.actual-time.delayed {
  color: #eab308;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #94a3b8;
}

:deep(.el-timeline-item__node) {
  border: 2px solid;
}

:deep(.el-timeline-item:nth-child(1) .el-timeline-item__node) {
  border-color: #22c55e;
}
</style>
