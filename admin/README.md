# 用药助手管理后台

独立的 PC 端管理后台，用于管理用药计划和配置 API 密钥。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写你的 Supabase 配置：

```bash
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3010

## 构建

```bash
npm run build
```

## 功能

- **Dashboard** - 查看统计数据
- **用药计划管理** - 查看和管理用户的用药计划
- **API 配置** - 配置百度 AI API 密钥

## 默认管理员账户

执行 `sql/init-admin.sql` 后，使用以下账户登录：

- 邮箱：`admin@medication-assistant.local`
- 密码：在 SQL 脚本中设置的密码
