<template>
  <div class="dashboard-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <span>💊</span>
        <span>用药助手</span>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/" class="nav-item">
          <span class="nav-icon">📊</span>
          <span>Dashboard</span>
        </router-link>
        <router-link to="/users" class="nav-item active">
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
        <h1 class="page-title">用户管理</h1>
        <div class="header-actions">
          <span class="user-email">{{ authStore.user?.email }}</span>
          <el-button size="small" @click="handleLogout">退出</el-button>
        </div>
      </header>

      <div class="content">
        <el-card>
          <div class="toolbar">
            <el-input
              v-model="searchQuery"
              placeholder="搜索用户名、手机号..."
              style="width: 300px"
              clearable
              @input="loadUsers"
            />
          </div>

          <el-table
            :data="users"
            :loading="loading"
            style="width: 100%"
            v-if="users.length > 0"
          >
            <el-table-column prop="id" label="用户 ID" width="280" />
            <el-table-column prop="username" label="用户名" width="150" />
            <el-table-column prop="phone" label="手机号" width="150" />
            <el-table-column prop="emergency_contact" label="紧急联系人" width="120" />
            <el-table-column prop="emergency_phone" label="紧急电话" width="120" />
            <el-table-column label="注册时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  @click="viewUserPlans(row)"
                >
                  查看计划
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  @click="handleDelete(row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-else description="暂无用户" />
        </el-card>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const searchQuery = ref('')
const users = ref<any[]>([])

function formatDate(dateString: string) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function loadUsers() {
  loading.value = true
  try {
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (searchQuery.value) {
      query = query.or(`username.ilike.%${searchQuery.value}%,phone.ilike.%${searchQuery.value}%`)
    }

    const { data, error } = await query

    if (error) throw error
    users.value = data || []
  } catch (error: any) {
    ElMessage.error('加载失败：' + error.message)
  } finally {
    loading.value = false
  }
}

function viewUserPlans(user: any) {
  router.push(`/medications?userId=${user.id}`)
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个用户吗？这将同时删除该用户的所有用药计划和记录！',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', row.id)

    if (error) throw error

    ElMessage.success('删除成功')
    loadUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + error.message)
    }
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
  loadUsers()
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

.toolbar {
  margin-bottom: 16px;
}
</style>
