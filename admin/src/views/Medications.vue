<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import { Search, Plus, Goods } from '@element-plus/icons-vue'

interface Medication {
  id: string
  name: string
  generic_name?: string
  category: string
  manufacturer?: string
  specification?: string
  dosage_instructions?: string
  contraindications?: string
  side_effects?: string
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

const medications = ref<Medication[]>([])
const loading = ref(true)
const dialogVisible = ref(false)
const editMode = ref(false)
const currentMedication = ref<Partial<Medication>>({})

// 搜索和筛选
const searchKeyword = ref('')
const categoryFilter = ref('')
const categories = ref<string[]>([])

// 表单数据
const formRef = ref()
const formRules = {
  name: [{ required: true, message: '请输入药品名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择药品分类', trigger: 'change' }]
}

async function fetchMedications() {
  loading.value = true

  try {
    let query = supabase
      .from('medications')
      .select('*')
      .order('created_at', { ascending: false })

    // 搜索筛选
    if (searchKeyword.value) {
      query = query.or(`name.ilike.%${searchKeyword.value}%,generic_name.ilike.%${searchKeyword.value}%`)
    }

    // 分类筛选
    if (categoryFilter.value) {
      query = query.eq('category', categoryFilter.value)
    }

    const { data, error } = await query

    if (error) throw error
    medications.value = data || []

    // 提取所有分类
    const uniqueCategories = new Set(medications.value.map(m => m.category).filter(Boolean))
    categories.value = Array.from(uniqueCategories)
  } catch (error) {
    console.error('获取药品列表失败:', error)
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  editMode.value = false
  currentMedication.value = {
    is_active: true
  }
  dialogVisible.value = true
}

function handleEdit(medication: Medication) {
  editMode.value = true
  currentMedication.value = { ...medication }
  dialogVisible.value = true
}

async function handleDelete(medication: Medication) {
  if (!confirm(`确定要删除药品"${medication.name}"吗？`)) return

  try {
    const { error } = await supabase
      .from('medications')
      .delete()
      .eq('id', medication.id)

    if (error) throw error

    await fetchMedications()
    alert('药品已删除')
  } catch (error) {
    console.error('删除药品失败:', error)
    alert('删除失败')
  }
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()

    if (editMode.value && currentMedication.value.id) {
      // 更新药品
      const { error } = await supabase
        .from('medications')
        .update({
          name: currentMedication.value.name,
          generic_name: currentMedication.value.generic_name,
          category: currentMedication.value.category,
          manufacturer: currentMedication.value.manufacturer,
          specification: currentMedication.value.specification,
          dosage_instructions: currentMedication.value.dosage_instructions,
          contraindications: currentMedication.value.contraindications,
          side_effects: currentMedication.value.side_effects,
          image_url: currentMedication.value.image_url,
          is_active: currentMedication.value.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentMedication.value.id)

      if (error) throw error
      alert('药品已更新')
    } else {
      // 添加新药品
      const { error } = await supabase
        .from('medications')
        .insert([{
          name: currentMedication.value.name,
          generic_name: currentMedication.value.generic_name,
          category: currentMedication.value.category,
          manufacturer: currentMedication.value.manufacturer,
          specification: currentMedication.value.specification,
          dosage_instructions: currentMedication.value.dosage_instructions,
          contraindications: currentMedication.value.contraindications,
          side_effects: currentMedication.value.side_effects,
          image_url: currentMedication.value.image_url,
          is_active: currentMedication.value.is_active ?? true
        }])

      if (error) throw error
      alert('药品已添加')
    }

    dialogVisible.value = false
    await fetchMedications()
  } catch (error) {
    console.error('保存药品失败:', error)
  }
}

function handleClearFilter() {
  searchKeyword.value = ''
  categoryFilter.value = ''
  fetchMedications()
}

onMounted(() => {
  fetchMedications()
})
</script>

<template>
  <div class="medications-page">
    <div class="page-header">
      <h2>药品库管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加药品
      </el-button>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="filter-card">
      <div class="filter-row">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索药品名称或通用名"
          style="width: 300px"
          clearable
          @clear="fetchMedications"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="categoryFilter"
          placeholder="全部分类"
          style="width: 200px"
          clearable
          @change="fetchMedications"
        >
          <el-option label="全部分类" value="" />
          <el-option
            v-for="cat in categories"
            :key="cat"
            :label="cat"
            :value="cat"
          />
        </el-select>

        <el-button @click="handleClearFilter">重置</el-button>
      </div>
    </el-card>

    <!-- 药品列表 -->
    <el-card>
      <el-table
        :data="medications"
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="image_url" label="图片" width="80">
          <template #default="{ row }">
            <el-avatar
              v-if="row.image_url"
              :src="row.image_url"
              :size="50"
              shape="square"
            />
            <el-avatar v-else :size="50" icon="Goods" shape="square" />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="药品名称" />
        <el-table-column prop="generic_name" label="通用名称" />
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="manufacturer" label="生产厂家" />
        <el-table-column prop="specification" label="规格" width="120" />
        <el-table-column prop="is_active" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'" size="small">
              {{ row.is_active ? '在用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="添加时间" width="180">
          <template #default="{ row }">
            {{ new Date(row.created_at).toLocaleDateString('zh-CN') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editMode ? '编辑药品' : '添加药品'"
      width="700px"
      @closed="formRef?.resetFields()"
    >
      <el-form
        ref="formRef"
        :model="currentMedication"
        :rules="formRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="药品名称" prop="name">
              <el-input v-model="currentMedication.name" placeholder="如：阿司匹林肠溶片" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="通用名称">
              <el-input v-model="currentMedication.generic_name" placeholder="如：Acetylsalicylic Acid" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="药品分类" prop="category">
              <el-select v-model="currentMedication.category" placeholder="请选择分类" style="width: 100%">
                <el-option label="心血管系统" value="心血管系统" />
                <el-option label="消化系统" value="消化系统" />
                <el-option label="呼吸系统" value="呼吸系统" />
                <el-option label="神经系统" value="神经系统" />
                <el-option label="内分泌系统" value="内分泌系统" />
                <el-option label="抗感染药" value="抗感染药" />
                <el-option label="止痛药" value="止痛药" />
                <el-option label="维生素类" value="维生素类" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生产厂家">
              <el-input v-model="currentMedication.manufacturer" placeholder="如：拜耳医药" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="规格">
              <el-input v-model="currentMedication.specification" placeholder="如：100mg*30 片" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-switch v-model="currentMedication.is_active" active-text="在用" inactive-text="停用" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="用药说明">
          <el-input
            v-model="currentMedication.dosage_instructions"
            type="textarea"
            :rows="2"
            placeholder="如：口服，一次 1 片，一日 3 次，饭前服用"
          />
        </el-form-item>

        <el-form-item label="禁忌症">
          <el-input
            v-model="currentMedication.contraindications"
            type="textarea"
            :rows="2"
            placeholder="如：对本品过敏者禁用，胃溃疡患者慎用"
          />
        </el-form-item>

        <el-form-item label="不良反应">
          <el-input
            v-model="currentMedication.side_effects"
            type="textarea"
            :rows="2"
            placeholder="如：可能出现恶心、头晕、皮疹等反应"
          />
        </el-form-item>

        <el-form-item label="图片 URL">
          <el-input v-model="currentMedication.image_url" placeholder="输入图片 URL 或留空" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.medications-page {
  width: 100%;
  max-width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #1e293b;
  font-size: 20px;
  font-weight: 700;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  gap: 16px;
  align-items: center;
}
</style>
