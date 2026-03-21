# 添加药品页面适老化优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构添加药品页面为三步走流程，集成百度 AI API，创建管理后台

**Architecture:**
- 前端：uni-app + Vue 3 + Pinia，适老化视觉规范（大字体、高对比度、大按钮）
- 后端：Supabase（PostgreSQL + Auth + RLS）
- AI 服务：百度语音识别 API + 百度药品图片识别 API
- 管理后台：独立 admin 路由，与前端共享 Supabase 认证

**Tech Stack:** Vue 3, TypeScript, Pinia, uni-app, Supabase, 百度 AI API

---

## 文件结构映射

### 新增文件
- `src/services/baidu-speech.ts` - 百度语音识别 API 服务
- `src/services/baidu-ocr.ts` - 百度图片识别 API 服务
- `src/services/app-config.ts` - 应用配置读取服务
- `src/pages/admin/index.vue` - 管理后台首页
- `src/pages/admin/medication-list.vue` - 用药计划管理
- `src/pages/admin/stats-report.vue` - 统计报告
- `src/pages/admin/api-config.vue` - API 配置页面
- `src/components/StepIndicator.vue` - 步骤条组件（复用）
- `src/components/VoiceButton.vue` - 语音按钮组件（复用）

### 修改文件
- `src/pages/add-medication/add-medication.vue` - 重构为三步走流程
- `src/services/voice.ts` - 集成百度语音识别
- `src/services/medication.ts` - 集成百度图片识别
- `src/pages/index/index.vue` - 添加多处入口
- `src/pages/settings/settings.vue` - 移除 API 配置 UI
- `sql/schema.sql` - 已更新（新增 admin_users、app_settings、drug_interactions 表）

---

## 实施顺序

优先适老化功能，后管理后台：

1. 数据库迁移（Supabase 执行 SQL）
2. 百度 API 服务集成
3. 添加药品页面重构（三步走）
4. 配置读取服务
5. 管理后台页面
6. 测试与调优

---

## Phase 1: 基础设施

### Task 1: 在 Supabase 执行数据库迁移

**Files:**
- 修改：`sql/schema.sql`（已完成）
- 新增：`sql/init-admin.sql`（已完成）
- 手动操作：在 Supabase SQL Editor 执行脚本

- [ ] **Step 1: 确认 schema.sql 已包含新表**

运行：`git diff sql/schema.sql`
预期：包含 `admin_users`、`app_settings`、`drug_interactions` 表定义

- [ ] **Step 2: 在 Supabase 控制台执行迁移脚本**

操作：
1. 登录 https://supabase.com
2. 进入项目 SQL Editor
3. 复制 `sql/schema.sql` 内容执行
4. 复制 `sql/init-admin.sql` 内容执行（修改默认密码）

预期：所有新表创建成功

- [ ] **Step 3: 验证表创建**

运行：在 Supabase Table Editor 查看新表
预期：`admin_users`、`app_settings`、`drug_interactions` 可见

- [ ] **Step 4: 提交迁移**

```bash
git add sql/
git commit -m "feat(db): 管理后台数据库迁移完成"
```

---

### Task 2: 创建百度语音识别 API 服务

**Files:**
- 新增：`src/services/baidu-speech.ts`
- 修改：`src/services/voice.ts`

- [ ] **Step 1: 创建 baidu-speech.ts**

```typescript
// src/services/baidu-speech.ts
/**
 * 百度语音识别 API 服务
 * 文档：https://ai.baidu.com/ai-doc/SPEECH/wkqrwjv6t
 */

import { getApiConfigFromBackend } from './app-config'

let accessToken: string | null = null
let tokenExpireTime: number = 0

// 获取 access_token
async function getAccessToken(): Promise<string> {
  const now = Date.now()
  if (accessToken && now < tokenExpireTime) {
    return accessToken
  }

  const config = await getApiConfigFromBackend()
  if (!config?.baiduApiKey || !config?.baiduSecretKey) {
    throw new Error('百度 API 配置缺失')
  }

  const response = await fetch(
    `https://openapi.baidu.com/oauth/2.0/token?grant_type=client_credentials&client_id=${config.baiduApiKey}&client_secret=${config.baiduSecretKey}`
  )
  const data = await response.json()

  accessToken = data.access_token
  tokenExpireTime = now + (data.expires_in - 300) * 1000 // 提前 5 分钟过期

  return accessToken
}

// 语音识别（说话方式）
export async function recognizeSpeechBaidu(audioBlob: Blob): Promise<{ text: string }> {
  const token = await getAccessToken()

  // 转换音频为 base64
  const base64Audio = await blobToBase64(audioBlob)

  const response = await fetch(
    `https://vop.baidu.com/server_api?dev_pid=1936&token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        format: 'wav',
        rate: 16000,
        channel: 1,
        cuid: 'medication-app',
        speech: base64Audio,
        len: audioBlob.size
      })
    }
  )

  const result = await response.json()
  if (result.err_no !== 0) {
    throw new Error(result.err_msg)
  }

  return { text: result.result?.[0] || '' }
}

// 工具函数：Blob 转 Base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
```

- [ ] **Step 2: 运行 TypeScript 检查**

```bash
npx tsc --noEmit
```
预期：无错误

- [ ] **Step 3: 提交**

```bash
git add src/services/baidu-speech.ts
git commit -m "feat: 创建百度语音识别 API 服务"
```

---

### Task 3: 创建百度图片识别 API 服务

**Files:**
- 新增：`src/services/baidu-ocr.ts`
- 修改：`src/services/medication.ts`

- [ ] **Step 1: 创建 baidu-ocr.ts**

```typescript
// src/services/baidu-ocr.ts
/**
 * 百度 OCR 图片识别 API 服务
 * 文档：https://ai.baidu.com/ai-doc/OCR/wkqrwjv6t
 */

import { getApiConfigFromBackend } from './app-config'

let accessToken: string | null = null
let tokenExpireTime: number = 0

// 获取 access_token
async function getAccessToken(): Promise<string> {
  const now = Date.now()
  if (accessToken && now < tokenExpireTime) {
    return accessToken
  }

  const config = await getApiConfigFromBackend()
  if (!config?.baiduApiKey || !config?.baiduSecretKey) {
    throw new Error('百度 API 配置缺失')
  }

  const response = await fetch(
    `https://openapi.baidu.com/oauth/2.0/token?grant_type=client_credentials&client_id=${config.baiduApiKey}&client_secret=${config.baiduSecretKey}`
  )
  const data = await response.json()

  accessToken = data.access_token
  tokenExpireTime = now + (data.expires_in - 300) * 1000

  return accessToken
}

// 通用 OCR 识别
export async function recognizeImage(imagePath: string): Promise<{
  name?: string
  specification?: string
  manufacturer?: string
  form?: string
  rawText: string[]
}> {
  const token = await getAccessToken()

  // 读取图片为 base64
  const base64Image = await imageToBase64(imagePath)

  const response = await fetch(
    `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `image=${encodeURIComponent(base64Image)}`
    }
  )

  const result = await response.json()
  if (result.error_code) {
    throw new Error(result.error_msg)
  }

  const words = result.words_result?.map((item: any) => item.words) || []

  // 简单解析药品信息（后续可优化）
  return {
    rawText: words,
    name: extractMedicineName(words),
    specification: extractSpecification(words),
    manufacturer: extractManufacturer(words)
  }
}

// 提取药品名称（简化版）
function extractMedicineName(words: string[]): string | undefined {
  // 匹配常见药品名模式
  const patterns = [
    /(.+?) 片/,
    /(.+?) 胶囊/,
    /(.+?) 口服液/,
    /(.+?) 颗粒/
  ]

  for (const word of words) {
    for (const pattern of patterns) {
      const match = word.match(pattern)
      if (match) return match[1]
    }
  }

  return words[0] // 默认返回第一行
}

// 提取规格
function extractSpecification(words: string[]): string | undefined {
  const patterns = [
    /(\d+\.?\d*(mg|g|ml))/i,
    /(\d+ 片)/,
    /(\d+ 粒)/
  ]

  for (const word of words) {
    for (const pattern of patterns) {
      const match = word.match(pattern)
      if (match) return match[0]
    }
  }

  return undefined
}

// 提取生产厂家
function extractManufacturer(words: string[]): string | undefined {
  const keywords = ['公司', '制药', '药业', '有限公司']
  for (const word of words) {
    if (keywords.some(k => word.includes(k))) {
      return word
    }
  }
  return undefined
}

// 工具函数：图片转 Base64
async function imageToBase64(imagePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.getFileSystemManager().readFile({
      filePath: imagePath,
      encoding: 'base64',
      success: (res: any) => resolve(res.data),
      fail: reject
    })
  })
}
```

- [ ] **Step 2: 修改 medication.ts 集成 OCR**

在 `src/services/medication.ts` 添加：

```typescript
import { recognizeImage as recognizeImageBaidu } from './baidu-ocr'

// 修改 recognizeMedication 函数
export async function recognizeMedication(imagePath: string) {
  try {
    const result = await recognizeImageBaidu(imagePath)
    return {
      name: result.name || '未知药品',
      specification: result.specification || '',
      manufacturer: result.manufacturer || '',
      form: result.rawText.join('\n')
    }
  } catch (error) {
    console.error('药品识别失败:', error)
    throw error
  }
}
```

- [ ] **Step 3: 运行 TypeScript 检查**

```bash
npx tsc --noEmit
```
预期：无错误

- [ ] **Step 4: 提交**

```bash
git add src/services/baidu-ocr.ts src/services/medication.ts
git commit -m "feat: 创建百度 OCR 图片识别服务"
```

---

### Task 4: 创建应用配置读取服务

**Files:**
- 新增：`src/services/app-config.ts`
- 修改：`src/services/api-config.ts`（已存在，需调整）

- [ ] **Step 1: 创建 app-config.ts**

```typescript
// src/services/app-config.ts
/**
 * 应用配置服务 - 从 app_settings 表读取配置
 */

import { supabase } from './supabase'

export interface AppConfig {
  baidu_app_id?: string
  baidu_api_key?: string
  baidu_secret_key?: string
  voice_recognition_enabled?: boolean
  image_recognition_enabled?: boolean
  voice_guidance_enabled?: boolean
  elderly_mode_enabled?: boolean
}

const CACHE_KEY = 'app_config_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 分钟
let lastFetchTime = 0
let cachedConfig: AppConfig | null = null

// 从后端读取配置
export async function fetchAppConfig(): Promise<AppConfig | null> {
  const now = Date.now()
  if (cachedConfig && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedConfig
  }

  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['baidu_api_config', 'app_config'])

    if (error) throw error

    const config: AppConfig = {}

    for (const item of data || []) {
      if (item.key === 'baidu_api_config') {
        const baidu = item.value
        config.baidu_app_id = baidu.app_id
        config.baidu_api_key = baidu.api_key
        config.baidu_secret_key = baidu.secret_key
      } else if (item.key === 'app_config') {
        const app = item.value
        config.voice_recognition_enabled = app.voice_recognition_enabled
        config.image_recognition_enabled = app.image_recognition_enabled
        config.voice_guidance_enabled = app.voice_guidance_enabled
        config.elderly_mode_enabled = app.elderly_mode_enabled
      }
    }

    cachedConfig = config
    lastFetchTime = now

    return config
  } catch (error) {
    console.error('获取配置失败:', error)
    return null
  }
}

// 清除缓存
export function clearAppConfigCache() {
  cachedConfig = null
  lastFetchTime = 0
}
```

- [ ] **Step 2: 修改 api-config.ts 使用 app_settings 表**

将 `getApiConfigFromBackend` 函数改为从 `app_settings` 读取：

```typescript
// 修改 query 为从 app_settings 读取
const { data, error } = await supabase
  .from('app_settings')
  .select('key, value')
  .eq('key', 'baidu_api_config')
  .single()
```

- [ ] **Step 3: 提交**

```bash
git add src/services/app-config.ts src/services/api-config.ts
git commit -m "feat: 创建应用配置服务，从 app_settings 读取"
```

---

## Phase 2: 添加药品页面重构

### Task 5: 重构 add-medication.vue 为三步走流程

**Files:**
- 修改：`src/pages/add-medication/add-medication.vue`

- [ ] **Step 1: 定义新的状态接口**

在组件中添加：

```typescript
interface AddMedicationState {
  currentStep: number           // 1: 选药品，2: 设时间，3: 确认
  selectedMedication: CommonMedication | null
  schedule: {
    time_of_day: string[]
    dosage: string
    instructions: string
    weekdays: number[]
    start_date: string
    end_date?: string
  }
}

const state = reactive<AddMedicationState>({
  currentStep: 1,
  selectedMedication: null,
  schedule: {
    time_of_day: ['08:00'],
    dosage: '1 片',
    instructions: '',
    weekdays: [1, 2, 3, 4, 5, 6, 7],
    start_date: new Date().toISOString().split('T')[0]
  }
})
```

- [ ] **Step 2: 重写 template 为三步结构**

```vue
<template>
  <view class="add-medication-page page-fade-in">
    <!-- 步骤条 -->
    <StepIndicator
      :current-step="state.currentStep"
      :steps="['选择药品', '设置时间', '确认']"
    />

    <!-- 步骤 1: 选择药品 -->
    <view v-if="state.currentStep === 1" class="step-content">
      <!-- 常用药列表、搜索、语音、拍照 -->
    </view>

    <!-- 步骤 2: 设置时间 -->
    <view v-else-if="state.currentStep === 2" class="step-content">
      <!-- 时间选择器、用量输入 -->
    </view>

    <!-- 步骤 3: 确认 -->
    <view v-else-if="state.currentStep === 3" class="step-content">
      <!-- 信息摘要、确认按钮 -->
    </view>

    <!-- 导航按钮 -->
    <view class="nav-buttons">
      <button v-if="state.currentStep > 1" @click="prevStep">上一步</button>
      <button v-if="state.currentStep < 3" @click="nextStep">下一步</button>
      <button v-else @click="confirmAdd">确认添加</button>
    </view>
  </view>
</template>
```

- [ ] **Step 3: 实现步骤切换逻辑**

```typescript
function prevStep() {
  if (state.currentStep > 1) {
    state.currentStep--
    speakText(`第${state.currentStep}步`)
  }
}

function nextStep() {
  if (!validateCurrentStep()) return

  if (state.currentStep < 3) {
    state.currentStep++
    speakText(`第${state.currentStep}步`)
  }
}

function validateCurrentStep(): boolean {
  if (state.currentStep === 1 && !state.selectedMedication) {
    uni.showToast({ title: '请先选择药品', icon: 'none' })
    return false
  }
  if (state.currentStep === 2 && state.schedule.time_of_day.length === 0) {
    uni.showToast({ title: '请设置服用时间', icon: 'none' })
    return false
  }
  return true
}
```

- [ ] **Step 4: 实现确认添加逻辑**

```typescript
async function confirmAdd() {
  if (!state.selectedMedication) return

  loading.value = true

  try {
    // 添加药品
    const medResult = await medicationStore.addMedication({
      name: state.selectedMedication.name,
      generic_name: state.selectedMedication.genericName,
      appearance_desc: state.selectedMedication.appearanceDesc,
      image_url: state.selectedMedication.image
    })

    if (medResult.success && medResult.data) {
      // 添加用药计划
      for (const time of state.schedule.time_of_day) {
        await medicationStore.addSchedule({
          medication_id: medResult.data.id,
          time_of_day: time,
          dosage: state.schedule.dosage,
          instructions: state.schedule.instructions,
          weekdays: state.schedule.weekdays,
          start_date: state.schedule.start_date
        })
      }

      speakText(`${state.selectedMedication.name}已添加成功`)
      uni.showToast({ title: '添加成功', icon: 'success' })

      setTimeout(() => {
        uni.switchTab({ url: '/pages/medication-list/medication-list' })
      }, 1500)
    }
  } catch (error) {
    uni.showToast({ title: '添加失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}
```

- [ ] **Step 5: 提交**

```bash
git add src/pages/add-medication/add-medication.vue
git commit -m "refactor: 重构添加药品页面为三步走流程"
```

---

## Phase 3: 管理后台

### Task 6: 创建管理后台首页

**Files:**
- 新增：`src/pages/admin/index.vue`

- [ ] **Step 1: 创建 admin 目录和首页**

```vue
<!-- src/pages/admin/index.vue -->
<template>
  <view class="admin-page">
    <view class="admin-header">
      <text class="title">用药助手管理后台</text>
    </view>

    <view class="admin-grid">
      <view class="admin-card" @click="goTo('medication-list')">
        <text class="card-icon">💊</text>
        <text class="card-title">用药计划管理</text>
        <text class="card-desc">查看和管理用户用药计划</text>
      </view>

      <view class="admin-card" @click="goTo('stats-report')">
        <text class="card-icon">📊</text>
        <text class="card-title">统计报告</text>
        <text class="card-desc">用药依从性统计</text>
      </view>

      <view class="admin-card" @click="goTo('api-config')">
        <text class="card-icon">⚙️</text>
        <text class="card-title">API 配置</text>
        <text class="card-desc">百度 API 密钥配置</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
function goTo(page: string) {
  uni.navigateTo({ url: `/pages/admin/${page}` })
}
</script>
```

- [ ] **Step 2: 提交**

```bash
git add src/pages/admin/index.vue
git commit -m "feat: 创建管理后台首页"
```

---

## 测试计划

### Task 7: 测试验证

- [ ] **Step 1: 手动测试三步走流程**
- [ ] **Step 2: 测试语音识别**
- [ ] **Step 3: 测试图片识别**
- [ ] **Step 4: 测试管理后台 CRUD**
- [ ] **Step 5: 提交测试报告**

---

## 验收标准

- [ ] 老年人可在 3 分钟内完成药品添加
- [ ] 语音识别准确率 > 85%（常用药名）
- [ ] 图片识别可提取药品名称
- [ ] 管理后台可正常 CRUD 用药计划
- [ ] 统计报告图表正确显示
- [ ] API 配置可动态更新
- [ ] 所有页面无严重 Bug
