<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { User, Lock, UserFilled } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const showTestAccount = ref(false)

async function handleLogin() {
  error.value = ''

  if (!email.value || !password.value) {
    error.value = '请输入邮箱和密码'
    return
  }

  const result = await authStore.login(email.value, password.value)

  if (result.success) {
    router.push('/dashboard')
  } else {
    error.value = result.error || '登录失败'
  }
}

function useTestAccount() {
  email.value = 'test@medication.local'
  password.value = 'test123456'
  showTestAccount.value = false
}
</script>

<template>
  <div class="login-container">
    <div class="login-background">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
    </div>

    <el-card class="login-card">
      <div class="login-header">
        <span class="logo">💊</span>
        <h1>用药助手后台管理系统</h1>
        <p class="subtitle">AI Medication Assistant Admin</p>
      </div>

      <el-form @submit.prevent="handleLogin">
        <el-form-item>
          <el-input
            v-model="email"
            type="email"
            placeholder="管理员邮箱"
            size="large"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-input
            v-model="password"
            type="password"
            placeholder="密码"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-alert
          v-if="error"
          :title="error"
          type="error"
          :closable="false"
          show-icon
          style="margin-bottom: 20px"
        />

        <el-button
          type="primary"
          size="large"
          :loading="authStore.loading"
          @click="handleLogin"
          style="width: 100%"
        >
          {{ authStore.loading ? '登录中...' : '登录' }}
        </el-button>

        <div style="text-align: center; margin-top: 16px;">
          <el-button type="info" size="small" @click="showTestAccount = !showTestAccount">
            使用测试账号
          </el-button>
        </div>

        <el-collapse-transition>
          <div v-if="showTestAccount" class="test-account-tip">
            <el-alert
              title="测试账号"
              type="info"
              :closable="false"
              show-icon
            >
              <template #title>
                <div class="tip-content">
                  <p>由于 Supabase 未配置，请使用以下任意方式：</p>
                  <ol>
                    <li>在 Supabase 控制台创建账号</li>
                    <li>使用邮箱：<code>test@medication.local</code></li>
                    <li>密码：<code>test123456</code></li>
                  </ol>
                  <el-button type="primary" size="small" @click="useTestAccount">填充测试账号</el-button>
                </div>
              </template>
            </el-alert>
          </div>
        </el-collapse-transition>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.login-background {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 0;
}

.shape {
  position: absolute;
  border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
  animation: morph 8s ease-in-out infinite;
  opacity: 0.1;
}

.shape-1 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #fff 0%, #f0f0f0 100%);
  top: -100px;
  right: -100px;
  animation-delay: 0s;
}

.shape-2 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #f0f0f0 0%, #fff 100%);
  bottom: -50px;
  left: -50px;
  animation-delay: 2s;
}

.shape-3 {
  width: 250px;
  height: 250px;
  background: linear-gradient(135deg, #fff 0%, #e0e0e0 100%);
  top: 50%;
  left: 50%;
  animation-delay: 4s;
}

@keyframes morph {
  0%, 100% {
    border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
  }
  50% {
    border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%;
  }
}

.login-card {
  width: 440px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: none;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  z-index: 1;
  position: relative;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
  padding-top: 20px;
}

.logo {
  font-size: 72px;
  display: block;
  margin-bottom: 16px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

h1 {
  font-size: 26px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  font-weight: 400;
}

.el-form-item {
  margin-bottom: 20px;
}

:deep(.el-input__wrapper) {
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  padding: 20px;
  transition: all 0.3s ease;
}

:deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
}

:deep(.el-button--primary:active) {
  transform: translateY(0);
}

:deep(.el-alert) {
  border-radius: 8px;
}

.test-account-tip {
  margin-top: 16px;
}

.tip-content {
  font-size: 13px;
  line-height: 1.8;
}

.tip-content ol {
  margin: 8px 0;
  padding-left: 20px;
}

.tip-content code {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  color: #0369a1;
}

.tip-content .el-button {
  margin-top: 12px;
}
</style>
