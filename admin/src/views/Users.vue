<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import type { User } from '@supabase/supabase-js'
import { Search } from '@element-plus/icons-vue'

const users = ref<any[]>([])
const loading = ref(true)
const searchKeyword = ref('')
const dialogVisible = ref(false)
const currentUser = ref<any>(null)

async function fetchUsers() {
  loading.value = true

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    users.value = data || []
  } catch (error) {
    console.error('获取用户列表失败:', error)
  } finally {
    loading.value = false
  }
}

function handleViewDetail(user: any) {
  currentUser.value = user
  dialogVisible.value = true
}

async function handleDelete(user: any) {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id)

    if (error) throw error

    await fetchUsers()
    alert('用户已删除')
  } catch (error) {
    console.error('删除用户失败:', error)
    alert('删除失败')
  }
}

const filteredUsers = ref(users.value)

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="users-page">
    <div class="page-header">
      <h2>用户管理</h2>
      <el-input
        v-model="searchKeyword"
        placeholder="搜索用户名或手机号"
        style="width: 300px"
        clearable
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <el-card>
      <el-table
        :data="users"
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="avatar_url" label="头像">
          <template #default="{ row }">
            <el-avatar v-if="row.avatar_url" :src="row.avatar_url" :size="40" />
            <el-avatar v-else :size="40" icon="User" />
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="180">
          <template #default="{ row }">
            {{ new Date(row.created_at).toLocaleString('zh-CN') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleViewDetail(row)">详情</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 用户详情对话框 -->
    <el-dialog v-model="dialogVisible" title="用户详情" width="500px">
      <el-descriptions :column="1" v-if="currentUser">
        <el-descriptions-item label="用户名">{{ currentUser.username }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentUser.phone }}</el-descriptions-item>
        <el-descriptions-item label="紧急联系人">{{ currentUser.emergency_contact || '-' }}</el-descriptions-item>
        <el-descriptions-item label="紧急电话">{{ currentUser.emergency_phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">
          {{ new Date(currentUser.created_at).toLocaleString('zh-CN') }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<style scoped>
.users-page {
  max-width: 1400px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}
</style>
