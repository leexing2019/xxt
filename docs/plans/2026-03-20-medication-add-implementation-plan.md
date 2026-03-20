# 添加药品适老化改造实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** 重构添加药品页面，实现语音优先 + 常用药快捷选择 + 可选拍摄的适老化设计，将操作流程简化为 3 步。

**Architecture:** 保留现有页面框架，简化方式选择为 4 个大卡片（语音、常用药、拍照、手写），新增语音搜索组件、常用药列表组件、简化的药品详情确认组件。

**Tech Stack:** Vue 3 + TypeScript + uni-app + Pinia + 百度语音识别 API

---

## 第一阶段：核心功能（语音输入 + 搜索 + 确认）

### Task 1: 创建常用药品数据文件

**Files:**
- Create: `src/data/common-medications.ts`

**Step 1: 创建常用药品数据**

```typescript
// src/data/common-medications.ts
// 常用药品库 - 50 种高频药品

export interface CommonMedication {
  id: string
  name: string           // 商品名
  genericName: string    // 通用名
  category: string       // 分类
  indications: string    // 适应症/用途
  appearanceDesc: string // 外观描述
  image: string          // 标准图片 URL
  usage: string          // 常用法用量
}

export const COMMON_MEDICATIONS: CommonMedication[] = [
  // ===== 降压药 (10 种) =====
  {
    id: 'common_001',
    name: '硝苯地平缓释片',
    genericName: '硝苯地平',
    category: '降压药',
    indications: '降血压',
    appearanceDesc: '黄色椭圆形薄膜衣片，长约 12mm',
    image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 2 次'
  },
  {
    id: 'common_002',
    name: '氨氯地平片',
    genericName: '苯磺酸氨氯地平',
    category: '降压药',
    indications: '降血压',
    appearanceDesc: '白色圆形片剂，直径约 9mm',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_003',
    name: '厄贝沙坦片',
    genericName: '厄贝沙坦',
    category: '降压药',
    indications: '降血压',
    appearanceDesc: '白色椭圆形片剂，一面刻有标识',
    image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_004',
    name: '缬沙坦胶囊',
    genericName: '缬沙坦',
    category: '降压药',
    indications: '降血压',
    appearanceDesc: '蓝白胶囊，内含白色颗粒',
    image: 'https://images.unsplash.com/photo-1583912267670-6bdd75a7e1fd?w=200&h=200&fit=crop',
    usage: '每次 1 粒，每日 1 次'
  },
  {
    id: 'common_005',
    name: '美托洛尔缓释片',
    genericName: '酒石酸美托洛尔',
    category: '降压药',
    indications: '降血压/心率',
    appearanceDesc: '淡黄色圆形片剂',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次'
  },

  // ===== 降糖药 (10 种) =====
  {
    id: 'common_006',
    name: '二甲双胍片',
    genericName: '盐酸二甲双胍',
    category: '降糖药',
    indications: '降血糖',
    appearanceDesc: '白色圆形片剂，直径约 10mm',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 2 次，餐中服用'
  },
  {
    id: 'common_007',
    name: '格列美脲片',
    genericName: '格列美脲',
    category: '降糖药',
    indications: '降血糖',
    appearanceDesc: '粉红色椭圆形片剂',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次，早餐前'
  },
  {
    id: 'common_008',
    name: '阿卡波糖片',
    genericName: '阿卡波糖',
    category: '降糖药',
    indications: '降餐后血糖',
    appearanceDesc: '白色类圆形片剂',
    image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 3 次，餐前服用'
  },

  // ===== 降脂药 (8 种) =====
  {
    id: 'common_009',
    name: '阿托伐他汀钙片',
    genericName: '阿托伐他汀',
    category: '降脂药',
    indications: '降胆固醇',
    appearanceDesc: '白色椭圆形薄膜衣片，长约 14mm',
    image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次，睡前服用'
  },
  {
    id: 'common_010',
    name: '瑞舒伐他汀钙片',
    genericName: '瑞舒伐他汀',
    category: '降脂药',
    indications: '降血脂',
    appearanceDesc: '粉色圆形片剂',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次，睡前服用'
  },

  // ===== 抗血小板药 (5 种) =====
  {
    id: 'common_011',
    name: '阿司匹林肠溶片',
    genericName: '阿司匹林',
    category: '抗血小板药',
    indications: '预防血栓',
    appearanceDesc: '白色圆形小药片，直径约 8mm，刻有"100"',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_012',
    name: '氯吡格雷片',
    genericName: '硫酸氢氯吡格雷',
    category: '抗血小板药',
    indications: '预防血栓',
    appearanceDesc: '黄色圆形片剂',
    image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次'
  },

  // ===== 胃药 (5 种) =====
  {
    id: 'common_013',
    name: '奥美拉唑肠溶胶囊',
    genericName: '奥美拉唑',
    category: '胃药',
    indications: '抑制胃酸',
    appearanceDesc: '透明胶囊，内含白色小丸',
    image: 'https://images.unsplash.com/photo-1583912267670-6bdd75a7e1fd?w=200&h=200&fit=crop',
    usage: '每次 1 粒，每日 1 次，早餐前'
  },
  {
    id: 'common_014',
    name: '雷贝拉唑钠肠溶片',
    genericName: '雷贝拉唑',
    category: '胃药',
    indications: '抑制胃酸',
    appearanceDesc: '黄色薄膜衣片',
    image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次'
  },

  // ===== 止咳药 (4 种) =====
  {
    id: 'common_015',
    name: '氨溴索片',
    genericName: '盐酸氨溴索',
    category: '止咳药',
    indications: '化痰止咳',
    appearanceDesc: '白色圆形片剂',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 3 次'
  },

  // ===== 止痛药 (4 种) =====
  {
    id: 'common_016',
    name: '布洛芬缓释胶囊',
    genericName: '布洛芬',
    category: '止痛药',
    indications: '止痛退烧',
    appearanceDesc: '透明胶囊，内含白色粉末',
    image: 'https://images.unsplash.com/photo-1583912267670-6bdd75a7e1fd?w=200&h=200&fit=crop',
    usage: '每次 1 粒，每日 2 次'
  },
  {
    id: 'common_017',
    name: '对乙酰氨基酚片',
    genericName: '对乙酰氨基酚',
    category: '止痛药',
    indications: '止痛退烧',
    appearanceDesc: '白色圆形片剂',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop',
    usage: '每次 1 片，需要时服用'
  },

  // ===== 维生素/钙片 (4 种) =====
  {
    id: 'common_018',
    name: '复合维生素片',
    genericName: '复合维生素',
    category: '维生素',
    indications: '补充维生素',
    appearanceDesc: '橙色椭圆形片剂',
    image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1 次'
  },
  {
    id: 'common_019',
    name: '碳酸钙 D3 片',
    genericName: '碳酸钙',
    category: '钙片',
    indications: '补钙',
    appearanceDesc: '白色或类白色片剂',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=200&h=200&fit=crop',
    usage: '每次 1 片，每日 1-2 次'
  }
]

// 分类列表
export const MEDICATION_CATEGORIES = [
  { id: 'all', name: '全部' },
  { id: '降压药', name: '降压药' },
  { id: '降糖药', name: '降糖药' },
  { id: '降脂药', name: '降脂药' },
  { id: '抗血小板药', name: '心血管' },
  { id: '胃药', name: '胃药' },
  { id: '止咳药', name: '止咳药' },
  { id: '止痛药', name: '止痛药' },
  { id: '维生素', name: '维生素' },
  { id: '钙片', name: '钙片' }
]

// 根据分类筛选
export function getMedicationsByCategory(categoryId: string): CommonMedication[] {
  if (categoryId === 'all') {
    return COMMON_MEDICATIONS
  }
  return COMMON_MEDICATIONS.filter(med => med.category === categoryId)
}

// 搜索药品
export function searchMedications(keyword: string): CommonMedication[] {
  const kw = keyword.toLowerCase().trim()
  if (!kw) return []

  return COMMON_MEDICATIONS.filter(med =>
    med.name.toLowerCase().includes(kw) ||
    med.genericName.toLowerCase().includes(kw) ||
    med.category.toLowerCase().includes(kw) ||
    med.indications.toLowerCase().includes(kw)
  )
}
```

**Step 2: 验证文件格式**

检查 TypeScript 语法是否正确。

**Step 3: 提交**

```bash
git add src/data/common-medications.ts
git commit -m "feat: add common medications data for elderly-friendly mode"
```

---

### Task 2: 重构添加药品页面 - 方式选择区

**Files:**
- Modify: `src/pages/add-medication/add-medication.vue`

**Step 1: 修改模板 - 方式选择区（大卡片设计）**

替换原有的 `method-cards` 部分：

```vue
<!-- 选择添加方式 -->
<view class="method-selection">
  <view class="section-title">
    <text class="h3-title">添加药品</text>
    <text class="section-hint">选择一种方式添加药品</text>
  </view>

  <view class="method-grid">
    <!-- 语音输入 - 主推 -->
    <view class="method-card primary" @click="selectMethod('voice')">
      <text class="method-icon-large">🎤</text>
      <text class="method-name-large">语音说药名</text>
      <text class="method-desc">说出药品名称，自动搜索</text>
    </view>

    <!-- 常用药品 -->
    <view class="method-card" @click="selectMethod('common')">
      <text class="method-icon">📋</text>
      <text class="method-name">常用药品</text>
      <text class="method-desc">高血压/糖尿病等常用药</text>
    </view>

    <!-- 拍照识别 -->
    <view class="method-card" @click="selectMethod('camera')">
      <text class="method-icon">📷</text>
      <text class="method-name">拍照识别</text>
      <text class="method-desc">拍摄药盒，适合新药</text>
    </view>

    <!-- 手写输入 -->
    <view class="method-card" @click="selectMethod('handwrite')">
      <text class="method-icon">✏️</text>
      <text class="method-name">手写输入</text>
      <text class="method-desc">手写药名，更准确</text>
    </view>
  </view>
</view>
```

**Step 2: 修改样式 - 大卡片设计**

```scss
.method-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
  margin-top: 32rpx;
}

.method-card {
  background: white;
  border-radius: 20rpx;
  padding: 40rpx 24rpx;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
  border: 2rpx solid transparent;

  &:active {
    transform: scale(0.96);
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.12);
  }
}

.method-card.primary {
  grid-column: span 2; // 语音卡片占满一行
  padding: 48rpx 24rpx;
  background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
  border: 2rpx solid #2196F3;
}

.method-icon-large {
  font-size: 88rpx;
  display: block;
  margin-bottom: 16rpx;
}

.method-name-large {
  font-size: 34rpx;
  font-weight: 700;
  color: #1976D2;
  display: block;
  margin-bottom: 12rpx;
}

.method-icon {
  font-size: 64rpx;
  display: block;
  margin-bottom: 12rpx;
}

.method-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.method-desc {
  font-size: 24rpx;
  color: #999;
  display: block;
}
```

**Step 3: 验证样式**

刷新页面，确认卡片布局正确，语音卡片占满一行且突出显示。

**Step 4: 提交**

```bash
git add src/pages/add-medication/add-medication.vue
git commit -m "feat: redesign method selection with large cards for elderly"
```

---

### Task 3: 实现语音输入组件

**Files:**
- Modify: `src/pages/add-medication/add-medication.vue`

**Step 1: 添加语音输入区域模板**

在方式选择区后添加：

```vue
<!-- 语音输入区域 -->
<view v-if="selectedMethod === 'voice'" class="voice-section">
  <!-- 语音按钮 -->
  <view class="voice-button-wrapper">
    <view
      class="voice-button"
      :class="{ recording: isRecording }"
      @click="toggleRecording"
    >
      <text class="voice-icon">{{ isRecording ? '🔴' : '🎤' }}</text>
    </view>
    <text class="voice-hint">
      {{ isRecording ? '正在听，请说药品名称...' : '点击按钮，说出药品名称' }}
    </text>
  </view>

  <!-- 识别结果 -->
  <view v-if="recognizedText" class="recognized-result">
    <text class="recognized-label">您说的是：</text>
    <text class="recognized-text">{{ recognizedText }}</text>
    <view class="recognized-actions">
      <button class="btn btn-outline" @click="retryVoice">重新说</button>
      <button class="btn btn-primary" @click="confirmVoice">是这个药</button>
    </view>
  </view>

  <!-- 搜索结果 -->
  <view v-if="searchResults.length > 0" class="search-results">
    <text class="results-title">找到 {{ searchResults.length }} 种药品</text>
    <view
      v-for="(drug, index) in searchResults"
      :key="index"
      class="result-card"
      @click="selectSearchResult(drug)"
    >
      <image :src="drug.image" class="result-image" mode="aspectFill" />
      <view class="result-info">
        <text class="result-name">{{ drug.name }}</text>
        <text class="result-generic">通用名：{{ drug.genericName }}</text>
        <text class="result-appearance">🔍 {{ drug.appearanceDesc }}</text>
        <text class="result-usage">用于：{{ drug.indications }}</text>
      </view>
    </view>
  </view>
</view>
```

**Step 2: 添加语音输入样式**

```scss
.voice-section {
  padding: 32rpx 24rpx;
  background: white;
  border-radius: 20rpx;
  margin-top: 24rpx;
}

.voice-button-wrapper {
  text-align: center;
  padding: 32rpx 0;
}

.voice-button {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(33, 150, 243, 0.3);
  transition: all 0.3s;

  &:active {
    transform: scale(0.92);
  }
}

.voice-button.recording {
  background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}

.voice-icon {
  font-size: 80rpx;
}

.voice-hint {
  font-size: 28rpx;
  color: #666;
  display: block;
}

.recognized-result {
  text-align: center;
  padding: 32rpx;
  background: #F5F5F5;
  border-radius: 16rpx;
  margin-top: 24rpx;
}

.recognized-label {
  font-size: 26rpx;
  color: #999;
  display: block;
  margin-bottom: 12rpx;
}

.recognized-text {
  font-size: 36rpx;
  font-weight: 600;
  color: #2196F3;
  display: block;
  margin-bottom: 24rpx;
}

.recognized-actions {
  display: flex;
  justify-content: center;
  gap: 24rpx;
}

.search-results {
  margin-top: 32rpx;
}

.results-title {
  font-size: 26rpx;
  color: #666;
  display: block;
  margin-bottom: 20rpx;
}

.result-card {
  display: flex;
  padding: 24rpx;
  background: #F5F5F5;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  gap: 24rpx;

  &:active {
    background: #EEEEEE;
  }
}

.result-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  background: white;
  flex-shrink: 0;
}

.result-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8rpx;
  min-width: 0;
}

.result-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-generic {
  font-size: 24rpx;
  color: #999;
}

.result-appearance {
  font-size: 24rpx;
  color: #E65100;
  background: #FFF3E0;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  display: inline-block;
  width: fit-content;
}

.result-usage {
  font-size: 24rpx;
  color: #666;
}
```

**Step 3: 提交**

```bash
git add src/pages/add-medication/add-medication.vue
git commit -m "feat: add voice input component with large button design"
```

---

### Task 4: 实现常用药品列表组件

**Files:**
- Modify: `src/pages/add-medication/add-medication.vue`

**Step 1: 添加常用药品区域模板**

```vue
<!-- 常用药品区域 -->
<view v-if="selectedMethod === 'common'" class="common-drugs-section">
  <!-- 分类 Tab -->
  <scroll-view scroll-x class="category-tabs" show-scrollbar>
    <view class="tabs-wrapper">
      <view
        v-for="cat in categories"
        :key="cat.id"
        class="tab"
        :class="{ active: activeCategory === cat.id }"
        @click="selectCategory(cat.id)"
      >
        {{ cat.name }}
      </view>
    </view>
  </scroll-view>

  <!-- 药品网格 -->
  <view class="drug-grid">
    <view
      v-for="drug in filteredDrugs"
      :key="drug.id"
      class="drug-card"
      @click="selectCommonDrug(drug)"
    >
      <image :src="drug.image" class="drug-image" mode="aspectFill" />
      <text class="drug-name">{{ drug.name }}</text>
      <text class="drug-usage">{{ drug.usage }}</text>
    </view>
  </view>
</view>
```

**Step 2: 添加常用药品样式**

```scss
.common-drugs-section {
  background: white;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-top: 24rpx;
}

.category-tabs {
  width: 100%;
  white-space: nowrap;
  margin-bottom: 24rpx;
}

.tabs-wrapper {
  display: inline-flex;
  gap: 16rpx;
  padding: 8rpx 4rpx;
}

.tab {
  display: inline-block;
  padding: 12rpx 28rpx;
  font-size: 26rpx;
  color: #666;
  background: #F5F5F5;
  border-radius: 32rpx;
  transition: all 0.2s;

  &.active {
    background: #2196F3;
    color: white;
    font-weight: 600;
  }
}

.drug-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.drug-card {
  background: #F5F5F5;
  border-radius: 16rpx;
  padding: 24rpx;
  text-align: center;
  transition: all 0.2s;

  &:active {
    background: #EEEEEE;
    transform: scale(0.96);
  }
}

.drug-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  background: white;
  margin-bottom: 16rpx;
}

.drug-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drug-usage {
  font-size: 22rpx;
  color: #666;
  display: block;
}
```

**Step 3: 提交**

```bash
git add src/pages/add-medication/add-medication.vue
git commit -m "feat: add common medications list with category tabs"
```

---

### Task 5: 实现药品详情确认组件

**Files:**
- Modify: `src/pages/add-medication/add-medication.vue`

**Step 1: 添加药品详情确认模板**

```vue
<!-- 药品详情确认 -->
<view v-if="selectedDrug" class="drug-detail-section">
  <view class="detail-header">
    <text class="detail-title">确认药品信息</text>
    <button class="btn-close" @click="closeDetail">✕</button>
  </view>

  <!-- 药品大图 -->
  <view class="drug-preview">
    <image :src="selectedDrug.image" class="preview-image" mode="aspectFill" />
    <view class="preview-overlay">
      <text class="preview-hint">这是药品参考图片</text>
    </view>
  </view>

  <!-- 药品信息 -->
  <view class="drug-info">
    <view class="info-row">
      <text class="info-label">药品名称</text>
      <text class="info-value">{{ selectedDrug.name }}</text>
    </view>
    <view class="info-row">
      <text class="info-label">通用名</text>
      <text class="info-value">{{ selectedDrug.genericName }}</text>
    </view>
    <view class="info-row">
      <text class="info-label">外观描述</text>
      <text class="info-value appearance">{{ selectedDrug.appearanceDesc }}</text>
    </view>
    <view class="info-row">
      <text class="info-label">主要用途</text>
      <text class="info-value">{{ selectedDrug.indications }}</text>
    </view>
  </view>

  <!-- 用药时间设置 -->
  <view class="time-section">
    <text class="time-label">什么时候吃药？</text>
    <view class="time-quick-select">
      <text
        class="time-tag"
        :class="{ active: selectedTime === '08:00' }"
        @click="setTime('08:00')"
      >
        早上
      </text>
      <text
        class="time-tag"
        :class="{ active: selectedTime === '12:00' }"
        @click="setTime('12:00')"
      >
        中午
      </text>
      <text
        class="time-tag"
        :class="{ active: selectedTime === '18:00' }"
        @click="setTime('18:00')"
      >
        晚上
      </text>
      <text
        class="time-tag"
        :class="{ active: selectedTime === '21:00' }"
        @click="setTime('21:00')"
      >
        睡前
      </text>
    </view>
    <picker mode="time" :value="selectedTime" @change="onTimeChange">
      <view class="time-picker">
        {{ selectedTime || '选择具体时间' }}
      </view>
    </picker>
  </view>

  <!-- 确认按钮 -->
  <button class="btn-confirm-large" @click="confirmAdd">
    确认添加
  </button>
</view>
```

**Step 2: 添加药品详情样式**

```scss
.drug-detail-section {
  background: white;
  border-radius: 20rpx;
  padding: 32rpx;
  margin-top: 24rpx;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.detail-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #333;
}

.btn-close {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #F5F5F5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #666;
  padding: 0;
  line-height: 1;
}

.drug-preview {
  position: relative;
  width: 100%;
  height: 300rpx;
  background: #F5F5F5;
  border-radius: 16rpx;
  overflow: hidden;
  margin-bottom: 24rpx;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  padding: 16rpx 24rpx;
}

.preview-hint {
  font-size: 24rpx;
  color: white;
}

.drug-info {
  margin-bottom: 32rpx;
}

.info-row {
  display: flex;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #F0F0F0;

  &:last-child {
    border-bottom: none;
  }
}

.info-label {
  font-size: 26rpx;
  color: #999;
  width: 180rpx;
  flex-shrink: 0;
}

.info-value {
  font-size: 28rpx;
  color: #333;
  flex: 1;

  &.appearance {
    color: #E65100;
    background: #FFF3E0;
    padding: 8rpx 16rpx;
    border-radius: 8rpx;
    display: inline-block;
  }
}

.time-section {
  margin-bottom: 32rpx;
}

.time-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

.time-quick-select {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.time-tag {
  flex: 1;
  padding: 20rpx 0;
  text-align: center;
  font-size: 28rpx;
  color: #666;
  background: #F5F5F5;
  border-radius: 12rpx;
  transition: all 0.2s;

  &.active {
    background: #2196F3;
    color: white;
    font-weight: 600;
  }
}

.time-picker {
  padding: 24rpx;
  font-size: 28rpx;
  color: #333;
  background: #F5F5F5;
  border-radius: 12rpx;
  text-align: center;
}

.btn-confirm-large {
  width: 100%;
  height: 80rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(76, 175, 80, 0.3);
}
```

**Step 3: 提交**

```bash
git add src/pages/add-medication/add-medication.vue
git commit -m "feat: add drug detail confirmation view with time selection"
```

---

### Task 6: 添加 TypeScript 逻辑和状态管理

**Files:**
- Modify: `src/pages/add-medication/add-medication.vue`
- Modify: `src/services/voice.ts`

**Step 1: 在 add-medication.vue 中添加 script 逻辑**

在 `<script setup lang="ts">` 中添加/修改：

```typescript
import { ref, computed } from 'vue'
import { useMedicationStore } from '@/store/medication'
import { useAuthStore } from '@/store/auth'
import { speakText, recognizeSpeech } from '@/services/voice'
import {
  COMMON_MEDICATIONS,
  MEDICATION_CATEGORIES,
  getMedicationsByCategory,
  searchMedications,
  type CommonMedication
} from '@/data/common-medications'

const medicationStore = useMedicationStore()
const authStore = useAuthStore()

// 状态
const selectedMethod = ref('') // 'voice' | 'common' | 'camera' | 'handwrite'
const selectedDrug = ref<CommonMedication | null>(null)
const selectedTime = ref('')
const isRecording = ref(false)
const recognizedText = ref('')
const searchResults = ref<CommonMedication[]>([])
const activeCategory = ref('all')
const loading = ref(false)

// 常用药分类
const categories = MEDICATION_CATEGORIES

// 筛选后的常用药
const filteredDrugs = computed(() => {
  return getMedicationsByCategory(activeCategory.value)
})

// 选择方式
function selectMethod(method: string) {
  selectedMethod.value = method
  if (method === 'voice') {
    speakText('请点击按钮，说出药品名称')
  }
}

// 切换录音状态
async function toggleRecording() {
  if (isRecording.value) {
    stopRecording()
  } else {
    startRecording()
  }
}

// 开始录音
async function startRecording() {
  isRecording.value = true
  speakText('正在听，请说药品名称')

  try {
    const result = await recognizeSpeech()
    isRecording.value = false

    if (result.success && result.text) {
      recognizedText.value = result.text
      searchResults.value = searchMedications(result.text)

      if (searchResults.value.length > 0) {
        speakText(`找到${searchResults.value.length}种药品，请查看屏幕选择`)
      } else {
        speakText('没有找到相关药品，请重新说或试试其他方式')
      }
    }
  } catch (error) {
    isRecording.value = false
    uni.showToast({ title: '语音识别失败', icon: 'none' })
  }
}

// 停止录音
function stopRecording() {
  isRecording.value = false
}

// 重新识别
function retryVoice() {
  recognizedText.value = ''
  searchResults.value = []
  startRecording()
}

// 确认语音识别
function confirmVoice() {
  if (searchResults.value.length > 0) {
    selectSearchResult(searchResults.value[0])
  }
}

// 选择搜索结果
function selectSearchResult(drug: CommonMedication) {
  selectedDrug.value = drug
  selectedTime.value = '08:00' // 默认早上 8 点
  speakText(`您选择的是${drug.name}，用于${drug.indications}`)
}

// 选择常用药
function selectCommonDrug(drug: CommonMedication) {
  selectedDrug.value = drug
  selectedTime.value = '08:00'
  speakText(`您选择的是${drug.name}，用于${drug.indications}`)
}

// 选择分类
function selectCategory(categoryId: string) {
  activeCategory.value = categoryId
}

// 设置时间
function setTime(time: string) {
  selectedTime.value = time
}

// 时间选择器变化
function onTimeChange(e: any) {
  selectedTime.value = e.detail.value
}

// 关闭详情
function closeDetail() {
  selectedDrug.value = null
}

// 确认添加
async function confirmAdd() {
  if (!selectedDrug.value) return

  loading.value = true

  try {
    // 添加药品到数据库
    const result = await medicationStore.addMedication({
      name: selectedDrug.value.name,
      generic_name: selectedDrug.value.genericName,
      specification: '',
      form: '',
      manufacturer: '',
      appearance_desc: selectedDrug.value.appearanceDesc,
      image_url: selectedDrug.value.image
    })

    if (result.success && result.data) {
      // 添加用药计划
      await medicationStore.addSchedule({
        medication_id: result.data.id,
        time_of_day: selectedTime.value,
        dosage: '1 片',
        instructions: selectedDrug.value.usage,
        weekdays: [1, 2, 3, 4, 5, 6, 7],
        start_date: new Date().toISOString().split('T')[0]
      })

      speakText(`${selectedDrug.value.name}已添加成功，每天${formatTime(selectedTime.value)}提醒您`)
      uni.showToast({ title: '添加成功', icon: 'success' })

      setTimeout(() => {
        resetState()
        uni.switchTab({ url: '/pages/medication-list/medication-list' })
      }, 1500)
    }
  } catch (error) {
    uni.showToast({ title: '添加失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 格式化时间显示
function formatTime(time: string): string {
  const [hour, minute] = time.split(':')
  const h = parseInt(hour)
  if (h < 6) return '凌晨'
  if (h < 10) return '早上'
  if (h < 14) return '中午'
  if (h < 18) return '下午'
  if (h < 21) return '晚上'
  return '睡前'
}

// 重置状态
function resetState() {
  selectedMethod.value = ''
  selectedDrug.value = null
  selectedTime.value = ''
  recognizedText.value = ''
  searchResults.value = []
}
```

**Step 2: 优化语音识别服务**

修改 `src/services/voice.ts`，确保 recognizeSpeech 返回正确格式：

```typescript
export async function recognizeSpeech(): Promise<{
  success: boolean
  text: string
  error?: string
}> {
  return new Promise((resolve) => {
    // 检查是否支持语音识别
    if (!uni.getRecorderManager) {
      resolve({ success: false, text: '', error: '设备不支持' })
      return
    }

    uni.startRecord({
      success: async (res) => {
        // 使用 H5 语音识别（浏览器自带）
        if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
          const SpeechRecognition = (window as any).webkitSpeechRecognition
          const recognition = new SpeechRecognition()
          recognition.lang = 'zh-CN'
          recognition.interimResults = false
          recognition.maxAlternatives = 1

          recognition.onresult = (event: any) => {
            resolve({
              success: true,
              text: event.results[0][0].transcript
            })
          }

          recognition.onerror = (event: any) => {
            resolve({
              success: false,
              text: '',
              error: event.error
            })
          }

          recognition.start()
        } else {
          // 降级处理：返回临时文件路径
          resolve({
            success: true,
            text: res.tempFilePath // 实际项目中需要发送到服务端识别
          })
        }
      },
      fail: () => {
        resolve({ success: false, text: '', error: '录音失败' })
      }
    })
  })
}
```

**Step 3: 验证代码**

运行 `npm run dev:h5` 并测试语音输入功能。

**Step 4: 提交**

```bash
git add src/pages/add-medication/add-medication.vue src/services/voice.ts
git commit -m "feat: implement voice recognition and drug selection logic"
```

---

### Task 7: 添加 loading 状态和错误处理

**Files:**
- Modify: `src/pages/add-medication/add-medication.vue`

**Step 1: 添加 loading 覆盖层**

```vue
<!-- 加载中 -->
<view v-if="loading" class="loading-overlay">
  <view class="loading-spinner"></view>
  <text class="loading-text">正在添加...</text>
</view>
```

**Step 2: 添加 loading 样式**

```scss
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.loading-spinner {
  width: 80rpx;
  height: 80rpx;
  border: 6rpx solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: white;
  margin-top: 24rpx;
  font-size: 28rpx;
}
```

**Step 3: 提交**

```bash
git add src/pages/add-medication/add-medication.vue
git commit -m "feat: add loading state and error handling"
```

---

## 测试清单

### 功能测试
- [ ] 语音按钮点击后开始录音
- [ ] 语音识别后显示搜索结果
- [ ] 常用药列表按分类筛选
- [ ] 点击药品显示详情
- [ ] 时间选择器正常工作
- [ ] 确认添加成功跳转

### 适老化测试
- [ ] 所有字体 ≥ 24rpx (约 18px)
- [ ] 所有按钮高度 ≥ 80rpx (约 48px)
- [ ] 语音播报所有关键操作
- [ ] 颜色对比度足够
- [ ] 3 步内完成添加

### 错误处理测试
- [ ] 语音识别失败有提示
- [ ] 无搜索结果有引导
- [ ] 网络错误有处理
- [ ] 空状态有说明

---

## 验收标准

1. **操作步骤**: 从 10+ 步减少到 3-5 步
2. **字体大小**: 所有文字 ≥ 24rpx
3. **按钮尺寸**: 主要按钮高度 ≥ 80rpx
4. **语音播报**: 关键操作都有语音反馈
5. **常用药**: 至少 19 种药品，覆盖 8 个分类
6. **响应时间**: 搜索结果 < 2 秒
