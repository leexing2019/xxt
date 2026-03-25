# 药品来源显示问题修复记录

## 问题描述

**症状**：用户在前端添加了一种库里面不存在的药品后，后台管理页面显示来源为"管理员导入"

**根本原因**：
1. `common_medications` 表创建时没有 `created_by` 字段
2. 前端代码虽然传递了 `created_by: authStore.userId`，但数据库字段不存在导致写入失败
3. 后台视图根据 `created_by` 是否为 NULL 判断来源，NULL 显示为"管理员导入"

## 修复方案

### 数据库修复（已执行）

执行文件：`sql/fix-medication-source-complete.sql`

修复内容：
1. 为 `common_medications` 表添加 `created_by UUID` 字段
2. 创建 `created_by` 索引提升查询性能
3. 配置 RLS 策略，确保用户只能设置自己的 `created_by`
4. 重建 `admin_medication_sources` 视图，正确显示来源类型

### 修复结果

- 管理员导入：101 种药品
- 用户添加：5 种药品

## 验证步骤

### 1. 验证数据库表结构

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'common_medications'
AND column_name = 'created_by';
```

应输出：`created_by | uuid`

### 2. 验证 RLS 策略

```sql
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'common_medications';
```

应输出 4 个策略：
- `authenticated_users_can_view` - SELECT
- `authenticated_users_can_insert` - INSERT
- `authenticated_users_can_update` - UPDATE
- `authenticated_users_can_delete` - DELETE

### 3. 验证视图数据

```sql
SELECT id, name, created_by, source_type, added_by_email
FROM admin_medication_sources
ORDER BY created_at DESC
LIMIT 5;
```

### 4. 前端功能测试

1. 在前端添加一种新药品（库中不存在的）
2. 在管理后台查看药品库
3. 确认新药品来源显示为"用户添加"
4. 确认添加者邮箱显示正确

## 相关文件

- 修复脚本：`sql/fix-medication-source-complete.sql`
- 后台管理页面：`admin/src/views/Medications.vue`
- 前端添加逻辑：`src/store/medication.ts` (addMedication 方法)
- 前端服务：`src/services/common-medications.ts`

## 注意事项

1. **RLS 策略**：确保 `created_by` 字段始终能被正确写入
2. **历史数据**：已执行修复脚本将用户已拥有的药品标记为"用户添加"
3. **未来预防**：新增字段时，确保同时更新：
   - 表结构
   - RLS 策略
   - 相关视图
   - 前端代码

## 代码审查要点

在 `src/store/medication.ts` 的 `addMedication` 方法中：

```typescript
// 第 178 行 - 确保 created_by 正确设置
const { data, error } = await supabase
  .from('common_medications')
  .insert({
    name: medication.name,
    // ... 其他字段
    created_by: authStore.userId // 关键字段
  })
```

在 `admin/src/views/Medications.vue` 的视图查询中：

```typescript
// 第 408-412 行 - 使用 admin_medication_sources 视图
let query = supabase
  .from('admin_medication_sources')
  .select('*')
  .order('created_at_with_tz', { ascending: false })
```

## 日期

- 问题发现：2026-03-25
- 修复执行：2026-03-25
- 修复验证：待前端功能测试
