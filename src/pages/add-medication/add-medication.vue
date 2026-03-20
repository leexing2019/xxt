<template>
  <view class="add-medication-page">
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
    <!-- AI识别区域 -->
    <view v-if="selectedMethod === 'camera'" class="scan-area">
      <view class="camera-preview" @click="openCamera">
        <image v-if="capturedImage" :src="capturedImage" mode="aspectFit" class="preview-image" />
        <view v-else class="camera-placeholder">
          <text class="placeholder-icon">📷</text>
          <text class="placeholder-text">点击拍摄药盒</text>
        </view>
      </view>

      <view v-if="recognizedData" class="recognized-result">
        <view class="result-header">
          <text class="h3-title">识别结果</text>
          <text class="confidence">置信度 {{ confidence }}%</text>
        </view>
        <view class="result-item">
          <text class="result-label">药品名称</text>
          <text class="result-value">{{ recognizedData.name }}</text>
        </view>
        <view class="result-item">
          <text class="result-label">规格</text>
          <text class="result-value">{{ recognizedData.specification }}</text>
        </view>
        <view class="result-item">
          <text class="result-label">生产厂家</text>
          <text class="result-value">{{ recognizedData.manufacturer }}</text>
        </view>
        <view class="result-actions">
          <button class="btn btn-outline" @click="resetScan">重新拍摄</button>
          <button class="btn btn-primary" @click="confirmMedication">确认添加</button>
        </view>
      </view>
    </view>

    <!-- 处方识别区域 -->
    <view v-if="selectedMethod === 'prescription'" class="scan-area">
      <view class="camera-preview" @click="openPrescriptionCamera">
        <view v-if="prescriptionImage" class="preview-container">
          <image :src="prescriptionImage" mode="aspectFit" class="preview-image" />
        </view>
        <view v-else class="camera-placeholder">
          <text class="placeholder-icon">📋</text>
          <text class="placeholder-text">拍摄处方照片</text>
        </view>
      </view>

      <view v-if="prescriptionData" class="recognized-result">
        <view class="result-header">
          <text class="h3-title">处方识别结果</text>
        </view>
        <view v-for="(med, index) in prescriptionData.medications" :key="index" class="prescription-item">
          <text class="med-item-name">{{ med.name }}</text>
          <text class="med-item-detail">{{ med.dosage }} · {{ med.frequency }}</text>
          <text class="med-item-duration">服用{{ med.duration }}</text>
        </view>
        <view class="result-actions">
          <button class="btn btn-outline" @click="resetPrescription">重新拍摄</button>
          <button class="btn btn-primary" @click="importPrescription">全部导入</button>
        </view>
      </view>
    </view>

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

    <!-- 手动搜索区域 -->
    <!-- 手动搜索区域 -->
    <view v-if="selectedMethod === 'search'" class="search-area">
      <view class="search-input-wrapper">
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="输入药品名称搜索"
          class="input search-input"
          @confirm="searchDrug"
        />
        <button class="btn btn-primary search-btn" @click="searchDrug">搜索</button>
      </view>

      <view v-if="searchResults.length > 0" class="search-results">
        <view
          v-for="drug in searchResults"
          :key="drug.name"
          class="drug-item"
          @click="selectDrug(drug)"
        >
          <text class="drug-name">{{ drug.name }}</text>
          <text class="drug-generic">{{ drug.genericName }}</text>
          <text class="drug-indication">{{ drug.indications }}</text>
        </view>
      </view>
    </view>


    <!-- 药品详情确认 -->
    <view v-if="selectedDrug" class="drug-detail-section">
      <view class="detail-header">
        <text class="detail-title">确认药品信息</text>
        <button class="btn-close" @click="closeDetail">×</button>
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

    <!-- 药品信息表单 -->
    <view v-if="showForm" class="medication-form">
      <view class="form-header">
        <text class="h3-title">{{ isEditing ? '编辑药品' : '完善药品信息' }}</text>
      </view>

      <!-- 药品封面上传 -->
      <view class="form-group">
        <text class="input-label">药品封面</text>
        <view class="image-upload-area">
          <view v-if="coverImage" class="uploaded-image-wrapper">
            <image :src="coverImage" mode="aspectFill" class="uploaded-image" />
            <text class="remove-image" @click="removeCoverImage">×</text>
          </view>
          <view v-else class="upload-placeholder" @click="uploadCoverImage">
            <text class="upload-icon">📷</text>
            <text class="upload-text">点击拍摄封面</text>
          </view>
        </view>
      </view>

      <!-- 药品照片上传 -->
      <view class="form-group">
        <text class="input-label">药品照片</text>
        <view class="image-upload-grid">
          <view v-for="(img, index) in medicationImages" :key="index" class="uploaded-image-wrapper">
            <image :src="img" mode="aspectFill" class="uploaded-image small" />
            <text class="remove-image" @click="removeMedicationImage(index)">×</text>
          </view>
          <view v-if="medicationImages.length < 6" class="upload-placeholder small" @click="uploadMedicationPhoto">
            <text class="upload-icon">+</text>
            <text class="upload-text">添加照片</text>
          </view>
        </view>
      </view>

      <view class="form-group">
        <text class="input-label">药品名称 *</text>
        <input v-model="formData.name" type="text" placeholder="请输入药品名称" class="input" />
      </view>

      <view class="form-group">
        <text class="input-label">通用名</text>
        <input v-model="formData.generic_name" type="text" placeholder="请输入通用名" class="input" />
      </view>

      <view class="form-group">
        <text class="input-label">规格</text>
        <input v-model="formData.specification" type="text" placeholder="如:50mg × 30 片" class="input" />
      </view>

      <view class="form-group">
        <text class="input-label">药品类型</text>
        <picker :value="formTypes.indexOf(formData.form)" :range="formTypes" @change="onFormChange">
          <view class="input picker-value">
            {{ formData.form || '请选择' }}
          </view>
        </picker>
      </view>

      <view class="form-group">
        <text class="input-label">生产厂家</text>
        <input v-model="formData.manufacturer" type="text" placeholder="请输入生产厂家" class="input" />
      </view>

      <view class="form-group">
        <text class="input-label">药品外观描述</text>
        <input v-model="formData.appearance_desc" type="text" placeholder="如：白色圆形药片" class="input" />
      </view>

      <view class="form-group">
        <text class="input-label">用药提醒时间</text>
        <view class="time-inputs">
          <view v-for="(time, index) in formData.times" :key="index" class="time-row">
            <picker mode="time" :value="time" @change="(e: any) => onTimeChangeWithIndex(e, index)">
              <view class="input time-picker">{{ time || '选择时间' }}</view>
            </picker>
            <text v-if="formData.times.length > 1" class="remove-time" @click="removeTime(index)">×</text>
</view>
          <button class="btn btn-outline add-time-btn" @click="addTime">+ 添加时间</button>
        </view>
      </view>

      <view class="form-group">
        <text class="input-label">用法说明</text>
        <textarea v-model="formData.instructions" placeholder="如：饭后半小时服用" class="input textarea" />
      </view>

      <view class="form-actions">
        <button class="btn btn-outline" @click="cancelForm">取消</button>
        <button class="btn btn-primary" :disabled="!formData.name" @click="submitForm">保存药品</button>
      </view>
    </view>

    <!-- 加载中-->
    <view v-if="loading" class="loading-overlay">
      <view class="loading-spinner"></view>
      <text class="loading-text">{{ loadingText }}</text>
    </view>
  </view>
</template>


<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useMedicationStore } from '@/store/medication'
import { useAuthStore } from '@/store/auth'
import { recognizeMedication, recognizePrescription, searchDrug as searchDrugApi } from '@/services/medication'
import { recognizeSpeech, speakText } from '@/services/voice'
import { uploadMedicationImage } from '@/services/storage'
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
const capturedImage = ref('')
const prescriptionImage = ref('')
const recognizedData = ref<any>(null)
const prescriptionData = ref<any>(null)
const confidence = ref(0)
const voiceText = ref('')
const recognizedText = ref('')
const isRecording = ref(false)
const searchKeyword = ref('')
const searchResults = ref<CommonMedication[]>([])
const showForm = ref(false)
const isEditing = ref(false)
const loading = ref(false)
const loadingText = ref('')
const coverImage = ref('')
const medicationImages = ref<string[]>([])

// 常用药状态
const activeCategory = ref('all')

// 分类列表
const categories = MEDICATION_CATEGORIES

// 筛选后的常用药
const filteredDrugs = computed(() => {
  return getMedicationsByCategory(activeCategory.value)
})

// 药品类型
const formTypes = ['片剂', '胶囊', '口服液', '颗粒', '注射液', '外用药', '贴剂', '其他']

// 表单数据
const formData = reactive({
  name: '',
  generic_name: '',
  specification: '',
  form: '',
  manufacturer: '',
  appearance_desc: '',
  instructions: '',
  image_url: '',
  times: ['08:00']
})

// 选择添加方式
function selectMethod(method: string) {
  selectedMethod.value = method
  showForm.value = false
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
  selectedTime.value = '08:00'
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

// 格式化时间显示
function formatTime(time: string): string {
  const [hour] = time.split(':')
  const h = parseInt(hour)
  if (h < 6) return '凌晨'
  if (h < 10) return '早上'
  if (h < 14) return '中午'
  if (h < 18) return '下午'
  if (h < 21) return '晚上'
  return '睡前'
}

// 确认添加
async function confirmAdd() {
  if (!selectedDrug.value) return

  loading.value = true
  loadingText.value = '正在添加...'

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

// 重置状态
function resetState() {
  selectedMethod.value = ''
  selectedDrug.value = null
  selectedTime.value = ''
  recognizedText.value = ''
  searchResults.value = []
}

// 打开相机
function openCamera() {
  uni.chooseImage({
    count: 1,
    sourceType: ['camera'],
    success: async (res) => {
      capturedImage.value = res.tempFilePaths[0]
      await processImage(res.tempFilePaths[0])
    }
  })
}

// 处理图片识别
async function processImage(imagePath: string) {
  loading.value = true
  loadingText.value = '正在识别药品...'

  try {
    const result = await recognizeMedication(imagePath)
    recognizedData.value = result
    confidence.value = 85 + Math.floor(Math.random() * 15) // 模拟置信度
    // 填充表单
    formData.name = result.name || ''
    formData.specification = result.specification || ''
    formData.manufacturer = result.manufacturer || ''
    formData.appearance_desc = result.form || ''
    formData.image_url = imagePath

    speakText(`识别成功{result.name}，请确认是否添加`)
  } catch (error) {
    uni.showToast({ title: '识别失败，请重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 确认添加药品
function confirmMedication() {
  showForm.value = true
}

// 重置扫描
function resetScan() {
  capturedImage.value = ''
  recognizedData.value = null
  selectedMethod.value = ''
}

// 处方相机
function openPrescriptionCamera() {
  uni.chooseImage({
    count: 1,
    sourceType: ['camera'],
    success: async (res) => {
      prescriptionImage.value = res.tempFilePaths[0]
      await processPrescription(res.tempFilePaths[0])
    }
  })
}

// 处理处方识别
async function processPrescription(imagePath: string) {
  loading.value = true
  loadingText.value = '正在识别处方...'

  try {
    const result = await recognizePrescription(imagePath)
    prescriptionData.value = result
    speakText(`识别成功{result.medications.length}种药品`)
  } catch (error) {
    uni.showToast({ title: '识别失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 导入处方药品
async function importPrescription() {
  if (!prescriptionData.value) return

  for (const med of prescriptionData.value.medications) {
    formData.name = med.name
    formData.specification = med.dosage
    formData.instructions = `${med.frequency}，服用{med.duration}`
    await submitForm()
  }

  uni.showToast({ title: '已导入全部药品', icon: 'success' })
  setTimeout(() => {
    uni.switchTab({ url: '/pages/medication-list/medication-list' })
  }, 1500)
}

// 重置处方
function resetPrescription() {
  prescriptionImage.value = ''
  prescriptionData.value = null
  selectedMethod.value = ''
}

// 语音输入
async function startVoiceInput() {
  if (isRecording.value) return

  isRecording.value = true
  speakText('请说出药品名称')

  setTimeout(async () => {
    const result = await recognizeSpeech()
    isRecording.value = false

    if (result.success && result.text) {
      voiceText.value = result.text
      searchKeyword.value = result.text
      await searchDrugApiFromVoice(result.text)
    } else {
      speakText('没有识别到声音，请重说')
    }
  }, 2000)
}

// 语音搜索药品
async function searchDrugApiFromVoice(keyword: string) {
  loading.value = true
  loadingText.value = '搜索中..'

  try {
    const results = await searchDrugApi(keyword)
    if (results.length > 0) {
      searchResults.value = results
      selectDrug(results[0])
    } else {
      uni.showToast({ title: '未找到相关药品', icon: 'none' })
    }
  } catch (error) {
    uni.showToast({ title: '搜索失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 搜索药品
async function searchDrug() {
  if (!searchKeyword.value.trim()) {
    uni.showToast({ title: '请输入药品名称', icon: 'none' })
    return
  }

  loading.value = true
  loadingText.value = '搜索中..'

  try {
    const results = await searchDrugApi(searchKeyword.value)
    searchResults.value = results

    if (results.length === 0) {
      // 未找到，直接进入手动输入
      formData.name = searchKeyword.value
      showForm.value = true
    }
  } catch (error) {
    uni.showToast({ title: '搜索失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 选择药品
function selectDrug(drug: any) {
  formData.name = drug.name
  formData.generic_name = drug.genericName
  formData.instructions = drug.dosage
  formData.appearance_desc = drug.form || ''
  showForm.value = true
}

// 时间选择
function onTimeChangeWithIndex(e: any, index: number) {
  formData.times[index] = e.detail.value
}

function addTime() {
  if (formData.times.length < 6) {
    formData.times.push('12:00')
  }
}

function removeTime(index: number) {
  formData.times.splice(index, 1)
}

// 上传封面图片
async function uploadCoverImage() {
  uni.chooseImage({
    count: 1,
    sourceType: ['camera', 'album'],
    success: async (res) => {
      const tempFilePath = res.tempFilePaths[0]
      coverImage.value = tempFilePath

      // 上传到云端
      if (authStore.userId) {
        try {
          const file = await urlToFile(tempFilePath, 'cover.jpg')
          const publicUrl = await uploadMedicationImage(file, authStore.userId)
          formData.image_url = publicUrl
        } catch (error) {
          console.error('上传封面失败:', error)
        }
      }
    }
  })
}

// 移除封面图片
function removeCoverImage() {
  coverImage.value = ''
  formData.image_url = ''
}

// 上传药品照片
async function uploadMedicationPhoto() {
  uni.chooseImage({
    count: 1,
    sourceType: ['camera', 'album'],
    success: async (res) => {
      const tempFilePath = res.tempFilePaths[0]
      medicationImages.value.push(tempFilePath)

      // 上传到云端（可选）
      if (authStore.userId) {
        try {
          const file = await urlToFile(tempFilePath, `med_${medicationImages.value.length}.jpg`)
          await uploadMedicationImage(file, authStore.userId)
        } catch (error) {
          console.error('上传照片失败:', error)
        }
      }
    }
  })
}

// 移除药品照片
function removeMedicationImage(index: number) {
  medicationImages.value.splice(index, 1)
}

// URL 加载图片为File 对象
async function urlToFile(url: string, filename: string): Promise<File> {
  const response = await uni.request({ url, responseType: 'arraybuffer' })
  const blob = new Blob([response.data])
  return new File([blob], filename, { type: blob.type })
}

// 药品类型选择
function onFormChange(e: any) {
  formData.form = formTypes[e.detail.value]
}

// 取消表单
function cancelForm() {
  showForm.value = false
  selectedMethod.value = ''
  resetForm()
}

// 重置表单
function resetForm() {
  formData.name = ''
  formData.generic_name = ''
  formData.specification = ''
  formData.form = ''
  formData.manufacturer = ''
  formData.appearance_desc = ''
  formData.instructions = ''
  formData.image_url = ''
  formData.times = ['08:00']
}

// 提交表单
async function submitForm() {
  if (!formData.name.trim()) {
    uni.showToast({ title: '请输入药品名称', icon: 'none' })
    return
  }

  loading.value = true
  loadingText.value = '保存中..'

  try {
    // 添加药品
    const result = await medicationStore.addMedication({
      name: formData.name,
      generic_name: formData.generic_name,
      specification: formData.specification,
      form: formData.form,
      manufacturer: formData.manufacturer,
      appearance_desc: formData.appearance_desc,
      image_url: formData.image_url
    })

    if (result.success && result.data) {
      // 添加用药计划
      for (const time of formData.times) {
        await medicationStore.addSchedule({
          medication_id: result.data.id,
          time_of_day: time,
          dosage: '1 片',
          instructions: formData.instructions,
          weekdays: [1, 2, 3, 4, 5, 6, 7],
          start_date: new Date().toISOString().split('T')[0]
        })
      }

      speakText(`${formData.name}已添加成功`)
      uni.showToast({ title: '添加成功', icon: 'success' })

      setTimeout(() => {
        resetForm()
        showForm.value = false
        selectedMethod.value = ''
        uni.switchTab({ url: '/pages/medication-list/medication-list' })
      }, 1500)
    } else {
      uni.showToast({ title: result.error || '添加失败', icon: 'none' })
    }
  } catch (error) {
    uni.showToast({ title: '添加失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.add-medication-page {
  min-height: 100vh;
  background: #F5F5F5;
  padding: 32rpx;
}

.method-selection {
  margin-bottom: 32rpx;
}

.section-title {
  margin-bottom: 24rpx;
}

.section-hint {
  font-size: 24rpx;
  color: #999;
  margin-left: 16rpx;
}

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
}

.method-card:active {
  transform: scale(0.96);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.12);
}

.method-card.primary {
  grid-column: span 2;
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
}

// ===== 语音输入区域样式 =====
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

.scan-area {
  margin-bottom: 32rpx;
}

.camera-preview {
  height: 400rpx;
  background: #1a1a1a;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.camera-placeholder {
  text-align: center;
}

.placeholder-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 16rpx;
}

.placeholder-text {
  color: #999;
  font-size: 28rpx;
}

.recognized-result {
  background: white;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-top: 20rpx;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.confidence {
  font-size: 24rpx;
  color: #4CAF50;
}

.result-item {
  display: flex;
  padding: 12rpx 0;
  border-bottom: 1px solid #f0f0f0;
}

.result-label {
  color: #999;
  width: 160rpx;
}

.result-value {
  flex: 1;
  color: #333;
}

.result-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 24rpx;
}

.prescription-item {
  padding: 16rpx;
  background: #F5F5F5;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
}

.med-item-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.med-item-detail {
  font-size: 26rpx;
  color: #666;
  margin-top: 6rpx;
}

.med-item-duration {
  font-size: 24rpx;
  color: #2196F3;
  margin-top: 6rpx;
}

.voice-area {
  text-align: center;
  padding: 60rpx 0;
}

.voice-animation {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  background: #E3F2FD;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 32rpx;
}

.voice-circle {
  font-size: 80rpx;
}

.voice-animation.recording {
  animation: pulse 1s infinite;
  background: #FFEBEE;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.voice-hint {
  font-size: 28rpx;
  color: #666;
}

.voice-result {
  display: block;
  margin-top: 24rpx;
  font-size: 32rpx;
  color: #2196F3;
  font-weight: 500;
}

// ===== 常用药品区域样式 =====
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

.search-area {
  margin-bottom: 32rpx;
}

.search-input-wrapper {
  display: flex;
  gap: 16rpx;
}

.search-input {
  flex: 1;
}

.search-btn {
  padding: 0 32rpx;
}

.search-results {
  margin-top: 20rpx;
}

.drug-item {
  background: white;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.drug-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.drug-generic {
  font-size: 26rpx;
  color: #666;
  margin-top: 6rpx;
}

.drug-indication {
  font-size: 24rpx;
  color: #999;
  margin-top: 6rpx;
}

// ===== 药品详情确认组件样式 =====
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

.medication-form {
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
}

.form-header {
  margin-bottom: 32rpx;
}

.form-group {
  margin-bottom: 28rpx;
}

.image-upload-area {
  margin-top: 12rpx;
}

.upload-placeholder {
  width: 200rpx;
  height: 200rpx;
  background: #F5F5F5;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2rpx dashed #E0E0E0;
  transition: all 0.2s;

  &.small {
    width: 160rpx;
    height: 160rpx;
  }

  &:active {
    background: #EEEEEE;
    border-color: var(--primary-color);
  }
}

.upload-icon {
  font-size: 48rpx;
  color: #999;
  margin-bottom: 8rpx;

  &.small {
    font-size: 32rpx;
  }
}

.upload-text {
  font-size: 24rpx;
  color: #999;
}

.uploaded-image-wrapper {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  overflow: hidden;

  &.small {
    width: 160rpx;
    height: 160rpx;
  }
}

.uploaded-image {
  width: 100%;
  height: 100%;
  object-fit: cover;

  &.small {
    width: 160rpx;
    height: 160rpx;
  }
}

.remove-image {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 48rpx;
  height: 48rpx;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  z-index: 10;
}

.image-upload-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 12rpx;
}

.picker-value {
  color: #333;
}

.time-inputs {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.time-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.time-picker {
  flex: 1;
}

.remove-time {
  width: 56rpx;
  height: 56rpx;
  background: #FFEBEE;
  color: #F44336;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

.add-time-btn {
  margin-top: 8rpx;
}

.textarea {
  height: 120rpx;
  padding: 16rpx;
}

.form-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 40rpx;
}

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
  width: 60rpx;
  height: 60rpx;
  border: 4px solid rgba(255, 255, 255, 0.3);
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
</style>
