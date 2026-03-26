/**
 * Supabase Realtime 客户端 - 使用 uni.connectSocket 实现
 */

const SUPABASE_URL = 'https://vqtrfkigzqtcthrivbzn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxdHJma2lnenF0Y3Rocml2YnpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTUxOTUsImV4cCI6MjA4OTQ3MTE5NX0.YznHv4aNl7WpH4s8cjoYRR0_IH1guoBbLl6zRrdsb3s'

const STORAGE_KEY = 'supabase_auth_token'

// 从 supabase 客户端获取 session 的辅助函数
async function getAccessToken(): Promise<string | null> {
  try {
    // 直接从 storage 获取 token
    const token = uni.getStorageSync(STORAGE_KEY)
    console.log('[Realtime] 获取到 token:', token ? token.substring(0, 30) + '...' : '无')
    return token
  } catch (e) {
    console.error('[Realtime] 获取 token 失败:', e)
    return null
  }
}

// Realtime 频道类型
interface RealtimeChannel {
  name: string
  callback?: (payload: any) => void
  filters?: {
    event: string
    schema: string
    table: string
    filter?: string
  }
}

// Realtime 客户端
export class SupabaseRealtimeClient {
  private socketTask: UniApp.SocketTask | null = null
  private channels: Map<string, RealtimeChannel> = new Map()
  private reconnectTimer: number | null = null
  private isConnected = false
  private token: string | null = null
  private joinRefCounter = 0

  constructor() {
    this.token = uni.getStorageSync(STORAGE_KEY)
  }

  /**
   * 创建频道
   */
  channel(name: string) {
    const channelObj: RealtimeChannel = { name }

    return {
      on: (event: string, filters: any, callback: (payload: any) => void) => {
        channelObj.callback = callback
        channelObj.filters = filters
        console.log('[Realtime] 配置频道过滤器:', name, filters)
        return {
          subscribe: () => {
            this.addChannel(channelObj)
            this.connect()
            return {
              unsubscribe: () => {
                this.removeChannel(channelObj.name)
              }
            }
          }
        }
      }
    }
  }

  /**
   * 添加频道
   */
  private addChannel(channel: RealtimeChannel) {
    console.log('[Realtime] 添加频道:', channel.name, channel.filters)
    this.channels.set(channel.name, channel)
  }

  /**
   * 移除频道
   */
  removeChannel(name: string) {
    console.log('[Realtime] 移除频道:', name)
    this.channels.delete(name)
    if (this.channels.size === 0) {
      this.disconnect()
    }
  }

  /**
   * 连接 WebSocket
   */
  private connect() {
    if (this.isConnected || this.socketTask) {
      console.log('[Realtime] 已连接或正在连接，跳过')
      return
    }

    // Supabase Realtime WebSocket URL 格式
    const wsUrl = `wss://${SUPABASE_URL.replace('https://', '')}/realtime/v1/websocket?apikey=${encodeURIComponent(SUPABASE_ANON_KEY)}&vsn=1.0.0`

    console.log('[Realtime] 连接 WebSocket:', wsUrl)

    try {
      this.socketTask = uni.connectSocket({
        url: wsUrl,
        protocols: ['graphql-ws'],
        success: () => {
          console.log('[Realtime] Socket 连接请求已发送')
        },
        fail: (err) => {
          console.error('[Realtime] Socket 连接失败:', err)
          this.scheduleReconnect()
        }
      })

      // 连接打开
      this.socketTask.onOpen(() => {
        console.log('[Realtime] WebSocket 已连接')
        this.isConnected = true
        // 等待连接稳定后加入频道
        setTimeout(() => this.sendJoinChannels(), 500)
      })

      // 接收消息
      this.socketTask.onMessage((res) => {
        console.log('[Realtime] 收到消息:', res.data)
        try {
          const msg = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
          this.handleMessage(msg)
        } catch (e) {
          console.error('[Realtime] 解析消息失败:', e)
        }
      })

      // 连接错误
      this.socketTask.onError((err) => {
        console.error('[Realtime] WebSocket 错误:', err)
        this.isConnected = false
      })

      // 连接关闭
      this.socketTask.onClose(() => {
        console.log('[Realtime] WebSocket 已关闭')
        this.isConnected = false
        this.socketTask = null
        this.scheduleReconnect()
      })
    } catch (e) {
      console.error('[Realtime] 创建 Socket 失败:', e)
    }
  }

  /**
   * 发送加入频道消息
   */
  private async sendJoinChannels() {
    const token = await getAccessToken()

    console.log('[Realtime] 准备加入频道，数量:', this.channels.size)
    console.log('[Realtime] 使用 token:', token ? token.substring(0, 30) + '...' : '无')

    for (const [name, channel] of this.channels.entries()) {
      if (!channel.filters) {
        console.warn('[Realtime] 频道没有过滤器，跳过:', name)
        continue
      }

      this.joinRefCounter++
      const joinRef = `${this.joinRefCounter}`

      // Supabase Realtime 加入消息格式
      // 使用正确的 Supabase Realtime topic 格式：realtime:{schema}:{table}
      const topic = `realtime:${channel.filters.schema}:${channel.filters.table}`

      const joinMessage = {
        topic: topic,
        event: 'phx_join',
        payload: {
          access_token: token || '',
          config: {
            event: channel.filters.event,
            schema: channel.filters.schema,
            table: channel.filters.table,
            filter: channel.filters.filter || ''
          }
        },
        ref: joinRef
      }

      console.log('[Realtime] 加入频道:', name, 'topic:', topic)
      console.log('[Realtime] join payload:', JSON.stringify({
        access_token: token ? token.substring(0, 30) + '...' : '无',
        config: joinMessage.payload.config
      }, null, 2))
      this.send(joinMessage)
    }
  }

  /**
   * 发送消息
   */
  private send(msg: any) {
    if (this.socketTask && this.isConnected) {
      this.socketTask.send({
        data: JSON.stringify(msg),
        success: () => {
          console.log('[Realtime] 消息已发送')
        },
        fail: (err) => {
          console.error('[Realtime] 发送消息失败:', err)
        }
      })
    }
  }

  /**
   * 断开连接
   */
  private disconnect() {
    console.log('[Realtime] 断开连接')
    if (this.socketTask) {
      this.socketTask.close()
      this.socketTask = null
    }
    this.isConnected = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  /**
   * 重连
   */
  private scheduleReconnect() {
    if (this.reconnectTimer) return

    console.log('[Realtime] 5 秒后重连...')
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.socketTask = null
      this.connect()
    }, 5000) as unknown as number
  }

  /**
   * 处理接收的消息
   */
  private handleMessage(msg: any) {
    console.log('[Realtime] 处理消息:', JSON.stringify(msg, null, 2))

    // 处理订阅成功响应
    // Supabase 返回的 topic 格式：realtime:{schema}:{table}
    if (msg.topic && msg.topic.startsWith('realtime:') && msg.event === 'phx_reply') {
      const channelName = msg.topic.replace('realtime:', '')
      if (msg.payload?.status === 'ok') {
        console.log('[Realtime] 频道订阅成功:', channelName, 'ref:', msg.ref)
        console.log('[Realtime] 订阅响应详情:', JSON.stringify(msg.payload.response))
      } else if (msg.payload?.status === 'error') {
        console.error('[Realtime] 频道订阅失败:', channelName, msg.payload)
      }
      return
    }

    // 处理 PostgreSQL 变更广播
    // Supabase 广播消息的 topic 格式：realtime:{schema}:{table}
    // 事件格式：INSERT, UPDATE, DELETE, postgres_changes
    if (msg.topic && msg.topic.startsWith('realtime:')) {
      const channelName = msg.topic.replace('realtime:', '')
      const schemaTable = channelName // 格式：public:remote_notifications

      // 检查是否是 PostgreSQL 变更事件 - 支持多种格式
      const isPostgresChange =
        msg.event === 'INSERT' ||
        msg.event === 'UPDATE' ||
        msg.event === 'DELETE' ||
        msg.event === 'postgres_changes' ||
        msg.event === 'BROADCAST' ||
        msg.payload?.type === 'INSERT' ||
        msg.payload?.type === 'UPDATE' ||
        msg.payload?.type === 'DELETE' ||
        // Supabase Realtime v2 格式
        msg.payload?.new ||
        msg.payload?.after ||
        msg.payload?.record

      if (isPostgresChange) {
        console.log('[Realtime] 收到 PostgreSQL 变更:', schemaTable, 'event:', msg.event, 'payload:', JSON.stringify(msg.payload))

        // 查找匹配的频道（使用 schema:table 格式查找）
        for (const [name, channel] of this.channels.entries()) {
          const channelKey = `${channel.filters?.schema}:${channel.filters?.table}`
          if (channelKey === schemaTable && channel?.callback && msg.payload) {
            console.log('[Realtime] 匹配频道:', name, '触发回调')
            channel.callback({
              new: msg.payload.new || msg.payload.after || msg.payload.record,
              old: msg.payload.old || msg.payload.before,
              type: msg.payload.type || msg.event || 'INSERT'
            })
            break
          }
        }
      } else if (msg.event === 'broadcast' && msg.payload) {
        // 处理 broadcast 事件
        console.log('[Realtime] 收到 broadcast 消息:', msg.payload)
      } else if (msg.event !== 'phx_reply' && msg.event !== 'phx_close' && msg.event !== 'system' && msg.event !== 'phx_error') {
        console.log('[Realtime] 未知消息类型 - event:', msg.event, 'topic:', msg.topic, 'full msg:', JSON.stringify(msg))
      }
    }
  }
}

// 创建 Realtime 客户端实例
export const realtimeClient = new SupabaseRealtimeClient()
