# 拼音首字母自动生成功能

## 概述

为 `common_medications` 表添加了 `pinyin_initials` 字段和自动触发器，实现拼音首字母的自动生成和存储。

## 技术实现

### 数据库层面

1. **新增字段**: `pinyin_initials TEXT`
2. **触发器**: 在 `INSERT` 或 `UPDATE` 时自动生成拼音首字母
3. **映射函数**: `get_pinyin_initials(text)` 将中文转换为拼音首字母
4. **索引**: `idx_common_medications_pinyin` 加速搜索

### 触发器行为

```sql
-- 当插入或更新药品时，自动根据 name 字段生成拼音首字母
CREATE TRIGGER trg_update_pinyin_initials
  BEFORE INSERT OR UPDATE ON common_medications
  FOR EACH ROW
  EXECUTE FUNCTION update_pinyin_initials();
```

### 拼音映射表

覆盖了常用药品用字，包括：
- 常见药品名称用字（甲、钴、胺、硝、苯等）
- 剂型用字（片、胶囊、注射液等）
- 常见化学用字（酸、酯、醇、苷等）

## 执行迁移

### 方式一：Supabase SQL Editor（推荐）

1. 访问 https://app.supabase.com/project/vqtrfkigzqtcthrivbzn/sql
2. 复制 `sql/add-pinyin-initials.sql` 的全部内容
3. 粘贴到 SQL Editor
4. 点击"Run"执行

### 方式二：Supabase CLI

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 执行迁移
supabase db execute --file sql/add-pinyin-initials.sql
```

## 验证结果

执行以下 SQL 查询验证迁移结果：

```sql
-- 查看所有药品的拼音首字母
SELECT name, pinyin_initials
FROM common_medications
ORDER BY name
LIMIT 20;

-- 验证特定药品
SELECT name, pinyin_initials
FROM common_medications
WHERE name IN ('甲钴胺片', '硝苯地平缓释片', '阿托伐他汀钙片');
```

预期结果：
```
name              | pinyin_initials
------------------|----------------
甲钴胺片          | jgap
硝苯地平缓释片    | xbdphsp
阿托伐他汀钙片    | atvtgtp
```

## 测试搜索功能

### 前端测试

1. 打开 H5 前端页面
2. 进入"添加药品"
3. 在搜索框输入 "jg"
4. 应该能看到 "甲钴胺片"

### 管理后台测试

1. 登录管理后台
2. 进入"公共药品库管理"
3. 在搜索框输入 "jg"
4. 应该能筛选出 "甲钴胺片"

## 自动触发场景

触发器会在以下场景自动生成拼音首字母：

1. **管理后台添加药品**: 保存时自动计算并存储
2. **管理后台编辑药品**: 修改药品名称时重新计算
3. **前端用户添加药品**: 保存到 `common_medications` 时自动计算
4. **批量导入药品**: 使用 `INSERT` 语句时自动触发

## 注意事项

1. **现有数据**: 迁移脚本会为现有数据批量生成拼音首字母
2. **性能**: 使用 IMMUTABLE 函数，支持索引优化
3. **扩展**: 如需添加新的汉字映射，编辑 `get_pinyin_initials` 函数中的映射表

## 故障排查

### 问题：拼音首字母为空

检查触发器是否存在：

```sql
SELECT tgname, tgtype
FROM pg_trigger
WHERE tgname = 'trg_update_pinyin_initials';
```

### 问题：搜索仍然失败

1. 检查 `pinyin_initials` 字段是否有值
2. 确认搜索关键词是否为小写
3. 检查前端代码是否正确读取了 `pinyin_initials` 字段

## 相关文件

- SQL 迁移脚本：`sql/add-pinyin-initials.sql`
- 前端服务：`src/services/common-medications.ts`
- 管理后台：`admin/src/views/Medications.vue`
