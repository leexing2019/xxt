<template>
  <view class="add-medication-page">
    <!-- 步骤条 -->
    <StepIndicator
      :current="currentStep"
      :steps="['选择药品', '设置时间', '确认']"
    />

    <!-- 步骤 1: 选择药品 -->
    <view v-if="currentStep === 1" class="step-content">
      <!-- 搜索框 -->
      <view class="search-section">
        <view class="search-wrapper">
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
          <button class="search-btn" @click="handleSearch">搜索</button>
        </view>

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
      </view>

      <!-- 功能按钮 -->
      <view class="action-buttons">
        <view class="action-row">
          <button class="action-btn voice-btn" @click="startVoiceSelect">
            <text class="action-icon">🎤</text>
            <text class="action-text">语音说药名</text>
          </button>
        </view>
        <view class="action-row">
          <button class="action-btn camera-btn" @click="openCameraSelect">
            <text class="action-icon">📷</text>
            <text class="action-text">拍照识别</text>
          </button>
        </view>
      </view>

      <!-- 语音识别结果 -->
      <view v-if="voiceRecognized" class="voice-result">
        <text class="result-label">您说的是：</text>
        <text class="result-text">{{ voiceText }}</text>
        <view class="result-actions">
          <button class="btn-outline" @click="retryVoice">重新说</button>
          <button class="btn-primary" @click="confirmVoiceSearch">搜索这个药</button>
        </view>
      </view>

      <!-- 分类 Tab -->
      <view class="category-section">
        <text class="section-title">常用药品</text>
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
      </view>

      <!-- 药品列表 -->
      <view class="drug-grid">
        <view
          v-for="drug in filteredDrugs"
          :key="drug.id"
          class="drug-card"
          :class="{ selected: selectedMedication?.id === drug.id }"
          @click="selectMedication(drug)"
        >
          <image :src="drug.image" class="drug-image" mode="aspectFill" />
          <text class="drug-name">{{ drug.name }}</text>
          <text class="drug-usage">{{ drug.usage }}</text>
        </view>
      </view>

      <!-- 搜索结果 -->
      <view v-if="searchResults.length > 0" class="search-results">
        <text class="results-title">找到 {{ searchResults.length }} 种药品</text>
        <view
          v-for="drug in searchResults"
          :key="drug.id"
          class="search-result-card"
          @click="selectMedication(drug)"
        >
          <image :src="drug.image" class="result-image" mode="aspectFill" />
          <view class="result-info">
            <text class="result-name">{{ drug.name }}</text>
            <text class="result-generic">通用名：{{ drug.genericName }}</text>
            <text class="result-indication">用于：{{ drug.indications }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 步骤 2: 设置时间 -->
    <view v-if="currentStep === 2" class="step-content">
      <view class="form-section">
        <!-- 已选药品 -->
        <view class="selected-medication">
          <image v-if="selectedMedication" :src="selectedMedication.image" class="med-image" />
          <view class="med-info">
            <text class="med-name">{{ selectedMedication?.name }}</text>
            <text class="med-usage">{{ selectedMedication?.usage }}</text>
          </view>
        </view>

        <!-- 服用时间 -->
        <view class="form-group">
          <text class="form-label">服用时间</text>
          <view class="time-slots">
            <view
              v-for="(time, index) in schedule.time_of_day"
              :key="index"
              class="time-slot"
            >
              <picker mode="time" :value="time" @change="(e) => onTimeChange(e, index)">
                <view class="time-picker">{{ time || '选择时间' }}</view>
              </picker>
              <text v-if="schedule.time_of_day.length > 1" class="remove-time" @click="removeTime(index)">×</text>
            </view>
            <button class="add-time-btn" @click="addTime">+ 添加服药时间</button>
          </view>
        </view>

        <!-- 用药频率 -->
        <view class="form-group">
          <text class="form-label">用药频率</text>
          <view class="frequency-options">
            <view
              class="frequency-option"
              :class="{ active: frequency === 'daily' }"
              @click="frequency = 'daily'"
            >
              每日
            </view>
            <view
              class="frequency-option"
              :class="{ active: frequency === 'weekly' }"
              @click="frequency = 'weekly'"
            >
              每周
            </view>
          </view>
        </view>

        <!-- 星期选择（仅每周模式） -->
        <view v-if="frequency === 'weekly'" class="form-group">
          <text class="form-label">选择服药日期</text>
          <view class="weekday-selector">
            <view
              v-for="day in weekdays"
              :key="day.value"
              class="weekday-item"
              :class="{ active: schedule.weekdays.includes(day.value) }"
              @click="toggleWeekday(day.value)"
            >
              {{ day.label }}
            </view>
          </view>
        </view>

        <!-- 用量 -->
        <view class="form-group">
          <text class="form-label">每次用量</text>
          <view class="dosage-input-wrapper">
            <input
              v-model="schedule.dosage"
              type="number"
              placeholder="输入数量"
              class="dosage-input"
            />
            <picker :value="dosageUnitIndex" :range="dosageUnits" @change="onDosageUnitChange">
              <view class="dosage-unit">{{ dosageUnits[dosageUnitIndex] }}</view>
            </picker>
          </view>
        </view>

        <!-- 用药说明 -->
        <view class="form-group">
          <text class="form-label">用药说明</text>
          <textarea
            v-model="schedule.instructions"
            placeholder="如：饭后半小时服用、多喝水等"
            class="instructions-textarea"
          />
        </view>

        <!-- 开始日期 -->
        <view class="form-group">
          <text class="form-label">开始日期</text>
          <picker mode="date" :value="schedule.start_date" @change="onStartDateChange">
            <view class="date-picker">{{ schedule.start_date || '选择日期' }}</view>
          </picker>
        </view>
      </view>
    </view>

    <!-- 步骤 3: 确认 -->
    <view v-if="currentStep === 3" class="step-content">
      <view class="confirm-section">
        <!-- 药品信息 -->
        <view class="confirm-card">
          <text class="confirm-title">药品信息</text>
          <view class="confirm-medication">
            <image v-if="selectedMedication" :src="selectedMedication.image" class="confirm-med-image" />
            <view class="confirm-med-info">
              <text class="confirm-med-name">{{ selectedMedication?.name }}</text>
              <text class="confirm-med-generic">通用名：{{ selectedMedication?.genericName }}</text>
              <text class="confirm-med-usage">{{ selectedMedication?.usage }}</text>
            </view>
          </view>
        </view>

        <!-- 服药时间 -->
        <view class="confirm-card">
          <text class="confirm-title">服药时间</text>
          <view class="time-list">
            <view v-for="(time, index) in schedule.time_of_day" :key="index" class="time-item">
              <text class="time-dot">●</text>
              <text class="time-text">{{ formatTimeDisplay(time) }}</text>
            </view>
          </view>
        </view>

        <!-- 用量 -->
        <view class="confirm-card">
          <text class="confirm-title">每次用量</text>
          <text class="confirm-dosage">{{ schedule.dosage }} {{ dosageUnits[dosageUnitIndex] }}</text>
        </view>

        <!-- 用药频率 -->
        <view class="confirm-card">
          <text class="confirm-title">用药频率</text>
          <text class="confirm-frequency">
            {{ frequency === 'daily' ? '每日服用' : '每周服用' }}
            <text v-if="frequency === 'weekly'" class="confirm-weekdays">
              ({{ selectedWeekdaysText }})
            </text>
          </text>
        </view>

        <!-- 用药说明 -->
        <view v-if="schedule.instructions" class="confirm-card">
          <text class="confirm-title">用药说明</text>
          <text class="confirm-instructions">{{ schedule.instructions }}</text>
        </view>

        <!-- 开始日期 -->
        <view class="confirm-card">
          <text class="confirm-title">开始日期</text>
          <text class="confirm-start-date">{{ schedule.start_date || '立即开始' }}</text>
        </view>
      </view>
    </view>

    <!-- 底部导航按钮 -->
    <view class="bottom-actions">
      <button v-if="currentStep > 1" class="btn-prev" @click="prevStep">上一步</button>
      <button v-if="currentStep < 3" class="btn-next" @click="nextStep">下一步</button>
      <button v-if="currentStep === 3" class="btn-confirm" @click="confirmAdd">确认添加</button>
      <button class="btn-cancel" @click="cancelAdd">取消</button>
    </view>

    <!-- 加载中 -->
    <view v-if="loading" class="loading-overlay">
      <view class="loading-spinner"></view>
      <text class="loading-text">{{ loadingText }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { NodeJS } from 'node'
import { useMedicationStore } from '@/store/medication'
import { useAuthStore } from '@/store/auth'
import { recognizeMedication } from '@/services/medication'
import { recognizeSpeech, speakText } from '@/services/voice'
import {
  fetchCommonMedications,
  getMedicationsByCategory as getCategoryMedications,
  searchMedications as searchCommonMedications,
  type CommonMedication as DbCommonMedication,
  type DisplayMedication as CommonMedication
} from '@/services/common-medications'
import StepIndicator from '@/components/StepIndicator.vue'

const medicationStore = useMedicationStore()
const authStore = useAuthStore()

// 步骤条
const currentStep = ref(1)

// 状态接口
interface Schedule {
  time_of_day: string[]
  dosage: string
  instructions: string
  weekdays: number[]
  start_date: string
  end_date?: string
}

// 状态
const selectedMedication = ref<CommonMedication | null>(null)
const schedule = reactive<Schedule>({
  time_of_day: ['08:00'],
  dosage: '1',
  instructions: '',
  weekdays: [1, 2, 3, 4, 5, 6, 7],
  start_date: new Date().toISOString().split('T')[0]
})

// 搜索
const searchKeyword = ref('')
const searchResults = ref<CommonMedication[]>([])

// 下拉建议
const showDropdown = ref(false)
const searchSuggestions = ref<CommonMedication[]>([])
const debounceTimer = ref<NodeJS.Timeout | null>(null)

// 空状态动作
const showEmptyAction = ref(false)

// 语音识别
const voiceRecognized = ref(false)
const voiceText = ref('')

// 分类
const activeCategory = ref('all')
const categories = ref([
  { id: 'all', name: '全部' },
  { id: '降压药', name: '降压药' },
  { id: '降糖药', name: '降糖药' },
  { id: '降脂药', name: '降脂药' },
  { id: '心血管药', name: '心血管' },
  { id: '胃药', name: '胃药' },
  { id: '止咳药', name: '止咳药' },
  { id: '止痛药', name: '止痛药' },
  { id: '维生素', name: '维生素' },
  { id: '钙片', name: '钙片' }
])

// 公共药品库数据
const commonMedications = ref<CommonMedication[]>([])
const loadingDrugs = ref(false)

// 筛选后的药品
const filteredDrugs = computed(() => {
  if (activeCategory.value === 'all') {
    return commonMedications.value
  }
  return commonMedications.value.filter(med => med.category === activeCategory.value)
})

// 用药频率
const frequency = ref<'daily' | 'weekly'>('daily')

// 星期选项
const weekdays = [
  { label: '一', value: 1 },
  { label: '二', value: 2 },
  { label: '三', value: 3 },
  { label: '四', value: 4 },
  { label: '五', value: 5 },
  { label: '六', value: 6 },
  { label: '日', value: 7 }
]

// 用量单位
const dosageUnits = ['片', '粒', '胶囊', 'ml', 'g', 'mg', '滴', '勺']
const dosageUnitIndex = ref(0)

// 加载状态
const loading = ref(false)
const loadingText = ref('')

// 已选星期文本
const selectedWeekdaysText = computed(() => {
  const days = schedule.weekdays.sort((a, b) => a - b)
  return days.map(d => weekdays.find(w => w.value === d)?.label || '').join('、')
})

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

// 处理失焦
function handleBlur() {
  // 延迟关闭下拉框，允许点击下拉项
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

// 获取药品名称的拼音首字母快捷方式
function getPinyinShortcut(name: string): string {
  // 临时实现，显示药名首字
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

// 选择分类
function selectCategory(categoryId: string) {
  activeCategory.value = categoryId
  speakText(`已选择${categories.find(c => c.id === categoryId)?.name || '全部'}药品`)
}

// 选择药品
function selectMedication(drug: CommonMedication) {
  selectedMedication.value = drug
  // 自动填充默认用药说明
  schedule.instructions = drug.usage
  speakText(`已选择${drug.name}，${drug.indications}`)

  // 如果是在步骤 1 选择，提示可以进入下一步
  if (currentStep.value === 1) {
    setTimeout(() => {
      speakText('请点击下一步设置服药时间')
    }, 1000)
  }
}

// 搜索药品
async function handleSearch() {
  if (!searchKeyword.value.trim()) {
    uni.showToast({ title: '请输入药品名称', icon: 'none' })
    return
  }

  loading.value = true
  loadingText.value = '搜索中...'

  try {
    searchResults.value = await searchCommonMedications(searchKeyword.value)

    if (searchResults.value.length === 0) {
      uni.showToast({ title: '未找到相关药品', icon: 'none' })
      speakText('未找到相关药品，请试试其他方式')
    } else {
      speakText(`找到${searchResults.value.length}种药品，请查看屏幕选择`)
    }
  } catch (error) {
    uni.showToast({ title: '搜索失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 语音选择药品
async function startVoiceSelect() {
  if (voiceRecognized.value) return

  speakText('请说出药品名称')

  try {
    const result = await recognizeSpeech()

    if (result.success && result.text) {
      voiceText.value = result.text
      voiceRecognized.value = true
      speakText(`您说的是${result.text}，请确认`)
    } else {
      speakText('没有识别到声音，请重试')
    }
  } catch (error) {
    uni.showToast({ title: '语音识别失败', icon: 'none' })
  }
}

// 确认语音搜索
function confirmVoiceSearch() {
  if (voiceText.value) {
    searchKeyword.value = voiceText.value
    handleSearch()
    voiceRecognized.value = false
  }
}

// 重新语音
function retryVoice() {
  voiceText.value = ''
  voiceRecognized.value = false
  startVoiceSelect()
}

// 拍照识别
async function openCameraSelect() {
  uni.chooseImage({
    count: 1,
    sourceType: ['camera', 'album'],
    success: async (res) => {
      const imagePath = res.tempFilePaths[0]
      await processImageRecognition(imagePath)
    },
    fail: () => {
      uni.showToast({ title: '拍照失败', icon: 'none' })
    }
  })
}

// 处理图片识别
async function processImageRecognition(imagePath: string) {
  loading.value = true
  loadingText.value = '正在识别药品...'

  try {
    const result = await recognizeMedication(imagePath)

    if (result.name) {
      // 尝试在常用药中匹配
      const matched = await searchCommonMedications(result.name)
      if (matched.length > 0) {
        selectMedication(matched[0])
        speakText(`识别成功，${matched[0].name}`)
      } else {
        // 未匹配到，创建临时药品
        const tempDrug: CommonMedication = {
          id: 'temp_' + Date.now(),
          name: result.name || '未知药品',
          genericName: result.name || '',
          category: '其他',
          indications: '请确认用途',
          appearanceDesc: result.form || '',
          image: imagePath,
          usage: result.dosage || '每次 1 片'
        }
        selectMedication(tempDrug)
        speakText('识别成功，请确认药品信息')
      }
    }
  } catch (error) {
    uni.showToast({ title: '识别失败，请重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 时间变化
function onTimeChange(e: any, index: number) {
  schedule.time_of_day[index] = e.detail.value
}

// 添加时间
function addTime() {
  if (schedule.time_of_day.length < 6) {
    schedule.time_of_day.push('12:00')
    speakText('已添加服药时间')
  } else {
    uni.showToast({ title: '最多添加 6 个时间', icon: 'none' })
  }
}

// 移除时间
function removeTime(index: number) {
  schedule.time_of_day.splice(index, 1)
  speakText('已删除服药时间')
}

// 切换星期
function toggleWeekday(value: number) {
  const idx = schedule.weekdays.indexOf(value)
  if (idx > -1) {
    schedule.weekdays.splice(idx, 1)
  } else {
    schedule.weekdays.push(value)
    schedule.weekdays.sort((a, b) => a - b)
  }
}

// 用量单位变化
function onDosageUnitChange(e: any) {
  dosageUnitIndex.value = Number(e.detail.value)
}

// 开始日期变化
function onStartDateChange(e: any) {
  schedule.start_date = e.detail.value
}

// 格式化时间显示
function formatTimeDisplay(time: string): string {
  const [hour, minute] = time.split(':')
  const h = parseInt(hour)
  const m = minute === '00' ? '' : `:${minute}`

  if (h >= 5 && h < 10) return `早上${h}${m}`
  if (h >= 10 && h < 12) return `上午${h}${m}`
  if (h === 12) return `中午${m}`
  if (h > 12 && h < 18) return `下午${h - 12}${m}`
  if (h >= 18 && h < 21) return `晚上${h > 12 ? h - 12 : h}${m}`
  if (h >= 21 || h < 5) return `睡前${h >= 21 ? h - 12 : h}${m}`
  return time
}

// 上一步
function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
    speakText(`第${currentStep.value}步，${currentStep.value === 1 ? '选择药品' : '设置时间'}`)
  }
}

// 下一步
function nextStep() {
  if (currentStep.value === 1) {
    if (!selectedMedication.value) {
      uni.showToast({ title: '请先选择药品', icon: 'none' })
      speakText('请先选择药品')
      return
    }
    currentStep.value++
    speakText('第 2 步，设置服药时间')
  } else if (currentStep.value === 2) {
    if (schedule.time_of_day.every(t => !t)) {
      uni.showToast({ title: '请设置服药时间', icon: 'none' })
      speakText('请设置服药时间')
      return
    }
    if (!schedule.dosage || schedule.dosage === '0') {
      uni.showToast({ title: '请设置用量', icon: 'none' })
      speakText('请设置用量')
      return
    }
    currentStep.value++
    speakText('第 3 步，确认信息')
  }
}

// 确认添加
async function confirmAdd() {
  if (!selectedMedication.value || !authStore.userId) {
    uni.showToast({ title: '请先选择药品', icon: 'none' })
    return
  }

  loading.value = true
  loadingText.value = '正在添加...'

  try {
    // 添加药品到数据库
    const result = await medicationStore.addMedication({
      name: selectedMedication.value.name,
      generic_name: selectedMedication.value.genericName,
      specification: '',
      form: '',
      manufacturer: '',
      appearance_desc: selectedMedication.value.appearanceDesc,
      image_url: selectedMedication.value.image
    })

    if (result.success && result.data) {
      // 添加用药计划
      for (const time of schedule.time_of_day) {
        await medicationStore.addSchedule({
          medication_id: result.data.id,
          time_of_day: time,
          dosage: `${schedule.dosage}${dosageUnits[dosageUnitIndex.value]}`,
          instructions: schedule.instructions,
          weekdays: schedule.weekdays,
          start_date: schedule.start_date
        })
      }

      const msg = `${selectedMedication.value.name}已添加成功`
      speakText(msg)
      uni.showToast({ title: '添加成功', icon: 'success' })

      setTimeout(() => {
        resetState()
        uni.switchTab({ url: '/pages/medication-list/medication-list' })
      }, 1500)
    } else {
      throw new Error(result.error || '添加失败')
    }
  } catch (error: any) {
    uni.showToast({ title: error.message || '添加失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 取消添加
function cancelAdd() {
  uni.showModal({
    title: '确认取消',
    content: '确定要取消添加药品吗？',
    success: (res) => {
      if (res.confirm) {
        resetState()
        uni.navigateBack()
      }
    }
  })
}

// 重置状态
function resetState() {
  currentStep.value = 1
  selectedMedication.value = null
  schedule.time_of_day = ['08:00']
  schedule.dosage = '1'
  schedule.instructions = ''
  schedule.weekdays = [1, 2, 3, 4, 5, 6, 7]
  schedule.start_date = new Date().toISOString().split('T')[0]
  searchKeyword.value = ''
  searchResults.value = []
  voiceRecognized.value = false
  voiceText.value = ''
  activeCategory.value = 'all'
  dosageUnitIndex.value = 0
}

// 页面加载时语音提示并加载公共药品库
onMounted(async () => {
  // 加载公共药品库数据
  loadingDrugs.value = true
  commonMedications.value = await fetchCommonMedications()
  loadingDrugs.value = false

  setTimeout(() => {
    speakText('欢迎添加药品，请选择药品开始')
  }, 500)
})
</script>

<style lang="scss" scoped>
.add-medication-page {
  min-height: 100vh;
  background: #F5F5F5;
  padding-bottom: 140rpx;
}

.step-content {
  padding: 0 24rpx 24rpx;
}

// ===== 搜索区域 =====
.search-section {
  margin-bottom: 24rpx;
}

.search-wrapper {
  display: flex;
  gap: 16rpx;
  align-items: center;
}

.search-input {
  flex: 1;
  height: 88rpx;
  padding: 0 32rpx;
  background: white;
  border-radius: 44rpx;
  font-size: 32rpx;
  color: #333;
  border: 2rpx solid #E0E0E0;
}

.search-placeholder {
  color: #999;
}

.search-btn {
  width: 140rpx;
  height: 88rpx;
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
  font-size: 30rpx;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

// ===== 功能按钮 =====
.action-buttons {
  margin-bottom: 32rpx;
}

.action-row {
  margin-bottom: 16rpx;
}

.action-btn {
  width: 100%;
  height: 96rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  font-size: 32rpx;
  padding: 0;
  border: none;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.action-btn:active {
  transform: scale(0.98);
}

.voice-btn {
  background: linear-gradient(135deg, #E3F2FD, #BBDEFB);
  color: #1976D2;
  border: 2rpx solid #2196F3;
}

.camera-btn {
  background: linear-gradient(135deg, #FFF3E0, #FFE0B2);
  color: #F57C00;
  border: 2rpx solid #FF9800;
}

.action-icon {
  font-size: 44rpx;
}

.action-text {
  font-weight: 600;
}

// ===== 语音识别结果 =====
.voice-result {
  background: white;
  border-radius: 20rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  text-align: center;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.result-label {
  font-size: 26rpx;
  color: #999;
  display: block;
  margin-bottom: 12rpx;
}

.result-text {
  font-size: 40rpx;
  font-weight: 700;
  color: #2196F3;
  display: block;
  margin-bottom: 24rpx;
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 24rpx;
}

.btn-outline {
  height: 72rpx;
  padding: 0 48rpx;
  background: white;
  color: #2196F3;
  border: 2rpx solid #2196F3;
  border-radius: 36rpx;
  font-size: 30rpx;
}

.btn-primary {
  height: 72rpx;
  padding: 0 48rpx;
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
  border: none;
  border-radius: 36rpx;
  font-size: 30rpx;
}

// ===== 分类 Tab =====
.category-section {
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

.category-tabs {
  width: 100%;
  white-space: nowrap;
}

.tabs-wrapper {
  display: inline-flex;
  gap: 16rpx;
  padding: 8rpx 4rpx;
}

.tab {
  display: inline-block;
  padding: 16rpx 32rpx;
  font-size: 28rpx;
  color: #666;
  background: #F5F5F5;
  border-radius: 40rpx;
  transition: all 0.2s;

  &.active {
    background: linear-gradient(135deg, #2196F3, #1976D2);
    color: white;
    font-weight: 600;
    box-shadow: 0 4rpx 12rpx rgba(33, 150, 243, 0.3);
  }
}

// ===== 药品网格 =====
.drug-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.drug-card {
  background: white;
  border-radius: 20rpx;
  padding: 24rpx;
  text-align: center;
  transition: all 0.2s;
  border: 2rpx solid transparent;

  &.selected {
    border-color: #4CAF50;
    background: #E8F5E9;
  }

  &:active {
    transform: scale(0.98);
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.12);
  }
}

.drug-image {
  width: 140rpx;
  height: 140rpx;
  border-radius: 16rpx;
  background: #F5F5F5;
  margin-bottom: 16rpx;
}

.drug-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drug-usage {
  font-size: 24rpx;
  color: #666;
  display: block;
}

// ===== 搜索结果 =====
.search-results {
  margin-bottom: 24rpx;
}

.results-title {
  font-size: 26rpx;
  color: #666;
  display: block;
  margin-bottom: 16rpx;
}

.search-result-card {
  display: flex;
  padding: 24rpx;
  background: white;
  border-radius: 20rpx;
  margin-bottom: 16rpx;
  gap: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);

  &:active {
    background: #F5F5F5;
  }
}

.result-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 16rpx;
  background: #F5F5F5;
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
  font-size: 32rpx;
  font-weight: 700;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-generic {
  font-size: 26rpx;
  color: #999;
}

.result-indication {
  font-size: 24rpx;
  color: #2196F3;
  background: #E3F2FD;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  display: inline-block;
  width: fit-content;
}

// ===== 表单区域 =====
.form-section {
  background: white;
  border-radius: 20rpx;
  padding: 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.selected-medication {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding-bottom: 32rpx;
  margin-bottom: 32rpx;
  border-bottom: 2rpx solid #F0F0F0;
}

.med-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 16rpx;
  background: #F5F5F5;
  flex-shrink: 0;
}

.med-info {
  flex: 1;
}

.med-name {
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.med-usage {
  font-size: 26rpx;
  color: #666;
  display: block;
}

.form-group {
  margin-bottom: 32rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

.time-slots {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.time-slot {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.time-picker {
  flex: 1;
  height: 80rpx;
  background: #F5F5F5;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  padding: 0 32rpx;
  font-size: 30rpx;
  color: #333;
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
  font-size: 36rpx;
  flex-shrink: 0;
}

.add-time-btn {
  height: 72rpx;
  background: white;
  color: #2196F3;
  border: 2rpx dashed #2196F3;
  border-radius: 16rpx;
  font-size: 28rpx;
  padding: 0;
}

.frequency-options {
  display: flex;
  gap: 24rpx;
}

.frequency-option {
  flex: 1;
  height: 80rpx;
  background: #F5F5F5;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  color: #666;
  transition: all 0.2s;

  &.active {
    background: linear-gradient(135deg, #2196F3, #1976D2);
    color: white;
    font-weight: 600;
  }
}

.weekday-selector {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
}

.weekday-item {
  width: 72rpx;
  height: 72rpx;
  background: #F5F5F5;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #666;
  transition: all 0.2s;

  &.active {
    background: linear-gradient(135deg, #4CAF50, #45a049);
    color: white;
    font-weight: 600;
  }
}

.dosage-input-wrapper {
  display: flex;
  gap: 16rpx;
}

.dosage-input {
  flex: 1;
  height: 80rpx;
  background: #F5F5F5;
  border-radius: 16rpx;
  padding: 0 32rpx;
  font-size: 30rpx;
  color: #333;
}

.dosage-unit {
  width: 160rpx;
  height: 80rpx;
  background: #F5F5F5;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  color: #333;
}

.instructions-textarea {
  height: 160rpx;
  background: #F5F5F5;
  border-radius: 16rpx;
  padding: 20rpx;
  font-size: 30rpx;
  color: #333;
  line-height: 1.6;
}

.date-picker {
  height: 80rpx;
  background: #F5F5F5;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  padding: 0 32rpx;
  font-size: 30rpx;
  color: #333;
}

// ===== 确认区域 =====
.confirm-section {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.confirm-card {
  background: white;
  border-radius: 20rpx;
  padding: 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.confirm-title {
  font-size: 26rpx;
  color: #999;
  display: block;
  margin-bottom: 20rpx;
}

.confirm-medication {
  display: flex;
  gap: 24rpx;
  align-items: center;
}

.confirm-med-image {
  width: 100rpx;
  height: 100rpx;
  border-radius: 16rpx;
  background: #F5F5F5;
  flex-shrink: 0;
}

.confirm-med-info {
  flex: 1;
}

.confirm-med-name {
  font-size: 40rpx;
  font-weight: 700;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.confirm-med-generic {
  font-size: 26rpx;
  color: #999;
  display: block;
  margin-bottom: 8rpx;
}

.confirm-med-usage {
  font-size: 24rpx;
  color: #2196F3;
  background: #E3F2FD;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  display: inline-block;
}

.time-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.time-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.time-dot {
  color: #4CAF50;
  font-size: 24rpx;
}

.time-text {
  font-size: 32rpx;
  color: #333;
  font-weight: 500;
}

.confirm-dosage {
  font-size: 48rpx;
  font-weight: 700;
  color: #4CAF50;
}

.confirm-frequency {
  font-size: 32rpx;
  color: #333;
  font-weight: 500;
}

.confirm-weekdays {
  color: #666;
  font-weight: 400;
}

.confirm-instructions {
  font-size: 30rpx;
  color: #666;
  line-height: 1.6;
}

.confirm-start-date {
  font-size: 32rpx;
  color: #333;
  font-weight: 500;
}

// ===== 底部按钮 =====
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 20rpx;
  padding: 24rpx;
  background: white;
  box-shadow: 0 -4rpx 24rpx rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.btn-prev,
.btn-cancel {
  height: 88rpx;
  padding: 0 48rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-prev {
  background: white;
  color: #666;
  border: 2rpx solid #E0E0E0;
  flex: 1;
}

.btn-next {
  flex: 2;
  height: 88rpx;
  padding: 0 48rpx;
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
  border: none;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-confirm {
  flex: 2;
  height: 88rpx;
  padding: 0 48rpx;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  border: none;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 24rpx rgba(76, 175, 80, 0.4);
}

.btn-cancel {
  background: #F5F5F5;
  color: #999;
  border: none;
  flex: 1;
}

// ===== 加载中 =====
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
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
  margin-top: 32rpx;
  font-size: 30rpx;
}
</style>
