<!-- 步骤条组件 - 适老化设计 -->
<template>
  <view class="step-indicator">
    <view
      v-for="(step, index) in steps"
      :key="index"
      class="step-item"
      :class="{
        active: current === index + 1,
        completed: current > index + 1
      }"
    >
      <view class="step-content-wrapper">
        <view class="step-circle" :class="{
          'step-active': current === index + 1,
          'step-completed': current > index + 1
        }">
          <text v-if="current > index + 1" class="step-checkmark">✓</text>
          <text v-else class="step-number">{{ index + 1 }}</text>
        </view>
        <text class="step-label" :class="{
          'label-active': current === index + 1 || current > index + 1
        }">{{ step }}</text>
      </view>
      <view v-if="index < steps.length - 1" class="step-line" :class="{
        'line-active': current > index + 1
      }"></view>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  current: number           // 当前步骤 (1, 2, 3)
  steps: string[]           // 步骤名称列表
}>()
</script>

<style lang="scss" scoped>
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40rpx 24rpx;
  background: white;
  border-radius: 20rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.step-item {
  display: flex;
  align-items: center;
  flex: 1;
  position: relative;
}

.step-content-wrapper {
  display: flex;
  align-items: center;
  z-index: 1;
  position: relative;
  background: white;
  padding-right: 16rpx;
}

.step-circle {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #F0F0F0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 700;
  color: #999;
  transition: all 0.3s;
  flex-shrink: 0;
}

.step-active {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  box-shadow: 0 4rpx 16rpx rgba(76, 175, 80, 0.4);
  transform: scale(1.1);
}

.step-completed {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
}

.step-checkmark {
  font-size: 36rpx;
}

.step-label {
  font-size: 24rpx;
  color: #999;
  margin-left: 12rpx;
  transition: all 0.3s;
  white-space: nowrap;
  background: white;
  padding-left: 4rpx;
}

.label-active {
  color: #333;
  font-weight: 600;
}

.step-line {
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(100% - 64rpx);
  height: 4rpx;
  background: #F0F0F0;
  transform: translateY(-50%);
  transition: all 0.3s;
  z-index: 0;
}

.line-active {
  background: linear-gradient(90deg, #2196F3, #4CAF50);
}
</style>
