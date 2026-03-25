import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<any>(null)
  const profile = ref<any>(null)
  const loading = ref(false)
  const initialized = ref(false)

  // 计算属性
  const isLoggedIn = computed(() => !!user.value)
  const userId = computed(() => user.value?.id || null)
  const userPhone = computed(() => profile.value?.phone || user.value?.phone || '')

  // 初始化认证状态
  async function initAuth() {
    if (initialized.value) return

    loading.value = true
    try {
      // 设置超时，避免网络问题导致白屏
      const sessionPromise = supabase.auth.getSession()
      const timeoutPromise = new Promise(resolve => {
        setTimeout(() => resolve({ data: { session: null }, error: null }), 3000)
      })

      const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any

      if (session?.user) {
        user.value = session.user
        await fetchProfile()
      }

      // 监听认证状态变化
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          user.value = session.user
          await fetchProfile()
        } else {
          user.value = null
          profile.value = null
        }
      })
    } catch (error) {
      console.error('初始化认证失败（已降级处理）:', error)
      // 不阻塞应用启动，用户可以手动登录
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  // 用户名密码登录
  async function login(username: string, password: string) {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username.includes('@') ? username : `${username}@local.dev`,
        password: password
      })

      if (error) throw error

      if (data.user) {
        user.value = data.user
        await fetchProfile()
      }

      return { success: true }
    } catch (error: any) {
      console.error('登录失败:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // 注册
  async function register(username: string, password: string, email?: string) {
    loading.value = true
    try {
      // 注册前清除旧用户状态，防止数据污染
      user.value = null
      profile.value = null

      const { data, error } = await supabase.auth.signUp({
        email: email || `${username}@local.dev`,
        password: password,
        options: {
          data: {
            username: username
          }
        }
      })

      if (error) throw error

      if (data.user) {
        user.value = data.user
        // 数据库触发器会自动创建 profile，等待触发器执行完成
        await new Promise(resolve => setTimeout(resolve, 500))
        await fetchProfile()
      }

      return { success: true }
    } catch (error: any) {
      console.error('注册失败:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // 获取用户资料
  async function fetchProfile() {
    if (!user.value?.id) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .single()

      if (data && !error) {
        profile.value = data
      }
    } catch (error) {
      console.error('获取用户资料失败:', error)
    }
  }

  // 创建用户资料
  async function createProfile() {
    if (!user.value?.id) return
    
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.value.id,
          phone: user.value.phone
        })
      
      if (error && error.code !== '23505') { // 忽略重复键错误
        throw error
      }
      
      await fetchProfile()
    } catch (error) {
      console.error('创建资料失败:', error)
    }
  }

  // 更新用户资料
  async function updateProfile(updates: any) {
    if (!user.value?.id) return { success: false, error: '未登录' }
    
    loading.value = true
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.value.id)
      
      if (error) throw error
      
      await fetchProfile()
      return { success: true }
    } catch (error: any) {
      console.error('更新资料失败:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // 退出登录
  async function logout() {
    loading.value = true
    try {
      await supabase.auth.signOut()
      user.value = null
      profile.value = null
      // 通知其他 store 清除数据（需要在调用 logout 的页面中处理）
      uni.$emit('userLoggedOut')
    } catch (error) {
      console.error('退出登录失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 修改密码
  async function changePassword(currentPassword: string, newPassword: string) {
    if (!user.value?.email) return { success: false, error: '未登录' }

    loading.value = true
    try {
      // 1. 先验证当前密码是否正确（重新登录验证）
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: user.value.email,
        password: currentPassword
      })

      if (signInError) {
        return { success: false, error: '当前密码错误' }
      }

      if (!signInData?.user) {
        return { success: false, error: '当前密码错误' }
      }

      // 2. 更新密码
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      return { success: true }
    } catch (error: any) {
      console.error('修改密码失败:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  return {
    // 状态
    user,
    profile,
    loading,
    initialized,
    // 计算属性
    isLoggedIn,
    userId,
    userPhone,
    // 方法
    initAuth,
    fetchProfile,
    login,
    register,
    createProfile,
    updateProfile,
    logout,
    changePassword
  }
})
