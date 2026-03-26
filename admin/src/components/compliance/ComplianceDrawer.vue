<script setup lang="ts">
import { ref, computed } from 'vue'
import { getAllUserComplianceStats, type UserComplianceStats } from '@/services/compliance'
import UserComplianceDetailDrawer from './UserComplianceDetailDrawer.vue'
import { User, CircleCheck, ArrowRight } from '@element-plus/icons-vue'

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

// 初始化加载数据
fetchComplianceStats()
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
        <el-table-column prop="username" label="用户名" min-width="150">
          <template #default="{ row }">
            <div class="user-name">
              <el-avatar :size="32" :icon="User" style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); margin-right: 12px;" />
              {{ row.username || row.phone || '未知用户' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="今日依从率" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag :color="getComplianceColor(row.today_compliance)" size="small" effect="dark">
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

        <el-table-column label="操作" min-width="120" align="center">
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
        <p class="hint">提示：用户开始服药后才会显示数据</p>
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
  margin: 8px 0;
  font-size: 14px;
}

.empty-state .hint {
  font-size: 12px;
  color: #64748b;
}

:deep(.el-table__row:hover) {
  background: #f8fafc;
}

:deep(.el-table__cell) {
  padding: 14px 0;
}
</style>
