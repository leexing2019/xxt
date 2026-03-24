import type { RouteRecordRaw, Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '数据统计', requiresAuth: true }
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('@/views/Users.vue'),
    meta: { title: '用户管理', requiresAuth: true }
  },
  {
    path: '/medications',
    name: 'Medications',
    component: () => import('@/views/Medications.vue'),
    meta: { title: '药品库管理', requiresAuth: true }
  },
  {
    path: '/api-settings',
    name: 'ApiSettings',
    component: () => import('@/views/ApiSettings.vue'),
    meta: { title: 'API 配置', requiresAuth: true }
  }
]

// 路由守卫
export function setupRouterGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    // 等待 auth 初始化完成（防止刷新时未初始化就跳转）
    if (!authStore.initialized) {
      await new Promise(resolve => {
        const checkInitialized = () => {
          if (authStore.initialized) {
            resolve(true)
          } else {
            setTimeout(checkInitialized, 50)
          }
        }
        checkInitialized()
      })
    }

    // 设置页面标题
    if (to.meta.title) {
      document.title = `${to.meta.title} - 用药助手后台`
    }

    // 检查是否需要登录
    if (to.meta.requiresAuth && !authStore.isLoggedIn) {
      next('/login')
    } else if (to.path === '/login' && authStore.isLoggedIn) {
      next('/dashboard')
    } else {
      next()
    }
  })
}
