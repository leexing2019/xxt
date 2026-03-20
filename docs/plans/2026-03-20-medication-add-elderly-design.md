# 添加药品功能适老化改造设计

**日期**: 2026-03-20
**状态**: 待实现

---

## 一、背景与目标

### 当前问题
1. 添加方式太多（4 种），老年人选择困难
2. 表单字段过于复杂（10+ 个输入项）
3. 没有大字体、大按钮优化
4. 缺少语音播报反馈
5. 没有常用药快捷选择

### 设计目标
- **极简操作**: 90% 的用户在 3 步内完成添加
- **语音优先**: 支持方言识别，无需打字
- **大字体大按钮**: 符合老年人视觉需求
- **语音播报**: 关键操作都有语音反馈

---

## 二、整体流程

```
┌─────────────────────────────────────────────────────────────┐
│                    添加药品页面（适老版）                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              步骤 1：选择添加方式                     │   │
│  │                                                      │   │
│  │   ┌──────────────┐      ┌──────────────┐            │   │
│  │   │  🎤 语音说药名 │      │  📋 常用药品  │            │   │
│  │   │   (主推)     │      │   (备选)     │            │   │
│  │   └──────────────┘      └──────────────┘            │   │
│  │                                                      │   │
│  │   ┌──────────────┐      ┌──────────────┐            │   │
│  │   │  📷 拍照识别  │      │  ✏️ 手写输入  │            │   │
│  │   │   (新药)     │      │   (辅助)     │            │   │
│  │   └──────────────┘      └──────────────┘            │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              步骤 2：搜索/选择药品                     │   │
│  │                                                      │   │
│  │   - 语音识别后自动搜索                                │   │
│  │   - 展示 3-5 个匹配结果（大卡片）                      │   │
│  │   - 每个结果包含：药名 + 标准图 + 外观描述            │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              步骤 3：确认用药信息                     │   │
│  │                                                      │   │
│  │   - 展示药品详情（大字）                              │   │
│  │   - 语音播报：「您选择的是 XXX，用于降血压」           │   │
│  │   - 询问：「需要拍摄您手上的药片吗？」                │   │
│  │       · 跳过 → 使用药品库标准图（默认）               │   │
│  │       · 拍摄 → 拍照上传（可选）                       │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              步骤 4：设置用药时间                     │   │
│  │                                                      │   │
│  │   - 默认时间：早上 8:00（可修改）                     │   │
│  │   - 快捷选项：「早上」「中午」「晚上」「睡前」        │   │
│  │   - 语音设置：说「每天早上」自动设置 08:00            │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              步骤 5：确认添加                         │   │
│  │                                                      │   │
│  │   - 大按钮：「确认添加」                              │   │
│  │   - 语音播报：「XX 药已添加成功，每天早上 8 点提醒您」  │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、页面结构设计

### 3.1 方式选择区（主界面）

```vue
<view class="method-section">
  <text class="section-title">添加药品</text>
  <text class="section-hint">请选择一种方式</text>

  <view class="method-grid">
    <!-- 语音输入 - 主推，最大卡片 -->
    <view class="method-card primary" @click="selectMethod('voice')">
      <text class="method-icon-large">🎤</text>
      <text class="method-name-large">语音说药名</text>
      <text class="method-desc">说出药品名称，自动搜索</text>
    </view>

    <!-- 常用药品 - 备选 -->
    <view class="method-card" @click="selectMethod('common')">
      <text class="method-icon">📋</text>
      <text class="method-name">常用药品</text>
      <text class="method-desc">高血压/糖尿病等常用药</text>
    </view>

    <!-- 拍照识别 - 新药 -->
    <view class="method-card" @click="selectMethod('camera')">
      <text class="method-icon">📷</text>
      <text class="method-name">拍照识别</text>
      <text class="method-desc">拍摄药盒，适合新药</text>
    </view>

    <!-- 手写输入 - 辅助 -->
    <view class="method-card" @click="selectMethod('handwrite')">
      <text class="method-icon">✏️</text>
      <text class="method-name">手写输入</text>
      <text class="method-desc">手写药名，更准确</text>
    </view>
  </view>
</view>
```

### 3.2 语音输入区

```vue
<view v-if="method === 'voice'" class="voice-input-section">
  <!-- 大按钮，方便点击 -->
  <view class="voice-button" :class="{ recording: isRecording }" @click="toggleRecording">
    <text class="voice-icon">{{ isRecording ? '🔴' : '🎤' }}</text>
  </view>

  <text class="voice-hint">
    {{ isRecording ? '正在听，请说药品名称...' : '点击按钮，说出药品名称' }}
  </text>

  <!-- 识别结果展示 -->
  <view v-if="recognizedText" class="recognized-box">
    <text class="recognized-label">您说的是：</text>
    <text class="recognized-text">{{ recognizedText }}</text>
    <button class="btn-confirm" @click="confirmVoice">是这个药</button>
    <button class="btn-retry" @click="retryVoice">重新说</button>
  </view>
</view>
```

### 3.3 常用药品列表

```vue
<view v-if="method === 'common'" class="common-drugs-section">
  <!-- 分类 Tab -->
  <view class="category-tabs">
    <text class="tab active">全部</text>
    <text class="tab">降压药</text>
    <text class="tab">降糖药</text>
    <text class="tab">降脂药</text>
    <text class="tab">心脏病药</text>
  </view>

  <!-- 药品网格 -->
  <view class="drug-grid">
    <view v-for="drug in commonDrugs" :key="drug.id" class="drug-card" @click="selectDrug(drug)">
      <image :src="drug.image" class="drug-image" />
      <text class="drug-name">{{ drug.name }}</text>
      <text class="drug-usage">{{ drug.usage }}</text>
    </view>
  </view>
</view>
```

### 3.4 搜索结果展示

```vue
<view v-if="searchResults.length > 0" class="search-results-section">
  <text class="result-title">找到 {{ searchResults.length }} 种药品</text>

  <view v-for="(drug, index) in searchResults" :key="index" class="result-card" @click="selectDrug(drug)">
    <view class="result-left">
      <image :src="drug.image" class="result-image" />
    </view>
    <view class="result-right">
      <text class="result-name">{{ drug.name }}</text>
      <text class="result-generic">通用名：{{ drug.genericName }}</text>
      <text class="result-appearance">🔍 {{ drug.appearanceDesc }}</text>
      <text class="result-usage">用于：{{ drug.indications }}</text>
    </view>
  </view>
</view>
```

### 3.5 药品详情确认

```vue
<view v-if="selectedDrug" class="drug-detail-section">
  <text class="detail-title">确认药品信息</text>

  <!-- 药品大图展示 -->
  <view class="drug-preview">
    <image :src="selectedDrug.image" class="preview-image" />
    <button class="btn-camera" @click="openCamera">📷 拍摄我的药片</button>
  </view>

  <!-- 药品信息 -->
  <view class="info-row">
    <text class="info-label">药品名称：</text>
    <text class="info-value">{{ selectedDrug.name }}</text>
  </view>
  <view class="info-row">
    <text class="info-label">外观描述：</text>
    <text class="info-value">{{ selectedDrug.appearanceDesc }}</text>
  </view>
  <view class="info-row">
    <text class="info-label">主要用途：</text>
    <text class="info-value">{{ selectedDrug.indications }}</text>
  </view>

  <!-- 用药时间设置 -->
  <view class="time-section">
    <text class="time-label">什么时候吃药？</text>
    <view class="time-quick-select">
      <text class="time-tag" @click="setTime('08:00')">早上</text>
      <text class="time-tag" @click="setTime('12:00')">中午</text>
      <text class="time-tag" @click="setTime('18:00')">晚上</text>
      <text class="time-tag" @click="setTime('21:00')">睡前</text>
    </view>
    <picker mode="time" :value="selectedTime" @change="onTimeChange">
      <view class="time-picker">{{ selectedTime || '选择具体时间' }}</view>
    </picker>
  </view>

  <!-- 确认按钮 -->
  <button class="btn-confirm-large" @click="confirmAdd">确认添加</button>
</view>
```

---

## 四、常用药品库（预设 50 种）

### 4.1 降压药（10 种）
| 药品名 | 通用名 | 外观描述 | 用途 |
|--------|--------|----------|------|
| 硝苯地平缓释片 | 硝苯地平 | 黄色椭圆形薄膜衣片，长约 12mm | 降血压 |
| 氨氯地平片 | 苯磺酸氨氯地平 | 白色圆形片剂，直径约 9mm | 降血压 |
| 厄贝沙坦片 | 厄贝沙坦 | 白色椭圆形片剂，一面刻有标识 | 降血压 |
| 缬沙坦胶囊 | 缬沙坦 | 蓝白胶囊，内含白色颗粒 | 降血压 |
| 美托洛尔缓释片 | 酒石酸美托洛尔 | 淡黄色圆形片剂 | 降血压/心率 |

### 4.2 降糖药（10 种）
| 药品名 | 通用名 | 外观描述 | 用途 |
|--------|--------|----------|------|
| 二甲双胍片 | 盐酸二甲双胍 | 白色圆形片剂，直径约 10mm | 降血糖 |
| 格列美脲片 | 格列美脲 | 粉红色椭圆形片剂 | 降血糖 |
| 阿卡波糖片 | 阿卡波糖 | 白色类圆形片剂 | 降餐后血糖 |

### 4.3 降脂药（8 种）
| 药品名 | 通用名 | 外观描述 | 用途 |
|--------|--------|----------|------|
| 阿托伐他汀钙片 | 阿托伐他汀 | 白色椭圆形薄膜衣片，长约 14mm | 降胆固醇 |
| 瑞舒伐他汀钙片 | 瑞舒伐他汀 | 粉色圆形片剂 | 降血脂 |

### 4.4 抗血小板药（5 种）
| 药品名 | 通用名 | 外观描述 | 用途 |
|--------|--------|----------|------|
| 阿司匹林肠溶片 | 阿司匹林 | 白色圆形小药片，直径约 8mm，刻有"100" | 预防血栓 |
| 氯吡格雷片 | 硫酸氢氯吡格雷 | 黄色圆形片剂 | 预防血栓 |

### 4.5 其他常用药（17 种）
- 胃药：奥美拉唑、雷贝拉唑
- 止咳药：氨溴索、右美沙芬
- 止痛药：布洛芬、对乙酰氨基酚
- 抗生素：阿莫西林、头孢类
- 维生素：复合维生素、钙片

---

## 五、语音交互设计

### 5.1 语音识别配置
```typescript
// 使用百度语音识别（支持方言）
const speechConfig = {
  lang: 'zh-CN',
  engine: 'baidu', // 或 'iflytek' 讯飞
  dialect: 'mandarin', // 可切换：cantonese, sichuanese, shanghainese
  showTip: true, // 显示语音提示
  vibrate: true, // 震动反馈
};
```

### 5.2 语音播报文本
| 场景 | 播报文本 |
|------|----------|
| 开始识别 | 「正在听，请说药品名称」 |
| 识别成功 | 「您说的是{{药名}}，对吗？」 |
| 找到结果 | 「找到{{数量}}种药品，请查看屏幕选择」 |
| 选择药品 | 「您选择的是{{药名}}，用于{{用途}}」 |
| 设置时间 | 「用药时间设置为{{时间}}，需要修改吗？」 |
| 添加成功 | 「{{药名}}已添加成功，每天{{时间}}提醒您」 |

### 5.3 方言支持
- 默认：普通话
- 可选：粤语、四川话、上海话、河南话
- 切换方式：设置页面选择，或语音说「用粤语」

---

## 六、样式规范（适老化）

### 6.1 字体大小
```scss
$font-size-huge: 36px;    // 主标题
$font-size-extra-large: 28px;  // 次标题/按钮文字
$font-size-large: 22px;   // 正文/卡片标题
$font-size-normal: 18px;  // 辅助说明
$font-size-small: 16px;   // 提示文字（最少使用）
```

### 6.2 按钮尺寸
```scss
$btn-height-large: 64px;  // 主要操作按钮
$btn-height-normal: 48px; // 次要按钮
$btn-min-width: 120px;    // 最小宽度
$btn-border-radius: 12px; // 圆角
```

### 6.3 颜色对比
- 主色：#2196F3（蓝色，高对比度）
- 成功：#4CAF50（绿色）
- 警告：#FF9800（橙色）
- 错误：#F44336（红色）
- 背景：#F5F5F5（浅灰）
- 文字：#333333（深灰，不用纯黑）

### 6.4 间距规范
- 卡片间距：20px
- 卡片内边距：24px
- 元素间距：16px
- 页面边距：16px

---

## 七、错误处理

### 7.1 语音识别失败
| 错误 | 处理 |
|------|------|
| 没听清 | 播报：「没听清楚，请再说一次」+ 显示提示文字 |
| 识别失败 | 播报：「识别失败，试试手写输入吧」+ 自动跳转到手写 |
| 找不到药品 | 播报：「没有找到{{药名}}，试试拍照识别」+ 推荐相似药 |

### 7.2 拍照识别失败
| 错误 | 处理 |
|------|------|
| 图片模糊 | 播报：「照片有点模糊，请重新拍摄」 |
| 识别失败 | 播报：「无法识别，请试试语音输入」 |
| 光线太暗 | 播报：「光线太暗，请开灯后再试」 |

### 7.3 网络错误
| 错误 | 处理 |
|------|------|
| 无网络 | 播报：「没有网络连接，请检查网络设置」+ 显示离线模式提示 |
| 超时 | 播报：「网络超时，请重试」+ 显示重试按钮 |

---

## 八、测试场景

### 8.1 核心场景测试
1. 语音说「阿司匹林」→ 自动搜索 → 选择 → 设置时间 → 添加成功
2. 点击「常用药品」→ 选择「降压药」→ 选择「硝苯地平」→ 添加成功
3. 拍照识别药盒 → 确认信息 → 添加成功

### 8.2 异常场景测试
1. 语音识别失败 → 显示手写输入
2. 搜索无结果 → 推荐常用药
3. 网络断开 → 显示离线提示

### 8.3 适老化测试
1. 字体是否够大（至少 18px）
2. 按钮是否容易点击（最小 48px）
3. 颜色对比度是否足够（WCAG AA 标准）
4. 语音播报是否清晰
5. 操作流程是否简单（3 步内完成）

---

## 九、实现优先级

### 第一阶段（核心功能）
- [ ] 语音输入搜索药品
- [ ] 搜索结果展示（含图片和外观描述）
- [ ] 药品详情确认
- [ ] 用药时间设置
- [ ] 语音播报反馈

### 第二阶段（常用药库）
- [ ] 50 种常用药数据
- [ ] 常用药分类展示
- [ ] 快速选择添加

### 第三阶段（辅助功能）
- [ ] 拍照识别（百度 API）
- [ ] 手写输入
- [ ] 可选拍摄药片

### 第四阶段（优化）
- [ ] 方言支持
- [ ] 离线模式
- [ ] 性能优化

---

## 十、API 配置

### 10.1 百度语音识别
```typescript
const BAIDU_SPEECH_CONFIG = {
  appId: 'YOUR_APP_ID',
  apiKey: 'YOUR_API_KEY',
  secretKey: 'YOUR_SECRET_KEY',
  freeQuota: 50000, // 5 万次/月免费
};
```

### 10.2 百度药品识别（可选）
```typescript
const BAIDU_MEDICINE_OCR_CONFIG = {
  appId: 'YOUR_APP_ID',
  apiKey: 'YOUR_API_KEY',
  secretKey: 'YOUR_SECRET_KEY',
  freeQuota: 500, // 500 次/天免费
};
```

---

## 十一、数据模型

### 11.1 药品数据结构
```typescript
interface Drug {
  id: string;
  name: string;           // 商品名
  genericName: string;    // 通用名
  category: string;       // 分类：降压药/降糖药等
  indications: string;    // 适应症/用途
  appearanceDesc: string; // 外观描述
  image: string;          // 标准图片 URL
  common: boolean;        // 是否常用药
  usage?: string;         // 常用法用量
}
```

### 11.2 用户添加药品数据
```typescript
interface UserMedication {
  id: string;
  drugId: string;         // 关联药品库 ID
  name: string;           // 药品名称（可自定义）
  image_url: string;      // 用户拍摄的图片（可选）
  specification: string;  // 规格
  instructions: string;   // 用法说明
  schedules: Schedule[];  // 用药计划
}
```

---

## 十二、验收标准

1. **操作简化**: 从 10+ 步减少到 3-5 步
2. **语音成功率**: 普通话识别率 > 90%
3. **响应速度**: 搜索结果 < 2 秒
4. **字体大小**: 所有文字 ≥ 18px
5. **按钮尺寸**: 所有可点击区域 ≥ 48px
6. **语音播报**: 所有关键操作都有播报
7. **常用药覆盖**: 50 种药品，覆盖 80% 高频场景
