# 用户添加药品来源显示错误修复文档

## 问题描述

**症状**：用户在前端添加药品后，管理后台显示"管理员导入"而非"用户添加"。

**影响**：
- 无法正确追踪药品来源
- 用户添加的药品被错误标记为管理员导入
- 影响数据统计和权限管理

## 根本原因

在 `src/store/medication.ts` 的 `addMedication` 函数中：

```typescript
// 问题代码（第 144-148 行）
if (existingRows && existingRows.length > 0) {
  // 药品已存在，直接返回现有 ID
  console.log('[addMedication] 药品已存在:', existingRows[0].id)
  return { success: true, data: { id: existingRows[0].id, ...medication } }
}
```

**问题**：当药品已存在但 `created_by` 为 NULL（管理员导入）时，代码没有更新 `created_by` 字段，导致用户添加的药品仍然显示为"管理员导入"。

## 修复方案

### 1. 修改前端代码（`src/store/medication.ts`）

在检测到药品已存在时，检查 `created_by` 字段：
- 如果为 NULL，更新为当前用户 ID
- 如果不为 NULL，保持原有值（可能是其他用户添加的）

```typescript
if (existingRows && existingRows.length > 0) {
  const existingMed = existingRows[0]
  console.log('[addMedication] 药品已存在:', existingMed.id, 'created_by:', existingMed.created_by)

  // 如果药品是管理员导入的（created_by 为 NULL），更新为当前用户
  if (!existingMed.created_by) {
    console.log('[addMedication] 药品是管理员导入的，更新 created_by 为当前用户:', authStore.userId)
    const { error: updateError } = await supabase
      .from('common_medications')
      .update({ created_by: authStore.userId })
      .eq('id', existingMed.id)

    if (updateError) {
      console.error('[addMedication] 更新 created_by 失败:', updateError)
    }
  }

  return { success: true, data: { id: existingMed.id, ...medication } }
}
```

### 2. 更新 RLS 策略（`sql/fix-rls-policy.sql`）

确保用户有权限更新 `created_by` 为 NULL 的药品：

```sql
-- 允许认证用户更新药品，但只能更新自己添加的药品
-- 或者更新 created_by 为 NULL 的药品（管理员导入的，可以认领）
CREATE POLICY "authenticated_users_can_update" ON common_medications
  FOR UPDATE TO authenticated
  USING (
    created_by IS NULL OR created_by = auth.uid()
  )
  WITH CHECK (
    created_by IS NULL OR created_by = auth.uid()
  );
```

### 3. 修复现有数据（`sql/fix-created-by-source.sql`）

将用户已拥有但 `created_by` 为 NULL 的药品，更新为对应的用户 ID：

```sql
-- 更新 common_medications 表，将用户添加但 created_by 为 NULL 的药品更新为用户 ID
UPDATE common_medications cm
SET created_by = (
  SELECT MIN(ms.user_id)
  FROM medication_schedules ms
  WHERE ms.medication_id = cm.id
  GROUP BY ms.medication_id
)
WHERE cm.created_by IS NULL
AND EXISTS (
  SELECT 1 FROM medication_schedules ms
  WHERE ms.medication_id = cm.id
);
```

## 执行步骤

### 第 1 步：执行 SQL 修复脚本

1. 打开 https://app.supabase.com/project/vqtrfkigzqtcthrivbzn/sql/new
2. 执行 `sql/fix-created-by-source.sql` - 修复现有数据
3. 执行 `sql/fix-rls-policy.sql` - 更新 RLS 策略

### 第 2 步：部署前端代码

代码已修改在 `src/store/medication.ts`，重新构建并部署：

```bash
npm run build:h5
```

### 第 3 步：验证修复

1. 使用用户账号（如 `lx`）登录前端
2. 添加一个新药品（如"维生素 C 片"）
3. 打开管理后台，查看该药品的"添加者"列
4. 应该显示"用户添加"和对应的邮箱

## 技术细节

### 数据库表结构

**common_medications 表**：
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| name | text | 药品名称 |
| created_by | uuid | 添加者 ID（关联 auth.users） |
| created_at | timestamptz | 创建时间 |

**medication_schedules 表**：
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| user_id | uuid | 用户 ID |
| medication_id | uuid | 药品 ID（关联 common_medications） |

### 药品来源判断逻辑

```sql
-- 在 admin_medication_sources 视图中
CASE
  WHEN cm.created_by IS NULL THEN '管理员导入'
  ELSE '用户添加'
END AS source_type
```

### 边界情况处理

1. **药品被多个用户添加**：使用 `MIN(user_id)`，记录最早添加的用户
2. **管理员导入的药品被用户认领**：更新 `created_by` 为用户 ID
3. **用户删除自己的用药计划**：不删除 `common_medications` 记录，保留药品数据

## 相关文件

- `src/store/medication.ts` - 前端药品 store
- `sql/fix-created-by-source.sql` - 修复现有数据
- `sql/fix-rls-policy.sql` - 更新 RLS 策略
- `sql/diagnose-admin-view.sql` - 诊断脚本
- `admin/src/views/Medications.vue` - 后台药品管理页面

## 注意事项

⚠️ **数据一致性**：修复脚本会将"管理员导入"的药品重新标记为"用户添加"，这可能会影响统计数据。

⚠️ **多用户场景**：如果一个药品被多个用户添加，只会记录一个用户 ID（最早的）。

⚠️ **权限控制**：RLS 策略限制了用户只能更新自己添加的药品或"管理员导入"的药品。

## 历史修复记录

- **2026-03-24**: 首次修复，添加 `created_by` 字段
- **2026-03-25**: 修复用户添加来源显示错误，修改 `addMedication` 逻辑
