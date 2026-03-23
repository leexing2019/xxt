# 公共药品库改造设计文档

**日期**: 2026-03-23
**作者**: AI Assistant
**状态**: 待审批

---

## 1. 背景与目标

### 1.1 现状问题

当前系统存在数据冗余：
- 同一款药被多个用户添加时，会在 `medications` 表中创建多条重复记录
- 药品信息（厂家、规格、外观等）分散存储，无法统一管理
- 用户删除个人药品后，药品信息完全丢失，无法复用

### 1.2 改造目标

1. **数据统一**：所有药品统一存储在公共药品库（`common_medications` 表）
2. **用户关联**：用户通过关联表引用公共药品，而非复制药品信息
3. **自助添加**：用户可自行添加公共库中没有的药品，直接并入公共库
4. **零冗余**：同款药品在数据库中只有一条记录

---

## 2. 架构设计

### 2.1 改造前后对比

| 维度 | 改造前 | 改造后 |
|------|--------|--------|
| 药品存储 | `medications` (个人) + `common_medications` (公共) | 仅 `common_medications` |
| 用户 - 药品关系 | 复制药品信息到个人库 | 关联表引用公共药品 ID |
| 新增药品 | 仅管理员可添加 | 用户可自助添加至公共库 |
| 数据冗余 | 高（同款药多条记录） | 零（同款药一条记录） |

### 2.2 数据模型

```
┌─────────────────────┐
│ common_medications  │  ← 公共药品库（唯一药品信息源）
├─────────────────────┤
│ id (PK)             │
│ name                │
│ generic_name        │
│ category            │
│ manufacturer        │
│ specification       │
│ form                │
│ appearance_desc     │
│ dosage_unit         │
│ is_active           │
│ created_at          │
│ updated_at          │
└─────────────────────┘
           ▲
           │
           │ user_medication_logs.medication_id
           │
┌─────────────────────┐
│ user_medication_logs│  ← 用户用药记录（新增关联表）
├─────────────────────┤
│ id (PK)             │
│ user_id             │
│ medication_id (FK)  │  ← 关联公共药品
│ dosage              │  ← 用户个人用量
│ time_of_day         │  ← 用户个人服药时间
│ weekdays            │
│ instructions        │
│ is_active           │
│ created_at          │
└─────────────────────┘
           ▲
           │
           │ medication_logs.schedule_id
           │
┌─────────────────────┐
│ medication_logs     │  ← 服药记录（结构不变）
├─────────────────────┤
│ id (PK)             │
│ schedule_id (FK)    │  ← 关联用户用药记录
│ scheduled_time      │
│ taken_time          │
│ status              │
│ notes               │
└─────────────────────┘
```

### 2.3 表结构改造

#### 2.3.1 保留并扩展 `common_medications` 表

```sql
-- 现有表已满足需求，仅需确认索引完整
CREATE INDEX IF NOT EXISTS idx_common_medications_name ON common_medications(name);
CREATE INDEX IF NOT EXISTS idx_common_medications_category ON common_medications(category);
CREATE INDEX IF NOT EXISTS idx_common_medications_active ON common_medications(is_active);
```

#### 2.3.2 清空并移除 `medications` 表

```sql
-- 移除外键约束
ALTER TABLE medication_schedules DROP CONSTRAINT IF EXISTS medication_schedules_medication_id_fkey;

-- 清空并删除个人药品表
DROP TABLE IF EXISTS medications;
```

#### 2.3.3 清空并重构 `medication_schedules` 表

```sql
-- 清空现有数据
TRUNCATE TABLE medication_schedules CASCADE;

-- 修改表结构（移除 medication_id，改为直接关联 common_medications）
-- 注意：medication_schedules 需要保留，因为存储用户个人的用药计划（时间、用量等）
-- 但需要修改关联方式
```

**修正设计**：

实际上，`medication_schedules` 表需要保留 `medication_id` 字段，但它现在指向 `common_medications` 而非原来的 `medications` 表。

新的表结构：
```sql
-- medication_schedules 表改造
ALTER TABLE medication_schedules
  DROP CONSTRAINT IF EXISTS medication_schedules_medication_id_fkey,
  ADD CONSTRAINT medication_schedules_medication_id_fkey
    FOREIGN KEY (medication_id) REFERENCES common_medications(id) ON DELETE CASCADE;
```

#### 2.3.4 新增药品到公共库的表

```sql
-- 可选：如果需要记录谁添加了药品，可以添加创建者字段
ALTER TABLE common_medications
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
```

### 2.4 行级安全策略 (RLS)

```sql
-- common_medications: 所有认证用户可读，所有认证用户可插入（自助添加）
DROP POLICY IF EXISTS "authenticated_users_can_view" ON common_medications;
CREATE POLICY "all_authenticated_users_can_view" ON common_medications
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_users_can_insert" ON common_medications;
CREATE POLICY "all_authenticated_users_can_insert" ON common_medications
  FOR INSERT TO authenticated WITH CHECK (true);

-- 注意：更新和删除仅限管理员（通过管理后台）
DROP POLICY IF EXISTS "authenticated_users_can_update" ON common_medications;
CREATE POLICY "admin_users_can_update" ON common_medications
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_users_can_delete" ON common_medications;
CREATE POLICY "admin_users_can_delete" ON common_medications
  FOR DELETE TO authenticated USING (true);

-- medication_schedules: 用户只能访问自己的用药计划
DROP POLICY IF EXISTS "users_can_view_own_schedules" ON medication_schedules;
CREATE POLICY "users_can_view_own_schedules" ON medication_schedules
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_can_insert_own_schedules" ON medication_schedules;
CREATE POLICY "users_can_insert_own_schedules" ON medication_schedules
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_can_update_own_schedules" ON medication_schedules;
CREATE POLICY "users_can_update_own_schedules" ON medication_schedules
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_can_delete_own_schedules" ON medication_schedules;
CREATE POLICY "users_can_delete_own_schedules" ON medication_schedules
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

---

## 3. 前端改造

### 3.1 添加药品页面 (`src/pages/add-medication/add-medication.vue`)

**改造点**：

1. **步骤 1 - 选择药品**：
   - 保留从公共库选择药品的功能
   - 添加"新增药品到公共库"按钮
   - 新增药品表单：只需输入药名，其他信息可选

2. **选中药品逻辑**：
   - 选中药品后，直接使用 `common_medication_id`
   - 不再创建个人药品记录

3. **确认添加逻辑**：
   - 直接创建 `medication_schedules` 记录
   - `medication_id` 指向选中的公共药品

**伪代码**：
```typescript
// 选中公共库药品
function selectCommonMedication(med: CommonMedication) {
  selectedMedication.value = med
  // 直接使用公共药品 ID，不再复制到个人库
}

// 添加新药到公共库
async function addNewCommonMedication(name: string) {
  const { data, error } = await supabase
    .from('common_medications')
    .insert({
      name,
      category: '其他', // 默认分类
      is_active: true
    })
    .select()
    .single()

  if (data) {
    // 选中新添加的药品
    selectedMedication.value = data
    // 刷新公共库列表
    await fetchCommonMedications()
  }
}

// 确认添加用药计划
async function confirmAdd() {
  // 直接创建用药计划，关联公共药品
  await medicationStore.addSchedule({
    medication_id: selectedMedication.value.id, // 公共药品 ID
    user_id: authStore.userId,
    time_of_day: schedule.time_of_day,
    dosage: `${schedule.dosage}${dosageUnits[dosageUnitIndex.value]}`,
    weekdays: schedule.weekdays,
    start_date: schedule.start_date
  })
}
```

### 3.2 药品列表页面 (`src/pages/medication-list/medication-list.vue`)

**改造点**：

1. **数据来源**：
   - 从 `medication_schedules` 表读取，关联 `common_medications`
   - 查询示例：
   ```sql
   SELECT
     s.id,
     s.medication_id,
     s.dosage,
     s.time_of_day,
     m.name,
     m.generic_name,
     m.image_url
   FROM medication_schedules s
   JOIN common_medications m ON s.medication_id = m.id
   WHERE s.user_id = $1 AND s.is_active = true
   ```

2. **编辑逻辑**：
   - 编辑的是 `medication_schedules` 记录
   - 药品基本信息不可编辑（来自公共库）

3. **删除逻辑**：
   - 删除 `medication_schedules` 记录
   - 不影响公共库中的药品

### 3.3 首页/今日用药 (`src/pages/index/index.vue`)

**改造点**：

- 数据来源改为 `medication_schedules` + `common_medications` 联表查询
- 药品信息显示公共库中的数据

### 3.4 新增服务：用户添加药品到公共库

```typescript
// src/services/common-medications.ts 新增方法
export async function addCommonMedication(medication: {
  name: string
  generic_name?: string
  category?: string
  manufacturer?: string
  specification?: string
  form?: string
  appearance_desc?: string
  dosage_unit?: string
}): Promise<{ success: boolean; data?: CommonMedication; error?: string }> {
  const { data, error } = await supabase
    .from('common_medications')
    .insert(medication)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true, data }
}
```

---

## 4. 后台管理系统改造

### 4.1 公共药品库管理 (`admin/src/views/Medications.vue`)

**现有功能保持不变**：
- 药品列表展示
- 添加药品
- 编辑药品
- 删除药品
- 导入常用药品

**改造点**：
- 用户自助添加的药品会直接出现在列表中
- 管理员可以补充完善药品信息（厂家、规格、外观等）

---

## 5. 数据迁移方案

### 5.1 迁移步骤

```sql
-- 步骤 1: 备份现有数据（可选，用于回滚）
CREATE TABLE medications_backup AS SELECT * FROM medications;
CREATE TABLE medication_schedules_backup AS SELECT * FROM medication_schedules;

-- 步骤 2: 检查现有 medications 表中的药品，合并到 common_medications
-- 注意：需要去重，避免重复药品

-- 步骤 3: 清空 medication_schedules（用户重新设置用药计划）
TRUNCATE TABLE medication_schedules CASCADE;

-- 步骤 4: 清空 medications（个人药品库）
TRUNCATE TABLE medications CASCADE;

-- 步骤 5: 重建外键约束
ALTER TABLE medication_schedules
  DROP CONSTRAINT IF EXISTS medication_schedules_medication_id_fkey;

ALTER TABLE medication_schedules
  ADD CONSTRAINT medication_schedules_medication_id_fkey
    FOREIGN KEY (medication_id) REFERENCES common_medications(id) ON DELETE CASCADE;

-- 步骤 6: 重新应用 RLS 策略（见 2.4 节）
```

### 5.2 用户影响

- **用药计划**：清空，用户需要重新设置
- **用药记录**：保留（通过 `medication_logs` 关联 `medication_schedules`，但 schedules 被清空后会丢失）

**修正方案**：

考虑到数据迁移的复杂性，建议分两阶段执行：

**阶段一：保留现有用户数据**
1. 将 `medications` 表中的药品信息合并到 `common_medications`（去重）
2. 更新 `medication_schedules.medication_id` 指向新的公共药品 ID
3. 删除空的 `medications` 记录

**阶段二：清理用药计划**
- 由于涉及用户数据，建议通知用户后清空，让用户重新设置

---

## 6. 错误处理

### 6.1 前端错误处理

```typescript
// 添加药品失败
try {
  const result = await addCommonMedication({ name: 'xxx' })
  if (!result.success) {
    uni.showToast({ title: '添加失败：' + result.error, icon: 'none' })
  }
} catch (e) {
  uni.showToast({ title: '网络错误', icon: 'none' })
}

// 重复药品处理
// 后端添加唯一约束：name + manufacturer + specification
// 前端搜索时实时匹配，避免重复添加
```

### 6.2 数据库约束

```sql
-- 防止重复药品（药品名称 + 厂家 + 规格 唯一）
CREATE UNIQUE INDEX IF NOT EXISTS idx_common_medications_unique
  ON common_medications(name, manufacturer, specification);
```

---

## 7. 测试计划

### 7.1 单元测试

- [ ] 公共药品库 CRUD 操作
- [ ] 用户添加药品到公共库
- [ ] 用药计划创建/编辑/删除
- [ ] 重复药品检测

### 7.2 集成测试

- [ ] 完整添加药品流程
- [ ] 编辑用药计划
- [ ] 删除用药计划
- [ ] 首页今日用药显示

### 7.3 E2E 测试

- [ ] 新用户从选择药品到完成设置
- [ ] 用户添加公共库没有的药品
- [ ] 多用户共享同一药品

---

## 8. 上线检查清单

- [ ] 数据库迁移脚本执行完成
- [ ] RLS 策略正确应用
- [ ] 前端代码部署
- [ ] 后台管理系统部署
- [ ] 公共药品库数据验证
- [ ] 用户添加药品功能测试
- [ ] 监控告警配置

---

## 9. 后续优化

1. **药品图片**：支持用户上传药品图片
2. **药品审核**：可选的审核机制，防止垃圾数据
3. **药品合并**：管理员合并重复药品
4. **导入导出**：支持批量导入药品数据
