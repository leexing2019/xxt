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
          <text class="setting-desc">{{ emergencyContact || '未设置' }} {{ emergencyPhone ? ' (' + emergencyPhone + ')' : '' }}</text>
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

      <!-- 管理后台入口 -->
      <view class="setting-item" @click="goToAdmin">
        <text class="setting-icon">👨‍💼</text>
        <view class="setting-info">
          <text class="setting-title">管理后台</text>
          <text class="setting-desc">用药计划管理和 API 配置</text>
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
      <button class="btn btn-danger logout-btn" @click="logout">
        <text class="btn-icon">🚪</text>
        <text class="btn-text">退出登录</text>
      </button>
    </view>

    <!-- 底部安全区 -->
    <view class="safe-area-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()

const profile = computed(() => authStore.profile)
const userId = computed(() => authStore.userId)

// 紧急联系人
const emergencyContact = ref('')
const emergencyPhone = ref('')

// 页面加载时读取紧急联系人数据
onMounted(async () => {
  // 确保 profile 已加载
  if (!authStore.profile) {
    await authStore.fetchProfile()
  }
  if (authStore.profile) {
    emergencyContact.value = authStore.profile.emergency_contact || ''
    emergencyPhone.value = authStore.profile.emergency_phone || ''
  }
})

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

// 设置紧急联系人 - 分两步输入
async function setEmergencyContact() {
  // 第一步：输入姓名
  const nameResult = await new Promise((resolve) => {
    uni.showModal({
      title: '联系人姓名',
      editable: true,
      placeholderText: '请输入紧急联系人姓名',
      success: (res) => resolve(res)
    })
  })

  if (!nameResult || !('confirm' in nameResult) || !nameResult.confirm || !nameResult.content) {
    return
  }

  // 第二步：输入手机号
  const phoneResult = await new Promise((resolve) => {
    uni.showModal({
      title: '联系人电话',
      editable: true,
      placeholderText: '请输入手机号',
      success: (res) => resolve(res)
    })
  })

  if (!phoneResult || !('confirm' in phoneResult) || !phoneResult.confirm || !phoneResult.content) {
    return
  }

  // 保存数据
  const contactName = nameResult.content
  const contactPhone = phoneResult.content

  emergencyContact.value = contactName
  emergencyPhone.value = contactPhone

  // 保存到数据库并刷新
  const result = await authStore.updateProfile({
    emergency_contact: contactName,
    emergency_phone: contactPhone
  })

  if (result.success) {
    uni.showToast({ title: '已保存', icon: 'success' })
  } else {
    uni.showToast({ title: '保存失败', icon: 'error' })
  }
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

// 跳转到管理后台
function goToAdmin() {
  uni.navigateTo({
    url: '/pages/admin/index'
  })
}
</script>

<style lang="scss" scoped>
.settings-page {
  min-height: 100vh;
  background: var(--bg-color);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.user-section {
  display: flex;
  align-items: center;
  padding: 40rpx 32rpx;
  background: var(--card-bg);
  margin-bottom: 20rpx;
  box-shadow: var(--shadow-sm);
}

.user-avatar {
  margin-right: 24rpx;
}

.avatar-img,
.avatar-placeholder {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-bg) 0%, rgba(33, 150, 243, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(33, 150, 243, 0.15);
  transition: transform 0.2s ease;
}

.avatar-img:active,
.avatar-placeholder:active {
  transform: scale(0.95);
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
  color: var(--text-primary);
}

.user-phone {
  font-size: 26rpx;
  color: var(--text-secondary);
  margin-top: 8rpx;
}

.edit-btn {
  font-size: 28rpx;
  color: var(--primary-color);
  padding: 12rpx 24rpx;
  background: var(--primary-light-bg);
  border-radius: 20rpx;
  transition: all 0.2s ease;
}

.edit-btn:active {
  background: var(--primary-color);
  color: white;
  transform: scale(0.95);
}

.settings-list {
  background: var(--card-bg);
  margin-bottom: 20rpx;
  box-shadow: var(--shadow-sm);
}

.section-header {
  display: flex;
  align-items: center;
  padding: 20rpx 32rpx 16rpx;
  background: linear-gradient(90deg, rgba(33, 150, 243, 0.05) 0%, transparent 100%);
  border-left: 6rpx solid var(--primary-color);
}

.section-header-text {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--primary-color);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.setting-item {
  display: flex;
  align-items: center;
  padding: 36rpx 32rpx;
  border-bottom: 1px solid var(--border-color);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 120rpx;
}

.setting-item:active {
  background: var(--bg-color);
  transform: scale(0.98);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-icon {
  font-size: 44rpx;
  margin-right: 24rpx;
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-bg) 0%, rgba(33, 150, 243, 0.1) 100%);
  border-radius: 16rpx;
  flex-shrink: 0;
}

.setting-info {
  flex: 1;
  min-width: 0;
}

.setting-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-primary);
  display: block;
}

.setting-desc {
  font-size: 26rpx;
  color: var(--text-secondary);
  margin-top: 8rpx;
  display: block;
}

.setting-arrow {
  font-size: 32rpx;
  color: var(--text-disabled);
  margin-left: 16rpx;
  transition: transform 0.2s ease;
}

.setting-item:active .setting-arrow {
  transform: translateX(4rpx);
}

/* Switch 开关动画 */
.setting-item switch {
  transform: scale(1.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.setting-item switch:active {
  transform: scale(1.05);
}

.about-section {
  background: var(--card-bg);
  margin-bottom: 20rpx;
  box-shadow: var(--shadow-sm);
}

.section-title {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--text-secondary);
  padding: 20rpx 32rpx 16rpx;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.03) 0%, transparent 100%);
  border-left: 4rpx solid var(--text-disabled);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.about-list {
  background: var(--card-bg);
}

.about-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 36rpx 32rpx;
  border-bottom: 1px solid var(--border-color);
  font-size: 30rpx;
  color: var(--text-primary);
  transition: all 0.2s ease;
  min-height: 120rpx;
}

.about-item:active {
  background: var(--bg-color);
  transform: scale(0.98);
}

.about-item:last-child {
  border-bottom: none;
}

.about-arrow {
  font-size: 32rpx;
  color: var(--text-disabled);
  transition: transform 0.2s ease;
}

.about-item:active .about-arrow {
  transform: translateX(4rpx);
}

.version-text {
  color: var(--text-secondary);
  font-size: 28rpx;
}

.logout-section {
  padding: 40rpx 32rpx 60rpx;
}

.logout-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #EF5350 0%, #C62828 100%);
  color: white;
  border: none;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  font-size: 32rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 24rpx rgba(239, 83, 80, 0.35);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.logout-btn:active {
  transform: scale(0.96);
  box-shadow: 0 4rpx 12rpx rgba(239, 83, 80, 0.25);
}

.logout-btn .btn-icon {
  font-size: 36rpx;
  line-height: 1;
}

.logout-btn .btn-text {
  white-space: nowrap;
}

.safe-area-bottom {
  height: env(safe-area-inset-bottom);
}
</style>
