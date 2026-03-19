<template>
  <view class="medication-list-page">
    <!-- 顶部统计 -->
    <view class="header">
      <view class="stats-card">
        <view class="stat-item">
          <text class="stat-value">{{ medications.length }}</text>
          <text class="stat-label">正在使用</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
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

      <view v-if="medications.length === 0" class="empty-state">
        <text class="empty-icon">💊</text>
        <text class="empty-text">暂无药品</text>
        <text class="empty-hint">点击右上角添加您的第一种药品</text>
      </view>

      <view v-else class="medication-list">
        <view
          v-for="med in medications"
          :key="med.id"
          class="medication-card"
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

    <!-- 药物禁忌提醒 -->
    <view v-if="contraindications.length > 0" class="contraindication-section">
      <view class="section-header">
        <text class="section-title">⚠️ 药物相互作用提醒</text>
      </view>
      <view v-for="(item, index) in contraindications" :key="index" class="contraindication-card">
        <text class="contraindication-drugs">{{ item.drugs }}</text>
        <text class="contraindication-desc">{{ item.description }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMedicationStore } from '@/store/medication'
import { getInteractions } from '@/services/medication'

const medicationStore = useMedicationStore()

const medications = computed(() => medicationStore.medications)
const schedules = computed(() => medicationStore.schedules)

// 禁忌警告（模拟数据）
const contraindications = ref<any[]>([
  {
    drugs: '阿司匹林 + 布洛芬',
    description: '同时使用可能增加胃肠道出血风险'
  }
])

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

  const drugNames = medications.value.map(m => m.name)
  if (drugNames.length > 1) {
    await getInteractions(drugNames)
  }
})
</script>

<style lang="scss" scoped>
.medication-list-page {
  min-height: 100vh;
  background: #F5F5F5;
}

.header {
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  padding: 40rpx 32rpx;
}

.stats-card {
  background: rgba(255, 255, 255, 0.2);
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

.stat-value {
  font-size: 48rpx;
  font-weight: bold;
  color: white;
}

.stat-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
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
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.section-count {
  font-size: 24rpx;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 100rpx 40rpx;
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
  color: #666;
  display: block;
  margin-bottom: 16rpx;
}

.empty-hint {
  font-size: 24rpx;
  color: #999;
  display: block;
}

.medication-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.medication-card {
  background: white;
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.med-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
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
  color: #333;
  margin-bottom: 8rpx;
}

.med-detail {
  font-size: 24rpx;
  color: #999;
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
  color: #2196F3;
  background: #E3F2FD;
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
  padding: 8rpx;
  cursor: pointer;
}

.action-btn.edit {
  opacity: 0.7;
}

.action-btn.delete {
  opacity: 0.7;
}

.contraindication-section {
  padding: 32rpx;
  padding-top: 0;
}

.contraindication-card {
  background: #FFF3E0;
  border-left: 4rpx solid #FF9800;
  border-radius: 8rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
}

.contraindication-drugs {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.contraindication-desc {
  font-size: 24rpx;
  color: #666;
  display: block;
}
</style>
