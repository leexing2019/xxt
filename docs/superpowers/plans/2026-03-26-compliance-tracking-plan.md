# 用户服药依从性追踪功能实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task.

**Goal:** 在后台 Dashboard 添加用户服药依从性查看功能，并修复药品总数统计错误

**Architecture:**
- 新增两个抽屉组件：ComplianceDrawer（用户列表）和 UserComplianceDetailDrawer（用户详情）
- 新增 compliance.ts 服务层处理数据查询
- 创建 SQL view 优化依从性统计查询
- 修复 Dashboard 查询 common_medications 表

**Tech Stack:** Vue 3 + TypeScript + Element Plus + Supabase + ECharts（热力图）

---

## 任务清单

### Task 1: 创建 SQL View 和 RLS Policy

**Files:**
- Create: `sql/create-compliance-views.sql`

**Steps:**

1. 创建依从性统计 SQL view：
```sql
-- 用户依从性日统计表
CREATE OR REPLACE VIEW user_daily_compliance AS
SELECT
  p.id AS user_id,
  p.username,
  p.phone,
  DATE(ml.scheduled_time) AS log_date,
  COUNT(ml.id) AS total_scheduled,
  COUNT(CASE WHEN ml.status = 'taken' THEN 1 END) AS taken_count,
  COUNT(CASE WHEN ml.status = 'delayed' THEN 1 END) AS delayed_count,
  COUNT(CASE WHEN ml.status = 'missed' THEN 1 END) AS missed_count,
  ROUND(
    (COUNT(CASE WHEN ml.status = 'taken' THEN 1 END) * 1.0 +
     COUNT(CASE WHEN ml.status = 'delayed' THEN 1 END) * 0.5) /
    NULLIF(COUNT(ml.id), 0) * 100,
    2
  ) AS compliance_rate
FROM profiles p
LEFT JOIN medication_logs ml ON p.id = ml.user_id
GROUP BY p.id, p.username, p.phone, DATE(ml.scheduled_time);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_medication_logs_user_date
ON medication_logs(user_id, scheduled_time);
```

2. 运行 SQL 脚本
   - 访问 Supabase SQL Editor
   - 复制粘贴执行

3. Commit
```bash
git add sql/create-compliance-views.sql
git commit -m "feat: add user compliance tracking SQL view"
```

---

### Task 2: 创建依从性服务层

**Files:**
- Create: `admin/src/services/compliance.ts`

**Step 1: Write the service**

```typescript
import { supabase } from './supabase'

export interface UserComplianceStats {
  user_id: string
  username: string | null
  phone: string | null
  today_compliance: number
  week_compliance: number
  month_compliance: number
}

export interface DailyLog {
  id: string
  scheduled_time: string
  taken_time: string | null
  status: 'taken' | 'missed' | 'delayed'
  medication_name: string
  medication_form: string
  medication_color: string | null
  medication_shape: string | null
}

/**
 * 获取所有用户的依从性统计
 */
export async function getAllUserComplianceStats(date?: string): Promise<UserComplianceStats[]> {
  const dateFilter = date || new Date().toISOString().split('T')[0]

  // 查询今日数据
  const { data: todayData, error: todayError } = await supabase
    .rpc('get_user_compliance_stats', {
      target_date: dateFilter,
      days_range: 1
    })

  if (todayError) throw todayError

  // 查询 7 日数据
  const { data: weekData, error: weekError } = await supabase
    .rpc('get_user_compliance_stats', {
      target_date: dateFilter,
      days_range: 7
    })

  if (weekError) throw weekError

  // 查询 30 日数据
  const { data: monthData, error: monthError } = await supabase
    .rpc('get_user_compliance_stats', {
      target_date: dateFilter,
      days_range: 30
    })

  if (monthError) throw monthError

  // 合并数据
  return (todayData || []).map((item: any) => ({
    user_id: item.user_id,
    username: item.username,
    phone: item.phone,
    today_compliance: item.compliance_rate,
    week_compliance: weekData?.find((w: any) => w.user_id === item.user_id)?.compliance_rate || 0,
    month_compliance: monthData?.find((m: any) => m.user_id === item.user_id)?.compliance_rate || 0
  }))
}

/**
 * 获取用户指定日期的服药记录
 */
export async function getUserDailyLogs(
  userId: string,
  date: string
): Promise<DailyLog[]> {
  const { data, error } = await supabase
    .from('medication_logs')
    .select(`
      id,
      scheduled_time,
      taken_time,
      status,
      medication:medication_id (
        name,
        form,
        color,
        shape
      )
    `)
    .eq('user_id', userId)
    .gte('scheduled_time', `${date}T00:00:00`)
    .lt('scheduled_time', `${date}T23:59:59`)
    .order('scheduled_time', { ascending: true })

  if (error) throw error

  return (data || []).map((log: any) => ({
    id: log.id,
    scheduled_time: log.scheduled_time,
    taken_time: log.taken_time,
    status: log.status,
    medication_name: log.medication?.name || '未知药品',
    medication_form: log.medication?.form || 'unknown',
    medication_color: log.medication?.color,
    medication_shape: log.medication?.shape
  }))
}

/**
 * 获取用户月度依从率（用于热力图）
 */
export async function getUserMonthlyCompliance(
  userId: string,
  year: number,
  month: number // 1-12
): Promise<{ date: string; rate: number }[]> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('user_daily_compliance')
    .select('log_date, compliance_rate')
    .eq('user_id', userId)
    .gte('log_date', startDate)
    .lte('log_date', endDate)

  if (error) throw error

  return (data || []).map((item: any) => ({
    date: item.log_date,
    rate: item.compliance_rate || 0
  }))
}
```

**Step 2: Run TypeScript check**

```bash
cd admin
npx tsc --noEmit
```

Expected: PASS (no errors)

**Step 3: Commit**

```bash
git add admin/src/services/compliance.ts
git commit -m "feat: add compliance tracking service layer"
```

---

### Task 3: 创建用户依从性列表组件 (ComplianceDrawer)

**Files:**
- Create: `admin/src/components/compliance/ComplianceDrawer.vue`

**Step 1: Create the component**

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { getAllUserComplianceStats, type UserComplianceStats } from '@/services/compliance'
import { UserComplianceDetailDrawer } from './'
import { CircleCheck, TrendCharts, ArrowRight } from '@element-plus/icons-vue'

const props = defineProps<{
  modelValue: boolean
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
const users = ref<UserComplianceStats[]>([])
const showDetailDrawer = ref(false)
const selectedUser = ref<UserComplianceStats | null>(null)

async function fetchComplianceStats() {
  loading.value = true
  try {
    users.value = await getAllUserComplianceStats(selectedDate.value)
  } catch (error) {
    console.error('获取依从性数据失败:', error)
    users.value = []
  } finally {
    loading.value = false
  }
}

function getComplianceColor(rate: number): string {
  if (rate >= 90) return '#22c55e'
  if (rate >= 70) return '#eab308'
  return '#ef4444'
}

function getComplianceLabel(rate: number): string {
  if (rate >= 90) return '优秀'
  if (rate >= 70) return '良好'
  return '需关注'
}

function handleViewDetail(user: UserComplianceStats) {
  selectedUser.value = user
  showDetailDrawer.value = true
}

function handleDateChange() {
  fetchComplianceStats()
}
</script>

<template>
  <el-drawer
    v-model="isOpen"
    title="服药依从性统计"
    size="60%"
    direction="rtl"
  >
    <div class="compliance-drawer">
      <!-- 日期选择器 -->
      <div class="date-selector">
        <el-date-picker
          v-model="selectedDate"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          @change="handleDateChange"
        />
      </div>

      <!-- 用户列表表格 -->
      <el-table
        :data="users"
        :loading="loading"
        style="width: 100%"
        :header-cell-style="{ background: '#f8fafc', color: '#475569', fontWeight: 600 }"
      >
        <el-table-column prop="username" label="用户名" min-width="120">
          <template #default="{ row }">
            <div class="user-name">
              <el-avatar :size="32" :icon="User" style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); margin-right: 12px;" />
              {{ row.username || row.phone || '未知用户' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="今日依从率" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag :color="getComplianceColor(row.today_compliance)" size="small">
              {{ row.today_compliance }}%
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="7 日平均" min-width="100" align="center">
          <template #default="{ row }">
            <span :style="{ color: getComplianceColor(row.week_compliance), fontWeight: 600 }">
              {{ row.week_compliance }}%
            </span>
          </template>
        </el-table-column>

        <el-table-column label="30 日平均" min-width="100" align="center">
          <template #default="{ row }">
            <span :style="{ color: getComplianceColor(row.month_compliance), fontWeight: 600 }">
              {{ row.month_compliance }}%
            </span>
          </template>
        </el-table-column>

        <el-table-column label="操作" min-width="100" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleViewDetail(row)"
            >
              详情
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <div v-if="!loading && users.length === 0" class="empty-state">
        <el-icon :size="48" color="#cbd5e1"><CircleCheck /></el-icon>
        <p>暂无依从性数据</p>
      </div>
    </div>

    <!-- 用户详情抽屉 -->
    <UserComplianceDetailDrawer
      v-if="selectedUser"
      v-model="showDetailDrawer"
      :user="selectedUser"
    />
  </el-drawer>
</template>

<style scoped>
.compliance-drawer {
  padding: 16px;
}

.date-selector {
  margin-bottom: 20px;
}

.user-name {
  display: flex;
  align-items: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #94a3b8;
}

.empty-state p {
  margin-top: 16px;
  font-size: 14px;
}
</style>
```

**Step 2: Commit**

```bash
git add admin/src/components/compliance/ComplianceDrawer.vue
git commit -m "feat: add compliance drawer component"
```

---

### Task 4: 创建用户详情组件 (UserComplianceDetailDrawer)

**Files:**
- Create: `admin/src/components/compliance/UserComplianceDetailDrawer.vue`

**Step 1: Create the component (包含 ECharts 热力图)**

```vue
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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

// 初始化图表
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
    heatMapData.value = data.map(item => [
      new Date(item.date).getDate() - 1,
      Math.ceil(new Date(item.date).getDate() / 7) - 1,
      item.rate
    ])
    renderChart()
  } catch (error) {
    console.error('获取热力图数据失败:', error)
  }
}

function renderChart() {
  if (!chartRef.value) return

  if (!chartInstance.value) {
    chartInstance.value = echarts.init(chartRef.value)
  }

  chartInstance.value.setOption({
    title: {
      text: `${currentYear.value}年${currentMonth.value}月 依从性热力图`,
      left: 'center'
    },
    tooltip: {
      formatter: (params: any) => {
        const day = params.data[0] + 1
        const rate = params.data[2]
        return `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}<br/>依从率：${rate}%`
      }
    },
    grid: {
      top: '60px',
      bottom: '20px',
      left: '20px',
      right: '20px'
    },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 31 }, (_, i) => i + 1),
      splitArea: { show: true }
    },
    yAxis: {
      type: 'category',
      data: ['第 1 周', '第 2 周', '第 3 周', '第 4 周', '第 5 周'],
      splitArea: { show: true }
    },
    visualMap: {
      min: 0,
      max: 100,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      inRange: {
        color: ['#ef4444', '#eab308', '#22c55e']
      }
    },
    series: [{
      name: '依从率',
      type: 'heatmap',
      data: heatMapData.value,
      label: {
        show: true,
        formatter: (params: any) => {
          const rate = params.data[2]
          return rate ? `${Math.round(rate)}%` : ''
        }
      }
    }]
  })
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

// 监听用户变化
watch(() => props.user, () => {
  fetchLogs()
  fetchHeatMapData()
}, { immediate: true })
</script>

<template>
  <el-drawer
    v-model="isOpen"
    :title="user?.username || '用户详情'"
    size="800px"
    direction="rtl"
  >
    <div class="detail-drawer">
      <!-- 日期选择器 -->
      <div class="date-selector">
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
      <div ref="chartRef" style="width: 100%; height: 300px; margin-bottom: 24px;"></div>

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
      <el-timeline class="medication-timeline" style="margin-top: 24px;">
        <el-timeline-item
          v-for="log in dailyLogs"
          :key="log.id"
          :icon="getStatusIcon(log.status)"
          :color="getStatusColor(log.status)"
          size="large"
        >
          <el-card>
            <div class="timeline-item">
              <div class="timeline-header">
                <span class="time">{{ formatTime(log.scheduled_time) }}</span>
                <el-tag :color="getStatusColor(log.status)" size="small">
                  {{ getStatusText(log.status) }}
                </el-tag>
              </div>
              <div class="medication-info">
                <div class="medication-icon" :style="{ background: log.medication_color || '#e2e8f0' }">
                  💊
                </div>
                <div class="medication-details">
                  <span class="medication-name">{{ log.medication_name }}</span>
                  <span class="medication-form">{{ log.medication_form }}</span>
                </div>
              </div>
              <div v-if="log.taken_time" class="actual-time">
                实际服用：{{ formatTime(log.taken_time) }}
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
  </el-drawer>
</template>

<style scoped>
.detail-drawer {
  padding: 16px;
}

.date-selector {
  margin-bottom: 20px;
}

.summary-card {
  margin-top: 16px;
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
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.card-header {
  font-weight: 600;
  color: #374151;
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
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.medication-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.medication-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.medication-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.medication-name {
  font-weight: 600;
  color: #374151;
}

.medication-form {
  font-size: 12px;
  color: #64748b;
}

.actual-time {
  font-size: 12px;
  color: #22c55e;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #94a3b8;
}
</style>
```

**Step 2: Install ECharts dependency**

```bash
cd admin
npm install echarts
```

**Step 3: Commit**

```bash
git add admin/src/components/compliance/UserComplianceDetailDrawer.vue admin/package.json admin/package-lock.json
git commit -m "feat: add user compliance detail drawer with heatmap"
```

---

### Task 5: 集成到 Dashboard

**Files:**
- Modify: `admin/src/views/Dashboard.vue`

**Step 1: 修改 Dashboard.vue - 添加导入和状态**

在 script 部分添加：
```typescript
import { ComplianceDrawer } from '@/components/compliance/ComplianceDrawer.vue'

// 添加状态
const showComplianceDrawer = ref(false)
```

**Step 2: 修改 fetchStats 函数 - 修复药品总数查询**

将药品总数查询改为：
```typescript
// 获取公共药品库总数
const { count: medsCount } = await supabase
  .from('common_medications')
  .select('*', { count: 'exact', head: true })

stats.value.totalMedications = medsCount || 0
```

**Step 3: 修改模板 - 添加点击事件**

修改依从性卡片：
```vue
<el-col :span="6">
  <el-card shadow="hover" class="stat-card card-compliance" @click="showComplianceDrawer = true" style="cursor: pointer;">
    <!-- 原有内容 -->
  </el-card>
</el-col>
```

**Step 4: 添加组件引用**

在模板末尾添加：
```vue
<ComplianceDrawer v-model="showComplianceDrawer" />
```

**Step 5: Commit**

```bash
git add admin/src/views/Dashboard.vue
git commit -m "feat: integrate compliance drawer into dashboard and fix medication count"
```

---

### Task 6: 注册组件和测试

**Files:**
- Modify: `admin/src/App.vue` (如果需要全局注册)

**Step 1: 本地测试开发服务器**

```bash
cd admin
npm run dev
```

访问 http://localhost:5173

**Step 2: 验证功能**

1. 登录后台
2. 进入"数据统计"页面
3. 验证"药品总数"显示正确数值
4. 点击"平均依从性"卡片
5. 验证抽屉弹出并显示用户列表
6. 点击"详情"按钮
7. 验证详情抽屉显示热力图和时间线

**Step 3: 运行 TypeScript 检查**

```bash
cd admin
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add .
git commit -m "chore: verify compliance tracking feature"
```

---

## 验收标准

- [ ] Dashboard"药品总数"显示 common_medications 表的数量
- [ ] 点击"平均依从性"卡片弹出用户列表
- [ ] 用户列表显示今日/7 日/30 日依从率
- [ ] 依从率颜色正确（≥90% 绿色，70-89% 黄色，<70% 红色）
- [ ] 点击"详情"弹出用户详情抽屉
- [ ] 详情显示日历热力图
- [ ] 热力图颜色正确反映依从率
- [ ] 显示当日服药时间线
- [ ] 时间线显示药品图标、名称、时间、状态
