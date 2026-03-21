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
        <router-link to="/users" class="nav-item">
          <span class="nav-icon">👥</span>
          <span>用户管理</span>
        </router-link>
        <router-link to="/medications" class="nav-item active">
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
        <h1 class="page-title">用药计划管理</h1>
        <div class="header-actions">
          <span class="user-email">{{ authStore.user?.email }}</span>
          <el-button size="small" @click="handleLogout">退出</el-button>
        </div>
      </header>

      <div class="content">
        <!-- 用户筛选 -->
        <el-card style="margin-bottom: 16px">
          <el-form :inline="true" :model="filterForm">
            <el-form-item label="用户">
              <el-select
                v-model="filterForm.userId"
                placeholder="选择用户"
                clearable
                style="width: 250px"
                @change="loadPlans"
              >
                <el-option
                  v-for="user in users"
                  :key="user.id"
                  :label="user.username || user.phone || user.id.slice(0, 8)"
                  :value="user.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select
                v-model="filterForm.status"
                placeholder="选择状态"
                clearable
                style="width: 120px"
                @change="loadPlans"
              >
                <el-option label="启用" value="active" />
                <el-option label="停用" value="inactive" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="showAddDialog">新增用药计划</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 用药计划列表 -->
        <el-card>
          <el-table
            :data="plans"
            :loading="loading"
            style="width: 100%"
            v-if="plans.length > 0"
          >
            <el-table-column prop="id" label="计划 ID" width="280" />
            <el-table-column label="药品" width="200">
              <template #default="{ row }">
                <strong>{{ row.medication?.name || '未知药品' }}</strong>
              </template>
            </el-table-column>
            <el-table-column prop="time_of_day" label="服用时间" width="100" />
            <el-table-column prop="dosage" label="用量" width="80" />
            <el-table-column label="服用频率" width="120">
              <template #default="{ row }">
                <el-tag size="small" v-if="row.weekdays?.length === 7">每日</el-tag>
                <el-tag size="small" type="warning" v-else>
                  每周 {{ row.weekdays?.sort().join(',') }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.is_active ? 'success' : 'info'">
                  {{ row.is_active ? '启用' : '停用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="用户" width="150">
              <template #default="{ row }">
                {{ getUserInfo(row.user_id) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="280" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  @click="handleEdit(row)"
                >
                  编辑
                </el-button>
                <el-button
                  type="success"
                  size="small"
                  @click="handlePush(row)"
                >
                  推送
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

          <el-empty v-else description="暂无用药计划" />
        </el-card>
      </div>
    </main>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用药计划' : '新增用药计划'"
      width="600px"
      @close="resetForm"
    >
      <el-form :model="form" label-width="100px" ref="formRef">
        <el-form-item label="选择用户" required>
          <el-select
            v-model="form.userId"
            placeholder="选择用户"
            style="width: 100%"
            :disabled="isEdit"
          >
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="user.username || user.phone || user.id.slice(0, 8)"
              :value="user.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="选择药品" required>
          <el-select
            v-model="form.medicationId"
            placeholder="选择药品"
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="med in medications"
              :key="med.id"
              :label="med.name"
              :value="med.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="服用时间" required>
          <el-time-picker
            v-model="form.timeOfDay"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="选择时间"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="用量" required>
          <el-input
            v-model="form.dosage"
            placeholder="例如：1 片、10ml"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="服用说明">
          <el-input
            v-model="form.instructions"
            type="textarea"
            :rows="3"
            placeholder="例如：饭后服用、多喝水等"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="服用频率" required>
          <el-checkbox-group v-model="form.weekdays">
            <el-checkbox :label="1">周一</el-checkbox>
            <el-checkbox :label="2">周二</el-checkbox>
            <el-checkbox :label="3">周三</el-checkbox>
            <el-checkbox :label="4">周四</el-checkbox>
            <el-checkbox :label="5">周五</el-checkbox>
            <el-checkbox :label="6">周六</el-checkbox>
            <el-checkbox :label="7">周日</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="开始日期">
          <el-date-picker
            v-model="form.startDate"
            type="date"
            placeholder="选择开始日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="结束日期">
          <el-date-picker
            v-model="form.endDate"
            type="date"
            placeholder="选择结束日期（可选）"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-switch v-model="form.isActive" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 推送对话框 -->
    <el-dialog
      v-model="pushDialogVisible"
      title="推送用药计划"
      width="500px"
    >
      <el-form :model="pushForm" label-width="100px">
        <el-form-item label="推送内容">
          <el-input
            v-model="pushForm.message"
            type="textarea"
            :rows="4"
            readonly
          />
        </el-form-item>
        <el-form-item label="推送方式">
          <el-checkbox-group v-model="pushForm.methods">
            <el-checkbox label="app">App 通知</el-checkbox>
            <el-checkbox label="sms">短信</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="pushDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmPush" :loading="pushing">
          确认推送
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loading = ref(false)
const submitting = ref(false)
const pushing = ref(false)
const dialogVisible = ref(false)
const pushDialogVisible = ref(false)
const isEdit = ref(false)
const currentPlan = ref<any>(null)

const users = ref<any[]>([])
const medications = ref<any[]>([])
const plans = ref<any[]>([])

const filterForm = reactive({
  userId: '',
  status: ''
})

const form = reactive({
  userId: '',
  medicationId: '',
  timeOfDay: '',
  dosage: '',
  instructions: '',
  weekdays: [] as number[],
  startDate: '',
  endDate: '',
  isActive: true
})

const pushForm = reactive({
  planId: '',
  message: '',
  methods: ['app'] as string[]
})

const formRef = ref<any>(null)

// 获取用户信息显示
function getUserInfo(userId: string) {
  const user = users.value.find(u => u.id === userId)
  if (user) {
    return user.username || user.phone || userId.slice(0, 8)
  }
  return userId.slice(0, 8)
}

// 加载用户列表
async function loadUsers() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, phone')
      .order('created_at', { ascending: false })

    if (error) throw error
    users.value = data || []
  } catch (error: any) {
    console.error('加载用户失败:', error.message)
  }
}

// 加载药品列表
async function loadMedications() {
  try {
    const { data, error } = await supabase
      .from('medications')
      .select('id, name')
      .order('created_at', { ascending: false })

    if (error) throw error
    medications.value = data || []
  } catch (error: any) {
    console.error('加载药品失败:', error.message)
  }
}

// 加载用药计划
async function loadPlans() {
  loading.value = true
  try {
    let query = supabase
      .from('medication_schedules')
      .select(`
        *,
        medication:medications(name)
      `)
      .order('created_at', { ascending: false })

    if (filterForm.userId) {
      query = query.eq('user_id', filterForm.userId)
    }

    if (filterForm.status === 'active') {
      query = query.eq('is_active', true)
    } else if (filterForm.status === 'inactive') {
      query = query.eq('is_active', false)
    }

    const { data, error } = await query

    if (error) throw error
    plans.value = data || []
  } catch (error: any) {
    ElMessage.error('加载失败：' + error.message)
  } finally {
    loading.value = false
  }
}

// 显示新增对话框
function showAddDialog() {
  isEdit.value = false
  dialogVisible.value = true
}

// 编辑
function handleEdit(row: any) {
  isEdit.value = true
  currentPlan.value = row
  form.userId = row.user_id
  form.medicationId = row.medication_id
  form.timeOfDay = row.time_of_day
  form.dosage = row.dosage
  form.instructions = row.instructions || ''
  form.weekdays = row.weekdays || []
  form.startDate = row.start_date
  form.endDate = row.end_date
  form.isActive = row.is_active
  dialogVisible.value = true
}

// 重置表单
function resetForm() {
  form.userId = ''
  form.medicationId = ''
  form.timeOfDay = ''
  form.dosage = ''
  form.instructions = ''
  form.weekdays = []
  form.startDate = ''
  form.endDate = ''
  form.isActive = true
  currentPlan.value = null
}

// 提交
async function handleSubmit() {
  if (!form.userId || !form.medicationId || !form.timeOfDay || !form.dosage) {
    ElMessage.warning('请填写必填项')
    return
  }

  submitting.value = true
  try {
    const payload = {
      user_id: form.userId,
      medication_id: form.medicationId,
      time_of_day: form.timeOfDay,
      dosage: form.dosage,
      instructions: form.instructions,
      weekdays: form.weekdays,
      start_date: form.startDate || new Date().toISOString().split('T')[0],
      end_date: form.endDate || null,
      is_active: form.isActive
    }

    let error
    if (isEdit.value && currentPlan.value) {
      const result = await supabase
        .from('medication_schedules')
        .update(payload)
        .eq('id', currentPlan.value.id)
      error = result.error
    } else {
      const result = await supabase
        .from('medication_schedules')
        .insert(payload)
      error = result.error
    }

    if (error) throw error

    ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
    dialogVisible.value = false
    loadPlans()
  } catch (error: any) {
    ElMessage.error('操作失败：' + error.message)
  } finally {
    submitting.value = false
  }
}

// 删除
async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm('确定要删除这个用药计划吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const { error } = await supabase
      .from('medication_schedules')
      .delete()
      .eq('id', row.id)

    if (error) throw error

    ElMessage.success('删除成功')
    loadPlans()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + error.message)
    }
  }
}

// 显示推送对话框
function handlePush(row: any) {
  currentPlan.value = row
  const user = users.value.find(u => u.id === row.user_id)
  const userName = user?.username || user?.phone || '用户'
  const medName = row.medication?.name || '药品'

  pushForm.planId = row.id
  pushForm.message = `【用药提醒】${userName}：\n药品：${medName}\n时间：${row.time_of_day}\n用量：${row.dosage}\n说明：${row.instructions || '无'}`
  pushForm.methods = ['app']
  pushDialogVisible.value = true
}

// 确认推送
async function confirmPush() {
  pushing.value = true
  try {
    // 创建用药提醒记录
    const { error } = await supabase
      .from('medication_logs')
      .insert({
        schedule_id: pushForm.planId,
        user_id: currentPlan.value?.user_id,
        scheduled_time: new Date().toISOString(),
        status: 'taken',
        notes: pushForm.methods.includes('app') ? '已推送提醒' : ''
      })

    if (error) throw error

    ElMessage.success('推送成功')
    pushDialogVisible.value = false
  } catch (error: any) {
    ElMessage.error('推送失败：' + error.message)
  } finally {
    pushing.value = false
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
  loadMedications()
  loadPlans()

  // 检查 URL 参数是否有用户筛选
  if (route.query.userId) {
    filterForm.userId = route.query.userId as string
  }
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
</style>
