# 远程通知演示功能设计文档

## 概述

为后台管理系统添加一个演示功能，允许管理员选择特定用户并远程触发其手机 App 上的提醒通知（声音、震动、横幅、系统通知）。

## 设计目标

1. **演示用途**：展示 App 的通知能力，用于测试和演示
2. **简单实现**：使用 Supabase Realtime，无需配置 Firebase 推送
3. **多类型通知**：支持声音、震动、横幅、系统通知四种类型，可组合使用
4. **前台运行**：仅支持 App 在前台运行时接收通知（简化实现）

## 架构设计

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Admin Backend  │      │   Supabase DB    │      │   User's App    │
│                 │      │                  │      │                 │
│  - 用户选择器    │─────>│  remote_notifs   │─────│  Realtime 监听   │
│  - 通知类型选择   │      │  表              │      │  - 声音         │
│  - 发送按钮      │      │                  │      │  - 震动         │
└─────────────────┘      └──────────────────┘      └─────────────────┘
```

## 数据库设计

### 表：`remote_notifications`

```sql
CREATE TABLE remote_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  notification_type TEXT NOT NULL,  -- 'sound', 'vibration', 'banner', 'system'
  title TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',    -- 'pending', 'delivered'
  sent_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 监听索引
CREATE INDEX idx_remote_notifications_user_created ON remote_notifications(user_id, created_at DESC);
```

### RLS 策略

```sql
-- 允许认证用户查看发送给自己的通知
CREATE POLICY "Users can view own notifications" ON remote_notifications
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 允许认证用户发送通知（管理员功能）
CREATE POLICY "Authenticated users can insert notifications" ON remote_notifications
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = sent_by);

-- 允许更新自己通知的状态
CREATE POLICY "Users can update own notifications" ON remote_notifications
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);
```

## App 端设计

### 监听位置

在 `src/pages/index/index.vue` 的 `onMounted` 中建立 Realtime 订阅。

### 订阅逻辑

```typescript
const channel = supabase
  .channel('remote-notifications')
  .on('postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'remote_notifications',
      filter: `user_id=eq.${userId}`
    },
    async (payload) => {
      const notif = payload.new
      // 根据类型触发对应提醒
      if (notif.notification_type === 'sound') playSound()
      if (notif.notification_type === 'vibration') vibrate()
      if (notif.notification_type === 'banner') showBanner(notif.message)
      if (notif.notification_type === 'system') showSystemNotification(notif)

      // 标记为已送达
      await supabase
        .from('remote_notifications')
        .update({ status: 'delivered' })
        .eq('id', notif.id)
    })
  .subscribe()
```

### 通知实现

| 类型 | 实现方式 | 文件位置 |
|------|---------|---------|
| 声音 | `playReminderSound()` 循环播放 3 次 | `src/services/reminder.ts:183` |
| 震动 | `uni.vibrateShort()` 连续 3 次 | `src/services/reminder.ts:170` |
| 横幅 | `uni.showToast()` 或自定义弹窗 | 多处 |
| 系统通知 | `showLocalNotification()` | `src/services/reminder.ts:46` |

## 后台前端设计

### 菜单位置

左侧菜单新增"通知演示"菜单项，路由 `/remote-notification`。

### 页面组件

**文件：** `admin/src/views/RemoteNotification.vue`

### 功能模块

1. **用户选择器**：下拉框，从 `profiles` 表加载所有用户
2. **通知类型选择**：四个复选框（声音、震动、横幅、系统通知）
3. **标题输入**：可选，系统通知的标题
4. **消息输入**：必填，通知内容
5. **发送按钮**：调用 Supabase 插入记录

## 技术栈

- **数据库**：Supabase PostgreSQL + Realtime
- **前端**：Vue 3 + TypeScript + Element Plus
- **App**：uni-app + Vue 3

## 错误处理

1. **Realtime 连接失败**：在 App 启动时重试连接
2. **发送失败**：后台显示错误提示
3. **用户未登录**：App 端不建立订阅

## 安全考虑

1. **RLS 策略**：确保用户只能查看自己的通知
2. **认证要求**：只有认证用户才能发送通知
3. **限流**：后续可添加发送频率限制

## 测试方案

1. **后台发送**：在后台选择一个用户，发送测试通知
2. **App 接收**：打开 App 首页，确认收到通知
3. **多类型测试**：分别测试声音、震动、横幅、系统通知
