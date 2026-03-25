# 部署百度 API 测试 Edge Function

## 前提条件

需要先登录 Supabase 才能部署 Edge Function。

## 部署步骤

### 1. 登录 Supabase

```bash
cd C:\Users\ZHUANG\.minimax-agent-cn\projects\17\ai-medication-assistant
npx supabase login
```

这会打开浏览器让你登录 Supabase 账号。

### 2. 链接项目

```bash
npx supabase link --project-ref vqtrfkigzqtcthrivbzn
```

### 3. 部署 Edge Function

```bash
npx supabase functions deploy test-baidu-api
```

部署成功后会返回 Function URL。

### 4. 测试连接

部署完成后，在后台管理系统的 API 配置页面点击"测试连接"按钮即可测试百度 API 连接。

## 说明

- Edge Function 用于代理百度 API 请求，避免浏览器 CORS 限制
- Function 路径：`supabase/functions/test-baidu-api/index.ts`
- 调用方式：通过 Supabase Edge Function API

## 如果无法部署

如果无法使用 CLI 部署，可以：

1. 访问 Supabase 控制台：https://app.supabase.com/project/vqtrfkigzqtcthrivbzn
2. 进入 "Edge Functions" 页面
3. 手动创建名为 `test-baidu-api` 的 Function
4. 复制 `supabase/functions/test-baidu-api/index.ts` 的内容到控制台编辑器
5. 点击部署
