<template>
  <view class="medication-list-page">
    <!-- 顶部统计 -->
    <view class="header">
      <view class="stats-card">
        <view class="stat-item">
          <view class="stat-icon-wrapper">
            <text class="stat-icon">💊</text>
          </view>
          <text class="stat-value">{{ medications.length }}</text>
          <text class="stat-label">正在使用</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <view class="stat-icon-wrapper">
            <text class="stat-icon">⏰</text>
          </view>
          <text class="stat-value">{{ schedules.filter(s => s.is_active).length }}</text>
          <text class="stat-label">用药计划</text>
        </view>
      </view>
    </view>

    <!-- 药品列表 -->
    <view class="medication-section">
      <view class="section-header">
        <text class="section-title">我的药品</text>
        <text class="section-count">共 {{ medications.length }} 种</text>
      </view>
      <view class="add-btn-wrapper">
        <button class="add-medication-btn" @click="goAddMedication">
          <text class="btn-icon">➕</text>
          <text class="btn-text">添加药品</text>
        </button>
      </view>

      <view v-if="medications.length === 0" class="empty-state">
        <text class="empty-icon">💊</text>
        <text class="empty-text">暂无药品</text>
        <text class="empty-hint">点击下方按钮添加您的第一种药品</text>
        <button class="add-med-btn" @click="goAddMedication">添加药品</button>
      </view>

      <view v-else class="medication-list">
        <view
          v-for="(med, index) in medications"
          :key="med.id"
          :class="`medication-card stagger-in-${index + 1}`"
          @click="goDetail(med)"
        >
          <view class="med-avatar">
            <text class="med-icon">{{ med.name.charAt(0) }}</text>
          </view>
          <view class="med-info">
            <view class="med-name">{{ med.name }}</view>
            <view class="med-detail">
              <text v-if="med.generic_name" class="med-generic">通用名：{{ med.generic_name }}</text>
              <text v-if="med.specification" class="med-spec">{{ med.specification }}</text>
            </view>
            <view class="med-schedule">
              <text v-for="schedule in getSchedules(med.id).slice(0, 2)" :key="schedule.id" class="schedule-tag">
                ⏰ {{ schedule.time_of_day }} {{ schedule.dosage }}
              </text>
            </view>
          </view>
          <view class="med-actions">
            <text class="action-btn edit" @click.stop="editMedication(med)">✏️</text>
            <text class="action-btn delete" @click.stop="deleteMedication(med)">🗑️</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 药物相互作用提醒 -->
    <view class="contraindication-section">
      <view class="section-header">
        <text class="section-title">⚠️ 药物相互作用提醒</text>
      </view>
      <view v-if="contraindications.length > 0">
        <view v-for="(item, index) in contraindications" :key="index" class="contraindication-card">
          <text class="contraindication-drugs">{{ item.drugs }}</text>
          <text class="contraindication-desc">{{ item.description }}</text>
        </view>
      </view>
      <view v-else class="safe-state">
        <text class="safe-icon">✅</text>
        <text class="safe-text">暂无用药风险</text>
        <text class="safe-hint">当前药品组合未发现相互作用</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMedicationStore } from '@/store/medication'
import { checkDrugInteractions } from '@/data/drug-interactions'

const medicationStore = useMedicationStore()

const medications = computed(() => medicationStore.medications)
const schedules = computed(() => medicationStore.schedules)

// 药物相互作用警告
const contraindications = ref<any[]>([])

// 检查药物相互作用
function checkInteractions() {
  const drugNames = medications.value.map(m => m.name)
  const interactions = checkDrugInteractions(drugNames)

  contraindications.value = interactions.map(int => ({
    drugs: `${int.drug1} + ${int.drug2}`,
    description: int.description
  }))
}

// 获取药品的用药计划
function getSchedules(medicationId: string) {
  return schedules.value.filter(s => s.medication_id === medicationId)
}

// 跳转详情
function goDetail(med: any) {
  uni.navigateTo({
    url: `/pages/medication-detail/medication-detail?id=${med.id}`
  })
}

// 编辑药品
function editMedication(med: any) {
  uni.navigateTo({
    url: `/pages/add-medication/add-medication?id=${med.id}`
  })
}

// 删除药品
function deleteMedication(med: any) {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除 "${med.name}" 吗？`,
    confirmText: '删除',
    confirmColor: '#F44336',
    success: async (res) => {
      if (res.confirm) {
        const result = await medicationStore.deleteMedication(med.id)
        if (result.success) {
          uni.showToast({ title: '已删除', icon: 'success' })
        }
      }
    }
  })
}

// 跳转添加
function goAddMedication() {
  uni.navigateTo({ url: '/pages/add-medication/add-medication' })
}

onMounted(async () => {
  await medicationStore.fetchMedications()
  await medicationStore.fetchSchedules()

  // 检查药物相互作用
  if (medications.value.length > 1) {
    checkInteractions()
  }
})
</script>

<style lang="scss" scoped>
.medication-list-page {
  min-height: 100vh;
  background: #F5F5F5;
}

.header {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  padding: 40rpx 32rpx;
}

.stats-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 16rpx;
  padding: 32rpx;
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
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
}

.stat-icon {
  font-size: 28rpx;
}

.stat-value {
  font-size: 48rpx;
  font-weight: bold;
  color: white;
}

.stat-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 8rpx;
}

.stat-divider {
  width: 2rpx;
  height: 60rpx;
  background: rgba(255, 255, 255, 0.3);
}

.medication-section {
  padding: 32rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: var(--text-primary);
}

.section-count {
  font-size: 24rpx;
  color: var(--text-secondary);
}

.add-btn-wrapper {
  margin-bottom: 24rpx;
}

.add-medication-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  box-shadow: 0 4px 12px rgba(30, 136, 229, 0.3);
  border: none;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 2px 6px rgba(30, 136, 229, 0.2);
  }
}

.btn-icon {
  font-size: 32rpx;
}

.btn-text {
  font-size: 30rpx;
  font-weight: 600;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 100rpx 40rpx;
  background: var(--card-bg);
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
  font-size: 24rpx;
  color: var(--text-disabled);
  display: block;
}

.medication-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.medication-card {
  background: var(--card-bg);
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  box-shadow: var(--shadow-md);
  transition: all 0.2s ease;

  &:active {
    box-shadow: var(--shadow-sm);
    transform: translateY(-1px);
  }
}

.med-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
  box-shadow: 0 2rpx 8rpx rgba(30, 136, 229, 0.2);
}

.med-icon {
  font-size: 36rpx;
  color: white;
  font-weight: bold;
}

.med-info {
  flex: 1;
  min-width: 0;
}

.med-name {
  font-size: 30rpx;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 8rpx;
}

.med-detail {
  font-size: 24rpx;
  color: var(--text-secondary);
  display: flex;
  gap: 16rpx;
  margin-bottom: 8rpx;
}

.med-schedule {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}

.schedule-tag {
  font-size: 22rpx;
  color: var(--primary-color);
  background: var(--primary-light-bg);
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.med-actions {
  display: flex;
  gap: 16rpx;
  margin-left: 16rpx;
}

.action-btn {
  font-size: 36rpx;
  padding: 24rpx;
  min-height: 56rpx;
  min-width: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.9);
    opacity: 1;
  }
}

.action-btn.edit {
  opacity: 0.8;
  color: var(--primary-color);
  background: var(--primary-light-bg);
  border-radius: 50%;
}

.action-btn.delete {
  opacity: 0.8;
  color: var(--danger-color);
  background: var(--danger-bg);
  border-radius: 50%;
}

.contraindication-section {
  padding: 32rpx;
  padding-top: 0;
}

.contraindication-card {
  background: var(--warning-bg);
  border-left: 6rpx solid var(--warning-color);
  border-radius: 8rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
}

.contraindication-drugs {
  font-size: 28rpx;
  font-weight: bold;
  color: var(--text-primary);
  display: block;
  margin-bottom: 8rpx;
}

.contraindication-desc {
  font-size: 24rpx;
  color: var(--text-secondary);
  display: block;
}

.safe-state {
  text-align: center;
  padding: 60rpx 40rpx;
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%);
  border-radius: 16rpx;
  border: 2rpx solid rgba(76, 175, 80, 0.2);
}

.safe-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 16rpx;
}

.safe-text {
  font-size: 30rpx;
  font-weight: bold;
  color: var(--primary-color);
  display: block;
  margin-bottom: 12rpx;
}

.safe-hint {
  font-size: 24rpx;
  color: var(--text-secondary);
  display: block;
}
</style>
