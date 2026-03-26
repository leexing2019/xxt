# 远程通知演示功能 - 测试验证指南

## 前置条件

1. **数据库表已创建**：执行 `sql/create-remote-notifications-table.sql`
2. **App 已重新编译**：代码修改后需要重新运行 App
3. **后台前端已重新编译**：`npm run dev:h5`

---

## 测试步骤

### Step 1: 验证数据库表创建

在 Supabase Dashboard 的 SQL Editor 中执行：

```sql
-- 验证表是否存在
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'remote_notifications';

-- 验证 Realtime 是否启用
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' AND tablename = 'remote_notifications';
```

预期结果：
- 表 `remote_notifications` 存在
- Realtime 发布已配置

---

### Step 2: 后台发送测试通知

1. 打开后台管理系统（`http://localhost:5173` 或你的本地地址）
2. 登录管理员账号
3. 点击左侧菜单 **"通知演示"**
4. 在页面中：
   - **选择用户**：从下拉框选择一个测试用户
   - **通知类型**：勾选 ☑ 声音 ☑ 震动 ☑ 横幅
   - **通知标题**：输入 "测试通知"
   - **通知内容**：输入 "这是一条测试消息，请确认是否收到"
5. 点击 **"发送通知"** 按钮

预期结果：
- 显示 "通知已发送" 成功提示

---

### Step 3: App 接收测试

1. 在测试用户的手机上打开 App（确保在首页）
2. 观察是否收到通知：
   - 🔊 **声音**：应听到提示音播放 3 次
   - 📳 **震动**：应感受到连续震动 3 次
   - 💬 **横幅**：应显示 toast 消息 "这是一条测试消息，请确认是否收到"

---

### Step 4: 验证通知状态

在 Supabase Dashboard 执行：

```sql
SELECT
  rn.created_at,
  rn.notification_type,
  rn.title,
  rn.message,
  rn.status,
  p.username,
  p.phone
FROM remote_notifications rn
LEFT JOIN profiles p ON rn.user_id = p.id
ORDER BY rn.created_at DESC
LIMIT 5;
```

预期结果：
- 最新一条记录的 `status` 应为 `delivered`
- `notification_type` 应为 `["sound","vibration","banner"]`（数组格式）

---

## 常见问题排查

### 问题 1: App 没有收到通知

**检查点：**
1. App 是否在首页运行（`pages/index/index.vue`）
2. 控制台是否有 `[RemoteNotification] 监听已启动` 日志
3. 用户 ID 是否正确

**解决方法：**
```typescript
// 在 App 控制台手动检查
import { supabase } from '@/services/supabase'
console.log('Channels:', supabase.getChannels())
```

---

### 问题 2: 发送通知报错

**可能错误：**
- `42501: permission denied for table remote_notifications` → RLS 策略问题
- `null value in column "user_id"` → 用户选择器未正确赋值

**解决方法：**
```sql
-- 检查 RLS 策略
SELECT * FROM pg_policies WHERE tablename = 'remote_notifications';

-- 重新创建策略（如果需要）
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON remote_notifications;
CREATE POLICY "Authenticated users can insert notifications" ON remote_notifications
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = sent_by);
```

---

### 问题 3: 通知状态未更新为 delivered

**检查点：**
1. App 端 Realtime 回调是否执行
2. 更新 SQL 是否有权限

**调试代码：**
在 `src/services/remote-notification.ts` 的回调中添加：
```typescript
console.log('[RemoteNotification] 收到通知，类型:', notif.notification_type)
console.log('[RemoteNotification] 准备更新状态，ID:', notif.id)
```

---

## 验收标准

- [ ] 数据库表 `remote_notifications` 创建成功
- [ ] Realtime 已启用（可在 Supabase Dashboard 验证）
- [ ] 后台可以选择用户并发送通知
- [ ] App 前台运行时收到通知
- [ ] 声音、震动、横幅至少一种类型生效
- [ ] 通知状态自动更新为 `delivered`

---

## 性能优化建议（后续）

1. **添加通知历史页面**：查看已发送的通知记录
2. **限流机制**：防止短时间内发送大量通知
3. **后台任务清理**：定期清理 30 天前的通知记录

```sql
-- 创建清理函数（可选）
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM remote_notifications
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
```
