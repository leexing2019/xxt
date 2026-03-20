<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { API_GUIDES, type ApiConfig } from '@/config/api'
import {
  getApiConfigFromBackend,
  saveApiConfigToBackend,
  testOcrConnection,
  testSpeechConnection
} from '@/services/api-config'
import { Setting, Camera, Mic, Goods, ArrowDown, ArrowRight } from '@element-plus/icons-vue'

// 展开的配置区块
const activeSection = ref<string | null>('ocr')

// 加载状态
const loading = ref(false)

// 表单数据
const formData = reactive<ApiConfig>({
  baiduOcrApiKey: '',
  baiduOcrSecretKey: '',
  baiduSpeechAppId: '',
  baiduSpeechApiKey: '',
  baiduSpeechSecretKey: '',
  drugApiBaseUrl: '',
  drugApiKey: ''
})

// 配置状态
const ocrConfigured = computed(() => !!formData.baiduOcrApiKey && !!formData.baiduOcrSecretKey)
const speechConfigured = computed(() => !!formData.baiduSpeechAppId && !!formData.baiduSpeechApiKey && !!formData.baiduSpeechSecretKey)
const drugConfigured = computed(() => !!formData.drugApiBaseUrl)

// 获取引导信息
const ocrGuide = computed(() => API_GUIDES.baiduOcr)
const speechGuide = computed(() => API_GUIDES.baiduSpeech)
const drugGuide = computed(() => API_GUIDES.drugDatabase)

// 加载配置
async function loadConfig() {
  loading.value = true
  try {
    const config = await getApiConfigFromBackend()
    if (config) {
      Object.assign(formData, config)
    }
  } catch (error) {
    console.error('加载配置失败:', error)
  } finally {
    loading.value = false
  }
}

// 切换区块展开/收起
function toggleSection(section: string) {
  activeSection.value = activeSection.value === section ? null : section
}

// 测试 OCR 连接
async function testOcr() {
  if (!formData.baiduOcrApiKey || !formData.baiduOcrSecretKey) {
    ElMessage.warning('请先填写 API Key 和 Secret Key')
    return
  }

  const result = await testOcrConnection(formData.baiduOcrApiKey, formData.baiduOcrSecretKey)
  if (result.success) {
    ElMessage.success(result.message)
  } else {
    ElMessage.error(result.message)
  }
}

// 测试语音连接
async function testSpeech() {
  if (!formData.baiduSpeechApiKey || !formData.baiduSpeechSecretKey) {
    ElMessage.warning('请先填写 API Key 和 Secret Key')
    return
  }

  const result = await testSpeechConnection(formData.baiduSpeechApiKey, formData.baiduSpeechSecretKey)
  if (result.success) {
    ElMessage.success(result.message)
  } else {
    ElMessage.error(result.message)
  }
}

// 保存配置
async function saveConfig() {
  const missing: string[] = []

  if (!formData.baiduOcrApiKey) missing.push('百度 OCR API Key')
  if (!formData.baiduOcrSecretKey) missing.push('百度 OCR Secret Key')
  if (!formData.baiduSpeechAppId) missing.push('百度语音 App ID')
  if (!formData.baiduSpeechApiKey) missing.push('百度语音 API Key')
  if (!formData.baiduSpeechSecretKey) missing.push('百度语音 Secret Key')

  if (missing.length > 0) {
    try {
      await ElMessageBox.confirm(
        `以下配置缺失：\n${missing.join('\n')}\n\n是否仍然保存？`,
        '配置不完整',
        {
          confirmButtonText: '仍要保存',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    } catch {
      return
    }
  }

  loading.value = true
  try {
    const success = await saveApiConfigToBackend(formData)
    if (success) {
      ElMessage.success('保存成功')
    } else {
      ElMessage.error('保存失败')
    }
  } catch (error) {
    console.error('保存配置失败:', error)
    ElMessage.error('保存失败')
  } finally {
    loading.value = false
  }
}

// 重置配置
function resetConfig() {
  ElMessageBox.confirm('确定要重置所有配置吗？', '确认重置', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    formData.baiduOcrApiKey = ''
    formData.baiduOcrSecretKey = ''
    formData.baiduSpeechAppId = ''
    formData.baiduSpeechApiKey = ''
    formData.baiduSpeechSecretKey = ''
    formData.drugApiBaseUrl = ''
    formData.drugApiKey = ''
    ElMessage.success('已重置')
  }).catch(() => {})
}

// 打开文档链接
function openDoc(url: string) {
  if (url) {
    window.open(url, '_blank')
  }
}

onMounted(() => {
  loadConfig()
})
</script>

<template>
  <div class="api-settings">
    <div class="page-header">
      <div class="header-content">
        <el-icon class="header-icon"><Setting /></el-icon>
        <div class="header-text">
          <h2>API 配置管理</h2>
          <p class="desc">配置第三方服务 API 以启用完整功能</p>
        </div>
      </div>
    </div>

    <!-- API 状态概览 -->
    <el-row :gutter="16" class="status-cards">
      <el-col :span="8">
        <el-card shadow="hover" :class="['status-card', ocrConfigured ? 'status-ok' : 'status-empty']">
          <div class="status-content">
            <div class="status-icon-wrapper">
              <el-icon class="status-icon"><Camera /></el-icon>
            </div>
            <div class="status-info">
              <span class="status-label">OCR 识别</span>
              <span class="status-value">{{ ocrConfigured ? '已配置' : '未配置' }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="hover" :class="['status-card', speechConfigured ? 'status-ok' : 'status-empty']">
          <div class="status-content">
            <div class="status-icon-wrapper">
              <el-icon class="status-icon"><Mic /></el-icon>
            </div>
            <div class="status-info">
              <span class="status-label">语音服务</span>
              <span class="status-value">{{ speechConfigured ? '已配置' : '未配置' }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="hover" :class="['status-card', drugConfigured ? 'status-ok' : 'status-empty']">
          <div class="status-content">
            <div class="status-icon-wrapper">
              <el-icon class="status-icon"><Goods /></el-icon>
            </div>
            <div class="status-info">
              <span class="status-label">药品数据库</span>
              <span class="status-value">{{ drugConfigured ? '已配置' : '使用内置' }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 百度 OCR 配置 -->
    <el-card class="config-section">
      <template #header>
        <div class="section-header" @click="toggleSection('ocr')">
          <div class="section-title">
            <el-icon class="section-icon"><Camera /></el-icon>
            <span>百度 OCR 配置</span>
          </div>
          <div class="section-status">
            <el-tag :type="ocrConfigured ? 'success' : 'info'" size="small">
              {{ ocrConfigured ? '✓ 已配置' : '○ 未配置' }}
            </el-tag>
            <el-icon class="expand-icon">
              <ArrowDown v-if="activeSection === 'ocr'" />
              <ArrowRight v-else />
            </el-icon>
          </div>
        </div>
      </template>

      <el-collapse-transition>
        <div v-if="activeSection === 'ocr'" class="section-content">
          <el-alert type="info" :closable="false" class="guide-box">
            <template #title>
              <div class="guide-title">
                <span>💡</span> 如何申请
              </div>
            </template>
            <div class="guide-steps">
              <div v-for="(step, index) in ocrGuide.steps" :key="index" class="guide-step">
                <span class="step-num">{{ index + 1 }}</span>
                <span class="step-text">{{ step }}</span>
              </div>
            </div>
            <div class="guide-quota">
              <el-icon><CircleCheck /></el-icon>
              免费额度：{{ ocrGuide.freeQuota }}
            </div>
            <el-button type="primary" link @click="openDoc(ocrGuide.docUrl)">查看官方文档 →</el-button>
          </el-alert>

          <el-form label-position="top" class="config-form">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="API Key">
                  <el-input
                    v-model="formData.baiduOcrApiKey"
                    type="password"
                    placeholder="请输入百度 OCR API Key"
                    show-password
                    size="large"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Secret Key">
                  <el-input
                    v-model="formData.baiduOcrSecretKey"
                    type="password"
                    placeholder="请输入百度 OCR Secret Key"
                    show-password
                    size="large"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-button type="primary" @click="testOcr" size="default">
              <el-icon><Connection /></el-icon>
              测试连接
            </el-button>
          </el-form>
        </div>
      </el-collapse-transition>
    </el-card>

    <!-- 百度语音配置 -->
    <el-card class="config-section">
      <template #header>
        <div class="section-header" @click="toggleSection('speech')">
          <div class="section-title">
            <el-icon class="section-icon"><Mic /></el-icon>
            <span>百度语音配置</span>
          </div>
          <div class="section-status">
            <el-tag :type="speechConfigured ? 'success' : 'info'" size="small">
              {{ speechConfigured ? '✓ 已配置' : '○ 未配置' }}
            </el-tag>
            <el-icon class="expand-icon">
              <ArrowDown v-if="activeSection === 'speech'" />
              <ArrowRight v-else />
            </el-icon>
          </div>
        </div>
      </template>

      <el-collapse-transition>
        <div v-if="activeSection === 'speech'" class="section-content">
          <el-alert type="info" :closable="false" class="guide-box">
            <template #title>
              <div class="guide-title">
                <span>💡</span> 如何申请
              </div>
            </template>
            <div class="guide-steps">
              <div v-for="(step, index) in speechGuide.steps" :key="index" class="guide-step">
                <span class="step-num">{{ index + 1 }}</span>
                <span class="step-text">{{ step }}</span>
              </div>
            </div>
            <div class="guide-quota">
              <el-icon><CircleCheck /></el-icon>
              免费额度：{{ speechGuide.freeQuota }}
            </div>
            <el-button type="primary" link @click="openDoc(speechGuide.docUrl)">查看官方文档 →</el-button>
          </el-alert>

          <el-form label-position="top" class="config-form">
            <el-row :gutter="16">
              <el-col :span="8">
                <el-form-item label="App ID">
                  <el-input
                    v-model="formData.baiduSpeechAppId"
                    placeholder="请输入百度语音 App ID"
                    size="large"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="API Key">
                  <el-input
                    v-model="formData.baiduSpeechApiKey"
                    type="password"
                    placeholder="请输入百度语音 API Key"
                    show-password
                    size="large"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="Secret Key">
                  <el-input
                    v-model="formData.baiduSpeechSecretKey"
                    type="password"
                    placeholder="请输入百度语音 Secret Key"
                    show-password
                    size="large"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-button type="primary" @click="testSpeech" size="default">
              <el-icon><Connection /></el-icon>
              测试连接
            </el-button>
          </el-form>
        </div>
      </el-collapse-transition>
    </el-card>

    <!-- 药品数据库配置 -->
    <el-card class="config-section">
      <template #header>
        <div class="section-header" @click="toggleSection('drug')">
          <div class="section-title">
            <el-icon class="section-icon"><Goods /></el-icon>
            <span>药品数据库配置</span>
          </div>
          <div class="section-status">
            <el-tag :type="drugConfigured ? 'success' : 'info'" size="small">
              {{ drugConfigured ? '✓ 已配置' : '○ 使用内置' }}
            </el-tag>
            <el-icon class="expand-icon">
              <ArrowDown v-if="activeSection === 'drug'" />
              <ArrowRight v-else />
            </el-icon>
          </div>
        </div>
      </template>

      <el-collapse-transition>
        <div v-if="activeSection === 'drug'" class="section-content">
          <el-alert type="info" :closable="false" class="guide-box">
            <template #title>
              <div class="guide-title">
                <span>💡</span> 说明
              </div>
            </template>
            <p>
              当前版本使用项目内置的常用药品数据库，包含高血压、糖尿病等常见药品的详细信息。
            </p>
            <p class="mt-2">
              如需接入外部药品数据库，可配置以下信息：
            </p>
          </el-alert>

          <el-form label-position="top" class="config-form">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="API 基础 URL（可选）">
                  <el-input
                    v-model="formData.drugApiBaseUrl"
                    placeholder="https://api.example.com"
                    size="large"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="API Key（可选）">
                  <el-input
                    v-model="formData.drugApiKey"
                    type="password"
                    placeholder="请输入药品数据库 API Key"
                    show-password
                    size="large"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>
      </el-collapse-transition>
    </el-card>

    <!-- 操作按钮 -->
    <div class="action-section">
      <el-button type="primary" size="large" :loading="loading" @click="saveConfig" class="btn-save">
        <el-icon><Check /></el-icon>
        保存配置
      </el-button>
      <el-button size="large" @click="resetConfig" class="btn-reset">
        <el-icon><Refresh /></el-icon>
        重置
      </el-button>
    </div>

    <!-- 提示信息 -->
    <el-alert type="warning" :closable="false" class="tips-section">
      <template #title>
        <div class="tips-title">
          <span>💡</span> 温馨提示
        </div>
      </template>
      <div class="tips-content">
        <p><el-icon><Check /></el-icon> API 密钥将加密存储在数据库中，仅用于前端服务调用</p>
        <p><el-icon><Check /></el-icon> 百度 OCR 和语音服务每月有免费额度，个人使用足够</p>
        <p><el-icon><Check /></el-icon> 如不配置 API，前端将使用模拟数据或降级方案</p>
      </div>
    </el-alert>
  </div>
</template>

<style scoped>
.api-settings {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 24px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}

.header-icon {
  font-size: 40px;
  color: #3b82f6;
}

.header-text h2 {
  margin: 0 0 4px 0;
  color: #1e293b;
  font-size: 22px;
  font-weight: 700;
}

.header-text .desc {
  color: #64748b;
  margin: 0;
  font-size: 14px;
}

/* 状态卡片 */
.status-cards {
  margin-bottom: 24px;
}

.status-card {
  height: 110px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.status-card.status-ok {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-color: #22c55e;
}

.status-card.status-empty {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border-color: #f59e0b;
}

.status-content {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 100%;
}

.status-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.status-icon {
  font-size: 32px;
}

.status-card.status-ok .status-icon {
  color: #22c55e;
}

.status-card.status-empty .status-icon {
  color: #f59e0b;
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.status-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.status-value {
  font-size: 22px;
  font-weight: 700;
}

.status-card.status-ok .status-value {
  color: #16a34a;
}

.status-card.status-empty .status-value {
  color: #d97706;
}

/* 配置区块 */
.config-section {
  margin-bottom: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.config-section :deep(.el-card__header) {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.section-header:hover {
  background: #f1f5f9;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-icon {
  font-size: 22px;
  color: #3b82f6;
}

.section-title span {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.section-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.expand-icon {
  font-size: 18px;
  color: #94a3b8;
}

.section-content {
  padding: 24px 20px;
}

/* 引导框 */
.guide-box {
  margin-bottom: 24px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 1px solid #bfdbfe;
  border-radius: 12px;
}

.guide-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1e40af;
  font-size: 15px;
  margin-bottom: 16px;
}

.guide-steps {
  margin-bottom: 16px;
}

.guide-step {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
  font-size: 14px;
  color: #475569;
  line-height: 1.7;
}

.step-num {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.guide-quota {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #16a34a;
  font-weight: 600;
  margin-bottom: 12px;
}

/* 表单 */
.config-form {
  max-width: 800px;
}

.config-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
  margin-bottom: 8px;
}

.config-form :deep(.el-input__wrapper) {
  border-radius: 10px;
  padding: 12px 16px;
}

/* 操作按钮 */
.action-section {
  display: flex;
  gap: 12px;
  margin: 24px 0;
  padding: 24px 0;
  border-top: 1px solid #e2e8f0;
}

.btn-save {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  padding: 16px 32px;
  font-weight: 600;
  font-size: 15px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-save:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.btn-reset {
  padding: 16px 32px;
  font-weight: 500;
  font-size: 15px;
}

/* 提示信息 */
.tips-section {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #fcd34d;
  border-radius: 12px;
  margin-top: 20px;
}

.tips-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #92400e;
  font-size: 15px;
  margin-bottom: 12px;
}

.tips-content p {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 10px 0;
  font-size: 14px;
  color: #78350f;
  line-height: 1.6;
}

.tips-content .el-icon {
  color: #16a34a;
  flex-shrink: 0;
  margin-top: 2px;
}

.mt-2 {
  margin-top: 12px;
}
</style>
