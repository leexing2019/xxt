<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMedicationStore } from '@/store/medication'

const medicationStore = useMedicationStore()

const medicationId = ref('')
const medication = ref<any>(null)
const schedules = ref<any[]>([])
const recentLogs = ref<any[]>([])

// 模拟数据
const contraindications = ref('对阿司匹林过敏者禁用')
const interactions = ref('与华法林同用可能增加出血风险')

// 计算属性
const complianceRate = computed(() => 85)
const takenCount = computed(() => 17)
const missedCount = computed(() => 3)

// 判断是否为今天
function isToday(dayOfWeek: number): boolean {
  const today = new Date().getDay()
  return today === dayOfWeek || (today === 0 && dayOfWeek === 7)
}

// 格式化时间
function formatTime(time: string): string {
  return new Date(time).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化日期
function formatDate(time: string): string {
  return new Date(time).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  })
}

// 编辑用药计划
function editSchedule() {
  uni.showToast({ title: '编辑计划功能', icon: 'none' })
}

// 添加用药计划
function addSchedule() {
  uni.showToast({ title: '添加计划功能', icon: 'none' })
}

// 确认服药
function takeMedication() {
  uni.showModal({
    title: '确认服药',
    content: `确认已服用 ${medication.value?.name || '该药品'}？`,
    confirmText: '确认',
    success: async (res) => {
      if (res.confirm && schedules.value.length > 0) {
        await medicationStore.logMedication(schedules.value[0].id, 'taken')
        uni.showToast({ title: '已记录', icon: 'success' })
      }
    }
  })
}

onMounted(async () => {
  // 获取页面参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.options || {}
  medicationId.value = options.id || ''

  if (medicationId.value) {
    await medicationStore.fetchMedications()
    medication.value = medicationStore.medications.find(m => m.id === medicationId.value)
    await medicationStore.fetchSchedules()
    schedules.value = medicationStore.schedules.filter(
      s => s.medication_id === medicationId.value
    )
  }
})
</script>
