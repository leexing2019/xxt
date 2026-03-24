<template>
  <view class="medication-schedule-page">
    <!-- 顶部统计 -->
    <view class="header">
      <view class="stats-card">
        <view class="stat-item">
          <view class="stat-icon-wrapper">
            <text class="stat-icon">💊</text>
          </view>
          <text class="stat-value">{{ schedules.length }}</text>
          <text class="stat-label">用药计划</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <view class="stat-icon-wrapper">
            <text class="stat-icon">✅</text>
          </view>
          <text class="stat-value">{{ activeSchedules.length }}</text>
          <text class="stat-label">进行中</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <view class="stat-icon-wrapper">
            <text class="stat-icon">⏸️</text>
          </view>
          <text class="stat-value">{{ inactiveSchedules.length }}</text>
          <text class="stat-label">已停用</text>
        </view>
      </view>
    </view>

    <!-- 筛选和搜索 -->
    <view class="filter-section">
      <view class="search-bar">
        <text class="search-icon">🔍</text>
        <input
          v-model="searchQuery"
          class="search-input"
          placeholder="搜索药品名称..."
          placeholder-class="input-placeholder"
        />
        <text v-if="searchQuery" class="search-clear" @click="clearSearch">✕</text>
      </view>

      <view class="filter-tags">
        <view
          :class="['filter-tag', statusFilter === 'all' ? 'active' : '']"
          @click="statusFilter = 'all'"
        >
          全部
        </view>
        <view
          :class="['filter-tag', statusFilter === 'active' ? 'active' : '']"
          @click="statusFilter = 'active'"
        >
          进行中
        </view>
        <view
          :class="['filter-tag', statusFilter === 'inactive' ? 'active' : '']"
          @click="statusFilter = 'inactive'"
        >
          已停用
        </view>
      </view>
    </view>

    <!-- 列表内容 -->
    <view class="schedule-section">
      <view v-if="filteredSchedules.length === 0" class="empty-state">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无用药计划</text>
        <text class="empty-hint">
          {{ searchQuery ? '换一个关键词试试' : '点击下方按钮添加您的第一个用药计划' }}
        </text>
        <button v-if="!searchQuery" class="add-btn-inline" @click="showAddModal = true">
          添加用药计划
        </button>
      </view>

      <view v-else class="schedule-list">
        <view
          v-for="(schedule, index) in paginatedSchedules"
          :key="schedule.id"
          :class="['schedule-card', `stagger-in-${(currentPage - 1) * pageSize + index + 1}`]"
        >
          <view class="schedule-header">
            <view class="med-info">
              <text class="med-name">{{ schedule.medication?.name || '未知药品' }}</text>
              <view class="status-badge" :class="schedule.is_active ? 'active' : 'inactive'">
                {{ schedule.is_active ? '进行中' : '已停用' }}
              </view>
            </view>
            <view class="card-actions">
              <text class="action-btn edit" @click="openEditModal(schedule)">✏️</text>
              <text class="action-btn delete" @click="confirmDelete(schedule)">🗑️</text>
            </view>
          </view>

          <view class="schedule-details">
            <view class="detail-row">
              <text class="detail-icon">⏰</text>
              <text class="detail-label">服用时间：</text>
              <text class="detail-value">{{ schedule.time_of_day }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-icon">💊</text>
              <text class="detail-label">用量：</text>
              <text class="detail-value">{{ schedule.dosage }}</text>
            </view>
            <view v-if="schedule.instructions" class="detail-row">
              <text class="detail-icon">📝</text>
              <text class="detail-label">说明：</text>
              <text class="detail-value">{{ schedule.instructions }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-icon">📅</text>
              <text class="detail-label">频率：</text>
              <text class="detail-value">{{ getWeekdayText(schedule.weekdays) }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-icon">📆</text>
              <text class="detail-label">有效期：</text>
              <text class="detail-value">
                {{ schedule.start_date }}{{ schedule.end_date ? ` 至 ${schedule.end_date}` : '起' }}
              </text>
            </view>
          </view>

          <view class="schedule-footer">
            <view class="footer-info">
              <text class="create-time">创建于：{{ formatDate(schedule.created_at) }}</text>
            </view>
            <view class="footer-actions">
              <button
                v-if="schedule.is_active"
                class="btn-toggle"
                @click="toggleScheduleStatus(schedule, false)"
              >
                停用
              </button>
              <button
                v-else
                class="btn-toggle btn-activate"
                @click="toggleScheduleStatus(schedule, true)"
              >
                启用
              </button>
            </view>
          </view>
        </view>
      </view>

      <!-- 分页 -->
      <view v-if="totalPages > 1" class="pagination">
        <button
          class="page-btn"
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
        >
          上一页
        </button>
        <view class="page-info">
          <text class="page-text">{{ currentPage }} / {{ totalPages }}</text>
        </view>
        <button
          class="page-btn"
          :disabled="currentPage === totalPages"
          @click="changePage(currentPage + 1)"
        >
          下一页
        </button>
      </view>
    </view>

    <!-- 添加/编辑弹窗 -->
    <view v-if="showAddModal || showEditModal" class="modal-overlay" @click="closeModals">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ showEditModal ? '编辑用药计划' : '添加用药计划' }}</text>
          <text class="modal-close" @click="closeModals">✕</text>
        </view>

        <view class="modal-body">
          <!-- 选择药品 -->
          <view class="form-group">
            <text class="form-label">选择药品 *</text>
            <picker
              :range="medicationOptions"
              :value="form.medicationIndex"
              @change="onMedicationChange"
            >
              <view class="picker-input">
                {{ medicationOptions[form.medicationIndex] || '请选择药品' }}
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>

          <!-- 服用时间 -->
          <view class="form-group">
            <text class="form-label">服用时间 *</text>
            <picker
              mode="time"
              :value="form.time_of_day"
              @change="onTimeChange"
            >
              <view class="picker-input">
                {{ form.time_of_day || '请选择时间' }}
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>

          <!-- 用量 -->
          <view class="form-group">
            <text class="form-label">用量 *</text>
            <input
              v-model="form.dosage"
              class="form-input"
              placeholder="例如：1 片、2 粒、5ml"
            />
          </view>

          <!-- 用药说明 -->
          <view class="form-group">
            <text class="form-label">用药说明</text>
            <textarea
              v-model="form.instructions"
              class="form-textarea"
              placeholder="例如：饭后服用、多喝水等"
              maxlength="200"
            />
          </view>

          <!-- 服用频率 -->
          <view class="form-group">
            <text class="form-label">服用频率 *</text>
            <view class="weekday-selector">
              <view
                v-for="(day, index) in weekdays"
                :key="day.value"
                :class="['weekday-btn', form.weekdays.includes(day.value) ? 'selected' : '']"
                @click="toggleWeekday(day.value)"
              >
                {{ day.label }}
              </view>
            </view>
          </view>

          <!-- 开始日期 -->
          <view class="form-group">
            <text class="form-label">开始日期 *</text>
            <picker
              mode="date"
              :value="form.start_date"
              @change="onStartDateChange"
            >
              <view class="picker-input">
                {{ form.start_date || '请选择日期' }}
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>

          <!-- 结束日期（可选） -->
          <view class="form-group">
            <text class="form-label">结束日期（可选）</text>
            <picker
              mode="date"
              :value="form.end_date"
              @change="onEndDateChange"
            >
              <view class="picker-input">
                {{ form.end_date || '长期服用' }}
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
        </view>

        <view class="modal-footer">
          <button class="btn-cancel" @click="closeModals">取消</button>
          <button class="btn-confirm" @click="submitForm" :disabled="isSubmitting">
            {{ isSubmitting ? '保存中...' : '保存' }}
          </button>
        </view>
      </view>
    </view>

    <!-- 悬浮添加按钮 -->
    <view class="fab-container" @click="showAddModal = true">
      <text class="fab-icon">➕</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/store/auth'
import { useMedicationStore, type MedicationSchedule, type Medication } from '@/store/medication'

const authStore = useAuthStore()
const medicationStore = useMedicationStore()

// 状态
const schedules = ref<MedicationSchedule[]>([])
const medications = ref<Medication[]>([])
const loading = ref(false)
const isSubmitting = ref(false)

// 筛选和搜索
const searchQuery = ref('')
const statusFilter = ref<'all' | 'active' | 'inactive'>('all')

// 分页
const currentPage = ref(1)
const pageSize = 10

// 星期选项
const weekdays = [
  { label: '一', value: 1 },
  { label: '二', value: 2 },
  { label: '三', value: 3 },
  { label: '四', value: 4 },
  { label: '五', value: 5 },
  { label: '六', value: 6 },
  { label: '日', value: 7 }
]

// 弹窗状态
const showAddModal = ref(false)
const showEditModal = ref(false)

// 表单数据
const defaultForm = {
  medication_id: '',
  medicationIndex: -1,
  time_of_day: '08:00',
  dosage: '',
  instructions: '',
  weekdays: [1, 2, 3, 4, 5, 6, 7],
  start_date: new Date().toISOString().split('T')[0],
  end_date: ''
}
const form = ref({ ...defaultForm })
const editingSchedule = ref<MedicationSchedule | null>(null)

// 药品选项
const medicationOptions = computed(() => {
  return medications.value.map(m => m.name)
})

// 计算属性
const activeSchedules = computed(() => schedules.value.filter(s => s.is_active))
const inactiveSchedules = computed(() => schedules.value.filter(s => !s.is_active))

const filteredSchedules = computed(() => {
  return schedules.value.filter(schedule => {
    // 状态筛选
    if (statusFilter.value === 'active' && !schedule.is_active) return false
    if (statusFilter.value === 'inactive' && schedule.is_active) return false

    // 搜索筛选
    if (searchQuery.value) {
      const medName = schedule.medication?.name || ''
      return medName.toLowerCase().includes(searchQuery.value.toLowerCase())
    }

    return true
  }).sort((a, b) => {
    // 按时间排序
    return a.time_of_day.localeCompare(b.time_of_day)
  })
})

const totalPages = computed(() => Math.ceil(filteredSchedules.value.length / pageSize))

const paginatedSchedules = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredSchedules.value.slice(start, start + pageSize)
})

// 获取用药计划
async function fetchSchedules() {
  if (!authStore.userId) return

  loading.value = true
  try {
    const { data, error } = await supabase
      .from('medication_schedules')
      .select('*, common_medications(*)')
      .eq('user_id', authStore.userId)
      .order('time_of_day', { ascending: true })

    if (error) throw error
    schedules.value = data || []
  } catch (error: any) {
    console.error('获取用药计划失败:', error)
    uni.showToast({ title: error.message, icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 获取药品列表（通过 medication_schedules 关联 common_medications）
async function fetchMedications() {
  if (!authStore.userId) return

  try {
    const { data, error } = await supabase
      .from('medication_schedules')
      .select(`
        id,
        medication_id,
        common_medications (*)
      `)
      .eq('user_id', authStore.userId)

    if (error) throw error

    // 提取药品信息（去重）
    const medsMap = new Map()
    data?.forEach(item => {
      if (!medsMap.has(item.medication_id)) {
        medsMap.set(item.medication_id, {
          id: item.common_medications.id,
          name: item.common_medications.name,
          generic_name: item.common_medications.generic_name,
          manufacturer: item.common_medications.manufacturer,
          specification: item.common_medications.specification,
          form: item.common_medications.form,
          appearance_desc: item.common_medications.appearance_desc,
          image_url: item.common_medications.image_url,
          created_at: item.common_medications.created_at_with_tz
        })
      }
    })
    medications.value = Array.from(medsMap.values())
  } catch (error: any) {
    console.error('获取药品列表失败:', error)
  }
}

// 获取星期文本
function getWeekdayText(weekdays: number[]): string {
  if (weekdays.length === 0) return '不适用'
  if (weekdays.length === 7) return '每天'
  if (weekdays.length === 5 && !weekdays.includes(6) && !weekdays.includes(7)) {
    return '工作日'
  }
  if (weekdays.length === 2 && weekdays.includes(6) && weekdays.includes(7)) {
    return '周末'
  }
  return weekdays.map(d => weekdays.find(w => w.value === d)?.label).join('、')
}

// 格式化日期
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 搜索相关
function clearSearch() {
  searchQuery.value = ''
  currentPage.value = 1
}

// 分页
function changePage(page: number) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

// 弹窗操作
function closeModals() {
  showAddModal.value = false
  showEditModal.value = false
  form.value = { ...defaultForm }
  editingSchedule.value = null
}

// 表单事件处理
function onMedicationChange(e: any) {
  const index = e.detail.value
  form.value.medicationIndex = index
  form.value.medication_id = medications.value[index]?.id || ''
}

function onTimeChange(e: any) {
  form.value.time_of_day = e.detail.value
}

function onStartDateChange(e: any) {
  form.value.start_date = e.detail.value
}

function onEndDateChange(e: any) {
  form.value.end_date = e.detail.value
}

function toggleWeekday(value: number) {
  const index = form.value.weekdays.indexOf(value)
  if (index === -1) {
    form.value.weekdays.push(value)
  } else {
    form.value.weekdays.splice(index, 1)
  }
}

// 打开编辑弹窗
function openEditModal(schedule: MedicationSchedule) {
  editingSchedule.value = schedule
  form.value = {
    medication_id: schedule.medication_id,
    medicationIndex: medications.value.findIndex(m => m.id === schedule.medication_id),
    time_of_day: schedule.time_of_day,
    dosage: schedule.dosage,
    instructions: schedule.instructions || '',
    weekdays: [...schedule.weekdays],
    start_date: schedule.start_date,
    end_date: schedule.end_date || ''
  }
  showEditModal.value = true
}

// 确认删除
function confirmDelete(schedule: MedicationSchedule) {
  const medName = schedule.medication?.name || '该用药计划'
  uni.showModal({
    title: '确认删除',
    content: `确定要删除"${medName}"的用药计划吗？`,
    confirmText: '删除',
    confirmColor: '#E53935',
    success: async (res) => {
      if (res.confirm) {
        await deleteSchedule(schedule.id)
      }
    }
  })
}

// 删除用药计划
async function deleteSchedule(id: string) {
  try {
    const { error } = await supabase
      .from('medication_schedules')
      .delete()
      .eq('id', id)

    if (error) throw error

    schedules.value = schedules.value.filter(s => s.id !== id)
    uni.showToast({ title: '已删除', icon: 'success' })
  } catch (error: any) {
    console.error('删除失败:', error)
    uni.showToast({ title: error.message, icon: 'none' })
  }
}

// 切换状态
async function toggleScheduleStatus(schedule: MedicationSchedule, isActive: boolean) {
  try {
    const { error } = await supabase
      .from('medication_schedules')
      .update({ is_active: isActive })
      .eq('id', schedule.id)

    if (error) throw error

    const index = schedules.value.findIndex(s => s.id === schedule.id)
    if (index !== -1) {
      schedules.value[index].is_active = isActive
    }

    uni.showToast({ title: isActive ? '已启用' : '已停用', icon: 'success' })
  } catch (error: any) {
    console.error('更新状态失败:', error)
    uni.showToast({ title: error.message, icon: 'none' })
  }
}

// 提交表单
async function submitForm() {
  // 验证必填项
  if (!form.value.medication_id) {
    uni.showToast({ title: '请选择药品', icon: 'none' })
    return
  }
  if (!form.value.time_of_day) {
    uni.showToast({ title: '请选择服用时间', icon: 'none' })
    return
  }
  if (!form.value.dosage.trim()) {
    uni.showToast({ title: '请输入用量', icon: 'none' })
    return
  }
  if (form.value.weekdays.length === 0) {
    uni.showToast({ title: '请选择服用频率', icon: 'none' })
    return
  }

  isSubmitting.value = true

  try {
    const scheduleData = {
      medication_id: form.value.medication_id,
      user_id: authStore.userId,
      time_of_day: form.value.time_of_day,
      dosage: form.value.dosage,
      instructions: form.value.instructions,
      weekdays: form.value.weekdays.sort((a, b) => a - b),
      start_date: form.value.start_date,
      end_date: form.value.end_date || null,
      is_active: true
    }

    if (showEditModal.value && editingSchedule.value) {
      // 更新
      const { error } = await supabase
        .from('medication_schedules')
        .update(scheduleData)
        .eq('id', editingSchedule.value.id)

      if (error) throw error

      // 更新本地数据
      const index = schedules.value.findIndex(s => s.id === editingSchedule.value.id)
      if (index !== -1) {
        schedules.value[index] = { ...schedules.value[index], ...scheduleData }
      }

      uni.showToast({ title: '已更新', icon: 'success' })
    } else {
      // 新增
      const { data, error } = await supabase
        .from('medication_schedules')
        .insert(scheduleData)
        .select('*, common_medications(*)')
        .single()

      if (error) throw error

      schedules.value.push(data)
      schedules.value.sort((a, b) => a.time_of_day.localeCompare(b.time_of_day))

      uni.showToast({ title: '添加成功', icon: 'success' })
    }

    closeModals()
  } catch (error: any) {
    console.error('保存失败:', error)
    uni.showToast({ title: error.message, icon: 'none' })
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  await fetchMedications()
  await fetchSchedules()
})
</script>

<style lang="scss" scoped>
.medication-schedule-page {
  min-height: 100vh;
  background: #F5F5F5;
  padding-bottom: 120rpx;
}

.header {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  padding: 40rpx 32rpx;
}

.stats-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-icon-wrapper {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8rpx;
}

.stat-icon {
  font-size: 24rpx;
}

.stat-value {
  font-size: 40rpx;
  font-weight: bold;
  color: white;
}

.stat-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 4rpx;
}

.stat-divider {
  width: 2rpx;
  height: 50rpx;
  background: rgba(255, 255, 255, 0.3);
}

.filter-section {
  background: white;
  padding: 24rpx 32rpx;
  margin-bottom: 20rpx;
}

.search-bar {
  display: flex;
  align-items: center;
  background: #F5F5F5;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  margin-bottom: 20rpx;
}

.search-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  background: transparent;
}

.input-placeholder {
  color: #9E9E9E;
}

.search-clear {
  font-size: 28rpx;
  color: #9E9E9E;
  padding: 8rpx;
}

.filter-tags {
  display: flex;
  gap: 16rpx;
}

.filter-tag {
  padding: 12rpx 28rpx;
  border-radius: 30rpx;
  font-size: 26rpx;
  color: var(--text-secondary);
  background: #F5F5F5;
  transition: all 0.2s ease;

  &.active {
    background: var(--primary-color);
    color: white;
  }
}

.schedule-section {
  padding: 0 24rpx 32rpx;
}

.empty-state {
  text-align: center;
  padding: 120rpx 40rpx;
  background: white;
  border-radius: 16rpx;
}

.empty-icon {
  font-size: 100rpx;
  display: block;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 32rpx;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 16rpx;
}

.empty-hint {
  font-size: 26rpx;
  color: var(--text-disabled);
  display: block;
  margin-bottom: 32rpx;
}

.add-btn-inline {
  display: inline-block;
  padding: 16rpx 48rpx;
  background: var(--primary-color);
  color: white;
  border-radius: 30rpx;
  font-size: 28rpx;
  border: none;
}

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.schedule-card {
  background: white;
  border-radius: 16rpx;
  padding: 28rpx;
  box-shadow: var(--shadow-md);
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1px solid #F0F0F0;
}

.med-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.med-name {
  font-size: 32rpx;
  font-weight: bold;
  color: var(--text-primary);
}

.status-badge {
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  font-weight: 600;

  &.active {
    background: var(--success-bg);
    color: var(--success-color);
  }

  &.inactive {
    background: var(--text-disabled);
    color: white;
  }
}

.card-actions {
  display: flex;
  gap: 12rpx;
}

.action-btn {
  font-size: 36rpx;
  padding: 12rpx;
  min-height: 48rpx;
  min-width: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;

  &.edit {
    background: var(--primary-light-bg);
    color: var(--primary-color);
  }

  &.delete {
    background: var(--danger-bg);
    color: var(--danger-color);
  }
}

.schedule-details {
  margin-bottom: 20rpx;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12rpx;
  font-size: 28rpx;
}

.detail-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
  min-width: 32rpx;
}

.detail-label {
  color: var(--text-secondary);
}

.detail-value {
  color: var(--text-primary);
  flex: 1;
}

.schedule-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16rpx;
  border-top: 1px solid #F0F0F0;
}

.footer-info {
  .create-time {
    font-size: 24rpx;
    color: var(--text-disabled);
  }
}

.footer-actions {
  display: flex;
  gap: 12rpx;
}

.btn-toggle {
  padding: 10rpx 28rpx;
  border-radius: 20rpx;
  font-size: 26rpx;
  border: 1px solid var(--text-disabled);
  background: transparent;
  color: var(--text-secondary);

  &.btn-activate {
    border-color: var(--success-color);
    background: var(--success-bg);
    color: var(--success-color);
  }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24rpx;
  margin-top: 40rpx;
  padding: 24rpx;
  background: white;
  border-radius: 16rpx;
}

.page-btn {
  padding: 16rpx 32rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  background: var(--primary-color);
  color: white;
  border: none;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.page-info {
  .page-text {
    font-size: 28rpx;
    color: var(--text-primary);
    font-weight: 600;
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 32rpx;
}

.modal-content {
  background: white;
  border-radius: 20rpx;
  width: 100%;
  max-width: 700rpx;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 32rpx;
  border-bottom: 1px solid #F0F0F0;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: var(--text-primary);
}

.modal-close {
  font-size: 40rpx;
  color: var(--text-secondary);
  padding: 8rpx;
  line-height: 1;
}

.modal-body {
  padding: 24rpx 32rpx;
}

.form-group {
  margin-bottom: 28rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16rpx;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 20rpx 24rpx;
  border: 2px solid #E0E0E0;
  border-radius: 12rpx;
  font-size: 28rpx;
  background: white;
  transition: all 0.2s ease;

  &:focus {
    border-color: var(--primary-color);
  }
}

.form-textarea {
  min-height: 160rpx;
  resize: none;
}

.picker-input {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 24rpx;
  border: 2px solid #E0E0E0;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: var(--text-primary);
  background: white;
}

.picker-arrow {
  font-size: 24rpx;
  color: var(--text-disabled);
}

.weekday-selector {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
}

.weekday-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #E0E0E0;
  border-radius: 50%;
  font-size: 26rpx;
  color: var(--text-secondary);
  background: white;
  transition: all 0.2s ease;

  &.selected {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  }
}

.modal-footer {
  display: flex;
  gap: 20rpx;
  padding: 24rpx 32rpx;
  border-top: 1px solid #F0F0F0;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 20rpx;
  border-radius: 12rpx;
  font-size: 30rpx;
  font-weight: 600;
  border: none;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-cancel {
  background: #F5F5F5;
  color: var(--text-secondary);
}

.btn-confirm {
  background: var(--primary-color);
  color: white;
}

.fab-container {
  position: fixed;
  right: 32rpx;
  bottom: calc(120rpx + env(safe-area-inset-bottom));
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  box-shadow: 0 8rpx 24rpx rgba(30, 136, 229, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.9);
    box-shadow: 0 4rpx 12rpx rgba(30, 136, 229, 0.3);
  }
}

.fab-icon {
  font-size: 48rpx;
  color: white;
}
</style>
