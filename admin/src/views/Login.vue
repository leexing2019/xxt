<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="login-title">用药助手管理后台</h1>
      <p class="login-subtitle">AI Medication Assistant Admin</p>

      <el-form :model="form" @submit.prevent="handleLogin">
        <el-form-item label="邮箱">
          <el-input
            v-model="form.email"
            type="email"
            placeholder="请输入邮箱"
            size="large"
          />
        </el-form-item>

        <el-form-item label="密码">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-button
          type="primary"
          native-type="submit"
          size="large"
          :loading="loading"
          style="width: 100%"
        >
          登录
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const form = reactive({
  email: '',
  password: ''
})

async function handleLogin() {
  if (!form.email || !form.password) {
    ElMessage.warning('请输入邮箱和密码')
    return
  }

  loading.value = true
  const result = await authStore.login(form.email, form.password)

  if (result.success) {
    ElMessage.success('登录成功')
    router.push('/')
  } else {
    ElMessage.error(result.error || '登录失败')
  }

  loading.value = false
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: white;
  padding: 48px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 420px;
}

.login-title {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 8px;
}

.login-subtitle {
  font-size: 14px;
  color: #999;
  text-align: center;
  margin-bottom: 32px;
}
</style>
