<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/services/supabase'
import { User, VideoPlay, Goods, CircleCheck, TrendCharts, ArrowUp } from '@element-plus/icons-vue'

const stats = ref({
  totalUsers: 0,
  activeUsers: 0,
  totalMedications: 0,
  complianceRate: 0
})

const recentUsers = ref<any[]>([])
const loading = ref(true)

// 模拟图表数据
const chartData = computed(() => {
  return {
    users: [120, 132, 101, 134, 90, 230, 210],
    medications: [220, 182, 191, 234, 290, 330, 310]
  }
})

async function fetchStats() {
  loading.value = true

  try {
    // 获取用户总数
    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // 获取药品总数
    const { count: medsCount } = await supabase
      .from('medications')
      .select('*', { count: 'exact', head: true })

    stats.value.totalUsers = usersCount || 0
    stats.value.totalMedications = medsCount || 0

    // 获取最近注册用户
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    recentUsers.value = data || []

    // 模拟活跃用户和依从性数据
    stats.value.activeUsers = Math.floor((stats.value.totalUsers || 0) * 0.6)
    stats.value.complianceRate = 85
  } catch (error) {
    console.error('获取统计数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<template>
  <div class="dashboard">
    <div class="page-header">
      <div class="header-content">
        <el-icon class="header-icon"><TrendCharts /></el-icon>
        <div class="header-text">
          <h2>数据统计</h2>
          <p class="desc">实时掌握平台运营情况</p>
        </div>
      </div>
    </div>

    <el-row :gutter="16" class="stats-cards">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card card-users">
          <div class="stat-content">
            <div class="stat-icon-wrapper">
              <el-icon :size="36"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">总用户数</div>
              <div class="stat-value">{{ stats.totalUsers }}</div>
              <div class="stat-trend">
                <el-icon><ArrowUp /></el-icon>
                <span>12% 较上周</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover" class="stat-card card-active">
          <div class="stat-content">
            <div class="stat-icon-wrapper">
              <el-icon :size="36"><VideoPlay /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">活跃用户</div>
              <div class="stat-value">{{ stats.activeUsers }}</div>
              <div class="stat-trend">
                <el-icon><ArrowUp /></el-icon>
                <span>8% 较上周</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover" class="stat-card card-meds">
          <div class="stat-content">
            <div class="stat-icon-wrapper">
              <el-icon :size="36"><Goods /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">药品总数</div>
              <div class="stat-value">{{ stats.totalMedications }}</div>
              <div class="stat-trend">
                <el-icon><ArrowUp /></el-icon>
                <span>5% 较上周</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover" class="stat-card card-compliance">
          <div class="stat-content">
            <div class="stat-icon-wrapper">
              <el-icon :size="36"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">平均依从性</div>
              <div class="stat-value">{{ stats.complianceRate }}%</div>
              <div class="stat-trend">
                <el-icon><ArrowUp /></el-icon>
                <span>3% 较上周</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="12">
        <el-card class="trend-card">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <el-icon><TrendCharts /></el-icon>
                <span>用户增长趋势</span>
              </div>
              <el-tag type="success" size="small">近 7 天</el-tag>
            </div>
          </template>
          <div class="chart-placeholder">
            <div class="chart-bar" v-for="(value, index) in chartData.users" :key="index" :style="{ height: (value / 2.5) + '%' }">
              <span class="chart-value">{{ value }}</span>
            </div>
          </div>
          <div class="chart-labels">
            <span v-for="day in ['周一', '周二', '周三', '周四', '周五', '周六', '周日']" :key="day" class="label">
              {{ day }}
            </span>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="trend-card">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <el-icon><Goods /></el-icon>
                <span>药品添加趋势</span>
              </div>
              <el-tag type="primary" size="small">近 7 天</el-tag>
            </div>
          </template>
          <div class="chart-placeholder">
            <div class="chart-bar med" v-for="(value, index) in chartData.medications" :key="index" :style="{ height: (value / 3.5) + '%' }">
              <span class="chart-value">{{ value }}</span>
            </div>
          </div>
          <div class="chart-labels">
            <span v-for="day in ['周一', '周二', '周三', '周四', '周五', '周六', '周日']" :key="day" class="label">
              {{ day }}
            </span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="users-card" style="margin-top: 16px">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon><User /></el-icon>
            <span>最近注册用户</span>
          </div>
          <el-button type="primary" link size="small">查看全部 →</el-button>
        </div>
      </template>

      <el-table :data="recentUsers" style="width: 100%" :header-cell-style="{ background: '#f8fafc', color: '#475569', fontWeight: 600 }">
        <el-table-column prop="username" label="用户名" min-width="120">
          <template #default="{ row }">
            <div class="user-name">
              <el-avatar :size="32" :icon="User" style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); margin-right: 12px;" />
              {{ row.username || '用户' + (row.phone?.slice(-4) || '未知') }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" min-width="140" />
        <el-table-column prop="created_at" label="注册时间" min-width="180">
          <template #default="{ row }">
            <el-tag size="small" type="info">
              {{ new Date(row.created_at).toLocaleDateString('zh-CN') }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="recentUsers.length === 0" class="empty-state">
        <el-icon :size="48" color="#cbd5e1"><User /></el-icon>
        <p>暂无用户数据</p>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 0;
}

.page-header {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e0f2fe;
}

.header-icon {
  font-size: 36px;
  color: #0284c7;
}

.header-text h2 {
  margin: 0 0 4px 0;
  color: #0c4a6e;
  font-size: 20px;
  font-weight: 700;
}

.header-text .desc {
  color: #64748b;
  margin: 0;
  font-size: 13px;
}

/* 统计卡片 */
.stats-cards {
  margin-bottom: 16px;
}

.stat-card {
  height: 130px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  overflow: visible;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  overflow: visible;
}

.stat-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  overflow: visible;
}

.card-users .stat-icon-wrapper {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.card-active .stat-icon-wrapper {
  background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
}

.card-meds .stat-icon-wrapper {
  background: linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%);
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
}

.card-compliance .stat-icon-wrapper {
  background: linear-gradient(135deg, #22c55e 0%, #10b981 100%);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #22c55e;
  font-weight: 500;
}

.stat-trend .el-icon {
  font-size: 14px;
}

/* 趋势卡片 */
.trend-card {
  min-height: 280px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #374151;
  font-size: 15px;
}

.header-title .el-icon {
  color: #3b82f6;
}

.chart-placeholder {
  height: 180px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 16px 20px;
  gap: 12px;
  background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
  border-radius: 8px;
  margin-bottom: 8px;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(180deg, #3b82f6 0%, #8b5cf6 100%);
  border-radius: 6px 6px 0 0;
  min-height: 20px;
  position: relative;
  transition: all 0.3s ease;
  cursor: pointer;
}

.chart-bar:hover {
  opacity: 0.8;
  transform: scaleY(1.02);
}

.chart-bar.med {
  background: linear-gradient(180deg, #06b6d4 0%, #0ea5e9 100%);
}

.chart-value {
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.chart-bar:hover .chart-value {
  opacity: 1;
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  padding: 8px 20px 0;
}

.chart-labels .label {
  flex: 1;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
}

/* 用户表格卡片 */
.users-card {
  min-height: 300px;
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

.user-name {
  display: flex;
  align-items: center;
}

:deep(.el-table__row:hover) {
  background: #f8fafc;
}

:deep(.el-table__cell) {
  padding: 14px 0;
}
</style>
