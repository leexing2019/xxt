import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null)
  const loading = ref(false)
  const sidebarCollapsed = ref(false)

  const isLoggedIn = computed(() => !!user.value)

  // 管理员登录
  async function login(email: string, password: string) {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        // 开发模式：如果 Supabase 未配置，允许模拟登录
        if (import.meta.env.DEV && email && password) {
          console.warn('Supabase 登录失败，使用模拟登录（仅开发模式）')
          user.value = {
            id: 'dev-user-id',
            email: email,
            app_metadata: { role: 'admin' }
          }
          return { success: true, mock: true }
        }
        throw error
      }

      if (data.user) {
        user.value = data.user
        // 简单权限检查 - 生产环境应该检查用户角色
        if (!email.includes('admin')) {
          await logout()
          return { success: false, error: '无权访问，仅限管理员账号' }
        }
      }

      return { success: true }
    } catch (error: any) {
      console.error('登录失败:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // 退出登录
  async function logout() {
    await supabase.auth.signOut()
    user.value = null
  }

  // 切换侧边栏
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  return {
    user,
    loading,
    sidebarCollapsed,
    isLoggedIn,
    login,
    logout,
    toggleSidebar
  }
})
