# API 配置实现总结

## 完成的工作

### 1. Admin 后台系统（`admin/` 目录）

**新增文件：**
- `admin/src/config/api.ts` - API 配置类型定义和引导信息
- `admin/src/services/api-config.ts` - API 配置 CRUD 服务
- `admin/src/views/ApiSettings.vue` - API 配置管理页面
- `sql/api-config-table.sql` - 数据库迁移脚本

**修改文件：**
- `admin/src/router/index.ts` - 添加 API 配置路由
- `admin/src/App.vue` - 添加 API 配置导航菜单

**功能特性：**
- OCR 和语音 API 配置表单
- 实时测试连接功能
- 配置状态概览卡片
- 申请引导说明
- 保存到 Supabase 数据库

### 2. 前端 App（`src/` 目录）

**新增文件：**
- `src/services/api-config.ts` - 从后端获取 API 配置的服务

**修改文件：**
- `src/config/api.ts` - 改为从后端获取配置（移除本地存储函数）
- `src/services/medication.ts` - 使用 `fetchApiConfig()` 从后端获取配置
- `src/pages/settings/settings.vue` - 移除 API 配置入口
- `src/pages.json` - 移除 api-settings 路由

**删除文件：**
- `src/pages/api-settings/` - 前端 API 配置页面（已删除）

### 3. 文档

**修改文件：**
- `docs/api-setup-guide.md` - 更新说明 API 配置在后台管理系统中进行

## 架构说明

```
┌─────────────────────┐         ┌──────────────────────┐
│   前端 App (uni-app) │         │  Admin 后台系统      │
│                     │         │  (Vue 3 + Vite)      │
│  - 读取 API 配置      │         │  - 配置 API 密钥       │
│  - 调用 OCR/语音 API  │         │  - 保存到 Supabase   │
│  - 降级方案（模拟）  │         │  - 测试连接          │
└─────────┬───────────┘         └──────────┬───────────┘
          │                                │
          │      ┌─────────────────────────┘
          │      │
          ▼      ▼
     ┌──────────────────┐
     │   Supabase DB    │
     │  - api_config 表 │
     │  - 存储 API 密钥    │
     └──────────────────┘
```

## 部署步骤

### 1. 数据库迁移

在 Supabase SQL Editor 中运行：
```bash
sql/api-config-table.sql
```

### 2. 部署 Admin 后台

```bash
cd admin
npm install
npm run build
# 部署 dist 目录到服务器
```

### 3. 配置 API

1. 访问 Admin 后台管理系统
2. 进入"API 配置"页面
3. 填写百度 OCR 和语音 API 密钥
4. 点击"测试连接"验证
5. 点击"保存配置"

### 4. 前端自动获取配置

前端 app 启动时自动从 Supabase 读取 API 配置，无需额外配置。

## API 密钥安全

- API 密钥存储在 Supabase 数据库中
- 仅管理员可访问后台配置页面
- 前端只读，无法修改配置
- 支持 5 分钟缓存，减少数据库查询
