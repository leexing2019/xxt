<template>
  <view v-if="visible" class="preview-overlay" @click="handleClose">
    <view class="preview-modal" @click.stop>
      <!-- 头部 -->
      <view class="preview-header">
        <text class="preview-title">长按保存图片</text>
        <text class="preview-close" @click="handleClose">×</text>
      </view>

      <!-- 图片内容 -->
      <view class="preview-content">
        <image
          v-if="imagePath"
          :src="imagePath"
          class="preview-image"
          mode="widthFix"
          @longpress="handleLongPress"
        />
        <view v-else class="preview-loading">正在生成图片...</view>
      </view>

      <!-- 底部操作 -->
      <view class="preview-footer">
        <button class="btn btn-primary" @click="handleSave">
          <text class="btn-icon">💾</text>
          <text class="btn-label">保存到相册</text>
        </button>
        <button class="btn btn-outline" @click="handleShare">
          <text class="btn-icon">📤</text>
          <text class="btn-label">分享</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const props = defineProps<{
  visible: boolean
  imagePath: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'save'): void
  (e: 'share'): void
}>()

function handleClose() {
  emit('update:visible', false)
}

function handleLongPress() {
  uni.showToast({ title: '长按图片已保存', icon: 'none' })
}

function handleSave() {
  emit('save')
}

function handleShare() {
  emit('share')
}
</script>

<style lang="scss" scoped>
.preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx;
}

.preview-modal {
  background: white;
  border-radius: 24rpx;
  width: calc(100% - 48rpx);
  max-width: 600rpx;
  overflow: hidden;
  animation: fadeIn 0.3s ease;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.preview-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.preview-close {
  font-size: 36rpx;
  color: #999;
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-content {
  padding: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300rpx;
  max-height: 50vh;
  background: #f8f9fa;
}

.preview-image {
  width: 100%;
  height: auto;
  border-radius: 8rpx;
}

.preview-loading {
  font-size: 28rpx;
  color: #999;
}

.preview-footer {
  display: flex;
  gap: 16rpx;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}

.preview-footer .btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  padding: 16rpx 12rpx;
  min-height: 48rpx;
  font-size: 26rpx;
  border-radius: 12rpx;
}

.btn-icon {
  flex-shrink: 0;
  font-size: 32rpx;
  line-height: 1;
}

.btn-label {
  flex-shrink: 0;
  font-size: 24rpx;
  white-space: nowrap;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
