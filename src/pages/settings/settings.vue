<template>
  <view class="settings-page">
    <!-- 用户信息 -->
    <view class="user-section">
      <view class="user-avatar">
        <image v-if="profile?.avatar_url" :src="profile.avatar_url" class="avatar-img" />
        <view v-else class="avatar-placeholder">
          <text class="avatar-icon">👤</text>
        </view>
      </view>
      <view class="user-info">
        <text class="user-name">{{ profile?.username || '用户' + userId?.slice(-4) }}</text>
        <text class="user-phone">{{ profile?.phone || '未绑定手机' }}</text>
      </view>
      <text class="edit-btn" @click="editProfile">编辑</text>
    </view>

    <!-- 设置列表 -->
    <view class="settings-list">
      <!-- 紧急联系人 -->
      <view class="setting-item" @click="setEmergencyContact">
        <text class="setting-icon">👥</text>
        <view class="setting-info">
          <text class="setting-title">紧急联系人</text>
          <text class="setting-desc">{{ emergencyContact || '未设置' }}</text>
        </view>
        <text class="setting-arrow">></text>
      </view>

      <!-- 提醒设置 -->
      <view class="setting-item" @click="setReminderSettings">
        <text class="setting-icon">🔔</text>
        <view class="setting-info">
          <text class="setting-title">提醒设置</text>
          <text class="setting-desc">提前{{ reminderAdvance }}分钟提醒</text>
        </view>
        <text class="setting-arrow">></text>
      </view>

      <!-- 提醒方式 -->
      <view class="setting-item">
        <text class="setting-icon">📢</text>
        <view class="setting-info">
          <text class="setting-title">提醒方式</text>
          <text class="setting-desc">
            {{ notifyMethods.filter(m => m.checked).map(m => m.label).join('、') || '未选择' }}
          </text>
        </view>
        <switch
          :checked="soundEnabled"
          @change="toggleSound"
          color="#2196F3"
        />
      </view>

      <!-- 语音播报 -->
      <view class="setting-item">
        <text class="setting-icon">🔊</text>
        <view class="setting-info">
          <text class="setting-title">语音播报</text>
          <text class="setting-desc">提醒时自动朗读药品信息</text>
        </view>
        <switch
          :checked="voiceEnabled"
          @change="toggleVoice"
          color="#2196F3"
        />
      </view>

      <!-- 数据同步 -->
      <view class="setting-item">
        <text class="setting-icon">☁️</text>
        <view class="setting-info">
          <text class="setting-title">数据同步</text>
          <text class="setting-desc">自动同步到云端</text>
        </view>
        <switch
          :checked="syncEnabled"
          @change="toggleSync"
          color="#2196F3"
        />
      </view>

      <!-- 隐私设置 -->
      <view class="setting-item" @click="showPrivacy">
        <text class="setting-icon">🔒</text>
        <view class="setting-info">
          <text class="setting-title">隐私设置</text>
          <text class="setting-desc">数据安全和隐私保护</text>
        </view>
        <text class="setting-arrow">></text>
      </view>
    </view>

    <!-- 关于 -->
    <view class="about-section">
      <text class="section-title">关于</text>
      <view class="about-list">
        <view class="about-item" @click="showTerms">
          <text>用户协议</text>
          <text class="about-arrow">></text>
        </view>
        <view class="about-item" @click="showPrivacy">
          <text>隐私政策</text>
          <text class="about-arrow">></text>
        </view>
        <view class="about-item">
          <text>版本</text>
          <text class="version-text">1.0.0</text>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-section">
      <button class="btn btn-outline logout-btn" @click="logout">
        退出登录
      </button>
    </view>

    <!-- 底部安全区 -->
    <view class="safe-area-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()

const profile = computed(() => authStore.profile)
const userId = computed(() => authStore.userId)

// 紧急联系人
const emergencyContact = ref('')
const emergencyPhone = ref('')

// 提醒设置
const reminderAdvance = ref(10)
const soundEnabled = ref(true)
const voiceEnabled = ref(true)
const syncEnabled = ref(true)

// 提醒方式选项
const notifyMethods = ref([
  { label: '声音', checked: true },
  { label: '震动', checked: true },
  { label: '横幅', checked: true }
])

// 编辑个人资料
function editProfile() {
  uni.showModal({
    title: '编辑资料',
    content: '功能开发中...',
    showCancel: false
  })
}

// 设置紧急联系人
function setEmergencyContact() {
  uni.showModal({
    title: '设置紧急联系人',
    editable: true,
    placeholderText: '请输入紧急联系人姓名',
    success: (res) => {
      if (res.confirm && res.content) {
        emergencyContact.value = res.content
        // 保存到数据库
        authStore.updateProfile({
          emergency_contact: res.content,
          emergency_phone: emergencyPhone.value
        })
        uni.showToast({ title: '已保存', icon: 'success' })
      }
    }
  })
}

// 提醒设置
function setReminderSettings() {
  uni.showActionSheet({
    itemList: ['提前5分钟', '提前10分钟', '提前15分钟', '提前30分钟'],
    success: (res) => {
      const minutes = [5, 10, 15, 30][res.tapIndex]
      reminderAdvance.value = minutes
      uni.showToast({ title: `已设置为提前${minutes}分钟`, icon: 'success' })
    }
  })
}

// 切换声音
function toggleSound(e: any) {
  soundEnabled.value = e.detail.value
}

// 切换语音
function toggleVoice(e: any) {
  voiceEnabled.value = e.detail.value
}

// 切换同步
function toggleSync(e: any) {
  syncEnabled.value = e.detail.value
}

// 显示用户协议
function showTerms() {
  uni.showModal({
    title: '用户协议',
    content: '这里是用户协议内容...\n\n1. 服务条款\n2. 免责声明\n3. 隐私政策',
    showCancel: false
  })
}

// 显示隐私政策
function showPrivacy() {
  uni.showModal({
    title: '隐私政策',
    content: '我们非常重视您的隐私保护：\n\n1. 数据加密存储\n2. 仅用于本地提醒功能\n3. 可随时删除所有数据',
    showCancel: false
  })
}

// 退出登录
function logout() {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    confirmText: '退出',
    confirmColor: '#F44336',
    success: async (res) => {
      if (res.confirm) {
        await authStore.logout()
        uni.redirectTo({ url: '/pages/login/login' })
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.settings-page {
  min-height: 100vh;
  background: #F5F5F5;
}

.user-section {
  display: flex;
  align-items: center;
  padding: 40rpx 32rpx;
  background: white;
  margin-bottom: 20rpx;
}

.user-avatar {
  margin-right: 24rpx;
}

.avatar-img,
.avatar-placeholder {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: #E3F2FD;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-icon {
  font-size: 48rpx;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.user-phone {
  font-size: 26rpx;
  color: #999;
  margin-top: 8rpx;
}

.edit-btn {
  font-size: 28rpx;
  color: #2196F3;
}

.settings-list {
  background: white;
  margin-bottom: 20rpx;
}

.setting-item {
  display: flex;
  align-items: center;
  padding: 28rpx 32rpx;
  border-bottom: 1px solid #F0F0F0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.setting-info {
  flex: 1;
}

.setting-title {
  font-size: 30rpx;
  color: #333;
}

.setting-desc {
  font-size: 24rpx;
  color: #999;
  margin-top: 6rpx;
}

.setting-arrow {
  font-size: 28rpx;
  color: #CCC;
  margin-left: 16rpx;
}

.about-section {
  background: white;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 26rpx;
  color: #999;
  padding: 24rpx 32rpx 12rpx;
}

.about-list {
  background: white;
}

.about-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 32rpx;
  border-bottom: 1px solid #F0F0F0;
  font-size: 30rpx;
  color: #333;
}

.about-item:last-child {
  border-bottom: none;
}

.about-arrow {
  font-size: 28rpx;
  color: #CCC;
}

.version-text {
  color: #999;
}

.logout-section {
  padding: 40rpx 32rpx;
}

.logout-btn {
  width: 100%;
}

.safe-area-bottom {
  height: env(safe-area-inset-bottom);
}
</style>
