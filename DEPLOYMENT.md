# 部署指南

## 构建完成

前端和后台管理系统已成功构建：

### 构建产物位置

- **H5 前端**（用户端）：`dist/build/h5/`
- **Admin 后台**（管理端）：`admin/dist/`

## 数据库迁移

在部署之前，请按顺序执行以下数据库迁移：

### 1. 拼音首字母自动生成功能（新增）

```bash
# 执行迁移脚本
sql/add-pinyin-initials.sql
```

**操作步骤**：
1. 访问 Supabase 后台：https://app.supabase.com/project/vqtrfkigzqtcthrivbzn/sql
2. 复制 `sql/add-pinyin-initials.sql` 的全部内容
3. 粘贴到 SQL Editor 并点击"Run"执行

**迁移内容**：
- 添加 `pinyin_initials` 字段到 `common_medications` 表
- 创建拼音首字母映射函数和自动触发器
- 为现有数据批量生成拼音首字母
- 创建索引加速搜索

**效果**：
- 管理员后台添加药品时，自动生成拼音首字母
- 用户前端添加药品时，保存到数据库后自动生成拼音首字母
- 搜索时可以使用拼音首字母（如输入 "jg" 搜索"甲钴胺片"）

### 2. 药品剂型和颜色迁移

1. 访问 Supabase 后台：https://app.supabase.com/project/vqtrfkigzqtcthrivbzn/sql
2. 复制 `sql/migrate-medication-forms-20260324.sql` 的全部内容
3. 粘贴到 SQL Editor 并点击"Run"执行

迁移脚本会：
- 添加 `color` 字段到 `common_medications` 表
- 将现有药品的 `form` 字段统一为标准值（tablet, capsule, liquid）
- 根据外观描述自动设置颜色值

## 部署方式

### 方案一：本地预览（测试用）

**H5 前端**：
```bash
cd C:/Users/zlx19/xtx
npx serve dist/build/h5
```
访问：http://localhost:3000

**Admin 后台**：
```bash
cd C:/Users/zlx19/xtx/admin
npx serve dist
```
访问：http://localhost:4173

### 方案二：部署到 Vercel（推荐）

**H5 前端**：
1. 访问 https://vercel.com/new
2. 导入 GitHub 仓库
3. 设置 Output Directory: `dist/build/h5`
4. 部署

**Admin 后台**：
1. 访问 https://vercel.com/new
2. 导入 GitHub 仓库
3. 设置 Output Directory: `admin/dist`
4. 部署

### 方案三：部署到 Netlify

**H5 前端**：
1. 访问 https://app.netlify.com/drop
2. 拖拽 `dist/build/h5` 文件夹到上传区域
3. 设置 SPA 路由（Netlify 自动配置）

**Admin 后台**：
1. 访问 https://app.netlify.com/drop
2. 拖拽 `admin/dist` 文件夹到上传区域

### 方案四：部署到云服务器

如果有 Nginx 服务器，配置如下：

```nginx
# H5 前端
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist/build/h5;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Admin 后台
server {
    listen 80;
    server_name admin.your-domain.com;
    root /path/to/admin/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 访问地址

部署完成后，你将获得两个访问地址：

1. **H5 前端**（用户使用）：用于添加药品、设置服药时间、查看服药记录
2. **Admin 后台**（管理员使用）：用于管理公共药品库、用户管理、API 设置

### 默认登录方式

Admin 后台使用 Supabase 认证，首次使用需要：
1. 访问 Admin 后台
2. 使用已在 Supabase 中注册的管理员账号登录
3. 如果没有管理员账号，需要在 Supabase 后台创建用户

## 验证部署

1. **H5 前端验证**：
   - 打开首页，检查是否正常加载
   - 测试搜索药品功能
   - 测试添加药品流程
   - 检查药品图标是否正确显示（药片、胶囊、口服液三种剂型）

2. **Admin 后台验证**：
   - 登录管理后台
   - 进入"公共药品库管理"
   - 编辑任意药品，检查剂型下拉菜单是否只有三种选项（药片、胶囊、口服液）
   - 检查编辑药片或胶囊时是否显示颜色选择器

## 注意事项

1. **环境变量**：确保生产环境使用正确的 Supabase 配置
2. **HTTPS**：生产环境建议使用 HTTPS 协议
3. **缓存**：部署后如果遇到问题，清除浏览器缓存或使用强制刷新（Ctrl+Shift+R）
4. **路由模式**：SPA 应用需要配置服务器将所有路由重定向到 `index.html`
