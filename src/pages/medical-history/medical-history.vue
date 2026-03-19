<template>
  <view class="history-page">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="h2-title">病史小结</text>
      <text class="sub-title">生成您的就医报告</text>
    </view>

    <!-- 进度指示 -->
    <view class="progress-section">
      <view
        v-for="(question, index) in visibleQuestions"
        :key="question.id"
        class="progress-dot"
        :class="{ active: index <= currentIndex, answered: answers[question.id] }"
      ></view>
    </view>

    <!-- 当前问题 -->
    <view class="question-card card" v-if="currentQuestion">
      <view class="question-header">
        <text class="question-number">问题 {{ currentIndex + 1 }}/{{ totalQuestions }}</text>
        <text class="question-type">{{ getQuestionTypeLabel(currentQuestion.type) }}</text>
      </view>
      <text class="question-text">{{ currentQuestion.question }}</text>

      <!-- 文本输入 -->
      <view v-if="currentQuestion.type === 'text'" class="answer-area">
        <input
          v-model="currentAnswer"
          type="text"
          :placeholder="'请输入' + currentQuestion.question"
          class="input answer-input"
          @confirm="nextQuestion"
        />
      </view>

      <!-- 数字输入 -->
      <view v-else-if="currentQuestion.type === 'number'" class="answer-area">
        <input
          v-model="currentAnswer"
          type="number"
          :placeholder="'请输入数字'"
          class="input answer-input"
          @confirm="nextQuestion"
        />
      </view>

      <!-- 多选输入 -->
      <view v-else-if="currentQuestion.type === 'select'" class="answer-area">
        <view class="option-grid">
          <view
            v-for="option in currentQuestion.options"
            :key="option"
            class="option-btn"
            :class="{ active: currentAnswer === option }"
            @click="selectOption(option)"
          >
            {{ option }}
          </view>
        </view>
      </view>

      <!-- 多行文本 -->
      <view v-else-if="currentQuestion.type === 'textarea'" class="answer-area">
        <textarea
          v-model="currentAnswer"
          :placeholder="'请详细描述'"
          class="input answer-textarea"
        />
      </view>

      <!-- 操作按钮 -->
      <view class="question-actions">
        <button v-if="currentIndex > 0" class="btn btn-outline" @click="prevQuestion">
          上一步
        </button>
        <button class="btn btn-primary" @click="nextQuestion">
          {{ currentIndex === totalQuestions - 1 ? '生成报告' : '下一步' }}
        </button>
      </view>
    </view>

    <!-- 预览报告 -->
    <view v-if="showReport" class="report-card card">
      <view class="report-header">
        <text class="report-title">病史报告</text>
        <text class="report-time">{{ formatDate(new Date().toISOString()) }}</text>
      </view>
      <view class="report-content">
        <text class="report-text">{{ medicalReport }}</text>
      </view>
      <view class="report-actions">
        <button class="btn btn-outline" @click="shareReport">
          <text>📤</text> 分享报告
        </button>
        <button class="btn btn-primary" @click="editReport">
          <text>✏️</text> 继续编辑
        </button>
      </view>
    </view>

    <!-- 底部导航 -->
    <view class="bottom-nav">
      <button class="btn btn-large btn-outline" @click="goBack">
        返回
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useHealthStore, medicalHistoryQuestions } from '@/store/health'
import { speakText } from '@/services/voice'

const healthStore = useHealthStore()

const currentIndex = ref(0)
const currentAnswer = ref('')
const answers = ref<Record<string, string>>({})
const showReport = ref(false)
const medicalReport = ref('')

const visibleQuestions = computed(() => medicalHistoryQuestions)
const totalQuestions = computed(() => visibleQuestions.value.length)
const currentQuestion = computed(() => visibleQuestions.value[currentIndex.value])

// 获取问题类型标签
function getQuestionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    text: '文本',
    number: '数字',
    select: '选择',
    textarea: '详情'
  }
  return labels[type] || '文本'
}

// 选择选项
function selectOption(option: string) {
  currentAnswer.value = option
}

// 上一步
function prevQuestion() {
  if (currentIndex.value > 0) {
    saveCurrentAnswer()
    currentIndex.value--
    currentAnswer.value = answers.value[currentQuestion.value.id] || ''
  }
}

// 下一步
async function nextQuestion() {
  saveCurrentAnswer()

  if (currentIndex.value < totalQuestions.value - 1) {
    currentIndex.value++
    currentAnswer.value = answers.value[currentQuestion.value.id] || ''
  } else {
    // 生成报告
    await generateReport()
  }
}

// 保存当前答案
async function saveCurrentAnswer() {
  if (currentAnswer.value.trim()) {
    answers.value[currentQuestion.value.id] = currentAnswer.value
    await healthStore.saveMedicalHistoryAnswer(
      currentQuestion.value.id,
      currentAnswer.value
    )
  }
}

// 生成报告
async function generateReport() {
  // 更新store中的答案
  for (const [questionId, answer] of Object.entries(answers.value)) {
    await healthStore.saveMedicalHistoryAnswer(questionId, answer)
  }

  // 生成报告文本
  medicalReport.value = healthStore.generateMedicalHistoryReport()
  showReport.value = true

  speakText('报告已生成，您可以查看或分享给医生')
}

// 分享报告
function shareReport() {
  uni.showModal({
    title: '分享报告',
    content: '是否将报告分享给医生？',
    confirmText: '分享',
    success: (res) => {
      if (res.confirm) {
        // 复制到剪贴板
        uni.setClipboardData({
          data: medicalReport.value,
          success: () => {
            uni.showToast({ title: '已复制到剪贴板', icon: 'success' })
          }
        })
      }
    }
  })
}

// 编辑报告
function editReport() {
  showReport.value = false
  currentIndex.value = 0
  currentAnswer.value = answers.value[currentQuestion.value.id] || ''
}

// 返回
function goBack() {
  if (showReport.value) {
    showReport.value = false
  } else {
    uni.navigateBack()
  }
}

// 格式化日期
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

onMounted(async () => {
  // 加载已有答案
  await healthStore.fetchMedicalHistoryAnswers()
  
  const existingAnswers: Record<string, string> = {}
  healthStore.medicalHistoryAnswers.forEach(a => {
    existingAnswers[a.question_id] = a.answer
  })
  answers.value = existingAnswers
  currentAnswer.value = existingAnswers[visibleQuestions.value[0]?.id] || ''
})
</script>

<style lang="scss" scoped>
.history-page {
  min-height: 100vh;
  background: #F5F5F5;
  padding-bottom: 120rpx;
}

.page-header {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  padding: 40rpx 32rpx;
}

.h2-title {
  color: white;
  font-size: 36rpx;
}

.sub-title {
  color: rgba(255, 255, 255, 0.8);
  font-size: 26rpx;
  margin-top: 8rpx;
}

.progress-section {
  display: flex;
  justify-content: center;
  gap: 12rpx;
  padding: 32rpx;
}

.progress-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #E0E0E0;
  transition: all 0.3s;
}

.progress-dot.active {
  background: #2196F3;
}

.progress-dot.answered {
  background: #4CAF50;
}

.card {
  background: white;
  border-radius: 16rpx;
  padding: 28rpx;
  margin: 0 32rpx 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.question-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.question-number {
  font-size: 24rpx;
  color: #2196F3;
  font-weight: 500;
}

.question-type {
  font-size: 24rpx;
  color: #999;
}

.question-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  line-height: 1.5;
  margin-bottom: 32rpx;
}

.answer-area {
  margin-bottom: 32rpx;
}

.answer-input {
  width: 100%;
}

.answer-textarea {
  width: 100%;
  height: 200rpx;
  padding: 16rpx;
  border: 2px solid #E0E0E0;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.option-btn {
  padding: 24rpx;
  background: #F5F5F5;
  border-radius: 12rpx;
  text-align: center;
  font-size: 28rpx;
  color: #666;
  transition: all 0.2s;
}

.option-btn.active {
  background: #E3F2FD;
  color: #2196F3;
  font-weight: 600;
  border: 2px solid #2196F3;
}

.question-actions {
  display: flex;
  gap: 20rpx;
}

.question-actions .btn {
  flex: 1;
}

.report-card {
  margin-top: 40rpx;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.report-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.report-time {
  font-size: 24rpx;
  color: #999;
}

.report-content {
  background: #F5F5F5;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  max-height: 600rpx;
  overflow-y: auto;
}

.report-text {
  font-size: 26rpx;
  color: #333;
  line-height: 1.8;
  white-space: pre-wrap;
}

.report-actions {
  display: flex;
  gap: 20rpx;
}

.report-actions .btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: white;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.08);
}
</style>
