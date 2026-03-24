/**
 * 数据库迁移脚本执行器
 * 使用 Supabase SDK 执行 SQL 迁移脚本
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// 从环境变量获取配置
const supabaseUrl = 'https://vqtrfkigzqtcthrivbzn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxdHJma2lnenF0Y3Rocml2YnpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTUxOTUsImV4cCI6MjA4OTQ3MTE5NX0.YznHv4aNl7WpH4s8cjoYRR0_IH1guoBbLl6zRrdsb3s'

// 注意： anon key 可能没有执行 DDL 的权限，需要使用 service role key
// 请从 Supabase 后台获取 service role key 并设置环境变量
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || supabaseKey

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function runMigration() {
  console.log('开始执行数据库迁移...')

  // 读取迁移脚本
  const migrationPath = path.join(__dirname, 'sql', 'migrate-medication-forms-20260324.sql')
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

  console.log('读取迁移脚本:', migrationPath)

  // Supabase JavaScript SDK 不直接支持执行原始 SQL
  // 我们需要使用 RPC 或者通过 REST API 执行
  // 这里我们通过调用 Supabase 的 REST API 来执行 SQL

  console.log('\n注意：Supabase JS SDK 不直接支持执行原始 SQL 语句')
  console.log('请通过以下方式之一执行迁移脚本:\n')
  console.log('1. 在 Supabase 后台执行:')
  console.log('   - 访问 https://app.supabase.com/project/vqtrfkigzqtcthrivbzn/editor')
  console.log('   - 进入 SQL Editor')
  console.log('   - 复制并执行 sql/migrate-medication-forms-20260324.sql 的内容\n')
  console.log('2. 使用 Supabase CLI:')
  console.log('   - 安装：npm install -g supabase')
  console.log('   - 登录：supabase login')
  console.log('   - 执行：supabase db execute --file sql/migrate-medication-forms-20260324.sql\n')

  // 尝试通过 API 执行（如果 service role key 可用）
  if (process.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey
        },
        body: JSON.stringify({ sql: migrationSQL })
      })

      if (response.ok) {
        console.log('迁移执行成功!')
        const result = await response.json()
        console.log('结果:', result)
        return true
      } else {
        console.log('API 执行失败，请手动在 Supabase 后台执行')
        return false
      }
    } catch (error) {
      console.error('执行出错:', error.message)
      return false
    }
  } else {
    console.log('未设置 VITE_SUPABASE_SERVICE_ROLE_KEY 环境变量')
    console.log('请从 Supabase 后台获取 Service Role Key:')
    console.log('https://app.supabase.com/project/vqtrfkigzqtcthrivbzn/settings/api')
    return false
  }
}

// 执行迁移
runMigration().then(success => {
  process.exit(success ? 0 : 1)
})
