# 药品批量导入功能实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 改造后台药品库管理的批量导入功能，从硬编码的 50 种药品导入改为 Excel 模板下载 + 用户上传的方式，支持预览编辑和错误修正。

**Architecture:**
- 在 Medications.vue 中替换旧的 handleImportCommonMedications 函数
- 新增 downloadTemplate 函数生成带数据验证的 Excel 模板
- 新增文件上传解析和预览编辑功能
- 使用 xlsx (SheetJS) 库处理 Excel 文件
- 批量导入时逐条插入，捕获唯一约束错误处理重复药品

**Tech Stack:** Vue 3 + TypeScript + Element Plus + xlsx (SheetJS) + Supabase

---

## 文件结构

**修改的文件：**
- `admin/src/views/Medications.vue` - 替换批量导入功能
- `admin/package.json` - 添加 xlsx 依赖

**依赖变化：**
- 新增：`xlsx` 库

---

## 任务分解

### Task 1: 安装 xlsx 依赖

**Files:**
- Modify: `admin/package.json`

- [ ] **Step 1: 添加 xlsx 依赖到 package.json**

在 admin 目录下执行：
```bash
cd admin && npm install xlsx
```

- [ ] **Step 2: 验证安装成功**

```bash
npm list xlsx
```
Expected: 显示 `xlsx@x.x.x`

- [ ] **Step 3: 提交**

```bash
git add admin/package.json admin/package-lock.json
git commit -m "chore: 安装 xlsx 库用于 Excel 文件处理"
```

---

### Task 2: 更新页面头部按钮

**Files:**
- Modify: `admin/src/views/Medications.vue:567-576`

- [ ] **Step 1: 移除旧的导入按钮，添加下载模板和上传按钮**

修改 template 部分，将：
```vue
<el-button type="success" @click="handleImportCommonMedications">
  <el-icon><Download /></el-icon>
  导入常用药品
</el-button>
```

替换为：
```vue
<el-button @click="downloadTemplate">
  <el-icon><Download /></el-icon>
  下载模板
</el-button>
<el-button @click="triggerUpload">
  <el-icon><Upload /></el-icon>
  上传
</el-button>
<el-upload
  ref="uploadRef"
  :auto-upload="false"
  :on-change="handleFileUpload"
  :show-file-list="false"
  accept=".xlsx,.xls"
  style="display: none"
>
  <el-button>上传</el-button>
</el-upload>
```

- [ ] **Step 2: 导入 Upload 图标和 el-upload 组件**

修改 import 语句，添加：
```typescript
import { Search, Plus, Download, Upload } from '@element-plus/icons-vue'
```

- [ ] **Step 3: 运行测试**

启动开发服务器验证按钮渲染正常：
```bash
cd admin && npm run dev
```

- [ ] **Step 4: 提交**

```bash
git add admin/src/views/Medications.vue
git commit -m "feat: 替换批量导入按钮为下载模板和上传按钮"
```

---

### Task 3: 实现 downloadTemplate 函数

**Files:**
- Modify: `admin/src/views/Medications.vue`

- [ ] **Step 1: 在 script 顶部添加 XLSX 导入**

```typescript
import * as XLSX from 'xlsx'
```

- [ ] **Step 2: 实现 downloadTemplate 函数**

在 `handleImportCommonMedications` 函数位置替换为：
```typescript
function downloadTemplate() {
  const wb = XLSX.utils.book_new()
  const dateString = new Date().toISOString().slice(0, 10).replace(/-/g, '')

  // 工作表 1：填写说明
  const instructionData = [
    ['📋 药品批量导入模板 - 填写说明'],
    [],
    ['填写规则：'],
    ['  • 标红单元格为必填项'],
    ['  • 药品分类：从下拉列表选择（降压药、降糖药、降脂药、心血管药、胃药、止咳药、止痛药、维生素、钙片、抗生素、其他）'],
    ['  • 剂型：从下拉列表选择（tablet=药片、capsule=胶囊、liquid=口服液）'],
    ['  • 重复药品判断：以"药品名称"为准，名称相同视为重复'],
    [],
    ['📝 填写示例：'],
    ['药品名称', '通用名称', '药品分类', '生产厂家', '规格', '剂型', '外观描述', '剂量单位'],
    ['阿司匹林肠溶片', '阿司匹林', '心血管药', '拜耳医药', '100mg×30 片', 'tablet', '白色圆形小药片，直径约 8mm，刻有"100"', '片'],
    ['布洛芬缓释胶囊', '布洛芬', '止痛药', '中美天津史克', '0.3g×20 粒', 'capsule', '透明胶囊，内含白色粉末', '粒']
  ]
  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionData)

  // 调整列宽
  wsInstructions['!cols'] = [{ wch: 50 }]
  XLSX.utils.book_append_sheet(wb, wsInstructions, '填写说明')

  // 工作表 2：模板数据（含数据验证）
  const categories = '降压药，降糖药，降脂药，心血管药，胃药，止咳药，止痛药，维生素，钙片，抗生素，其他'
  const forms = 'tablet,capsule,liquid'
  const headers = ['药品名称', '通用名称', '药品分类', '生产厂家', '规格', '剂型', '外观描述', '剂量单位']

  // 创建空数据行（10 行）
  const emptyRows = Array(10).fill(null).map(() => Array(8).fill(''))
  const wsTemplate = XLSX.utils.aoa_to_sheet([headers, ...emptyRows])

  // 设置列宽
  wsTemplate['!cols'] = [
    { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 20 },
    { wch: 15 }, { wch: 10 }, { wch: 30 }, { wch: 10 }
  ]

  // 设置数据验证（下拉列表）
  // C 列：药品分类
  wsTemplate['!dataValidations'] = {
    C2: {
      type: 'list',
      formulae: [categories],
      allowBlank: false,
      showDropDown: false,
      showErrorMessage: true,
      error: '分类无效，请从下拉列表选择'
    }
  }

  // 为 C3:C11 设置相同的验证（xlsx 库需要逐个设置）
  for (let i = 3; i <= 11; i++) {
    wsTemplate[`C${i}`] = { ...wsTemplate[`C${i}`], v: '' }
  }

  // F 列：剂型
  wsTemplate['!dataValidations'] = {
    ...wsTemplate['!dataValidations'],
    F2: {
      type: 'list',
      formulae: [forms],
      allowBlank: false,
      showDropDown: false,
      showErrorMessage: true,
      error: '剂型无效，只能选择 tablet/capsule/liquid'
    }
  }

  // 设置必填单元格背景色（红色）
  for (let i = 2; i <= 11; i++) {
    wsTemplate[`A${i}`] = {
      ...wsTemplate[`A${i}`],
      s: { fill: { fgColor: { rgb: 'FFE6E6' } } }
    }
    wsTemplate[`C${i}`] = {
      ...wsTemplate[`C${i}`],
      s: { fill: { fgColor: { rgb: 'FFE6E6' } } }
    }
    wsTemplate[`F${i}`] = {
      ...wsTemplate[`F${i}`],
      s: { fill: { fgColor: { rgb: 'FFE6E6' } } }
    }
  }

  XLSX.utils.book_append_sheet(wb, wsTemplate, '模板数据')
  XLSX.writeFile(wb, `药品批量导入模板_${dateString}.xlsx`)
}
```

- [ ] **Step 3: 测试下载功能**

在浏览器中点击"下载模板"按钮，验证：
- 文件正确下载
- 包含两个工作表
- 下拉列表功能正常
- 必填单元格有红色背景

- [ ] **Step 4: 提交**

```bash
git add admin/src/views/Medications.vue
git commit -m "feat: 实现 Excel 模板下载功能"
```

---

### Task 4: 实现文件上传和解析

**Files:**
- Modify: `admin/src/views/Medications.vue`

- [ ] **Step 1: 添加必要的状态变量**

在 `const formRef = ref()` 后添加：
```typescript
const uploadRef = ref()
const previewData = ref<any[]>([])
const previewVisible = ref(false)
const hasErrors = ref(false)
```

- [ ] **Step 2: 添加验证函数**

在 `matchesPinyin` 函数后添加：
```typescript
const VALID_CATEGORIES = ['降压药', '降糖药', '降脂药', '心血管药', '胃药', '止咳药', '止痛药', '维生素', '钙片', '抗生素', '其他']
const VALID_FORMS = ['tablet', 'capsule', 'liquid']

function validateRow(row: any): string[] {
  const errors: string[] = []

  // 药品名称：必填，1-100 字
  if (!row['药品名称'] || String(row['药品名称']).trim() === '') {
    errors.push('药品名称不能为空')
  } else if (String(row['药品名称']).length > 100) {
    errors.push('药品名称过长（最多 100 字）')
  }

  // 药品分类：必填，预设分类
  if (!row['药品分类'] || String(row['药品分类']).trim() === '') {
    errors.push('药品分类不能为空')
  } else if (!VALID_CATEGORIES.includes(String(row['药品分类']))) {
    errors.push(`分类无效，可选：${VALID_CATEGORIES.join('、')}`)
  }

  // 剂型：必填，预设剂型
  if (!row['剂型'] || String(row['剂型']).trim() === '') {
    errors.push('剂型不能为空')
  } else if (!VALID_FORMS.includes(String(row['剂型']))) {
    errors.push('剂型无效（tablet/capsule/liquid）')
  }

  // 可选字段长度验证
  if (row['通用名称'] && String(row['通用名称']).length > 100) {
    errors.push('通用名称过长（最多 100 字）')
  }
  if (row['生产厂家'] && String(row['生产厂家']).length > 200) {
    errors.push('生产厂家过长（最多 200 字）')
  }
  if (row['规格'] && String(row['规格']).length > 50) {
    errors.push('规格过长（最多 50 字）')
  }
  if (row['外观描述'] && String(row['外观描述']).length > 500) {
    errors.push('外观描述过长（最多 500 字）')
  }
  if (row['剂量单位'] && String(row['剂量单位']).length > 20) {
    errors.push('剂量单位过长（最多 20 字）')
  }

  return errors
}
```

- [ ] **Step 3: 实现 handleFileUpload 函数**

在 `downloadTemplate` 函数后添加：
```typescript
async function handleFileUpload(file: any) {
  try {
    const fileData = await file.raw.arrayBuffer()
    const workbook = XLSX.read(fileData, { type: 'array' })

    // 获取模板数据工作表
    const ws = workbook.Sheets[workbook.SheetNames[1]]
    if (!ws) {
      ElMessage.error('无效的模板文件格式')
      return
    }

    // 解析为 JSON
    const rows = XLSX.utils.sheet_to_json(ws)

    if (rows.length === 0) {
      ElMessage.warning('模板中没有数据')
      return
    }

    // 验证每一行
    const validatedRows = rows.map((row, index) => {
      const errors = validateRow(row)
      return {
        id: index,
        data: row,
        errors,
        hasErrors: errors.length > 0
      }
    })

    previewData.value = validatedRows
    hasErrors.value = validatedRows.some(r => r.hasErrors)
    previewVisible.value = true

    const errorCount = validatedRows.filter(r => r.hasErrors).length
    if (errorCount > 0) {
      ElMessage.warning(`共 ${rows.length} 条数据，其中 ${errorCount} 条有错误，请在预览窗口中修正`)
    } else {
      ElMessage.success(`共 ${rows.length} 条数据，验证通过`)
    }
  } catch (error) {
    console.error('解析文件失败:', error)
    ElMessage.error('解析文件失败：' + (error as any).message)
  }
}
```

- [ ] **Step 4: 实现 triggerUpload 函数**

```typescript
function triggerUpload() {
  uploadRef.value?.$el.click()
}
```

- [ ] **Step 5: 提交**

```bash
git add admin/src/views/Medications.vue
git commit -m "feat: 实现文件上传解析和数据验证功能"
```

---

### Task 5: 实现预览编辑弹窗

**Files:**
- Modify: `admin/src/views/Medications.vue`

- [ ] **Step 1: 添加行编辑函数**

```typescript
function updateRowData(rowId: number, field: string, value: any) {
  const row = previewData.value.find(r => r.id === rowId)
  if (row) {
    row.data[field] = value
    // 重新验证
    row.errors = validateRow(row.data)
    row.hasErrors = row.errors.length > 0
    hasErrors.value = previewData.value.some(r => r.hasErrors)
  }
}

function deleteRow(rowId: number) {
  previewData.value = previewData.value.filter(r => r.id !== rowId)
  hasErrors.value = previewData.value.some(r => r.hasErrors)
}
```

- [ ] **Step 2: 添加批量导入函数**

```typescript
async function handleBatchImport() {
  if (hasErrors.value) {
    ElMessage.warning('还有错误数据未修正，无法导入')
    return
  }

  const validRows = previewData.value.filter(r => !r.hasErrors)
  if (validRows.length === 0) {
    ElMessage.warning('没有可导入的数据')
    return
  }

  try {
    const loading = ElLoading.service({
      lock: true,
      text: '正在导入药品...',
      background: 'rgba(0, 0, 0, 0.7)'
    })

    const results = {
      success: 0,
      duplicate: 0,
      failed: 0,
      details: [] as { name: string; reason: string; type: 'duplicate' | 'failed' }[]
    }

    for (const row of validRows) {
      const medData = {
        name: row.data['药品名称'],
        generic_name: row.data['通用名称'] || '',
        category: row.data['药品分类'],
        manufacturer: row.data['生产厂家'] || '',
        specification: row.data['规格'] || '',
        form: row.data['剂型'],
        appearance_desc: row.data['外观描述'] || '',
        dosage_unit: row.data['剂量单位'] || '',
        is_active: true
      }

      const { error } = await supabase
        .from('common_medications')
        .insert([medData])

      if (error) {
        if (error.code === '23505') {
          results.duplicate++
          results.details.push({
            name: medData.name,
            reason: '药品已存在',
            type: 'duplicate'
          })
        } else {
          results.failed++
          results.details.push({
            name: medData.name,
            reason: error.message,
            type: 'failed'
          })
        }
      } else {
        results.success++
      }
    }

    loading.close()
    previewVisible.value = false

    // 显示结果
    showImportResult(results)

    // 刷新列表
    await fetchCommonMedications()
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error('导入失败：' + (error as any).message)
  }
}
```

- [ ] **Step 3: 添加结果展示函数**

```typescript
function showImportResult(results: any) {
  let message = `<div style="text-align: left; padding: 10px 0;">`
  message += `<p style="color: #67c23a; margin: 5px 0;">✓ 成功导入：${results.success} 条</p>`

  if (results.duplicate > 0) {
    message += `<p style="color: #e6a23c; margin: 5px 0;">⚠ 跳过重复：${results.duplicate} 条</p>`
    results.details
      .filter((d: any) => d.type === 'duplicate')
      .forEach((d: any) => {
        message += `<p style="color: #e6a23c; margin: 2px 0; padding-left: 20px;">• ${d.name}（${d.reason}）</p>`
      })
  }

  if (results.failed > 0) {
    message += `<p style="color: #f56c6c; margin: 5px 0;">✗ 导入失败：${results.failed} 条</p>`
    results.details
      .filter((d: any) => d.type === 'failed')
      .forEach((d: any) => {
        message += `<p style="color: #f56c6c; margin: 2px 0; padding-left: 20px;">• ${d.name}（${d.reason}）</p>`
      })
  }

  message += `</div>`

  ElMessageBox.alert(message, '导入完成', {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '确定'
  })
}
```

- [ ] **Step 4: 添加预览弹窗 template**

在 dialog 后添加：
```vue
<!-- 批量导入预览弹窗 -->
<el-dialog
  v-model="previewVisible"
  :title="`批量导入预览 - 共 ${previewData.length} 条，错误 ${previewData.filter(r => r.hasErrors).length} 条`"
  width="1200px"
  :close-on-click-modal="false"
>
  <el-table :data="previewData" max-height="500">
    <el-table-column label="药品名称" width="180">
      <template #default="{ row }">
        <el-input v-model="row.data['药品名称']" @change="updateRowData(row.id, '药品名称', $event.target.value)" />
      </template>
    </el-table-column>
    <el-table-column label="通用名称" width="150">
      <template #default="{ row }">
        <el-input v-model="row.data['通用名称']" @change="updateRowData(row.id, '通用名称', $event.target.value)" />
      </template>
    </el-table-column>
    <el-table-column label="药品分类" width="150">
      <template #default="{ row }">
        <el-select v-model="row.data['药品分类']" @change="updateRowData(row.id, '药品分类', $event)">
          <el-option v-for="cat in VALID_CATEGORIES" :key="cat" :label="cat" :value="cat" />
        </el-select>
      </template>
    </el-table-column>
    <el-table-column label="生产厂家" width="180">
      <template #default="{ row }">
        <el-input v-model="row.data['生产厂家']" @change="updateRowData(row.id, '生产厂家', $event.target.value)" />
      </template>
    </el-table-column>
    <el-table-column label="规格" width="120">
      <template #default="{ row }">
        <el-input v-model="row.data['规格']" @change="updateRowData(row.id, '规格', $event.target.value)" />
      </template>
    </el-table-column>
    <el-table-column label="剂型" width="120">
      <template #default="{ row }">
        <el-select v-model="row.data['剂型']" @change="updateRowData(row.id, '剂型', $event)">
          <el-option v-for="form in VALID_FORMS" :key="form" :label="form" :value="form" />
        </el-select>
      </template>
    </el-table-column>
    <el-table-column label="外观描述" width="200">
      <template #default="{ row }">
        <el-input v-model="row.data['外观描述']" @change="updateRowData(row.id, '外观描述', $event.target.value)" />
      </template>
    </el-table-column>
    <el-table-column label="剂量单位" width="100">
      <template #default="{ row }">
        <el-input v-model="row.data['剂量单位']" @change="updateRowData(row.id, '剂量单位', $event.target.value)" />
      </template>
    </el-table-column>
    <el-table-column label="状态" width="80" fixed="right">
      <template #default="{ row }">
        <el-tag :type="row.hasErrors ? 'danger' : 'success'" size="small">
          {{ row.hasErrors ? '有错误' : '通过' }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column label="操作" width="80" fixed="right">
      <template #default="{ row }">
        <el-button link type="danger" @click="deleteRow(row.id)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>

  <template #footer>
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <el-alert
        v-if="hasErrors"
        type="warning"
        title="还有错误数据，请修正或删除错误行后方可导入"
        :closable="false"
        show-icon
      />
      <el-alert
        v-else
        type="success"
        title="所有数据验证通过，可以导入"
        :closable="false"
        show-icon
      />
      <div>
        <el-button @click="previewVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleBatchImport"
          :disabled="hasErrors || previewData.length === 0"
        >
          开始导入 ({{ previewData.length }} 条)
        </el-button>
      </div>
    </div>
  </template>
</el-dialog>
```

- [ ] **Step 5: 提交**

```bash
git add admin/src/views/Medications.vue
git commit -m "feat: 实现预览编辑弹窗和批量导入功能"
```

---

### Task 6: 清理旧代码

**Files:**
- Modify: `admin/src/views/Medications.vue`

- [ ] **Step 1: 删除旧的 handleImportCommonMedications 函数**

删除第 278-402 行的整个 `handleImportCommonMedications` 函数

- [ ] **Step 2: 验证代码无引用错误**

确保没有其他地方引用已删除的函数

- [ ] **Step 3: 提交**

```bash
git add admin/src/views/Medications.vue
git commit -m "refactor: 移除旧的批量导入函数"
```

---

## 验收测试

完成所有任务后，执行以下测试：

1. **下载模板测试**
   - 点击"下载模板"按钮
   - 验证文件下载成功
   - 打开 Excel 验证两个工作表
   - 验证下拉列表功能

2. **上传解析测试**
   - 填写测试数据
   - 上传文件
   - 验证预览数据显示正确
   - 验证错误检测

3. **编辑修正测试**
   - 修改错误数据
   - 验证实时验证
   - 删除一行数据
   - 验证删除功能

4. **批量导入测试**
   - 点击"开始导入"
   - 验证数据库写入
   - 验证结果汇总
   - 验证重复药品跳过

5. **边界测试**
   - 上传空文件
   - 上传错误格式文件
   - 大量数据（100+ 行）性能测试

---

## 依赖技能

- @superpowers:subagent-driven-development - 执行各任务
- @superpowers:verification-before-completion - 验证功能完成
