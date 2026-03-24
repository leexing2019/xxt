# 后台登录刷新问题修复文档

## 问题描述

**症状**：在后台管理系统登录后，刷新页面会跳转回登录页面，即使 Supabase 会话仍然有效。

**影响**：用户每次刷新页面都需要重新登录，体验极差。

## 根本原因

1. **Pinia Store 刷新重置**：页面刷新时，Pinia store 的状态会重置为初始值（`user.value = null`）
2. **缺少初始化逻辑**：auth store 没有调用 `initAuth()` 来恢复 Supabase 会话
3. **路由守卫未等待初始化**：路由守卫在 auth 初始化完成前就判断 `isLoggedIn`，导致错误跳转

## 修复方案

### 1. auth store 添加 initAuth 函数

文件：`admin/src/stores/auth.ts`

```typescript
// 添加 initialized 状态
const initialized = ref(false)

// 添加 initAuth 函数
async function initAuth() {
  if (initialized.value) return

  loading.value = true
  try {
    // 获取当前会话
    const { data: { session }, error } = await supabase.auth.getSession()

    if (session?.user) {
      user.value = session.user
    }

    // 监听认证状态变化
    supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        user.value = session.user
      } else {
        user.value = null
      }
    })
  } catch (error) {
    console.error('初始化认证失败:', error)
  } finally {
    loading.value = false
    initialized.value = true
  }
}
```

### 2. main.ts 调用初始化

文件：`admin/src/main.ts`

```typescript
import { useAuthStore } from './stores/auth'

// 初始化认证状态（恢复刷新后的登录状态）
const authStore = useAuthStore(pinia)
authStore.initAuth()
```

### 3. 路由守卫等待初始化完成

文件：`admin/src/router/index.ts`

```typescript
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

  // ... 其他逻辑
})
```

## 验证方法

1. 使用管理员账号登录后台
2. 按 F5 刷新页面
3. 应该保持在当前页面，不跳转到登录页
4. 打开浏览器 DevTools → Application → Local Storage，应该能看到 `supabase.auth.token`

## 技术原理

### Supabase Auth 会话持久化

Supabase Auth 默认将会话存储在 `localStorage` 中：
- Key: `sb-{project-ref}-auth-token`
- 包含：access_token, refresh_token, user 信息

### 页面刷新时的流程

```
页面刷新
  ↓
Pinia Store 重置 (user.value = null)
  ↓
main.ts 调用 authStore.initAuth()
  ↓
supabase.auth.getSession() 从 localStorage 读取会话
  ↓
如果会话有效，恢复 user.value
  ↓
路由守卫等待 initialized = true
  ↓
判断 isLoggedIn，决定是否需要跳转
```

## 注意事项

⚠️ **禁止移除 initAuth 调用**
- `main.ts` 中的 `authStore.initAuth()` 必须在路由守卫之前调用
- 否则刷新后仍然会跳转登录页

⚠️ **禁止修改 initialized 标志**
- `initialized` 用于防止重复初始化
- 移除会导致多次调用 `getSession()`

⚠️ **路由守卫必须先等待初始化**
- 在判断 `isLoggedIn` 之前，必须确保 `initialized = true`
- 否则会在会话恢复前就跳转到登录页

## 相关文件

- `admin/src/stores/auth.ts` - 认证 store
- `admin/src/main.ts` - 应用入口
- `admin/src/router/index.ts` - 路由配置和守卫
- `admin/src/services/supabase.ts` - Supabase 客户端配置

## 历史修复记录

- **2026-03-24**: 首次修复，添加 initAuth 和路由守卫等待逻辑
- **2026-03-25**: 本文档创建，防止后续修改破坏修复
