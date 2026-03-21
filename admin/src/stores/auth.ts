import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!user.value)

  async function login(email: string, password: string) {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .single()

      if (error || !data) {
        throw new Error('邮箱或密码错误')
      }

      // 简单密码验证（实际应该使用 bcrypt 等加密验证）
      if (data.password_hash !== password) {
        throw new Error('邮箱或密码错误')
      }

      user.value = { id: data.id, email: data.email, role: data.role }
      localStorage.setItem('admin_token', data.id)
      localStorage.setItem('admin_user', JSON.stringify(user.value))

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    user.value = null
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
  }

  async function checkAuth() {
    const token = localStorage.getItem('admin_token')
    const userData = localStorage.getItem('admin_user')

    if (token && userData) {
      user.value = JSON.parse(userData)
    }

    return !!user.value
  }

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuth
  }
})
