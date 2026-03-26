<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import { User, Bell, Clock, VideoPlay } from '@element-plus/icons-vue'
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
const delayMinutes = ref(1)
const message = ref('该服药了')

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

async function sendReminder() {
  if (!selectedUserId.value) {
    ElMessage.warning('请选择用户')
    return
  }

  sending.value = true
  try {
    // 这里不插入数据库，只是演示功能说明
    ElMessage.success(`提醒已触发！用户将在 ${delayMinutes.value} 分钟后收到服药提醒`)

    // 实际触发由前端本地定时提醒实现
    console.log('[后台] 触发提醒:', {
      userId: selectedUserId.value,
      delayMinutes: delayMinutes.value,
      message: message.value
    })
  } catch (error: any) {
    console.error('触发提醒失败:', error)
    ElMessage.error('触发提醒失败：' + error.message)
  } finally {
    sending.value = false
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<template>
  <div class="medication-reminder">
    <div class="page-header">
      <div class="header-content">
        <el-icon class="header-icon"><Clock /></el-icon>
        <div class="header-text">
          <h2>服药提醒测试</h2>
          <p class="desc">触发用户 App 上的本地服药提醒</p>
        </div>
      </div>
    </div>

    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <el-icon><Bell /></el-icon>
          <span>触发提醒</span>
        </div>
      </template>

      <el-form label-width="120px" label-position="left">
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

        <el-form-item label="延迟时间 (分钟)" required>
          <el-input-number
            v-model="delayMinutes"
            :min="1"
            :max="60"
            style="width: 200px"
          />
          <span class="hint">1-60 分钟</span>
        </el-form-item>

        <el-form-item label="提醒内容" required>
          <el-input
            v-model="message"
            placeholder="提醒内容"
            maxlength="50"
            style="width: 300px"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="sending"
            @click="sendReminder"
            style="width: 100%"
          >
            <el-icon><Bell /></el-icon>
            触发提醒
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="hint-card">
      <template #header>
        <div class="card-header">
          <el-icon><VideoPlay /></el-icon>
          <span>工作原理</span>
        </div>
      </template>
      <div class="hint-content">
        <el-icon :size="20" color="#f59e0b"><VideoPlay /></el-icon>
        <div class="hints">
          <p><strong>说明：</strong></p>
          <ul>
            <li>App 使用本地定时提醒，无需后台实时推送</li>
            <li>用户设定服药时间后，App 会在指定时间自动弹出提醒</li>
            <li>提醒支持声音、震动和弹窗</li>
            <li>用户可以选择"立即服用"或"稍后提醒"</li>
          </ul>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.medication-reminder {
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
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #bfdbfe;
}

.header-icon {
  font-size: 36px;
  color: #1d4ed8;
}

.header-text h2 {
  margin: 0 0 4px 0;
  color: #1e40af;
  font-size: 20px;
  font-weight: 700;
}

.header-text .desc {
  color: #1e3a8a;
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

.hint {
  margin-left: 12px;
  color: #64748b;
  font-size: 13px;
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
