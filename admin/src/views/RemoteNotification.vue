<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import { User, Bell, Mic, Phone, Document, VideoPlay } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

interface UserProfile {
  id: string
  username: string | null
  phone: string | null
}

const loading = ref(false)
const sending = ref(false)
const users = ref<UserProfile[]>([])
const selectedUserId = ref('')
const selectedTypes = ref<string[]>([])
const title = ref('')
const message = ref('')

const notificationTypes = [
  { label: '声音', value: 'sound', icon: Mic, color: '#3b82f6' },
  { label: '震动', value: 'vibration', icon: Phone, color: '#8b5cf6' },
  { label: '横幅', value: 'banner', icon: Bell, color: '#06b6d4' },
  { label: '系统通知', value: 'system', icon: Document, color: '#22c55e' }
]

async function loadUsers() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, phone')
      .order('created_at', { ascending: false })

    if (error) throw error
    users.value = data || []
  } catch (error) {
    console.error('加载用户失败:', error)
    ElMessage.error('加载用户失败')
  } finally {
    loading.value = false
  }
}

async function sendNotification() {
  if (!selectedUserId.value) {
    ElMessage.warning('请选择用户')
    return
  }
  if (selectedTypes.value.length === 0) {
    ElMessage.warning('请至少选择一种通知类型')
    return
  }
  if (!message.value.trim()) {
    ElMessage.warning('请输入通知内容')
    return
  }

  sending.value = true
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { error } = await supabase
      .from('remote_notifications')
      .insert({
        user_id: selectedUserId.value,
        notification_type: selectedTypes.value,
        title: title.value.trim() || null,
        message: message.value.trim(),
        sent_by: user.id
      })

    if (error) throw error

    ElMessage.success('通知已发送')

    // 重置表单
    selectedTypes.value = []
    title.value = ''
    message.value = ''
  } catch (error: any) {
    console.error('发送通知失败:', error)
    ElMessage.error('发送通知失败：' + error.message)
  } finally {
    sending.value = false
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<template>
  <div class="remote-notification">
    <div class="page-header">
      <div class="header-content">
        <el-icon class="header-icon"><VideoPlay /></el-icon>
        <div class="header-text">
          <h2>通知演示</h2>
          <p class="desc">远程触发用户 App 上的通知提醒</p>
        </div>
      </div>
    </div>

    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <el-icon><Bell /></el-icon>
          <span>发送通知</span>
        </div>
      </template>

      <el-form label-width="100px" label-position="top">
        <el-form-item label="选择用户" required>
          <el-select
            v-model="selectedUserId"
            placeholder="请选择用户"
            style="width: 100%"
            :loading="loading"
            filterable
          >
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="user.username || user.phone || '未知用户'"
              :value="user.id"
            >
              <div class="user-option">
                <el-avatar :size="24" :icon="User" style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); margin-right: 8px;" />
                <span>{{ user.username || user.phone || '未知用户' }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="通知类型" required>
          <div class="type-selector">
            <el-checkbox-group v-model="selectedTypes">
              <el-checkbox
                v-for="type in notificationTypes"
                :key="type.value"
                :value="type.value"
                border
                class="type-checkbox"
              >
                <div class="checkbox-content">
                  <el-icon :color="type.color"><component :is="type.icon" /></el-icon>
                  <span>{{ type.label }}</span>
                </div>
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </el-form-item>

        <el-form-item label="通知标题">
          <el-input
            v-model="title"
            placeholder="可选，系统通知的标题"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="通知内容" required>
          <el-input
            v-model="message"
            type="textarea"
            placeholder="请输入通知内容"
            maxlength="200"
            show-word-limit
            :rows="4"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="sending"
            @click="sendNotification"
            style="width: 100%"
          >
            <el-icon><Bell /></el-icon>
            发送通知
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="hint-card">
      <template #header>
        <div class="card-header">
          <el-icon><VideoPlay /></el-icon>
          <span>使用说明</span>
        </div>
      </template>
      <div class="hint-content">
        <el-icon :size="20" color="#f59e0b"><VideoPlay /></el-icon>
        <div class="hints">
          <p><strong>注意：</strong></p>
          <ul>
            <li>用户需要打开 App 并在首页运行状态才能收到通知</li>
            <li>支持多类型组合选择，如同时选择声音 + 震动 + 横幅</li>
            <li>通知发送后，用户会立即收到提醒</li>
            <li>可在后台查看通知发送状态</li>
          </ul>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.remote-notification {
  width: 100%;
  max-width: 100%;
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #fde68a;
}

.header-icon {
  font-size: 36px;
  color: #d97706;
}

.header-text h2 {
  margin: 0 0 4px 0;
  color: #92400e;
  font-size: 20px;
  font-weight: 700;
}

.header-text .desc {
  color: #78350f;
  margin: 0;
  font-size: 13px;
}

.form-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #374151;
  font-size: 15px;
}

.card-header .el-icon {
  color: #3b82f6;
}

.user-option {
  display: flex;
  align-items: center;
}

.type-selector {
  width: 100%;
}

.type-checkbox {
  margin-right: 16px;
  margin-bottom: 12px;
}

.checkbox-content {
  display: flex;
  align-items: center;
  gap: 6px;
}

.hint-card {
  border: 1px solid #fef3c7;
}

.hint-content {
  display: flex;
  gap: 12px;
  padding: 8px 0;
}

.hint-content .hints {
  flex: 1;
}

.hint-content .hints p {
  margin: 0 0 8px 0;
  color: #78350f;
}

.hint-content .hints ul {
  margin: 0;
  padding-left: 20px;
  color: #92400e;
}

.hint-content .hints li {
  margin-bottom: 4px;
}
</style>
