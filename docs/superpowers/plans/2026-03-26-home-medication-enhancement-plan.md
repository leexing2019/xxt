# 首页用药功能增强实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完善首页用药功能，包括排序优化、状态标签、药品照片展示，同时修复详情页空白和编辑模式跳转错误的 bug

**Architecture:** 基于现有 Vue 3 + Pinia + uni-app 架构，修改首页、详情页、列表页的组件逻辑，扩展 store 中的状态计算函数

**Tech Stack:** Vue 3, TypeScript, Pinia, uni-app, Supabase

---

### Task 1: 修复药品详情页空白问题

**Files:**
- Modify: `src/pages/medication-detail/medication-detail.vue`
- Test: 手动测试 - 从列表页点击进入详情页

- [ ] **Step 1: 添加 template 模板**

```vue
<template>
  <view class="medication-detail-page">
    <!-- 顶部药品信息卡片 -->
    <view class="medication-header card">
      <view class="medication-avatar">
        <image v-if="medication?.image_url" :src="medication.image_url" class="med-image" mode="aspectFill" />
        <text v-else class="med-placeholder">💊</text>
      </view>
      <view class="medication-info">
        <text class="medication-name">{{ medication?.name || '未知药品' }}</text>
        <text v-if="medication?.generic_name" class="generic-name">通用名：{{ medication.generic_name }}</text>
        <text v-if="medication?.specification" class="specification">规格：{{ medication.specification }}</text>
      </view>
    </view>

    <!-- 用药计划列表 -->
    <view class="schedules-section">
      <text class="section-title">用药计划</text>
      <view v-if="schedules.length === 0" class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无用药计划</text>
      </view>
      <view v-else v-for="schedule in schedules" :key="schedule.id" class="schedule-card card">
        <view class="schedule-header">
          <text class="schedule-time">⏰ {{ schedule.time_of_day }}</text>
          <text class="schedule-dosage">{{ schedule.dosage }}</text>
        </view>
        <view class="schedule-footer">
          <text class="schedule-weekdays">{{ formatWeekdays(schedule.weekdays) }}</text>
          <text v-if="schedule.instructions" class="schedule-instructions">💡 {{ schedule.instructions }}</text>
        </view>
      </view>
    </view>

    <!-- 用药统计 -->
    <view class="stats-section card">
      <view class="stat-item">
        <text class="stat-value">{{ takenCount }}</text>
        <text class="stat-label">已服用</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ missedCount }}</text>
        <text class="stat-label">漏服</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ complianceRate }}%</text>
        <text class="stat-label">依从性</text>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="bottom-actions">
      <button class="btn btn-outline" @click="editMedication">✏️ 编辑</button>
      <button class="btn btn-primary" @click="takeMedication">💊 确认服药</button>
    </view>
  </view>
</template>
```

- [ ] **Step 2: 添加 style 样式**

```scss
<style lang="scss" scoped>
.medication-detail-page {
  min-height: 100vh;
  background: #F5F5F5;
  padding-bottom: 80px;
}

.card {
  background: white;
  border-radius: 16rpx;
  padding: 24rpx;
  margin: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.medication-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.medication-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #2196F3, #1976D2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.med-image {
  width: 100%;
  height: 100%;
}

.med-placeholder {
  font-size: 48rpx;
}

.medication-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.medication-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.generic-name, .specification {
  font-size: 24rpx;
  color: #666;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 16rpx;
  padding: 0 24rpx;
}

.schedule-card {
  margin-bottom: 16rpx;
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.schedule-time {
  font-size: 28rpx;
  font-weight: bold;
  color: #2196F3;
}

.schedule-dosage {
  font-size: 26rpx;
  color: #333;
}

.schedule-footer {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.schedule-weekdays, .schedule-instructions {
  font-size: 24rpx;
  color: #666;
}

.stats-section {
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
  font-size: 36rpx;
  font-weight: bold;
  color: #2196F3;
}

.stat-label {
  font-size: 22rpx;
  color: #666;
  margin-top: 8rpx;
}

.stat-divider {
  width: 2rpx;
  height: 60rpx;
  background: #E0E0E0;
}

.empty-state {
  text-align: center;
  padding: 60rpx 24rpx;
}

.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 26rpx;
  color: #666;
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: white;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.08);
  display: flex;
  gap: 20rpx;
}

.bottom-actions .btn {
  flex: 1;
  padding: 16rpx 24rpx;
  font-size: 28rpx;
  border-radius: 12rpx;
}

.btn-outline {
  background: transparent;
  border: 2rpx solid #2196F3;
  color: #2196F3;
}

.btn-primary {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
  border: none;
}
</style>
```

- [ ] **Step 3: 完善 script 逻辑**

在现有 script 基础上添加：
```typescript
// 格式化星期数组
function formatWeekdays(weekdays: number[]): string {
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return weekdays.map(d => `周${days[d]}`).join('、')
}

// 编辑药品
function editMedication() {
  uni.navigateTo({
    url: `/pages/add-medication/add-medication?id=${medicationId.value}`
  })
}

// 格式化日期函数已存在，确保格式正确
function formatTime(time: string): string {
  return time.slice(0, 5) // "08:00"
}

function formatDate(time: string): string {
  return new Date(time).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  })
}
```

- [ ] **Step 4: 测试详情页显示**
  - 从列表页点击进入详情
  - 验证药品信息、用药计划、统计数据都正确显示

---

### Task 2: 修复编辑模式跳转错误

**Files:**
- Modify: `src/pages/add-medication/add-medication.vue`
- Test: 从列表页点击编辑按钮，验证是否直接进入第 2 步

- [ ] **Step 1: 检查 onMounted 中的数据加载顺序**

确认以下逻辑顺序正确：
```typescript
onMounted(async () => {
  // 1. 先加载公共药品库数据
  loadingDrugs.value = true
  commonMedications.value = await getDisplayMedications()
  loadingDrugs.value = false

  // 2. 检查是否是编辑模式
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.options as any

  if (options?.id) {
    // 3. 编辑模式：先刷新数据
    await medicationStore.fetchMedications()
    await medicationStore.fetchSchedules()

    isEditMode.value = true
    editingMedicationId.value = options.id

    // 4. 获取药品信息（确保这里 medications 已经有数据）
    const medication = medicationStore.medications.find(m => m.id === options.id)
    // ...
  }
})
```

- [ ] **Step 2: 添加调试日志**

在关键位置添加 console.log：
```typescript
console.log('[编辑模式] medications:', medicationStore.medications.length)
console.log('[编辑模式] 找到的药品:', medication)
console.log('[编辑模式] 设置 step = 2')
```

- [ ] **Step 3: 确保 currentStep 正确设置**

```typescript
if (medication) {
  // ... 填充数据 ...

  // 确保这里设置 step = 2
  currentStep.value = 2
  speakText('已进入编辑模式，请修改服药时间')
}
```

- [ ] **Step 4: 测试编辑功能**
  - 从列表页点击编辑按钮
  - 验证直接进入"设置时间"步骤（步骤条显示第 2 步）
  - 验证原有用药计划数据已正确填充

---

### Task 3: 实现首页排序优化

**Files:**
- Modify: `src/pages/index/index.vue`
- Test: 验证未服用药品在上半区，已服用药品在下半区

- [ ] **Step 1: 修改 todayMedications 计算属性**

```typescript
// 分离未服用和已服用的药品
const pendingMedications = computed(() => {
  return todayMedications.value
    .filter(m => !m.taken)
    .sort((a, b) => a.time_of_day.localeCompare(b.time_of_day))
})

const takenMedications = computed(() => {
  return todayMedications.value
    .filter(m => m.taken)
    .sort((a, b) => a.time_of_day.localeCompare(b.time_of_day))
})
```

- [ ] **Step 2: 修改 template 显示两个区域**

```vue
<!-- 上半区：未服用 -->
<view v-if="pendingMedications.length > 0" class="medications-section">
  <text class="section-title">待服用</text>
  <view v-for="item in pendingMedications" :key="item.id" class="medication-item card pending">
    <!-- ... -->
  </view>
</view>

<!-- 下半区：已服用 -->
<view v-if="takenMedications.length > 0" class="medications-section">
  <text class="section-title">已服用</text>
  <view v-for="item in takenMedications" :key="item.id" class="medication-item card taken">
    <!-- ... -->
  </view>
</view>
```

- [ ] **Step 3: 添加样式区分**

```scss
.medication-item.pending {
  background: white;
  border-left: 4rpx solid #2196F3;
}

.medication-item.taken {
  background: linear-gradient(135deg, #E8F5E9 0%, #F5F5F5 100%);
  border-left: 4rpx solid #A5D6A7;
  opacity: 0.85;
}
```

- [ ] **Step 4: 测试排序**
  - 添加多个用药计划
  - 确认部分药品后，验证排序正确

---

### Task 4: 实现服药状态标签

**Files:**
- Modify: `src/pages/index/index.vue`
- Modify: `src/store/medication.ts`
- Test: 验证不同时间服药显示不同状态标签

- [ ] **Step 1: 在 store 中添加状态计算函数**

```typescript
// 在 medication.ts 中添加
export function getMedicationStatus(
  scheduledTime: string,
  takenTime?: string
): { label: string; class: string; isLate: boolean } {
  if (!takenTime) {
    return { label: '待服用', class: 'pending', isLate: false }
  }

  const scheduled = new Date(scheduledTime)
  const taken = new Date(takenTime)
  const diffMinutes = (taken.getTime() - scheduled.getTime()) / 60000

  if (diffMinutes < -15) {
    return { label: '提前', class: 'early', isLate: false }
  } else if (diffMinutes > 15) {
    return { label: '过时', class: 'late', isLate: true }
  } else {
    return { label: '准点', class: 'ontime', isLate: false }
  }
}
```

- [ ] **Step 2: 在首页组件中使用状态计算**

```typescript
import { getMedicationStatus } from '@/store/medication'

// 在 medication item 中添加计算属性
const status = computed(() => {
  const schedule = schedules.value.find(s => s.id === item.id)
  if (!schedule) return { label: '未知', class: 'unknown', isLate: false }

  const log = medicationStore.todayLogs.find(l => l.schedule_id === item.id)
  return getMedicationStatus(
    schedule.time_of_day,
    log?.taken_time
  )
})
```

- [ ] **Step 3: 添加状态标签 UI**

```vue
<view class="status-tag" :class="status.class">
  <text v-if="status.class === 'early'">🕐</text>
  <text v-else-if="status.class === 'ontime'">✅</text>
  <text v-else-if="status.class === 'late'">⏰</text>
  {{ status.label }}
</view>
```

- [ ] **Step 4: 添加状态标签样式**

```scss
.status-tag {
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  font-weight: 500;

  &.early {
    background: #FFF3E0;
    color: #E65100;
  }

  &.ontime {
    background: #E8F5E9;
    color: #1B5E20;
  }

  &.late {
    background: #FFEBEE;
    color: #B71C1C;
  }
}
```

- [ ] **Step 5: 过时提醒对话框**

```typescript
async function takeMedication(item: any) {
  // 检查是否过时
  const schedule = schedules.value.find(s => s.id === item.id)
  if (schedule) {
    const status = getMedicationStatus(schedule.time_of_day)
    if (status.isLate) {
      const diffMinutes = Math.floor(
        (new Date().getTime() - new Date(schedule.time_of_day).getTime()) / 60000
      )
      const confirmed = await uni.showModal({
        title: '超时提醒',
        content: `您已超时${diffMinutes}分钟，是否确认服药？`,
        confirmText: '确认',
        cancelText: '取消'
      })
      if (!confirmed.confirm) return
    }
  }
  // ... 正常服药流程
}
```

- [ ] **Step 6: 测试状态标签**
  - 模拟不同时间服药，验证状态标签正确显示
  - 验证过时服药弹出提醒对话框

---

### Task 5: 实现药品照片功能

**Files:**
- Modify: `src/pages/medication-detail/medication-detail.vue`
- Modify: `src/pages/index/index.vue`
- Modify: `src/pages/medication-list/medication-list.vue`
- Modify: `src/store/medication.ts`
- Test: 验证拍照、上传、显示流程

- [ ] **Step 1: 在详情页添加拍照按钮**

```vue
<view class="photo-section card">
  <text class="section-title">药品照片</text>
  <view class="photo-content">
    <view class="photo-preview" @click="takePhoto">
      <image v-if="medication?.image_url" :src="medication.image_url" class="preview-image" mode="aspectFill" />
      <view v-else class="photo-placeholder">
        <text class="placeholder-icon">📷</text>
        <text class="placeholder-text">点击拍摄药品照片</text>
      </view>
    </view>
    <button class="take-photo-btn" @click="takePhoto">📷 拍摄/选择照片</button>
  </view>
</view>
```

- [ ] **Step 2: 添加拍照样式**

```scss
.photo-section {
  margin-top: 16rpx;
}

.photo-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.photo-preview {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  overflow: hidden;
  background: #F5F5F5;
  border: 4rpx solid #E0E0E0;

  &:active {
    opacity: 0.8;
  }
}

.preview-image {
  width: 100%;
  height: 100%;
}

.photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  font-size: 60rpx;
  margin-bottom: 8rpx;
}

.placeholder-text {
  font-size: 20rpx;
  color: #999;
}

.take-photo-btn {
  padding: 16rpx 32rpx;
  font-size: 26rpx;
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
  border-radius: 40rpx;
}
```

- [ ] **Step 3: 在 store 中添加照片上传函数**

```typescript
// 添加上传函数
async function uploadMedicationPhoto(medicationId: string, imagePath: string): Promise<string> {
  if (!authStore.userId) throw new Error('未登录')

  // 上传到 Supabase Storage
  const { data, error } = await supabase.storage
    .from('medication-photos')
    .upload(`${authStore.userId}/${medicationId}.jpg`, imagePath, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) throw error

  // 获取公开 URL
  const { data: urlData } = supabase.storage
    .from('medication-photos')
    .getPublicUrl(`${authStore.userId}/${medicationId}.jpg`)

  return urlData.publicUrl
}

// 更新药品照片
async function updateMedicationPhoto(medicationId: string, imageUrl: string) {
  return await updateMedication(medicationId, { image_url: imageUrl })
}
```

- [ ] **Step 4: 在详情页添加拍照逻辑**

```typescript
async function takePhoto() {
  uni.chooseImage({
    count: 1,
    sourceType: ['camera', 'album'],
    success: async (res) => {
      uni.showLoading({ title: '上传中...' })
      try {
        const imagePath = res.tempFilePaths[0]
        const imageUrl = await medicationStore.uploadMedicationPhoto(medicationId.value, imagePath)
        await medicationStore.updateMedicationPhoto(medicationId.value, imageUrl)

        // 更新本地状态
        if (medication.value) {
          medication.value.image_url = imageUrl
        }

        uni.showToast({ title: '照片已更新', icon: 'success' })
        speakText('药品照片已更新')
      } catch (error) {
        console.error('上传失败:', error)
        uni.showToast({ title: '上传失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    },
    fail: () => {
      uni.showToast({ title: '取消选择', icon: 'none' })
    }
  })
}
```

- [ ] **Step 5: 首页和列表页显示圆形照片**

```vue
<!-- 首页 -->
<view class="medication-avatar">
  <image
    v-if="item.common_medications?.image_url"
    :src="item.common_medications.image_url"
    class="med-image"
    mode="aspectFill"
  />
  <MedicationIcon
    v-else
    :name="item.common_medications?.name || '药'"
    :appearance-desc="item.common_medications?.appearance_desc"
    :size="60"
  />
</view>

<!-- 列表页 - 已有 MedicationIcon，确保支持图片显示 -->
```

- [ ] **Step 6: 添加圆形照片样式**

```scss
.medication-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.med-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

- [ ] **Step 7: 测试照片功能**
  - 在详情页点击拍照按钮
  - 选择照片或拍照
  - 验证上传成功后首页和列表页显示圆形照片

---

### Task 6: 数据验证和错误处理

**Files:**
- Modify: `src/store/medication.ts`
- Test: 验证各种错误场景的处理

- [ ] **Step 1: 添加 Storage 桶创建检查**

```typescript
// 检查 Storage 桶是否存在，不存在则提示
async function checkStorageBucket() {
  const { data, error } = await supabase.storage.getBucket('medication-photos')
  if (error) {
    console.error('Storage 桶不存在，请先在 Supabase 控制台创建')
    // 可以在管理员后台页面添加创建按钮
  }
}
```

- [ ] **Step 2: 添加照片大小限制**

```typescript
async function takePhoto() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'], // 自动压缩
    sourceType: ['camera', 'album'],
    success: async (res) => {
      const imageSize = res.tempFiles[0].size
      if (imageSize > 5 * 1024 * 1024) { // 5MB 限制
        uni.showToast({ title: '图片太大，请重新选择', icon: 'none' })
        return
      }
      // ...
    }
  })
}
```

- [ ] **Step 3: 添加网络错误处理**

```typescript
try {
  const imageUrl = await uploadMedicationPhoto(...)
} catch (error: any) {
  if (error.message.includes('network')) {
    uni.showToast({ title: '网络错误，请检查连接', icon: 'none' })
  } else if (error.message.includes('unauthorized')) {
    uni.showToast({ title: '请先登录', icon: 'none' })
  } else {
    uni.showToast({ title: '上传失败：' + error.message, icon: 'none' })
  }
}
```

- [ ] **Step 4: 测试错误场景**
  - 断网状态下上传照片
  - 未登录状态下操作
  - 上传超大图片

---

## 验收标准汇总

### Task 1: 详情页修复
- [ ] 详情页显示完整的药品信息
- [ ] 显示用药计划列表
- [ ] 显示用药统计数据
- [ ] 编辑和确认服药按钮可用

### Task 2: 编辑模式修复
- [ ] 从列表页点击编辑按钮
- [ ] 直接进入第 2 步（设置时间）
- [ ] 原有用药计划数据正确填充

### Task 3: 首页排序
- [ ] 未服用的药品显示在上半区
- [ ] 已服用的药品显示在下半区
- [ ] 已服用卡片有视觉弱化效果

### Task 4: 状态标签
- [ ] 提前 >15 分钟显示橙色"提前"标签
- [ ] ±15 分钟内显示绿色"准点"标签
- [ ] 过时 >15 分钟显示红色"过时"标签
- [ ] 过时服药弹出确认对话框

### Task 5: 药品照片
- [ ] 详情页有拍照按钮
- [ ] 支持相机拍摄和相册选择
- [ ] 上传后首页和列表页显示圆形照片
- [ ] 照片自动裁剪为圆形

### Task 6: 错误处理
- [ ] 网络错误有友好提示
- [ ] 图片大小有限制
- [ ] 未登录有正确引导

---

## 执行说明

**推荐执行方式**: Subagent-Driven（每个 Task 独立，可并行执行部分任务）

**执行顺序建议**:
1. Task 1 → Task 2 (先修复 bug)
2. Task 3 → Task 4 (排序和状态标签)
3. Task 5 (照片功能，依赖较少)
4. Task 6 (最后添加错误处理)

**每 Task 完成后**:
- 运行 `npm run dev:app` 或 HBuilder X 运行到安卓基座
- 手动测试验证功能
- 提交 git 后再执行下一个 Task
