# 添加药品实时搜索下拉框实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为添加药品页面的搜索框实现实时搜索下拉功能，支持拼音首字母和中文的实时匹配，包含空状态添加入口

**Architecture:**
- 在搜索框下方添加下拉建议列表组件
- 使用防抖（300ms）监听输入变化，触发搜索
- 智能判断输入类型：中文≥1 字符或拼音≥2 字符时触发
- 下拉列表显示匹配结果（药名 + 拼音首字母）
- 无结果时显示"添加新药"入口

**Tech Stack:** Vue 3 + TypeScript + uni-app + SCSS

---

## 文件结构

**修改文件：**
- `src/pages/add-medication/add-medication.vue` - 添加下拉组件、防抖逻辑、空状态处理

**保持不变：**
- `src/services/common-medications.ts` - `searchMedications` 函数已支持拼音和中文匹配

---

## 任务清单

### Task 1: 添加下拉框状态和计算属性

**Files:**
- Modify: `src/pages/add-medication/add-medication.vue:323-324`

- [ ] **Step 1: 添加下拉框相关状态**

在 `searchKeyword` 和 `searchResults` 之后添加以下状态：

```typescript
// 下拉建议
const showDropdown = ref(false)
const searchSuggestions = ref<CommonMedication[]>([])
const debounceTimer = ref<NodeJS.Timeout | null>(null)

// 空状态动作
const showEmptyAction = ref(false)
```

- [ ] **Step 2: 添加计算属性判断输入类型**

```typescript
// 判断是否为拼音输入（2 个或以上字母）
const isPinyinInput = computed(() => {
  const trimmed = searchKeyword.value.trim()
  return trimmed.length >= 2 && /^[a-zA-Z]+$/.test(trimmed)
})

// 判断是否为中文输入（1 个或以上中文字符）
const isChineseInput = computed(() => {
  const trimmed = searchKeyword.value.trim()
  return trimmed.length >= 1 && /[\u4e00-\u9fa5]/.test(trimmed)
})

// 是否应该触发搜索
const shouldTriggerSearch = computed(() => {
  if (!searchKeyword.value.trim()) return false
  return isPinyinInput.value || isChineseInput.value
})
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/add-medication/add-medication.vue
git commit -m "feat(search): add dropdown state and computed properties"
```

---

### Task 2: 实现防抖搜索函数

**Files:**
- Modify: `src/pages/add-medication/add-medication.vue:406-430`

- [ ] **Step 1: 添加防抖搜索函数**

在 `handleSearch` 函数之前添加：

```typescript
// 防抖搜索
function debouncedSearch() {
  // 清除之前的定时器
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
    debounceTimer.value = null
  }

  // 检查是否应该触发搜索
  if (!shouldTriggerSearch.value) {
    showDropdown.value = false
    searchSuggestions.value = []
    showEmptyAction.value = false
    return
  }

  // 设置新的定时器（300ms 防抖）
  debounceTimer.value = setTimeout(async () => {
    loading.value = true

    try {
      const results = await searchCommonMedications(searchKeyword.value)
      searchSuggestions.value = results

      // 判断是否显示空状态
      if (results.length === 0) {
        showEmptyAction.value = true
      } else {
        showEmptyAction.value = false
      }

      showDropdown.value = true
    } catch (error) {
      console.error('搜索失败:', error)
      searchSuggestions.value = []
      showDropdown.value = false
    } finally {
      loading.value = false
    }
  }, 300)
}
```

- [ ] **Step 2: 修改现有 handleSearch 函数**

保留原有 `handleSearch` 函数用于按钮点击和确认事件，不做修改。

- [ ] **Step 3: Commit**

```bash
git add src/pages/add-medication/add-medication.vue
git commit -m "feat(search): add debounced search function"
```

---

### Task 3: 添加输入事件监听

**Files:**
- Modify: `src/pages/add-medication/add-medication.vue:14-21`

- [ ] **Step 1: 修改搜索输入框模板**

将搜索输入框修改为：

```vue
<input
  v-model="searchKeyword"
  type="text"
  placeholder="输入药品名称或拼音首字母"
  class="search-input"
  placeholder-class="search-placeholder"
  @confirm="handleSearch"
  @input="debouncedSearch"
  @focus="showDropdown = true"
  @blur="handleBlur"
/>
```

- [ ] **Step 2: 添加 blur 处理函数**

```typescript
// 处理失焦
function handleBlur() {
  // 延迟关闭下拉框，允许点击下拉项
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/add-medication/add-medication.vue
git commit -m "feat(search): add input event listeners"
```

---

### Task 4: 添加下拉框 UI 组件

**Files:**
- Modify: `src/pages/add-medication/add-medication.vue:22-24` (在 search-section 内)

- [ ] **Step 1: 添加下拉框模板**

在 `</view>` (search-wrapper 结束标签) 之后添加下拉框组件：

```vue
<!-- 搜索下拉建议 -->
<view v-if="showDropdown" class="search-dropdown">
  <!-- 匹配结果列表 -->
  <view v-if="searchSuggestions.length > 0" class="suggestion-list">
    <view
      v-for="med in searchSuggestions"
      :key="med.id"
      class="suggestion-item"
      @click="selectSuggestion(med)"
    >
      <text class="suggestion-name">{{ med.name }}</text>
      <text class="suggestion-pinyin">{{ getPinyinShortcut(med.name) }}</text>
    </view>
  </view>

  <!-- 空状态 - 添加新药入口 -->
  <view v-if="showEmptyAction" class="empty-action">
    <text class="empty-icon">🔍</text>
    <text class="empty-text">未找到 "{{ searchKeyword }}" 相关的药品</text>
    <view class="empty-btn" @click="addNewMedication">
      <text class="empty-btn-icon">+</text>
      <text class="empty-btn-text">添加新药 "{{ searchKeyword }}"</text>
      <text class="empty-btn-hint">只需输入药名，其他信息后续补充</text>
    </view>
  </view>
</view>
```

- [ ] **Step 2: 添加辅助函数**

```typescript
// 获取药品名称的拼音首字母快捷方式
function getPinyinShortcut(name: string): string {
  // 使用已有的 toPinyinFirst 函数（需要从 common-medications 导入）
  // 这里简化处理，显示药名首字
  return name.charAt(0)
}

// 选择建议项
function selectSuggestion(med: CommonMedication) {
  searchKeyword.value = med.name
  searchSuggestions.value = []
  showDropdown.value = false
  showEmptyAction.value = false
  selectMedication(med)
}

// 添加新药
function addNewMedication() {
  if (!searchKeyword.value.trim()) return

  // 创建临时药品对象（仅包含名称）
  const tempMed: CommonMedication = {
    id: 'temp_' + Date.now(),
    name: searchKeyword.value.trim(),
    genericName: searchKeyword.value.trim(),
    category: '其他',
    indications: '请确认用途',
    appearanceDesc: '',
    image: '',
    usage: '每次 1 片，每日 1 次'
  }

  showDropdown.value = false
  showEmptyAction.value = false
  searchSuggestions.value = []

  selectMedication(tempMed)
  speakText(`已添加新药${tempMed.name}，请确认信息`)
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/add-medication/add-medication.vue
git commit -m "feat(search): add dropdown UI component"
```

---

### Task 5: 添加下拉框样式

**Files:**
- Modify: `src/pages/add-medication/add-medication.vue:757-758` (在 .search-btn 之后)

- [ ] **Step 1: 添加下拉框样式**

```scss
// ===== 搜索下拉框 =====
.search-dropdown {
  position: relative;
  top: 8rpx;
  background: white;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.12);
  max-height: 400rpx;
  overflow-y: auto;
  z-index: 1000;
}

.suggestion-list {
  padding: 8rpx 0;
}

.suggestion-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 32rpx;
  gap: 16rpx;
  transition: background 0.15s;

  &:active {
    background: #F5F5F5;
  }
}

.suggestion-name {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.suggestion-pinyin {
  font-size: 24rpx;
  color: #999;
  background: #F5F5F5;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}

// 空状态
.empty-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 32rpx;
  gap: 24rpx;
}

.empty-icon {
  font-size: 80rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 28rpx;
  color: #666;
  text-align: center;
}

.empty-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(135deg, #E3F2FD, #BBDEFB);
  border: 2rpx solid #2196F3;
  border-radius: 24rpx;
  padding: 32rpx 24rpx;
  width: 100%;
  gap: 8rpx;
  transition: all 0.2s;

  &:active {
    transform: scale(0.98);
    background: #BBDEFB;
  }
}

.empty-btn-icon {
  font-size: 48rpx;
  color: #2196F3;
  font-weight: 700;
}

.empty-btn-text {
  font-size: 30rpx;
  color: #1976D2;
  font-weight: 600;
}

.empty-btn-hint {
  font-size: 24rpx;
  color: #666;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/add-medication/add-medication.vue
git commit -m "feat(search): add dropdown styles"
```

---

### Task 6: 清理和页面卸载处理

**Files:**
- Modify: `src/pages/add-medication/add-medication.vue:696-706` (onMounted)

- [ ] **Step 1: 添加 onUnmounted 生命周期钩子**

```typescript
import { onMounted, onUnmounted } from 'vue'

// 在文件顶部添加 onUnmounted 导入

// 在 onMounted 之后添加：
onUnmounted(() => {
  // 清除定时器，防止内存泄漏
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
    debounceTimer.value = null
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/add-medication/add-medication.vue
git commit -m "feat(search): add cleanup on unmount"
```

---

### Task 7: 从 common-medications 导入 toPinyinFirst 函数

**Files:**
- Modify: `src/pages/add-medication/add-medication.vue:287-293`

- [ ] **Step 1: 修改导入语句**

将导入语句修改为：

```typescript
import {
  fetchCommonMedications,
  getMedicationsByCategory as getCategoryMedications,
  searchMedications as searchCommonMedications,
  type CommonMedication as DbCommonMedication,
  type DisplayMedication as CommonMedication
} from '@/services/common-medications'
```

注意：`toPinyinFirst` 函数在当前实现中是私有的，需要在 common-medications.ts 中导出它。

- [ ] **Step 2: 修改 common-medications.ts 导出 toPinyinFirst**

Modify: `src/services/common-medications.ts:174-235`

将 `toPinyinFirst` 函数从 `private` 改为 `export`：

```typescript
/**
 * 将中文文本转换为拼音首字母（简易版）
 */
export function toPinyinFirst(text: string): string {
  // ... existing implementation
}
```

- [ ] **Step 3: 更新 getPinyinShortcut 函数**

```typescript
import { toPinyinFirst } from '@/services/common-medications'

// 更新函数
function getPinyinShortcut(name: string): string {
  return toPinyinFirst(name)
}
```

- [ ] **Step 4: Commit**

```bash
git add src/services/common-medications.ts src/pages/add-medication/add-medication.vue
git commit -m "feat(search): export toPinyinFirst function"
```

---

## 验收标准

完成所有任务后，验证以下功能：

1. **拼音首字母实时搜索**
   - 输入 "hfl" → 下拉框显示 "华法林钠片"
   - 输入 "xbdp" → 下拉框显示 "硝苯地平缓释片"
   - 输入时自动触发（不需要点击搜索按钮）

2. **中文实时搜索**
   - 输入 "华" → 下拉框显示包含"华"的药品
   - 输入 "法林" → 下拉框显示 "华法林钠片"

3. **下拉框交互**
   - 下拉框最大高度 400rpx，支持滚动
   - 点击建议项 → 关闭下拉 → 显示药品卡片
   - 失焦后下拉框自动关闭

4. **空状态处理**
   - 输入不存在的药品名 → 显示 "未找到 xxx 相关的药品"
   - 点击 "添加新药" → 创建临时药品 → 显示药品卡片

5. **防抖功能**
   - 快速输入时不会频繁触发搜索
   - 停止输入 300ms 后触发搜索

---

## 测试命令

```bash
# 开发模式运行
npm run dev:h5

# 浏览器访问 http://localhost:3000
# 导航到添加药品页面测试搜索功能
```
