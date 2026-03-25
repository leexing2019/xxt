/**
 * Supabase 客户端 - 使用 uni.request 实现
 * 避免 Supabase SDK 在 uni-app App 环境中的兼容性问题
 */

const SUPABASE_URL = 'https://vqtrfkigzqtcthrivbzn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxdHJma2lnenF0Y3Rocml2YnpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTUxOTUsImV4cCI6MjA4OTQ3MTE5NX0.YznHv4aNl7WpH4s8cjoYRR0_IH1guoBbLl6zRrdsb3s'

const STORAGE_KEY = 'supabase_auth_token'

// 简单的 Supabase 客户端实现
export const supabase = {
  auth: {
    // 获取会话
    async getSession() {
      try {
        const token = uni.getStorageSync(STORAGE_KEY)
        if (!token) {
          return { data: { session: null }, error: null }
        }

        // 验证 token 是否有效
        return new Promise((resolve) => {
          uni.request({
            url: `${SUPABASE_URL}/rest/v1/user`,
            method: 'GET',
            header: {
              'Authorization': `Bearer ${token}`,
              'apikey': SUPABASE_ANON_KEY,
              'Content-Type': 'application/json'
            },
            success: (res) => {
              if (res.statusCode === 200) {
                resolve({ data: { session: { user: res.data, access_token: token } }, error: null })
              } else {
                uni.removeStorageSync(STORAGE_KEY)
                resolve({ data: { session: null }, error: null })
              }
            },
            fail: (err) => {
              console.error('获取会话失败:', err)
              resolve({ data: { session: null }, error: err })
            }
          })
        })
      } catch (error) {
        console.error('获取会话失败:', error)
        return { data: { session: null }, error }
      }
    },

    // 登录
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      try {
        const basicAuth = SUPABASE_ANON_KEY + ':' + 'service_role'

        return new Promise((resolve) => {
          uni.request({
            url: `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
            method: 'POST',
            header: {
              'Authorization': `Basic ${basicAuth}`,
              'apikey': SUPABASE_ANON_KEY,
              'Content-Type': 'application/json'
            },
            data: { email, password },
            success: (res) => {
              if (res.statusCode === 200) {
                // 保存 token
                if (res.data.access_token) {
                  uni.setStorageSync(STORAGE_KEY, res.data.access_token)
                }
                resolve({
                  data: {
                    user: res.data.user,
                    session: {
                      access_token: res.data.access_token,
                      refresh_token: res.data.refresh_token,
                      user: res.data.user
                    }
                  },
                  error: null
                })
              } else {
                resolve({
                  data: {},
                  error: new Error(res.data.msg || res.data.error_description || '登录失败')
                })
              }
            },
            fail: (err) => {
              resolve({ data: {}, error: new Error(err.errMsg || '登录失败') })
            }
          })
        })
      } catch (error: any) {
        return { data: {}, error: new Error(error.message || '登录失败') }
      }
    },

    // 注册
    async signUp({ email, password, options }: { email: string; password: string; options?: { data?: any } }) {
      try {
        return new Promise((resolve) => {
          // 注册前先清除旧 token，防止数据污染
          uni.removeStorageSync(STORAGE_KEY)

          uni.request({
            url: `${SUPABASE_URL}/auth/v1/signup`,
            method: 'POST',
            header: {
              'apikey': SUPABASE_ANON_KEY,
              'Content-Type': 'application/json'
            },
            data: {
              email,
              password,
              data: options?.data || {}
            },
            success: (res) => {
              if (res.statusCode === 200) {
                // Supabase 注册成功返回格式：{ access_token, refresh_token, user: {...} }
                // 必须保存新 token 到 localStorage
                if (res.data.access_token) {
                  uni.setStorageSync(STORAGE_KEY, res.data.access_token)
                }
                // Supabase Auth API 返回格式：{ access_token, user: { id, email, user_metadata, ... } }
                resolve({
                  data: {
                    user: res.data.user || res.data,
                    access_token: res.data.access_token
                  },
                  error: null
                })
              } else {
                resolve({ data: {}, error: new Error(res.data.msg || res.data.error_description || '注册失败') })
              }
            },
            fail: (err) => {
              resolve({ data: {}, error: new Error(err.errMsg || '注册失败') })
            }
          })
        })
      } catch (error: any) {
        return { data: {}, error: new Error(error.message || '注册失败') }
      }
    },

    // 退出登录
    async signOut() {
      uni.removeStorageSync(STORAGE_KEY)
    },

    // 更新用户信息
    async updateUser(options: { password?: string }) {
      try {
        const token = uni.getStorageSync(STORAGE_KEY)
        return new Promise((resolve) => {
          uni.request({
            url: `${SUPABASE_URL}/auth/v1/user`,
            method: 'PUT',
            header: {
              'Authorization': `Bearer ${token}`,
              'apikey': SUPABASE_ANON_KEY,
              'Content-Type': 'application/json'
            },
            data: {
              password: options.password
            },
            success: (res) => {
              if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve({ data: res.data, error: null })
              } else {
                resolve({ data: null, error: res.data })
              }
            },
            fail: (err) => {
              resolve({ data: null, error: err })
            }
          })
        })
      } catch (error: any) {
        return { data: null, error: new Error(error.message || '更新用户失败') }
      }
    },

    // 监听认证状态变化
    onAuthStateChange(callback: (event: string, session: any) => void) {
      // uni-app 中简化处理
      return { data: { subscription: { unsubscribe: () => {} } } }
    }
  },

  // 数据库操作
  from(table: string) {
    let queryColumns = '*'
    let queryFilters: Array<{ column: string; value: any; operator: string }> = []
    let queryOrder: { column: string; ascending?: boolean } | null = null
    let queryLimit = 0
    let updateValues: any = null
    let needsUpdate = false
    let needsDelete = false

    // 构建 URL 函数
    const buildUrl = (base: string) => {
      let url = `${base}?select=${queryColumns}`
      for (const filter of queryFilters) {
        url += `&${filter.column}=${filter.operator}.${filter.value}`
      }
      if (queryOrder) {
        url += `&order=${queryOrder.column}${queryOrder.ascending ? '.asc' : '.desc'}`
      }
      if (queryLimit > 0) {
        url += `&limit=${queryLimit}`
      }
      return url
    }

    // 执行请求
    const executeRequest = (url: string, method = 'GET', data?: any) => {
      const token = uni.getStorageSync(STORAGE_KEY)
      return new Promise((resolve) => {
        uni.request({
          url,
          method,
          header: {
            'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            ...(method === 'POST' ? { 'Prefer': 'return=representation' } : {})
          },
          data,
          success: (res) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ data: res.data, error: null })
            } else {
              resolve({ data: null, error: res.data })
            }
          },
          fail: (err) => {
            resolve({ data: null, error: err })
          }
        })
      })
    }

    const queryObj: any = {}

    queryObj.select = (columns = '*') => {
      queryColumns = columns
      return queryObj
    }

    queryObj.eq = (column: string, value: any) => {
      queryFilters.push({ column, value, operator: 'eq' })
      return queryObj
    }

    queryObj.gte = (column: string, value: any) => {
      queryFilters.push({ column, value, operator: 'gte' })
      return queryObj
    }

    queryObj.gt = (column: string, value: any) => {
      queryFilters.push({ column, value, operator: 'gt' })
      return queryObj
    }

    queryObj.lte = (column: string, value: any) => {
      queryFilters.push({ column, value, operator: 'lte' })
      return queryObj
    }

    queryObj.lt = (column: string, value: any) => {
      queryFilters.push({ column, value, operator: 'lt' })
      return queryObj
    }

    queryObj.neq = (column: string, value: any) => {
      queryFilters.push({ column, value, operator: 'neq' })
      return queryObj
    }

    queryObj.like = (column: string, value: any) => {
      queryFilters.push({ column, value, operator: 'like' })
      return queryObj
    }

    queryObj.order = (column: string, options?: { ascending?: boolean }) => {
      queryOrder = { column, ascending: options?.ascending ?? true }
      return queryObj
    }

    queryObj.limit = (count: number) => {
      queryLimit = count
      return queryObj
    }

    queryObj.single = async () => {
      queryLimit = 1
      const url = buildUrl(`${SUPABASE_URL}/rest/v1/${table}`)
      const result: any = await executeRequest(url)
      return {
        data: Array.isArray(result.data) ? result.data[0] : result.data,
        error: result.error
      }
    }

    queryObj.then = async function(resolve: any, reject: any) {
      const url = buildUrl(`${SUPABASE_URL}/rest/v1/${table}`)

      if (needsUpdate && updateValues) {
        return executeRequest(url, 'PATCH', updateValues).then(resolve).catch(reject)
      }
      if (needsDelete) {
        return executeRequest(url, 'DELETE').then(resolve).catch(reject)
      }
      return executeRequest(url).then(resolve).catch(reject)
    }

    queryObj.insert = (values: any) => {
      // 返回一个支持链式调用的对象
      const insertObj: any = {
        select: () => insertObj,
        single: async () => {
          const result = await executeRequest(`${SUPABASE_URL}/rest/v1/${table}`, 'POST', values)
          return {
            data: Array.isArray(result.data) ? result.data[0] : result.data,
            error: result.error
          }
        }
      }
      // 直接调用 insert() 时返回 Promise
      insertObj.then = async (resolve: any, reject: any) => {
        executeRequest(`${SUPABASE_URL}/rest/v1/${table}`, 'POST', values)
          .then(resolve)
          .catch(reject)
      }
      return insertObj
    }

    queryObj.update = (values: any) => {
      updateValues = values
      needsUpdate = true
      return queryObj
    }

    queryObj.delete = () => {
      needsDelete = true
      return queryObj
    }

    queryObj.upsert = async (values: any, options?: { onConflict?: string }) => {
      const token = uni.getStorageSync(STORAGE_KEY)
      return new Promise((resolve) => {
        uni.request({
          url: `${SUPABASE_URL}/rest/v1/${table}`,
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          data: values,
          success: (res) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ data: res.data, error: null })
            } else {
              resolve({ data: null, error: res.data })
            }
          },
          fail: (err) => {
            resolve({ data: null, error: err })
          }
        })
      })
    }

    queryObj.onConflict = (column: string) => {
      return {
        async upsert(values: any) {
          const token = uni.getStorageSync(STORAGE_KEY)
          return new Promise((resolve) => {
            uni.request({
              url: `${SUPABASE_URL}/rest/v1/${table}`,
              method: 'POST',
              header: {
                'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
              },
              data: values,
              success: (res) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                  resolve({ data: res.data, error: null })
                } else {
                  resolve({ data: null, error: res.data })
                }
              },
              fail: (err) => {
                resolve({ data: null, error: err })
              }
            })
          })
        }
      }
    }

    return queryObj
  }
}
