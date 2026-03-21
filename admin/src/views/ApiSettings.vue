<template>
  <div class="dashboard-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <span>💊</span>
        <span>用药助手</span>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/" class="nav-item">
          <span class="nav-icon">📊</span>
          <span>Dashboard</span>
        </router-link>
        <router-link to="/users" class="nav-item">
          <span class="nav-icon">👥</span>
          <span>用户管理</span>
        </router-link>
        <router-link to="/medications" class="nav-item">
          <span class="nav-icon">💊</span>
          <span>用药计划管理</span>
        </router-link>
        <router-link to="/api-settings" class="nav-item active">
          <span class="nav-icon">⚙️</span>
          <span>API 配置</span>
        </router-link>
      </nav>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <header class="header">
        <h1 class="page-title">API 配置</h1>
        <div class="header-actions">
          <span class="user-email">{{ authStore.user?.email }}</span>
          <el-button size="small" @click="handleLogout">退出</el-button>
        </div>
      </header>

      <div class="content">
        <el-card>
          <h3 style="margin-bottom: 20px">百度 AI 配置</h3>
          <el-form :model="config" label-width="140px" style="max-width: 600px">
            <el-form-item label="百度 App ID">
              <el-input
                v-model="config.baidu_app_id"
                placeholder="请输入百度 App ID"
                size="large"
              />
            </el-form-item>

            <el-form-item label="百度 API Key">
              <el-input
                v-model="config.baidu_api_key"
                placeholder="请输入百度 API Key"
                size="large"
                show-password
              />
            </el-form-item>

            <el-form-item label="百度 Secret Key">
              <el-input
                v-model="config.baidu_secret_key"
                placeholder="请输入百度 Secret Key"
                size="large"
                show-password
              />
            </el-form-item>

            <el-form-item label="语音识别">
              <el-switch v-model="config.voice_enabled" />
            </el-form-item>

            <el-form-item label="图片识别">
              <el-switch v-model="config.image_enabled" />
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="saving"
                @click="saveConfig"
              >
                保存配置
              </el-button>
              <el-button size="large" @click="testConnection">
                测试连接
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card style="margin-top: 20px">
          <h3>配置说明</h3>
          <ul style="margin-top: 12px; line-height: 2; color: #666">
            <li>百度 App ID、API Key、Secret Key 用于语音识别和图片识别功能</li>
            <li>请在 <a href="https://ai.baidu.com" target="_blank">百度 AI 开放平台</a> 申请相关密钥</li>
            <li>保存配置后需要刷新前端页面才能生效</li>
          </ul>
        </el-card>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const saving = ref(false)
const config = reactive({
  baidu_app_id: '',
  baidu_api_key: '',
  baidu_secret_key: '',
  voice_enabled: true,
  image_enabled: true
})

async function loadConfig() {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'baidu_api_config')
      .single()

    if (data?.value) {
      config.baidu_app_id = data.value.app_id || ''
      config.baidu_api_key = data.value.api_key || ''
      config.baidu_secret_key = data.value.secret_key || ''
    }

    const { data: appConfig } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'app_config')
      .single()

    if (appConfig?.value) {
      config.voice_enabled = appConfig.value.voice_recognition_enabled ?? true
      config.image_enabled = appConfig.value.image_recognition_enabled ?? true
    }
  } catch (error: any) {
    console.error('加载配置失败:', error.message)
  }
}

async function saveConfig() {
  saving.value = true
  try {
    await supabase
      .from('app_settings')
      .upsert({
        key: 'baidu_api_config',
        value: {
          app_id: config.baidu_app_id,
          api_key: config.baidu_api_key,
          secret_key: config.baidu_secret_key
        },
        description: '百度语音识别和图片识别 API 配置'
      })

    await supabase
      .from('app_settings')
      .upsert({
        key: 'app_config',
        value: {
          voice_recognition_enabled: config.voice_enabled,
          image_recognition_enabled: config.image_enabled,
          voice_guidance_enabled: true,
          elderly_mode_enabled: true
        },
        description: '应用功能开关配置'
      })

    ElMessage.success('保存成功')
  } catch (error: any) {
    ElMessage.error('保存失败：' + error.message)
  } finally {
    saving.value = false
  }
}

async function testConnection() {
  if (!config.baidu_api_key || !config.baidu_secret_key) {
    ElMessage.warning('请先填写 API Key 和 Secret Key')
    return
  }

  try {
    const response = await fetch(
      `https://openapi.baidu.com/oauth/2.0/token?grant_type=client_credentials&client_id=${config.baidu_api_key}&client_secret=${config.baidu_secret_key}`
    )

    const data = await response.json()

    if (data.access_token) {
      ElMessage.success('连接成功！Token 有效期：' + (data.expires_in / 3600).toFixed(1) + ' 小时')
    } else {
      ElMessage.error('连接失败：' + (data.error_description || '未知错误'))
    }
  } catch (error: any) {
    ElMessage.error('连接失败：' + error.message)
  }
}

function handleLogout() {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    authStore.logout()
    router.push('/login')
  })
}

onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  display: flex;
  flex-direction: column;
}

.sidebar-logo {
  padding: 24px;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-nav {
  padding: 16px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.nav-icon {
  font-size: 20px;
}

.main-content {
  flex: 1;
  background: #f5f5f5;
}

.header {
  background: white;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-email {
  color: #666;
  font-size: 14px;
}

.content {
  padding: 24px;
}

h3 {
  margin-bottom: 0;
  color: #333;
}

ul {
  margin: 0;
  padding-left: 20px;
}

a {
  color: #409eff;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
