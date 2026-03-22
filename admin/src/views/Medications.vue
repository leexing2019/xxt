<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import { Search, Plus, Goods, Download } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'

interface CommonMedication {
  id: string
  name: string
  generic_name?: string
  category: string
  manufacturer?: string
  specification?: string
  form?: string
  appearance_desc?: string
  dosage_unit?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

const commonMedications = ref<CommonMedication[]>([])
const commonLoading = ref(true)

// 搜索和筛选
const searchKeyword = ref('')
const categoryFilter = ref('')
const categories = ref<string[]>([])

// 对话框
const dialogVisible = ref(false)
const editMode = ref(false)
const currentMedication = ref<Partial<CommonMedication>>({})

// 表单引用
const formRef = ref()

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入药品名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择药品分类', trigger: 'change' }]
}

// =====================================================
// 公共药品库操作
// =====================================================

// 导入常用药品数据
async function handleImportCommonMedications() {
  try {
    await ElMessageBox.confirm(
      '此操作将导入 50 种常用药品到公共药品库，所有用户都能看到，是否继续？',
      '导入常用药品',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    const loadingInstance = ElLoading.service({
      lock: true,
      text: '正在导入常用药品...',
      background: 'rgba(0, 0, 0, 0.7)'
    })

    try {
      // 导入常用药品数据到 common_medications 表
      const commonMedicationsData = [
        // 降压药
        { name: '硝苯地平缓释片', generic_name: '硝苯地平', manufacturer: '拜耳医药', specification: '30mg×14 片', form: '缓释片', appearance_desc: '黄色椭圆形薄膜衣片，长约 12mm', dosage_unit: '片', category: '降压药' },
        { name: '氨氯地平片', generic_name: '苯磺酸氨氯地平', manufacturer: '辉瑞制药', specification: '5mg×7 片', form: '片剂', appearance_desc: '白色圆形片剂，直径约 9mm', dosage_unit: '片', category: '降压药' },
        { name: '厄贝沙坦片', generic_name: '厄贝沙坦', manufacturer: '赛诺菲制药', specification: '150mg×7 片', form: '片剂', appearance_desc: '白色椭圆形片剂，一面刻有标识', dosage_unit: '片', category: '降压药' },
        { name: '缬沙坦胶囊', generic_name: '缬沙坦', manufacturer: '诺华制药', specification: '80mg×14 粒', form: '胶囊', appearance_desc: '蓝白胶囊，内含白色颗粒', dosage_unit: '粒', category: '降压药' },
        { name: '美托洛尔缓释片', generic_name: '酒石酸美托洛尔', manufacturer: '阿斯利康', specification: '47.5mg×7 片', form: '缓释片', appearance_desc: '淡黄色圆形片剂', dosage_unit: '片', category: '降压药' },
        { name: '非洛地平缓释片', generic_name: '非洛地平', manufacturer: '阿斯利康', specification: '5mg×10 片', form: '缓释片', appearance_desc: '白色椭圆形薄膜衣片', dosage_unit: '片', category: '降压药' },
        { name: '吲达帕胺片', generic_name: '吲达帕胺', manufacturer: '施维雅制药', specification: '2.5mg×30 片', form: '片剂', appearance_desc: '白色片剂', dosage_unit: '片', category: '降压药' },
        { name: '氯沙坦钾片', generic_name: '氯沙坦钾', manufacturer: '默沙东制药', specification: '50mg×7 片', form: '片剂', appearance_desc: '白色椭圆形薄膜衣片', dosage_unit: '片', category: '降压药' },
        { name: '替米沙坦片', generic_name: '替米沙坦', manufacturer: '勃林格殷格翰', specification: '40mg×14 片', form: '片剂', appearance_desc: '淡黄色圆形片剂', dosage_unit: '片', category: '降压药' },
        { name: '比索洛尔片', generic_name: '富马酸比索洛尔', manufacturer: '默克制药', specification: '5mg×10 片', form: '片剂', appearance_desc: '淡黄色圆形薄膜衣片', dosage_unit: '片', category: '降压药' },
        // 降糖药
        { name: '二甲双胍片', generic_name: '盐酸二甲双胍', manufacturer: '中美上海施贵宝', specification: '0.5g×20 片', form: '片剂', appearance_desc: '白色圆形片剂，直径约 10mm', dosage_unit: '片', category: '降糖药' },
        { name: '格列美脲片', generic_name: '格列美脲', manufacturer: '赛诺菲制药', specification: '1mg×15 片', form: '片剂', appearance_desc: '粉红色椭圆形片剂', dosage_unit: '片', category: '降糖药' },
        { name: '阿卡波糖片', generic_name: '阿卡波糖', manufacturer: '拜耳医药', specification: '50mg×30 片', form: '片剂', appearance_desc: '白色类圆形片剂', dosage_unit: '片', category: '降糖药' },
        { name: '格列齐特缓释片', generic_name: '格列齐特', manufacturer: '施维雅制药', specification: '30mg×10 片', form: '缓释片', appearance_desc: '白色椭圆形片剂', dosage_unit: '片', category: '降糖药' },
        { name: '瑞格列奈片', generic_name: '瑞格列奈', manufacturer: '诺和诺德', specification: '0.5mg×14 片', form: '片剂', appearance_desc: '白色圆形片剂', dosage_unit: '片', category: '降糖药' },
        { name: '西格列汀片', generic_name: '磷酸西格列汀', manufacturer: '默沙东制药', specification: '100mg×7 片', form: '片剂', appearance_desc: '淡粉色圆形薄膜衣片', dosage_unit: '片', category: '降糖药' },
        { name: '沙格列汀片', generic_name: '沙格列汀', manufacturer: '阿斯利康', specification: '5mg×14 片', form: '片剂', appearance_desc: '淡黄色圆形片剂', dosage_unit: '片', category: '降糖药' },
        { name: '达格列净片', generic_name: '达格列净', manufacturer: '阿斯利康', specification: '10mg×14 片', form: '片剂', appearance_desc: '黄色椭圆形薄膜衣片', dosage_unit: '片', category: '降糖药' },
        { name: '恩格列净片', generic_name: '恩格列净', manufacturer: '勃林格殷格翰', specification: '10mg×14 片', form: '片剂', appearance_desc: '淡黄色椭圆形片剂', dosage_unit: '片', category: '降糖药' },
        { name: '利拉鲁肽注射液', generic_name: '利拉鲁肽', manufacturer: '诺和诺德', specification: '3ml:18mg×1 支', form: '注射液', appearance_desc: '无色澄明注射液', dosage_unit: 'mg', category: '降糖药' },
        // 降脂药
        { name: '阿托伐他汀钙片', generic_name: '阿托伐他汀', manufacturer: '辉瑞制药', specification: '20mg×7 片', form: '片剂', appearance_desc: '白色椭圆形薄膜衣片，长约 14mm', dosage_unit: '片', category: '降脂药' },
        { name: '瑞舒伐他汀钙片', generic_name: '瑞舒伐他汀', manufacturer: '阿斯利康', specification: '10mg×7 片', form: '片剂', appearance_desc: '粉色圆形片剂', dosage_unit: '片', category: '降脂药' },
        { name: '辛伐他汀片', generic_name: '辛伐他汀', manufacturer: '默沙东制药', specification: '20mg×14 片', form: '片剂', appearance_desc: '白色或类白色片剂', dosage_unit: '片', category: '降脂药' },
        { name: '普伐他汀钠片', generic_name: '普伐他汀', manufacturer: '百时美施贵宝', specification: '10mg×7 片', form: '片剂', appearance_desc: '淡橙色椭圆形片剂', dosage_unit: '片', category: '降脂药' },
        { name: '非诺贝特胶囊', generic_name: '非诺贝特', manufacturer: '加利亚尼制药', specification: '200mg×10 粒', form: '胶囊', appearance_desc: '黄白相间胶囊', dosage_unit: '粒', category: '降脂药' },
        { name: '依折麦布片', generic_name: '依折麦布', manufacturer: '默沙东制药', specification: '10mg×10 片', form: '片剂', appearance_desc: '白色椭圆形片剂', dosage_unit: '片', category: '降脂药' },
        { name: '普罗布考片', generic_name: '普罗布考', manufacturer: '赛诺菲制药', specification: '0.5g×6 片', form: '片剂', appearance_desc: '白色片剂', dosage_unit: '片', category: '降脂药' },
        { name: '血脂康胶囊', generic_name: '红曲提取物', manufacturer: '北京北大维信', specification: '0.3g×24 粒', form: '胶囊', appearance_desc: '紫红色胶囊', dosage_unit: '粒', category: '降脂药' },
        // 心血管药
        { name: '阿司匹林肠溶片', generic_name: '阿司匹林', manufacturer: '拜耳医药', specification: '100mg×30 片', form: '肠溶片', appearance_desc: '白色圆形小药片，直径约 8mm，刻有"100"', dosage_unit: '片', category: '心血管药' },
        { name: '氯吡格雷片', generic_name: '硫酸氢氯吡格雷', manufacturer: '赛诺菲制药', specification: '75mg×7 片', form: '片剂', appearance_desc: '黄色圆形片剂', dosage_unit: '片', category: '心血管药' },
        { name: '华法林钠片', generic_name: '华法林钠', manufacturer: '奥加农制药', specification: '2.5mg×100 片', form: '片剂', appearance_desc: '白色片剂，有不同颜色标识', dosage_unit: '片', category: '心血管药' },
        { name: '单硝酸异山梨酯片', generic_name: '单硝酸异山梨酯', manufacturer: '赛诺菲制药', specification: '20mg×24 片', form: '片剂', appearance_desc: '白色圆形片剂', dosage_unit: '片', category: '心血管药' },
        { name: '硝酸甘油片', generic_name: '硝酸甘油', manufacturer: '拜耳医药', specification: '0.5mg×100 片', form: '片剂', appearance_desc: '白色小片剂', dosage_unit: '片', category: '心血管药' },
        // 胃药
        { name: '奥美拉唑肠溶胶囊', generic_name: '奥美拉唑', manufacturer: '阿斯利康', specification: '20mg×7 粒', form: '肠溶胶囊', appearance_desc: '透明胶囊，内含白色小丸', dosage_unit: '粒', category: '胃药' },
        { name: '雷贝拉唑钠肠溶片', generic_name: '雷贝拉唑', manufacturer: '卫材制药', specification: '10mg×7 片', form: '肠溶片', appearance_desc: '黄色薄膜衣片', dosage_unit: '片', category: '胃药' },
        { name: '泮托拉唑钠肠溶片', generic_name: '泮托拉唑', manufacturer: '武田制药', specification: '40mg×7 片', form: '肠溶片', appearance_desc: '类白色肠溶衣片', dosage_unit: '片', category: '胃药' },
        { name: '兰索拉唑肠溶胶囊', generic_name: '兰索拉唑', manufacturer: '武田制药', specification: '30mg×7 粒', form: '肠溶胶囊', appearance_desc: '透明胶囊，内含白色颗粒', dosage_unit: '粒', category: '胃药' },
        { name: '铝碳酸镁咀嚼片', generic_name: '铝碳酸镁', manufacturer: '拜耳医药', specification: '0.5g×20 片', form: '咀嚼片', appearance_desc: '白色或类白色片剂', dosage_unit: '片', category: '胃药' },
        // 止咳药
        { name: '氨溴索片', generic_name: '盐酸氨溴索', manufacturer: '勃林格殷格翰', specification: '30mg×20 片', form: '片剂', appearance_desc: '白色圆形片剂', dosage_unit: '片', category: '止咳药' },
        { name: '溴己新片', generic_name: '溴己新', manufacturer: '南京白敬宇', specification: '8mg×100 片', form: '片剂', appearance_desc: '白色片剂', dosage_unit: '片', category: '止咳药' },
        { name: '右美沙芬片', generic_name: '氢溴酸右美沙芬', manufacturer: '强生制药', specification: '15mg×12 片', form: '片剂', appearance_desc: '白色片剂', dosage_unit: '片', category: '止咳药' },
        { name: '喷托维林片', generic_name: '枸橼酸喷托维林', manufacturer: '南京白敬宇', specification: '25mg×100 片', form: '片剂', appearance_desc: '白色片剂', dosage_unit: '片', category: '止咳药' },
        // 止痛药
        { name: '布洛芬缓释胶囊', generic_name: '布洛芬', manufacturer: '中美天津史克', specification: '0.3g×20 粒', form: '缓释胶囊', appearance_desc: '透明胶囊，内含白色粉末', dosage_unit: '粒', category: '止痛药' },
        { name: '对乙酰氨基酚片', generic_name: '对乙酰氨基酚', manufacturer: '强生制药', specification: '0.5g×100 片', form: '片剂', appearance_desc: '白色圆形片剂', dosage_unit: '片', category: '止痛药' },
        { name: '双氯芬酸钠肠溶片', generic_name: '双氯芬酸钠', manufacturer: '诺华制药', specification: '25mg×30 片', form: '肠溶片', appearance_desc: '肠溶衣片', dosage_unit: '片', category: '止痛药' },
        { name: '塞来昔布胶囊', generic_name: '塞来昔布', manufacturer: '辉瑞制药', specification: '200mg×6 粒', form: '胶囊', appearance_desc: '蓝白胶囊', dosage_unit: '粒', category: '止痛药' },
        // 维生素/钙片
        { name: '复合维生素片', generic_name: '复合维生素', manufacturer: '拜耳医药', specification: '30 片×1 瓶', form: '片剂', appearance_desc: '橙色椭圆形片剂', dosage_unit: '片', category: '维生素' },
        { name: '碳酸钙 D3 片', generic_name: '碳酸钙 D3', manufacturer: '惠氏制药', specification: '600mg×30 片', form: '片剂', appearance_desc: '白色或类白色片剂', dosage_unit: '片', category: '钙片' },
        { name: '维生素 B1 片', generic_name: '维生素 B1', manufacturer: '南京白敬宇', specification: '10mg×100 片', form: '片剂', appearance_desc: '白色片剂', dosage_unit: '片', category: '维生素' },
        { name: '甲钴胺片', generic_name: '甲钴胺', manufacturer: '卫材制药', specification: '0.5mg×20 片', form: '片剂', appearance_desc: '淡红色圆形糖衣片', dosage_unit: '片', category: '维生素' }
      ]

      // 批量插入药品数据到 common_medications 表
      let successCount = 0
      let skipCount = 0

      for (const med of commonMedicationsData) {
        const { error } = await supabase
          .from('common_medications')
          .insert([{
            ...med,
            is_active: true
          }])

        if (error) {
          // 如果是唯一约束冲突，则跳过
          if (error.code === '23505') {
            skipCount++
          } else {
            console.error('导入药品失败:', error)
          }
        } else {
          successCount++
        }
      }

      loadingInstance.close()

      if (successCount > 0 || skipCount > 0) {
        ElMessage.success(`导入完成！新增 ${successCount} 种药品到公共药品库，跳过 ${skipCount} 种已存在的药品`)
      } else {
        ElMessage.warning('没有导入任何药品')
      }

      await fetchCommonMedications()
    } catch (error) {
      loadingInstance.close()
      console.error('导入过程出错:', error)
      ElMessage.error('导入失败：' + (error as any).message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消导入', error)
    }
  }
}

async function fetchCommonMedications() {
  commonLoading.value = true

  try {
    let query = supabase
      .from('common_medications')
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
    commonMedications.value = data || []

    // 提取所有分类
    const uniqueCategories = new Set(commonMedications.value.map(m => m.category).filter(Boolean))
    categories.value = Array.from(uniqueCategories)
  } catch (error) {
    console.error('获取公共药品列表失败:', error)
  } finally {
    commonLoading.value = false
  }
}

function handleAdd() {
  editMode.value = false
  currentMedication.value = {
    is_active: true
  }
  dialogVisible.value = true
}

function handleEdit(medication: CommonMedication) {
  editMode.value = true
  currentMedication.value = { ...medication }
  dialogVisible.value = true
}

async function handleDelete(medication: CommonMedication) {
  if (!confirm(`确定要删除药品"${medication.name}"吗？`)) return

  try {
    const { error } = await supabase
      .from('common_medications')
      .delete()
      .eq('id', medication.id)

    if (error) throw error

    ElMessage.success('药品已删除')
    await fetchCommonMedications()
  } catch (error) {
    console.error('删除药品失败:', error)
    ElMessage.error('删除失败')
  }
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()

    if (editMode.value && currentMedication.value.id) {
      // 更新药品
      const { error } = await supabase
        .from('common_medications')
        .update({
          name: currentMedication.value.name,
          generic_name: currentMedication.value.generic_name,
          category: currentMedication.value.category,
          manufacturer: currentMedication.value.manufacturer,
          specification: currentMedication.value.specification,
          form: currentMedication.value.form,
          appearance_desc: currentMedication.value.appearance_desc,
          dosage_unit: currentMedication.value.dosage_unit,
          is_active: currentMedication.value.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentMedication.value.id)

      if (error) throw error
      ElMessage.success('药品已更新')
    } else {
      // 添加新药品
      const { error } = await supabase
        .from('common_medications')
        .insert([{
          name: currentMedication.value.name,
          generic_name: currentMedication.value.generic_name,
          category: currentMedication.value.category,
          manufacturer: currentMedication.value.manufacturer,
          specification: currentMedication.value.specification,
          form: currentMedication.value.form,
          appearance_desc: currentMedication.value.appearance_desc,
          dosage_unit: currentMedication.value.dosage_unit,
          is_active: currentMedication.value.is_active ?? true
        }])

      if (error) throw error
      ElMessage.success('药品已添加')
    }

    dialogVisible.value = false
    await fetchCommonMedications()
  } catch (error) {
    console.error('保存药品失败:', error)
  }
}

function handleClearFilter() {
  searchKeyword.value = ''
  categoryFilter.value = ''
  fetchCommonMedications()
}

onMounted(() => {
  fetchCommonMedications()
})
</script>

<template>
  <div class="medications-page">
    <div class="page-header">
      <h2>公共药品库管理</h2>
      <div style="display: flex; gap: 12px">
        <el-button type="success" @click="handleImportCommonMedications">
          <el-icon><Download /></el-icon>
          导入常用药品
        </el-button>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          添加药品
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="filter-card">
      <div class="filter-row">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索药品名称或通用名"
          style="width: 300px"
          clearable
          @clear="fetchCommonMedications"
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
          @change="fetchCommonMedications"
        >
          <el-option label="全部分类" value="" />
          <el-option
            v-for="cat in categories"
            :key="cat"
            :label="cat"
            :value="cat"
          />
        </el-select>

        <el-button @click="handleClearFilter" style="margin-left: 12px">重置</el-button>
      </div>
    </el-card>

    <!-- 药品列表 -->
    <el-card>
      <el-table
        :data="commonMedications"
        v-loading="commonLoading"
        style="width: 100%"
      >
        <el-table-column prop="name" label="药品名称" />
        <el-table-column prop="generic_name" label="通用名称" />
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="manufacturer" label="生产厂家" />
        <el-table-column prop="specification" label="规格" width="120" />
        <el-table-column prop="form" label="剂型" width="100" />
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
                <el-option label="降压药" value="降压药" />
                <el-option label="降糖药" value="降糖药" />
                <el-option label="降脂药" value="降脂药" />
                <el-option label="心血管药" value="心血管药" />
                <el-option label="胃药" value="胃药" />
                <el-option label="止咳药" value="止咳药" />
                <el-option label="止痛药" value="止痛药" />
                <el-option label="维生素" value="维生素" />
                <el-option label="钙片" value="钙片" />
                <el-option label="抗生素" value="抗生素" />
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
            <el-form-item label="剂型">
              <el-select v-model="currentMedication.form" placeholder="请选择剂型" style="width: 100%">
                <el-option label="片剂" value="片剂" />
                <el-option label="胶囊" value="胶囊" />
                <el-option label="缓释片" value="缓释片" />
                <el-option label="肠溶片" value="肠溶片" />
                <el-option label="注射液" value="注射液" />
                <el-option label="散剂" value="散剂" />
                <el-option label="丸剂" value="丸剂" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="剂量单位">
              <el-input v-model="currentMedication.dosage_unit" placeholder="如：片、粒、ml" style="width: 120px" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-switch v-model="currentMedication.is_active" active-text="在用" inactive-text="停用" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="外观描述">
          <el-input
            v-model="currentMedication.appearance_desc"
            type="textarea"
            :rows="2"
            placeholder="如：黄色椭圆形薄膜衣片"
          />
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
