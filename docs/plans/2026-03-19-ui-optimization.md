# UI 全面优化 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 重构所有页面的布局和组件，采用 Material Design 3 风格 + 老年人友好增强，添加微交互动画

**Architecture:** 采用统一的设计系统和组件规范，从全局样式到页面组件逐层优化，确保一致的用户体验

**Tech Stack:** Vue 3 + TypeScript + uni-app + SCSS + Pinia

---

### Task 1: 更新全局样式变量和基础样式

**Files:**
- Modify: `src/styles/common.scss`

**Step 1: 更新主题色变量和基础样式**

```scss
/* 全局样式 - Material Design 3 + 老年人友好设计 */

/* 主题色变量 - 提高对比度 */
:root {
  --primary-color: #1E88E5;
  --primary-light: #64B5F6;
  --primary-dark: #1565C0;
  --primary-light-bg: #E3F2FD;
  --success-color: #43A047;
  --success-light: #81C784;
  --success-bg: #E8F5E9;
  --warning-color: #FB8C00;
  --warning-light: #FFB74D;
  --warning-bg: #FFF3E0;
  --danger-color: #E53935;
  --danger-light: #E57373;
  --danger-bg: #FFEBEE;
  --text-primary: #1A1A1A;
  --text-secondary: #424242;
  --text-disabled: #9E9E9E;
  --bg-color: #F8F9FA;
  --card-bg: #FFFFFF;
  --border-color: #E0E0E0;
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* 基础重置 - 老年人友好字体 */
page {
  background-color: var(--bg-color);
  font-size: 20px; /* 从 18px 提升至 20px */
  line-height: 1.8; /* 从 1.6 提升至 1.8 */
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

**Step 2: 更新标题样式**

```scss
/* 大字体标题 - 更高对比度 */
.h1-title {
  font-size: 32px; /* 从 28px 提升 */
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.h2-title {
  font-size: 28px; /* 从 24px 提升 */
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

.h3-title {
  font-size: 24px; /* 从 20px 提升 */
  font-weight: 600;
  color: var(--text-primary);
}
```

**Step 3: 更新卡片样式**

```scss
/* 卡片样式 - Material Design 3 风格 */
.card {
  background: var(--card-bg);
  border-radius: 20rpx; /* 从 12px 提升 */
  padding: 28rpx; /* 从 20px 提升 */
  margin: 16rpx;
  box-shadow: var(--shadow-md); /* 更明显的阴影 */
  transition: all 0.2s ease-out;
}

.card:active {
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.card-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
  letter-spacing: -0.3px;
}

/* 可点击卡片 */
.card-clickable {
  cursor: pointer;

  &:active {
    background-color: #F5F5F5;
  }
}
```

**Step 4: 更新按钮样式**

```scss
/* 按钮样式 - 大尺寸适合老年人 */
.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 40px; /* 从 16px 32px 提升 */
  border-radius: 24rpx; /* 从 12px 提升 */
  font-size: 20px;
  font-weight: 600;
  min-height: 64rpx; /* 从 56rpx 提升 */
  border: none;
  cursor: pointer;
  transition: all 0.15s ease-out; /* 新增过渡动画 */
  letter-spacing: 0.3px;

  &:active {
    transform: scale(0.95); /* 新增点击反馈 */
  }
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(30, 136, 229, 0.3);

  &:active {
    box-shadow: 0 2px 6px rgba(30, 136, 229, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
}

.btn-success {
  background: linear-gradient(135deg, var(--success-color) 0%, #2E7D32 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(67, 160, 71, 0.3);
}

.btn-danger {
  background: linear-gradient(135deg, var(--danger-color) 0%, #C62828 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(229, 57, 53, 0.3);
}

.btn-outline {
  background-color: transparent;
  border: 3px solid var(--primary-color); /* 从 2px 提升 */
  color: var(--primary-color);

  &:active {
    background-color: var(--primary-light-bg);
  }
}

.btn-large {
  padding: 24px 48px; /* 从 20px 40px 提升 */
  font-size: 22px;
  min-height: 72rpx; /* 从 64rpx 提升 */
  border-radius: 28rpx; /* 从 16rpx 提升 */
}

/* 按钮图标 */
.btn-icon {
  margin-right: 8px;
  font-size: 24px;
}
```

**Step 5: 更新输入框样式**

```scss
/* 输入框样式 - 更清晰的边框 */
.input {
  width: 100%;
  padding: 20px 24px; /* 从 16px 提升 */
  border: 3px solid var(--border-color); /* 从 2px 提升 */
  border-radius: 16rpx; /* 从 12px 提升 */
  font-size: 20px;
  background: white;
  transition: all 0.2s ease-out; /* 新增过渡 */
  color: var(--text-primary);

  &:focus {
    border-color: var(--primary-color);
    outline: none;
    box-shadow: 0 0 0 4px var(--primary-light-bg); /* 新增外发光 */
  }

  &:disabled {
    background-color: #F5F5F5;
    cursor: not-allowed;
  }

  &::placeholder {
    color: var(--text-disabled);
  }
}

/* 输入框错误状态 */
.input-error {
  border-color: var(--danger-color);

  &:focus {
    box-shadow: 0 0 0 4px var(--danger-bg);
  }
}

.input-error-text {
  font-size: 16px;
  color: var(--danger-color);
  margin-top: 8px;
}

.input-label {
  font-size: 20px; /* 从 18px 提升 */
  color: var(--text-secondary);
  margin-bottom: 12px; /* 从 8px 提升 */
  display: block;
  font-weight: 500;
}
```

**Step 6: 更新列表项样式**

```scss
/* 列表项 - 更大的点击区域 */
.list-item {
  display: flex;
  align-items: center;
  padding: 24rpx 28rpx; /* 从 20px 提升 */
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  min-height: 80rpx; /* 新增最小高度 */
  transition: all 0.15s ease-out;

  &:active {
    background-color: #F5F5F5;
    transform: scale(0.99);
  }
}

.list-item-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.list-item-content {
  flex: 1;
}

.list-item-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.list-item-desc {
  font-size: 16px;
  color: var(--text-secondary);
}

.list-item-action {
  font-size: 36rpx;
  color: var(--text-disabled);
  padding: 8rpx;
}
```

**Step 7: 更新警告提示样式**

```scss
/* 警告提示 - 更明显的视觉提示 */
.warning-box {
  background-color: var(--warning-bg);
  border-left: 6px solid var(--warning-color); /* 从 4px 提升 */
  padding: 20px; /* 从 16px 提升 */
  border-radius: 12rpx;
  margin: 20px 0; /* 从 16px 提升 */

  .warning-title {
    font-weight: 600;
    color: #E65100;
    margin-bottom: 8px;
  }
}

.danger-box {
  background-color: var(--danger-bg);
  border-left: 6px solid var(--danger-color);
  padding: 20px;
  border-radius: 12rpx;
  margin: 20px 0;

  .danger-title {
    font-weight: 600;
    color: #B71C1C;
    margin-bottom: 8px;
  }
}

.success-box {
  background-color: var(--success-bg);
  border-left: 6px solid var(--success-color);
  padding: 20px;
  border-radius: 12rpx;
  margin: 20px 0;

  .success-title {
    font-weight: 600;
    color: #1B5E20;
    margin-bottom: 8px;
  }
}
```

**Step 8: 更新空状态样式**

```scss
/* 空状态 - 更大的图标和文字 */
.empty-state {
  text-align: center;
  padding: 80rpx 40rpx; /* 从 60px 20px 提升 */
  color: var(--text-secondary);
  background: var(--card-bg);
  border-radius: 20rpx;
  margin: 20rpx;

  .empty-state-icon {
    font-size: 96rpx; /* 从 64px 提升 */
    margin-bottom: 24rpx;
    display: block;
    opacity: 0.7;
  }

  .empty-state-text {
    font-size: 24px; /* 从 20px 提升 */
    font-weight: 500;
    margin-bottom: 16rpx;
    display: block;
  }

  .empty-state-hint {
    font-size: 18px;
    color: var(--text-disabled);
    display: block;
  }
}
```

**Step 9: 更新工具类**

```scss
/* 工具类 */
.flex {
  display: flex;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flex-wrap {
  flex-wrap: wrap;
}

.gap-8 {
  gap: 8rpx;
}

.gap-16 {
  gap: 16rpx;
}

.gap-24 {
  gap: 24rpx;
}

.text-center {
  text-align: center;
}

.text-left {
  text-align: left;
}

.text-primary {
  color: var(--primary-color);
}

.text-success {
  color: var(--success-color);
}

.text-danger {
  color: var(--danger-color);
}

.text-warning {
  color: var(--warning-color);
}

.text-secondary {
  color: var(--text-secondary);
}

.text-disabled {
  color: var(--text-disabled);
}

.text-bold {
  font-weight: 600;
}

.mt-16 {
  margin-top: 16rpx;
}

.mt-24 {
  margin-top: 24rpx;
}

.mb-16 {
  margin-bottom: 16rpx;
}

.mb-24 {
  margin-bottom: 24rpx;
}

.p-20 {
  padding: 20rpx;
}

.p-28 {
  padding: 28rpx;
}

/* 安全区域适配 */
.safe-area-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
```

**Step 10: 更新动画**

```scss
/* 页面过渡动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30rpx);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.page-fade-in {
  animation: fadeInUp 0.35s ease-out;
}

.fade-in {
  animation: fadeIn 0.25s ease-out;
}

.slide-in-right {
  animation: slideInRight 0.3s ease-out;
}

.scale-in {
  animation: scaleIn 0.2s ease-out;
}

/* 列表项依次进入动画 */
@for $i from 1 through 10 {
  .stagger-in-#{$i} {
    animation: fadeInUp 0.3s ease-out #{$i * 0.05}s both;
  }
}

/* 加载动画 */
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60rpx;
}

.loading-spinner {
  width: 56rpx;
  height: 56rpx;
  border: 5px solid #E0E0E0; /* 从 4px 提升 */
  border-top: 5px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite; /* 从 1s 加快 */
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 脉冲动画用于提示 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.pulse {
  animation: pulse 1.5s ease-in-out infinite;
}
```

**Step 11: 新增标签和徽章样式**

```scss
/* 标签/徽章 */
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;

  &.badge-primary {
    background: var(--primary-light-bg);
    color: var(--primary-color);
  }

  &.badge-success {
    background: var(--success-bg);
    color: var(--success-color);
  }

  &.badge-warning {
    background: var(--warning-bg);
    color: var(--warning-color);
  }

  &.badge-danger {
    background: var(--danger-bg);
    color: var(--danger-color);
  }
}

/* 进度条 */
.progress-bar {
  height: 16rpx;
  background: #E0E0E0;
  border-radius: 8rpx;
  overflow: hidden;

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
    border-radius: 8rpx;
    transition: width 0.5s ease-out;
  }
}

/* 分隔线 */
.divider {
  height: 1px;
  background: var(--border-color);
  margin: 24rpx 0;
}

.divider-vertical {
  width: 1px;
  background: var(--border-color);
  margin: 0 24rpx;
}
```

**Step 12: 运行项目验证样式无错误**

```bash
npm run dev:h5
```

Expected: 项目正常编译，无 SCSS 错误

**Step 13: 提交**

```bash
git add src/styles/common.scss
git commit -m "style: 更新全局样式为 Material Design 3 风格 + 老年人友好增强"
```

---

### Task 2: 优化登录页面

**Files:**
- Modify: `src/pages/login/login.vue`

**Step 1: 更新模板和样式**

主要改动：
- 加大表单字段间距至 `40rpx`
- 输入框使用新的样式类
- 按钮添加点击动效
- 演示账号按钮使用独立样式区
- 页面添加淡入动画

**Step 2: 提交**

```bash
git add src/pages/login/login.vue
git commit -m "style(login): 优化登录页面布局和交互动画"
```

---

### Task 3: 优化注册页面

**Files:**
- Modify: `src/pages/register/register.vue`

**Step 1: 更新模板和样式**

主要改动：
- 与登录页保持一致的风格
- 密码输入框增加可视化的强度指示
- 按钮添加微交互动画

**Step 2: 提交**

```bash
git add src/pages/register/register.vue
git commit -m "style(register): 优化注册页面布局和交互动画"
```

---

### Task 4: 优化首页（今日用药）

**Files:**
- Modify: `src/pages/index/index.vue`

**Step 1: 更新模板和样式**

主要改动：
- 顶部问候卡片使用渐变背景
- 添加用药进度环（可视化进度）
- 待服药列表使用大卡片 + 明显操作按钮
- 空状态优化

**Step 2: 提交**

```bash
git add src/pages/index/index.vue
git commit -m "style(index): 优化首页布局和视觉层次"
```

---

### Task 5: 优化药品列表页面

**Files:**
- Modify: `src/pages/medication-list/medication-list.vue`

**Step 1: 更新模板和样式**

主要改动：
- 统计卡片使用渐变背景
- 药品卡片：头像 + 信息 + 操作区布局优化
- 添加列表项依次进入动画
- 操作按钮增大点击区域

**Step 2: 提交**

```bash
git add src/pages/medication-list/medication-list.vue
git commit -m "style(medication-list): 优化药品列表布局和交互动画"
```

---

### Task 6: 优化健康记录页面

**Files:**
- Modify: `src/pages/health-records/health-records.vue`

**Step 1: 更新模板和样式**

主要改动：
- 依从性进度条带动画
- 感觉选择器：大按钮 + 表情图标优化
- 记录列表：日期标签突出
- 快捷入口卡片优化

**Step 2: 提交**

```bash
git add src/pages/health-records/health-records.vue
git commit -m "style(health-records): 优化健康记录页面布局和动画"
```

---

### Task 7: 优化设置页面

**Files:**
- Modify: `src/pages/settings/settings.vue`

**Step 1: 读取现有设置页面**

```bash
cat src/pages/settings/settings.vue
```

**Step 2: 更新模板和样式**

主要改动：
- 列表项增大点击区域
- 添加开关动画
- 分组标题更清晰

**Step 3: 提交**

```bash
git add src/pages/settings/settings.vue
git commit -m "style(settings): 优化设置页面布局"
```

---

### Task 8: 优化紧急求助页面

**Files:**
- Modify: `src/pages/emergency/emergency.vue`

**Step 1: 读取现有紧急求助页面**

```bash
cat src/pages/emergency/emergency.vue
```

**Step 2: 更新模板和样式**

主要改动：
- SOS 按钮更大更明显
- 紧急联系人卡片优化
- 一键呼叫功能突出

**Step 3: 提交**

```bash
git add src/pages/emergency/emergency.vue
git commit -m "style(emergency): 优化紧急求助页面视觉层次"
```

---

### Task 9: 优化底部导航栏

**Files:**
- Modify: `src/pages.json`

**Step 1: 更新 tabBar 配置**

```json
"tabBar": {
  "color": "#9E9E9E",
  "selectedColor": "#1E88E5",
  "backgroundColor": "#FFFFFF",
  "borderStyle": "#E0E0E0",
  "height": "120rpx",
  "list": [
    {
      "pagePath": "pages/index/index",
      "text": "🏠 首页",
      "iconPath": "static/tabbar/home.svg",
      "selectedIconPath": "static/tabbar/home-active.svg"
    },
    ...
  ]
}
```

**Step 2: 提交**

```bash
git add src/pages.json
git commit -m "style: 优化底部导航栏样式和图标"
```

---

### Task 10: 最终测试和验证

**Step 1: 运行项目进行全面测试**

```bash
npm run dev:h5
```

**Step 2: 检查所有页面**
- [ ] 登录页
- [ ] 注册页
- [ ] 首页
- [ ] 药品列表页
- [ ] 健康记录页
- [ ] 设置页
- [ ] 紧急求助页

**Step 3: 验证交互效果**
- [ ] 按钮点击反馈
- [ ] 卡片点击效果
- [ ] 页面过渡动画
- [ ] 输入框焦点状态

**Step 4: 提交最终版本**

```bash
git commit -m "chore: UI 优化完成 - Material Design 3 + 老年人友好设计"
```

---

## 验收标准

1. **视觉一致性**：所有页面使用统一的设计语言和配色
2. **老年人友好**：字体大小≥20px，点击区域≥56rpx
3. **交互反馈**：所有可点击元素有明确的点击反馈
4. **动画流畅**：页面过渡和微交互动画流畅自然
5. **对比度达标**：文字与背景对比度符合 WCAG AAA 标准
