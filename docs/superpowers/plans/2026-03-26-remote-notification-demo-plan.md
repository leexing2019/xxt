# 远程通知演示功能实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 为后台管理系统添加远程通知演示功能，允许管理员选择用户并远程触发其 App 上的声音、震动、横幅提醒。

**Architecture:** 使用 Supabase Realtime 监听数据库变化，App 端建立订阅接收通知，后台通过插入记录触发通知。

**Tech Stack:** Supabase PostgreSQL + Realtime, Vue 3 + TypeScript + Element Plus, uni-app

---

### Task 1: 创建数据库表和 RLS 策略

**Files:**
- Create: `sql/create-remote-notifications-table.sql`

**Step 1: 创建 SQL 文件**

```sql
-- 远程通知演示表
-- 创建日期：2026-03-26
-- 用途：支持后台管理系统远程触发 App 通知

-- 创建表
CREATE TABLE IF NOT EXISTS remote_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  notification_type TEXT NOT NULL,
  title TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建监听索引
CREATE INDEX IF NOT EXISTS idx_remote_notifications_user_created
ON remote_notifications(user_id, created_at DESC);

-- RLS 策略
ALTER TABLE remote_notifications ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的通知
DROP POLICY IF EXISTS "Users can view own notifications" ON remote_notifications;
CREATE POLICY "Users can view own notifications" ON remote_notifications
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 认证用户可以插入通知（发送）
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON remote_notifications;
CREATE POLICY "Authenticated users can insert notifications" ON remote_notifications
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = sent_by);

-- 用户可以更新自己通知的状态
DROP POLICY IF EXISTS "Users can update own notifications" ON remote_notifications;
CREATE POLICY "Users can update own notifications" ON remote_notifications
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- 启用 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE remote_notifications;
```

**Step 2: 执行 SQL**

在 Supabase Dashboard 的 SQL Editor 中执行上述 SQL。

**Step 3: 验证**

```sql
-- 验证表创建
SELECT * FROM remote_notifications LIMIT 1;

-- 验证 Realtime 已启用
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

**Step 4: Commit**

```bash
git add sql/create-remote-notifications-table.sql
git commit -m "feat: create remote_notifications table with RLS and Realtime"
```

---

### Task 2: 创建 App 端远程通知服务

**Files:**
- Create: `src/services/remote-notification.ts`

**Step 1: 创建服务文件**

```typescript
import { supabase } from './supabase'
import { playReminderSound, vibrate } from './reminder'

let notificationChannel: any = null
let currentUserId: string | null = null

/**
 * 启动远程通知监听
 * @param userId 当前用户 ID
 */
export function startRemoteNotificationListener(userId: string) {
  if (notificationChannel) {
    console.warn('[RemoteNotification] 监听已存在，先停止')
    stopRemoteNotificationListener()
  }

  currentUserId = userId

  notificationChannel = supabase
    .channel('remote-notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'remote_notifications',
        filter: `user_id=eq.${userId}`
      },
      async (payload: any) => {
        const notif = payload.new
        console.log('[RemoteNotification] 收到远程通知:', notif)

        // 根据类型触发提醒
        const types = Array.isArray(notif.notification_type)
          ? notif.notification_type
          : [notif.notification_type]

        for (const type of types) {
          switch (type) {
            case 'sound':
              playSoundAlert()
              break
            case 'vibration':
              playVibrationAlert()
              break
            case 'banner':
              showBannerAlert(notif.message)
              break
            case 'system':
              showSystemAlert(notif.title, notif.message)
              break
          }
        }

        // 标记为已送达
        try {
          await supabase
            .from('remote_notifications')
            .update({ status: 'delivered' })
            .eq('id', notif.id)
        } catch (error) {
          console.error('[RemoteNotification] 更新状态失败:', error)
        }
      }
    )
    .subscribe()

  console.log('[RemoteNotification] 监听已启动')
}

/**
 * 停止远程通知监听
 */
export function stopRemoteNotificationListener() {
  if (notificationChannel) {
    supabase.removeChannel(notificationChannel)
    notificationChannel = null
    console.log('[RemoteNotification] 监听已停止')
  }
}

/**
 * 播放声音提醒（循环 3 次）
 */
async function playSoundAlert() {
  for (let i = 0; i < 3; i++) {
    playReminderSound()
    await new Promise(resolve => setTimeout(resolve, 500))
  }
}

/**
 * 播放震动提醒（连续 3 次）
 */
async function playVibrationAlert() {
  for (let i = 0; i < 3; i++) {
    vibrate()
    await new Promise(resolve => setTimeout(resolve, 300))
  }
}

/**
 * 显示横幅提醒
 */
function showBannerAlert(message: string) {
  uni.showToast({
    title: message,
    icon: 'none',
    duration: 3000
  })
}

/**
 * 显示系统通知
 */
function showSystemAlert(title: string | null, message: string) {
  // #ifdef APP-PLUS
  const UE = uni.requireNativePlugin('UENotification')
  if (UE) {
    UE.showLocalNotification({
      title: title || '远程通知',
      content: message,
      payload: '',
      trigger: {
        type: 'once'
      }
    })
  }
  // #endif

  // H5 降级
  // #ifdef H5
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title || '远程通知', {
      body: message,
      icon: '/static/logo.png'
    })
  }
  // #endif
}
```

**Step 2: Commit**

```bash
git add src/services/remote-notification.ts
git commit -m "feat: add remote notification service with Realtime listener"
```

---

### Task 3: 在 App 首页集成通知监听

**Files:**
- Modify: `src/pages/index/index.vue`

**Step 1: 修改首页组件**

在 `onMounted` 中启动监听，在 `onUnmounted` 中停止：

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import { startRemoteNotificationListener, stopRemoteNotificationListener } from '@/services/remote-notification'

const authStore = useAuthStore()

onMounted(async () => {
  // 等待用户登录
  if (authStore.userId) {
    startRemoteNotificationListener(authStore.userId)
  }
})

onUnmounted(() => {
  stopRemoteNotificationListener()
})
</script>
```

**Step 2: Commit**

```bash
git add src/pages/index/index.vue
git commit -m "feat: integrate remote notification listener in home page"
```

---

### Task 4: 创建后台通知演示页面

**Files:**
- Create: `admin/src/views/RemoteNotification.vue`

**Step 1: 创建页面组件**

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import { User, Bell, Sound, Phone, Document, VideoPlay } from '@element-plus/icons-vue'
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
  { label: '声音', value: 'sound', icon: Sound, color: '#3b82f6' },
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
```

**Step 2: 添加路由**

修改 `admin/src/router.ts`，添加新路由：

```typescript
{
  path: '/remote-notification',
  name: 'RemoteNotification',
  component: () => import('@/views/RemoteNotification.vue'),
  meta: { title: '通知演示', icon: 'VideoPlay' }
}
```

**Step 3: 添加到菜单**

修改 `admin/src/App.vue` 或菜单组件，在左侧菜单添加"通知演示"项。

**Step 4: Commit**

```bash
git add admin/src/views/RemoteNotification.vue admin/src/router.ts admin/src/App.vue
git commit -m "feat: add remote notification demo page with user selector"
```

---

### Task 5: 测试验证

**Step 1: 数据库验证**

```sql
-- 查看已发送的通知
SELECT
  rn.created_at,
  rn.notification_type,
  rn.message,
  rn.status,
  p.username,
  p.phone
FROM remote_notifications rn
LEFT JOIN profiles p ON rn.user_id = p.id
ORDER BY rn.created_at DESC
LIMIT 10;
```

**Step 2: 功能测试**

1. 打开后台管理系统，进入"通知演示"页面
2. 选择一个用户
3. 勾选"声音"、"震动"、"横幅"三种类型
4. 输入测试消息："这是一条测试通知"
5. 点击"发送通知"
6. 在用户的手机上打开 App，确认收到通知

**Step 3: 验证 Realtime 连接**

在 App 控制台查看是否有 `[RemoteNotification] 监听已启动` 日志。

---

### Task 6: 文档更新（可选）

**Files:**
- Modify: `admin/README.md`

添加新功能说明到 README。

**Step 1: Commit**

```bash
git add admin/README.md
git commit -m "docs: update README with remote notification feature"
```

---

## 验收标准

1. [ ] 数据库表 `remote_notifications` 创建成功
2. [ ] Realtime 已启用（在 Supabase Dashboard 可验证）
3. [ ] App 首页启动时自动建立监听
4. [ ] 后台可以选择用户并发送通知
5. [ ] 用户 App 收到通知后显示对应提醒（声音/震动/横幅）
6. [ ] 通知状态更新为 `delivered`
