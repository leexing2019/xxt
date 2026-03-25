<template>
  <view class="report-page">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="h2-title">病史报告</text>
      <text class="sub-title">{{ reportDate }}</text>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <view class="loading-spinner"></view>
      <text class="loading-text">正在加载报告...</text>
    </view>

    <!-- 错误状态 -->
    <view v-else-if="error" class="error-state">
      <text class="error-icon">!</text>
      <text class="error-text">{{ error }}</text>
      <button class="btn btn-primary" @click="retryLoad">重新加载</button>
    </view>

    <!-- 报告内容 -->
    <view v-else class="report-content">
      <view class="card">
        <!-- 基本信息 -->
        <view class="section">
          <text class="section-title">基本信息</text>
          <view class="info-grid">
            <view class="info-item">
              <text class="info-label">姓名：</text>
              <text class="info-value">{{ report.name || '未填写' }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">年龄：</text>
              <text class="info-value">{{ report.age ? report.age + '岁' : '未填写' }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">性别：</text>
              <text class="info-value">{{ report.gender || '未填写' }}</text>
            </view>
          </view>
        </view>

        <!-- 主诉 -->
        <view v-if="report.chief_complaint" class="section">
          <text class="section-title">主诉</text>
          <text class="section-content">{{ report.chief_complaint }}</text>
        </view>

        <!-- 症状描述 -->
        <view v-if="report.symptoms_description" class="section">
          <text class="section-title">症状描述</text>
          <view class="content-block">
            <text class="content-label">持续时间：</text>
            <text class="content-value">{{ report.symptoms_duration || '未填写' }}</text>
          </view>
          <text class="section-content">{{ report.symptoms_description }}</text>
        </view>

        <!-- 当前用药 -->
        <view v-if="report.current_medications" class="section">
          <text class="section-title">当前用药</text>
          <text class="section-content">{{ report.current_medications }}</text>
        </view>

        <!-- 药物过敏史 -->
        <view v-if="report.allergies" class="section">
          <text class="section-title">药物过敏史</text>
          <text class="section-content">{{ report.allergies }}</text>
        </view>

        <!-- 慢性病史 -->
        <view v-if="report.chronic_diseases" class="section">
          <text class="section-title">慢性病史</text>
          <text class="section-content">{{ report.chronic_diseases }}</text>
        </view>

        <!-- 手术史 -->
        <view v-if="report.previous_surgeries" class="section">
          <text class="section-title">手术史</text>
          <text class="section-content">{{ report.previous_surgeries }}</text>
        </view>

        <!-- 家族史 -->
        <view v-if="report.family_history" class="section">
          <text class="section-title">家族史</text>
          <text class="section-content">{{ report.family_history }}</text>
        </view>

        <!-- 近期检查 -->
        <view v-if="report.recent_checkups" class="section">
          <text class="section-title">近期检查结果</text>
          <text class="section-content">{{ report.recent_checkups }}</text>
        </view>

        <!-- 生活习惯 -->
        <view v-if="report.lifestyle" class="section">
          <text class="section-title">生活习惯</text>
          <text class="section-content">{{ report.lifestyle }}</text>
        </view>
      </view>

      <!-- 底部操作 -->
      <view class="bottom-actions">
        <button class="btn btn-outline" @click="shareReport">
          <text class="btn-icon">📤</text>
          <text class="btn-label">分享</text>
        </button>
        <button class="btn btn-primary" @click="printReport">
          <text class="btn-icon">🖨️</text>
          <text class="btn-label">保存/打印</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const loading = ref(true)
const error = ref('')
const reportDate = ref('')
const report = ref<Record<string, any>>({})

// 解析 URL 参数
function parseUrlParams(): string | null {
  // #ifdef H5
  const params = new URLSearchParams(window.location.search)
  return params.get('data')
  // #endif

  // #ifndef H5
  // 小程序和 App 端使用 getCurrentPages 获取页面参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  return currentPage.options?.data || null
  // #endif
}

// 解码报告数据
function decodeReportData(encodedData: string): Record<string, any> | null {
  try {
    const decoded = decodeURIComponent(encodedData)
    return JSON.parse(decoded)
  } catch (e) {
    console.error('解析报告数据失败:', e)
    return null
  }
}

// 加载报告
function loadReport() {
  const encodedData = parseUrlParams()

  if (!encodedData) {
    error.value = '未找到报告数据'
    loading.value = false
    return
  }

  const data = decodeReportData(encodedData)

  if (!data) {
    error.value = '报告数据格式错误'
    loading.value = false
    return
  }

  // 提取报告内容
  if (data.report) {
    // 从 report 文本中解析结构化数据
    parseReportText(data.report)
  } else if (data.answers) {
    // 直接从 answers 构建报告对象
    report.value = {
      name: data.answers.name,
      age: data.answers.age,
      gender: data.answers.gender,
      chief_complaint: data.answers.chief_complaint,
      symptoms_duration: data.answers.symptoms_duration,
      symptoms_description: data.answers.symptoms_description,
      current_medications: data.answers.current_medications,
      allergies: data.answers.allergies,
      chronic_diseases: data.answers.chronic_diseases,
      previous_surgeries: data.answers.previous_surgeries,
      family_history: data.answers.family_history,
      recent_checkups: data.answers.recent_checkups,
      lifestyle: data.answers.lifestyle
    }
  }

  // 设置日期
  if (data.date) {
    const date = new Date(data.date)
    reportDate.value = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  } else {
    reportDate.value = new Date().toLocaleDateString('zh-CN')
  }

  loading.value = false
}

// 从报告文本中解析数据
function parseReportText(reportText: string) {
  const lines = reportText.split('\n')
  const parsed: Record<string, any> = {}

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (line.startsWith('姓名：')) {
      parsed.name = line.replace('姓名：', '')
    } else if (line.startsWith('年龄：')) {
      parsed.age = line.replace('年龄：', '').replace('岁', '')
    } else if (line.startsWith('性别：')) {
      parsed.gender = line.replace('性别：', '')
    } else if (line.startsWith('【主诉】')) {
      parsed.chief_complaint = lines[++i]?.trim() || ''
    } else if (line.startsWith('【症状描述】')) {
      const symptomsBlock = []
      i++
      while (i < lines.length && lines[i].trim() && !lines[i].startsWith('[') && !lines[i].startsWith('===')) {
        symptomsBlock.push(lines[i].trim())
        i++
      }
      i--
      parsed.symptoms_description = symptomsBlock.join('\n')
    } else if (line.startsWith('【当前用药】')) {
      parsed.current_medications = lines[++i]?.trim() || ''
    } else if (line.startsWith('【药物过敏史】')) {
      parsed.allergies = lines[++i]?.trim() || ''
    } else if (line.startsWith('【慢性病史】')) {
      parsed.chronic_diseases = lines[++i]?.trim() || ''
    } else if (line.startsWith('【手术史】')) {
      parsed.previous_surgeries = lines[++i]?.trim() || ''
    } else if (line.startsWith('【家族史】')) {
      parsed.family_history = lines[++i]?.trim() || ''
    } else if (line.startsWith('【近期检查结果】')) {
      parsed.recent_checkups = lines[++i]?.trim() || ''
    } else if (line.startsWith('【生活习惯】')) {
      parsed.lifestyle = lines[++i]?.trim() || ''
    }
  }

  report.value = parsed
}

// 重新加载
function retryLoad() {
  error.value = ''
  loading.value = true
  loadReport()
}

// 分享报告
function shareReport() {
  // #ifdef H5
  const currentUrl = window.location.href
  if (navigator.share) {
    navigator.share({
      title: '病史报告',
      text: report.value.name ? `${report.value.name}的病史报告` : '病史报告',
      url: currentUrl
    })
  } else {
    // 复制链接到剪贴板
    navigator.clipboard.writeText(currentUrl)
    uni.showToast({ title: '链接已复制', icon: 'success' })
  }
  // #endif

  // #ifndef H5
  uni.showShareMenu()
  // #endif
}

// 打印/保存报告
function printReport() {
  // #ifdef H5
  window.print()
  // #endif

  // #ifndef H5
  uni.showModal({
    title: '保存报告',
    content: '您可以截图保存或使用分享功能保存报告',
    confirmText: '我知道了'
  })
  // #endif
}

onMounted(() => {
  loadReport()
})
</script>

<style lang="scss" scoped>
.report-page {
  min-height: 100vh;
  background: #F5F5F5;
  padding-bottom: 40rpx;
}

.page-header {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  padding: 40rpx 32rpx;
  text-align: center;
}

.h2-title {
  color: white;
  font-size: 36rpx;
  font-weight: 700;
  display: block;
}

.sub-title {
  color: rgba(255, 255, 255, 0.8);
  font-size: 24rpx;
  margin-top: 8rpx;
  display: block;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
}

.loading-spinner {
  width: 64rpx;
  height: 64rpx;
  border: 6px solid #E0E0E0;
  border-top: 6px solid #2196F3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 24rpx;
  font-size: 28rpx;
  color: #999;
}

/* 错误状态 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  background: white;
  border-radius: 16rpx;
  margin: 32rpx;
}

.error-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: #FFEBEE;
  color: #E53935;
  font-size: 48rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}

.error-text {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 32rpx;
}

/* 报告内容 */
.report-content {
  padding: 32rpx 0;
}

.card {
  background: white;
  border-radius: 16rpx;
  padding: 28rpx;
  margin: 0 32rpx 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.section {
  margin-bottom: 32rpx;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #E0E0E0;

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #2196F3;
  margin-bottom: 16rpx;
  display: block;
}

.section-content {
  font-size: 28rpx;
  color: #333;
  line-height: 1.8;
  display: block;
  white-space: pre-wrap;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.info-label {
  font-size: 24rpx;
  color: #999;
}

.info-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.content-block {
  margin-bottom: 12rpx;
}

.content-label {
  font-size: 26rpx;
  color: #666;
}

.content-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

/* 底部操作 */
.bottom-actions {
  display: flex;
  gap: 20rpx;
  padding: 0 32rpx;
  margin-top: 24rpx;
}

.bottom-actions .btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 16rpx 24rpx;
  min-height: 48rpx;
  font-size: 28rpx;
  border-radius: 12rpx;
}

.btn-icon {
  font-size: 32rpx;
}

/* 打印样式 */
@media print {
  .bottom-actions {
    display: none;
  }

  .page-header {
    background: white;
    color: black;
  }

  .h2-title, .sub-title {
    color: black;
  }
}
</style>
