<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import type { User } from '@supabase/supabase-js'
import { Search, Plus, Clock, Bell } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const users = ref<any[]>([])
const loading = ref(true)
const searchKeyword = ref('')
const userDetailDialogVisible = ref(false)
const medicationDialogVisible = ref(false)
const pushDialogVisible = ref(false)
const currentUser = ref<any>(null)
const currentPlan = ref<any>(null)

// 用户用药计划相关
const userMedications = ref<any[]>([])
const medicationsLoading = ref(false)
const medications = ref<any[]>([])

// 新增用药计划表单
const newPlanForm = ref({
  medicationId: '',
  timeOfDay: '08:00',
  dosage: '1 片',
  instructions: '',
  weekdays: [1, 2, 3, 4, 5, 6, 7],
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  isActive: true
})

// 推送表单
const pushForm = ref({
  scheduleId: '',
  message: '',
  methods: ['app'] as string[]
})

async function fetchUsers() {
  loading.value = true

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    users.value = data || []
  } catch (error) {
    console.error('获取用户列表失败:', error)
  } finally {
    loading.value = false
  }
}

function handleViewDetail(user: any) {
  currentUser.value = user
  userDetailDialogVisible.value = true
}

async function handleDelete(user: any) {
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
      .eq('id', user.id)

    if (error) throw error

    ElMessage.success('删除成功')
    await fetchUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + error.message)
    }
  }
}

// 打开用药计划管理对话框
async function handleMedications(user: any) {
  currentUser.value = user
  medicationDialogVisible.value = true
  await fetchUserMedications(user.id)
  await fetchMedicationsList()
}

// 获取用户的用药计划列表
async function fetchUserMedications(userId: string) {
  medicationsLoading.value = true
  try {
    const { data, error } = await supabase
      .from('medication_schedules')
      .select(`
        *,
        medication:medications(name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    userMedications.value = data || []
  } catch (error) {
    console.error('获取用药计划失败:', error)
    ElMessage.error('加载失败')
  } finally {
    medicationsLoading.value = false
  }
}

// 获取药品列表
async function fetchMedicationsList() {
  try {
    const { data, error } = await supabase
      .from('medications')
      .select('id, name')
      .order('created_at', { ascending: false })

    if (error) throw error
    medications.value = data || []
  } catch (error) {
    console.error('获取药品列表失败:', error)
  }
}

// 创建用药计划
async function handleAddMedication() {
  if (!newPlanForm.value.medicationId || !newPlanForm.value.timeOfDay || !newPlanForm.value.dosage) {
    ElMessage.warning('请填写必填项')
    return
  }

  try {
    const payload = {
      user_id: currentUser.value.id,
      medication_id: newPlanForm.value.medicationId,
      time_of_day: newPlanForm.value.timeOfDay,
      dosage: newPlanForm.value.dosage,
      instructions: newPlanForm.value.instructions || '',
      weekdays: newPlanForm.value.weekdays,
      start_date: newPlanForm.value.startDate,
      end_date: newPlanForm.value.endDate || null,
      is_active: newPlanForm.value.isActive
    }

    const { error } = await supabase
      .from('medication_schedules')
      .insert(payload)

    if (error) throw error

    ElMessage.success('创建成功')
    newPlanForm.value = {
      medicationId: '',
      timeOfDay: '08:00',
      dosage: '1 片',
      instructions: '',
      weekdays: [1, 2, 3, 4, 5, 6, 7],
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      isActive: true
    }
    await fetchUserMedications(currentUser.value.id)
  } catch (error: any) {
    ElMessage.error('创建失败：' + error.message)
  }
}

// 删除用药计划
async function handleDeleteMedication(plan: any) {
  try {
    await ElMessageBox.confirm('确定要删除这个用药计划吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const { error } = await supabase
      .from('medication_schedules')
      .delete()
      .eq('id', plan.id)

    if (error) throw error

    ElMessage.success('删除成功')
    await fetchUserMedications(currentUser.value.id)
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + error.message)
    }
  }
}

// 打开推送对话框
function handlePush(plan: any) {
  currentPlan.value = plan
  const user = currentUser.value
  const userName = user.username || user.phone || '用户'
  const medName = plan.medication?.name || '药品'

  pushForm.value = {
    scheduleId: plan.id,
    message: `【用药提醒】${userName}：\n药品：${medName}\n时间：${plan.time_of_day}\n用量：${plan.dosage}\n说明：${plan.instructions || '无'}`,
    methods: ['app']
  }
  pushDialogVisible.value = true
}

// 确认推送
async function confirmPush() {
  try {
    const { error } = await supabase
      .from('medication_logs')
      .insert({
        schedule_id: pushForm.value.scheduleId,
        user_id: currentUser.value.id,
        scheduled_time: new Date().toISOString(),
        status: 'taken',
        notes: pushForm.value.methods.includes('app') ? '已推送提醒' : ''
      })

    if (error) throw error

    ElMessage.success('推送成功')
    pushDialogVisible.value = false
  } catch (error: any) {
    ElMessage.error('推送失败：' + error.message)
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="users-page">
    <div class="page-header">
      <h2>用户管理</h2>
      <el-input
        v-model="searchKeyword"
        placeholder="搜索用户名或手机号"
        style="width: 300px"
        clearable
        @input="searchKeyword = $event.target.value"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <el-card>
      <el-table
        :data="users.filter(u => !searchKeyword || u.username?.includes(searchKeyword) || u.phone?.includes(searchKeyword))"
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="avatar_url" label="头像">
          <template #default="{ row }">
            <el-avatar v-if="row.avatar_url" :src="row.avatar_url" :size="40" />
            <el-avatar v-else :size="40" icon="User" />
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="180">
          <template #default="{ row }">
            {{ new Date(row.created_at).toLocaleString('zh-CN') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              @click="handleMedications(row)"
              :icon="Clock"
            >
              用药计划
            </el-button>
            <el-button link type="primary" @click="handleViewDetail(row)">详情</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 用户详情对话框 -->
    <el-dialog v-model="userDetailDialogVisible" title="用户详情" width="500px">
      <el-descriptions :column="1" v-if="currentUser">
        <el-descriptions-item label="用户名">{{ currentUser.username }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentUser.phone }}</el-descriptions-item>
        <el-descriptions-item label="紧急联系人">{{ currentUser.emergency_contact || '-' }}</el-descriptions-item>
        <el-descriptions-item label="紧急电话">{{ currentUser.emergency_phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">
          {{ new Date(currentUser.created_at).toLocaleString('zh-CN') }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 用药计划管理对话框 -->
    <el-dialog
      v-model="medicationDialogVisible"
      :title="currentUser?.username ? currentUser.username + ' - 用药计划管理' : '用药计划管理'"
      width="800px"
    >
      <!-- 新增用药计划 -->
      <el-card class="add-plan-card" style="margin-bottom: 20px">
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center">
            <span style="font-weight: 600">新增用药计划</span>
          </div>
        </template>
        <el-form :model="newPlanForm" label-width="80px" size="default">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="选择药品" required>
                <el-select
                  v-model="newPlanForm.medicationId"
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
            </el-col>
            <el-col :span="12">
              <el-form-item label="服用时间" required>
                <el-time-picker
                  v-model="newPlanForm.timeOfDay"
                  format="HH:mm"
                  value-format="HH:mm"
                  placeholder="选择时间"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="用量" required>
                <el-input
                  v-model="newPlanForm.dosage"
                  placeholder="例如：1 片、10ml"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="服用频率">
                <el-checkbox-group v-model="newPlanForm.weekdays" size="small">
                  <el-checkbox :label="1">一</el-checkbox>
                  <el-checkbox :label="2">二</el-checkbox>
                  <el-checkbox :label="3">三</el-checkbox>
                  <el-checkbox :label="4">四</el-checkbox>
                  <el-checkbox :label="5">五</el-checkbox>
                  <el-checkbox :label="6">六</el-checkbox>
                  <el-checkbox :label="7">日</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="开始日期">
                <el-date-picker
                  v-model="newPlanForm.startDate"
                  type="date"
                  placeholder="选择开始日期"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="结束日期">
                <el-date-picker
                  v-model="newPlanForm.endDate"
                  type="date"
                  placeholder="选择结束日期"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="服用说明">
            <el-input
              v-model="newPlanForm.instructions"
              type="textarea"
              :rows="2"
              placeholder="例如：饭后服用、多喝水等"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleAddMedication" :loading="medicationsLoading">
              <el-icon><Plus /></el-icon>
              添加计划
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 用药计划列表 -->
      <el-card>
        <template #header>
          <span style="font-weight: 600">现有用药计划</span>
        </template>
        <el-table
          :data="userMedications"
          v-loading="medicationsLoading"
          style="width: 100%"
        >
          <el-table-column prop="id" label="计划 ID" width="280" />
          <el-table-column label="药品" width="150">
            <template #default="{ row }">
              <strong>{{ row.medication?.name || '未知药品' }}</strong>
            </template>
          </el-table-column>
          <el-table-column prop="time_of_day" label="服用时间" width="100" />
          <el-table-column prop="dosage" label="用量" width="80" />
          <el-table-column label="频率" width="120">
            <template #default="{ row }">
              <el-tag size="small" v-if="row.weekdays?.length === 7">每日</el-tag>
              <el-tag size="small" type="warning" v-else>
                周{{ row.weekdays?.sort().join(',') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
                {{ row.is_active ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button
                link
                type="success"
                size="small"
                @click="handlePush(row)"
                :icon="Bell"
              >
                推送
              </el-button>
              <el-button
                link
                type="danger"
                size="small"
                @click="handleDeleteMedication(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="userMedications.length === 0 && !medicationsLoading" description="暂无用药计划" />
      </el-card>
    </el-dialog>

    <!-- 推送对话框 -->
    <el-dialog
      v-model="pushDialogVisible"
      title="推送用药计划"
      width="500px"
    >
      <el-form :model="pushForm" label-width="80px">
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
        <el-button type="primary" @click="confirmPush">
          确认推送
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.users-page {
  width: 100%;
  max-width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #1e293b;
  font-size: 20px;
  font-weight: 700;
}

.add-plan-card {
  background: #f8fafc;
}

.add-plan-card :deep(.el-card__header) {
  background: #e2e8f0;
}
</style>
