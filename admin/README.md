# 用药助手后台管理系统

基于 Vue 3 + TypeScript + Element Plus 的后台管理系统，用于管理用药助手应用的用户、药品和数据统计。

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - JavaScript 的超集
- **Element Plus** - Vue 3 UI 组件库
- **Vue Router** - 官方路由管理器
- **Pinia** - Vue 3 状态管理库
- **Supabase** - 开源后端云服务

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，并填入实际的 Supabase 配置：

```bash
# .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 获取 Supabase 配置

1. 登录 [Supabase](https://supabase.com)
2. 进入你的项目
3. 点击左下角 **Settings** (设置)
4. 点击 **API**
5. 复制 **Project URL** 和 **anon/public key**

### 4. 创建管理员账号

1. 进入 Supabase 项目
2. 点击左侧 **Authentication**
3. 点击 **Add user** -> **Create new user**
4. 填写管理员邮箱和密码
5. 建议邮箱包含 "admin" 字样（根据权限检查逻辑）

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

## 功能模块

### Dashboard
- 用户总数、活跃用户统计
- 药品总数统计
- 平均用药依从性
- 用户增长趋势图表
- 最近注册用户列表

### 用户管理
- 用户列表展示
- 用户详情查看
- 用户删除
- 搜索用户（用户名/手机号）

### 药品库管理
- 药品列表展示
- 添加新药品
- 编辑药品信息
- 删除药品
- 分类筛选
- 搜索药品

## 项目结构

```
admin/
├── src/
│   ├── assets/          # 静态资源
│   ├── components/      # 公共组件
│   ├── router/          # 路由配置
│   ├── services/        # 服务层（Supabase 客户端）
│   ├── stores/          # Pinia 状态管理
│   ├── views/           # 页面视图
│   │   ├── Login.vue    # 登录页
│   │   ├── Dashboard.vue # 仪表盘
│   │   ├── Users.vue    # 用户管理
│   │   └── Medications.vue # 药品库管理
│   ├── App.vue          # 根组件
│   └── main.ts          # 入口文件
├── .env.example         # 环境变量模板
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 数据库表结构

确保 Supabase 项目中已创建以下数据表：

- `profiles` - 用户资料
- `medications` - 药品信息
- `medication_schedules` - 服药计划
- `medication_logs` - 服药记录
- `drug_contraindications` - 药品禁忌
- `health_records` - 健康记录

详见项目根目录 `sql/schema.sql`

## Storage 配置

创建 `medication-images` storage bucket：

1. 进入 Supabase 项目
2. 点击左侧 **Storage**
3. 点击 **New bucket**
4. 名称：`medication-images`
5. Public bucket: 勾选（允许公开访问图片）

### RLS 策略

```sql
-- 允许认证用户上传文件
CREATE POLICY "允许认证用户上传文件"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'medication-images');

-- 允许任何人查看文件
CREATE POLICY "允许任何人查看文件"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'medication-images');
```

## 构建

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 开发命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run preview  # 预览生产构建
```
