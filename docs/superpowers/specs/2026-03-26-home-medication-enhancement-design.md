# 首页用药功能增强设计文档

> **创建日期**: 2026-03-26
> **状态**: 已确认
> **涉及页面**: 首页 (index.vue)、药品列表页 (medication-list.vue)、药品详情页 (medication-detail.vue)、添加药品页 (add-medication.vue)

## 概述

完善首页用药相关功能，包括排序优化、服药状态分类、药品照片展示，同时修复现有 bug。

---

## 1. 排序优化

### 1.1 问题描述
当前首页用药卡片没有明确的排序逻辑，已服用和未服用的药品混排，老年人难以快速识别待办事项。

### 1.2 设计方案
**排序规则**：
1. **未服用的药品** - 显示在顶部（上半区），作为待办事项优先提醒
2. **已服用的药品** - 显示在下半区，灰色弱化显示

**视觉区分**：
- 未服用卡片：白色背景，蓝色边框，绿色"服用"按钮
- 已服用卡片：浅绿色背景，绿色边框，"✓ 已服用"标签，透明度 85%

### 1.3 实现逻辑
```typescript
// 按服用状态和时间排序
const sortedMedications = computed(() => {
  const pending = todayMedications.value.filter(m => !m.taken)
  const taken = todayMedications.value.filter(m => m.taken)
  // 各自内部按时间排序
  pending.sort((a, b) => a.time_of_day.localeCompare(b.time_of_day))
  taken.sort((a, b) => a.time_of_day.localeCompare(b.time_of_day))
  return [...pending, ...taken]
})
```

---

## 2. 服药状态标签

### 2.1 时间阈值定义
| 状态 | 时间范围 | 颜色 | 图标 |
|------|----------|------|------|
| 提前服药 | 早于计划时间 >15 分钟 | 橙色 (#FF9800) | 🕐 |
| 准点服药 | 计划时间 ±15 分钟内 | 绿色 (#4CAF50) | ✅ |
| 过时服药 | 晚于计划时间 >15 分钟 | 红色 (#F44336) | ⏰ |

### 2.2 数据库修改
`medication_logs` 表的 `status` 字段需要扩展：

**当前枚举值**：`taken`, `missed`, `delayed`

**新增枚举值**：
- `early` - 提前服药（可选，或统一用 `taken` 加时间戳计算）
- `ontime` - 准点服药（可选，或统一用 `taken` 加时间戳计算）
- `late` - 过时服药（可选，或统一用 `taken` 加时间戳计算）

**建议**：不修改数据库，通过 `scheduled_time` 和 `taken_time` 的时间差动态计算状态。

### 2.3 过时提醒
当用户点击"服用"按钮且时间晚于计划时间 15 分钟以上时：
1. 弹出确认对话框："您已超时 XX 分钟，是否确认服药？"
2. 确认后记录为 `delayed` 状态
3. 推送通知提醒按时服药的重要性

---

## 3. 药品照片功能

### 3.1 功能设计
| 功能 | 位置 | 说明 |
|------|------|------|
| 拍照按钮 | 药品详情页 | 圆形拍摄按钮，调用系统相机 |
| 照片展示 | 首页/列表页 | 圆形裁剪框，直径 64-80px，显示在卡片左侧 |
| 照片上传 | 详情页 | 支持拍摄或从相册选择，自动压缩上传 |
| 照片存储 | Supabase Storage | 路径：`medication-photos/{user_id}/{medication_id}.jpg` |

### 3.2 数据库修改
`common_medications` 表已有 `image_url` 字段，无需修改。

### 3.3 视觉设计
```
┌─────────────────────────────────────┐
│  [💊 圆形照片]  阿司匹林肠溶片       │
│                 ⏰ 08:00 · 每次 1 片  │
│                          [服用按钮]  │
└─────────────────────────────────────┘
```

---

## 4. Bug 修复

### 4.1 详情页空白
**问题**：`medication-detail.vue` 只有 script 部分，缺少 template 和 style

**修复**：添加完整的 UI 组件，显示：
- 药品基本信息（名称、通用名、规格、外观描述、照片）
- 用药计划列表（时间、用量、星期）
- 用药记录统计（本周服药率、已服/漏服数量）
- 操作按钮（编辑、删除、确认服药）

### 4.2 编辑模式跳转错误
**问题**：药品列表页点击编辑按钮后跳转到选择药品步骤，而非直接进入时间设置

**原因**：`onMounted` 中编辑模式逻辑可能未正确执行

**修复**：确保 `isEditMode.value = true` 和 `currentStep.value = 2` 在数据加载完成后正确设置

---

## 5. 技术实现细节

### 5.1 首页排序 (index.vue)
```vue
<view class="medications-section">
  <!-- 上半区：未服用 -->
  <view v-if="pendingMedications.length > 0" class="section-header">
    <text class="section-title">待服用</text>
  </view>
  <view v-for="item in pendingMedications" :key="item.id" class="medication-card pending">
    <!-- ... -->
  </view>

  <!-- 下半区：已服用 -->
  <view v-if="takenMedications.length > 0" class="section-header">
    <text class="section-title">已服用</text>
  </view>
  <view v-for="item in takenMedications" :key="item.id" class="medication-card taken">
    <!-- ... -->
  </view>
</view>
```

### 5.2 状态计算
```typescript
function getMedicationStatus(scheduleTime: string, takenTime?: string): {
  label: string
  class: string
} {
  if (!takenTime) return { label: '待服用', class: 'pending' }

  const scheduled = new Date(scheduleTime)
  const taken = new Date(takenTime)
  const diffMinutes = (taken.getTime() - scheduled.getTime()) / 60000

  if (diffMinutes < -15) return { label: '提前', class: 'early' }
  if (diffMinutes > 15) return { label: '过时', class: 'late' }
  return { label: '准点', class: 'ontime' }
}
```

### 5.3 照片上传
```typescript
async function takePhoto() {
  uni.chooseImage({
    count: 1,
    sourceType: ['camera', 'album'],
    success: async (res) => {
      const imagePath = res.tempFilePaths[0]
      // 上传到 Supabase Storage
      const { data, error } = await supabase.storage
        .from('medication-photos')
        .upload(`${authStore.userId}/${medicationId.value}.jpg`, imagePath)

      if (data) {
        // 更新药品 image_url
        const publicUrl = supabase.storage
          .from('medication-photos')
          .getPublicUrl(`${authStore.userId}/${medicationId.value}.jpg`)
          .data.publicUrl

        await medicationStore.updateMedication(medicationId.value, {
          image_url: publicUrl
        })
      }
    }
  })
}
```

---

## 6. 文件修改清单

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `src/pages/index/index.vue` | 修改 | 添加排序逻辑、状态标签、圆形照片展示 |
| `src/pages/medication-detail/medication-detail.vue` | 重写 | 添加完整 UI，拍照功能 |
| `src/pages/medication-list/medication-list.vue` | 修改 | 添加圆形照片展示 |
| `src/pages/add-medication/add-medication.vue` | 修改 | 修复编辑模式跳转 bug |
| `src/store/medication.ts` | 修改 | 添加状态计算函数、照片上传函数 |
| `sql/` | 可选 | 如需要修改 status 枚举值 |

---

## 7. 验收标准

### 7.1 排序优化
- [ ] 未服用的药品显示在页面上半部分
- [ ] 已服用的药品显示在页面下半部分
- [ ] 已服用卡片有灰色/绿色弱化的视觉效果
- [ ] 两组各自内部按时间排序

### 7.2 状态标签
- [ ] 提前 >15 分钟显示橙色"提前"标签
- [ ] ±15 分钟内显示绿色"准点"标签
- [ ] 过时 >15 分钟显示红色"过时"标签
- [ ] 过时服药时弹出确认对话框

### 7.3 药品照片
- [ ] 详情页有拍照按钮
- [ ] 支持从相机或相册选择
- [ ] 上传后首页和列表页显示圆形照片
- [ ] 照片自动裁剪为圆形

### 7.4 Bug 修复
- [ ] 详情页显示完整的药品信息和用药计划
- [ ] 列表页编辑按钮点击后直接进入时间设置步骤

---

## 8. 后续优化建议

1. **智能提醒**：根据用户历史服药时间，动态调整提醒推送时间
2. **照片识别**：集成 AI 图片识别，自动识别药品名称和外观
3. **家属联动**：过时服药时通知紧急联系人
4. **统计报表**：生成服药依从性报表，鼓励用户坚持
