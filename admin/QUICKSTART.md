# 后台管理系统快速开始指南

## 已完成的功能

### 1. Dashboard (数据统计面板)
- 用户总数、活跃用户统计
- 药品总数统计
- 平均用药依从性 (85%)
- 用户增长趋势图表 (占位符)
- 药品添加趋势图表 (占位符)
- 最近注册用户列表

### 2. 用户管理
- 用户列表展示 (表格形式)
- 用户详情查看 (对话框)
- 用户删除功能
- 搜索用户 (用户名/手机号)

### 3. 药品库管理
- 药品列表展示 (带图片)
- 添加新药品 (完整表单)
- 编辑药品信息
- 删除药品
- 分类筛选 (心血管系统、消化系统等 9 种分类)
- 搜索药品 (名称/通用名)

## 启动步骤

### 1. 配置环境变量

编辑 `admin/.env` 文件，填入你的 Supabase 配置：

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**获取配置方法：**
1. 登录 [Supabase](https://supabase.com)
2. 进入你的项目
3. 点击 Settings -> API
4. 复制 Project URL 和 anon/public key

### 2. 创建管理员账号

1. 进入 Supabase 项目
2. 点击 Authentication -> Add user -> Create new user
3. 填写管理员邮箱和密码
4. **重要：** 邮箱建议包含 "admin" 字样 (如 admin@example.com)

### 3. 创建 Storage Bucket

在 Supabase SQL Editor 中执行 `sql/storage-setup.sql` 脚本：

```sql
-- 创建 medication-images 和 avatars bucket
-- 配置 RLS 策略允许上传和公开访问
```

或者手动创建：
1. 点击 Storage -> New bucket
2. 创建 `medication-images` (Public bucket)
3. 创建 `avatars` (Public bucket)

### 4. 启动开发服务器

```bash
cd admin
npm install  # 如果还未安装依赖
npm run dev
```

访问 http://localhost:5173

## 项目结构

```
admin/
├── src/
│   ├── router/index.ts       # 路由配置
│   ├── stores/auth.ts        # 认证状态管理
│   ├── services/supabase.ts  # Supabase 客户端
│   ├── views/
│   │   ├── Login.vue         # 登录页
│   │   ├── Dashboard.vue     # 仪表盘
│   │   ├── Users.vue         # 用户管理
│   │   └── Medications.vue   # 药品库管理
│   ├── App.vue               # 主布局
│   └── main.ts               # 入口文件
├── .env                      # 环境变量
├── .env.example              # 环境变量模板
└── package.json
```

## 注意事项

1. **权限检查：** 登录时会检查邮箱是否包含 "admin"，非管理员账号会被强制登出
2. **数据表依赖：** 需要 `profiles` 和 `medications` 表存在
3. **时区设置：** 日期显示使用浏览器本地时区

## 下一步优化建议

1. **Dashboard 图表：** 当前使用 CSS 占位符，可集成 ECharts 显示真实数据图表
2. **药品详情页：** 添加药品详情查看功能
3. **数据统计：** 实现真实的活跃用户和依从性统计
4. **导出功能：** 添加用户数据、药品数据导出为 Excel
5. **日志管理：** 添加服药记录查看功能
