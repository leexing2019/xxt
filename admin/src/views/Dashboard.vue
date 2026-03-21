<template>
  <div class="dashboard-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <span>💊</span>
        <span>用药助手</span>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/" class="nav-item active">
          <span class="nav-icon">📊</span>
          <span>Dashboard</span>
        </router-link>
        <router-link to="/users" class="nav-item">
          <span class="nav-icon">👥</span>
          <span>用户管理</span>
        </router-link>
        <router-link to="/medications" class="nav-item">
          <span class="nav-icon">💊</span>
          <span>用药计划管理</span>
        </router-link>
        <router-link to="/api-settings" class="nav-item">
          <span class="nav-icon">⚙️</span>
          <span>API 配置</span>
        </router-link>
      </nav>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <header class="header">
        <h1 class="page-title">Dashboard</h1>
        <div class="header-actions">
          <span class="user-email">{{ authStore.user?.email }}</span>
          <el-button size="small" @click="handleLogout">退出</el-button>
        </div>
      </header>

      <div class="content">
        <!-- 统计卡片 -->
        <div class="stats-grid">
          <el-card class="stat-card" @click="router.push('/users')" style="cursor: pointer">
            <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
              👥
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.userCount }}</div>
              <div class="stat-label">注册用户</div>
            </div>
          </el-card>

          <el-card class="stat-card" @click="router.push('/medications')" style="cursor: pointer">
            <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
              💊
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.medicationCount }}</div>
              <div class="stat-label">用药计划</div>
            </div>
          </el-card>

          <el-card class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
              ✅
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.todayLogs }}</div>
              <div class="stat-label">今日服药记录</div>
            </div>
          </el-card>

          <el-card class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
              📈
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.complianceRate }}%</div>
              <div class="stat-label">平均依从性</div>
            </div>
          </el-card>
        </div>

        <!-- 快捷操作 -->
        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="12">
            <el-card>
              <template #header>
                <div style="display: flex; justify-content: space-between; align-items: center">
                  <strong>快捷操作</strong>
                </div>
              </template>
              <div style="display: flex; flex-wrap: wrap; gap: 12px">
                <el-button type="primary" @click="router.push('/medications')">
                  + 新增用药计划
                </el-button>
                <el-button @click="router.push('/users')">
                  👥 查看用户列表
                </el-button>
                <el-button @click="router.push('/api-settings')">
                  ⚙️ API 配置
                </el-button>
              </div>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card>
              <template #header>
                <strong>系统状态</strong>
              </template>
              <div style="line-height: 2.5">
                <div>🟢 服务运行正常</div>
                <div>📅 今天 {{ new Date().toLocaleDateString('zh-CN') }}</div>
                <div>🕐 当前时间 {{ currentTime }}</div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 最近用药记录 -->
        <el-card style="margin-top: 20px">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <strong>最近服药记录</strong>
              <el-button type="primary" text @click="router.push('/medications')">
                查看全部
              </el-button>
            </div>
          </template>
          <el-table :data="recentLogs" :loading="loading" style="width: 100%">
            <el-table-column prop="scheduled_time" label="计划时间" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.scheduled_time) }}
              </template>
            </el-table-column>
            <el-table-column label="药品" width="200">
              <template #default="{ row }">
                {{ row.medication?.name || '未知药品' }}
              </template>
            </el-table-column>
            <el-table-column label="用户" width="150">
              <template #default="{ row }">
                {{ getUserInfo(row.user_id) }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'taken' ? 'success' : row.status === 'missed' ? 'danger' : 'warning'" size="small">
                  {{ row.status === 'taken' ? '已服用' : row.status === 'missed' ? '未服用' : '延迟' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="备注">
              <template #default="{ row }">
                {{ row.notes || row.side_effects || '-' }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const currentTime = ref('')
const stats = reactive({
  userCount: 0,
  medicationCount: 0,
  todayLogs: 0,
  complianceRate: 0
})
const recentLogs = ref<any[]>([])
const users = ref<any[]>([])

// 更新时间
function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 格式化日期时间
function formatDateTime(dateString: string) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取用户信息
function getUserInfo(userId: string) {
  const user = users.value.find(u => u.id === userId)
  return user?.username || user?.phone || userId.slice(0, 8)
}

// 加载统计数据
async function loadStats() {
  try {
    // 用户数
    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // 用药计划数
    const { count: medicationCount } = await supabase
      .from('medication_schedules')
      .select('*', { count: 'exact', head: true })

    // 今日服药记录数
    const today = new Date().toISOString().split('T')[0]
    const { count: todayLogs } = await supabase
      .from('medication_logs')
      .select('*', { count: 'exact', head: true })
      .gte('scheduled_time', today)

    // 计算依从性（已服用/总记录）
    const { data: logsData } = await supabase
      .from('medication_logs')
      .select('status')
      .gte('scheduled_time', today)

    const takenCount = logsData?.filter(l => l.status === 'taken').length || 0
    const totalCount = logsData?.length || 1
    const complianceRate = Math.round((takenCount / totalCount) * 100)

    stats.userCount = userCount || 0
    stats.medicationCount = medicationCount || 0
    stats.todayLogs = todayLogs || 0
    stats.complianceRate = complianceRate
  } catch (error: any) {
    console.error('加载统计数据失败:', error.message)
  }
}

// 加载最近记录
async function loadRecentLogs() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('medication_logs')
      .select(`
        *,
        medication:medications(name)
      `)
      .order('scheduled_time', { ascending: false })
      .limit(10)

    if (error) throw error
    recentLogs.value = data || []
  } catch (error: any) {
    ElMessage.error('加载失败：' + error.message)
  } finally {
    loading.value = false
  }
}

// 加载用户列表（用于显示）
async function loadUsers() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, phone')

    if (error) throw error
    users.value = data || []
  } catch (error: any) {
    console.error('加载用户失败:', error.message)
  }
}

function handleLogout() {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    authStore.logout()
    router.push('/login')
  })
}

onMounted(() => {
  updateTime()
  setInterval(updateTime, 1000)
  loadStats()
  loadUsers()
  loadRecentLogs()
})
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  display: flex;
  flex-direction: column;
}

.sidebar-logo {
  padding: 24px;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-nav {
  padding: 16px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.nav-icon {
  font-size: 20px;
}

.main-content {
  flex: 1;
  background: #f5f5f5;
}

.header {
  background: white;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-email {
  color: #666;
  font-size: 14px;
}

.content {
  padding: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin-top: 4px;
}
</style>
