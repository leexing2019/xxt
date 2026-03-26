# 统一用户前端页面设计风格实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于首页 UI 标准，统一所有用户端页面的设计风格，采用统一色彩系统 (#3B82F6 主色)、字体层级和组件规范。

**Architecture:** 采用 CSS 变量和 SCSS 混合模式，先更新全局样式文件 common.scss 定义统一的设计令牌，然后逐个修改页面组件的 `<style>` 区块，保持各页面功能逻辑不变仅更新视觉样式。

**Tech Stack:** Vue 3 + uni-app + SCSS + Pinia

---

## 文件结构

**修改文件:**
- `src/styles/common.scss` - 更新 CSS 变量和全局样式
- `src/pages/login/login.vue` - 登录页样式
- `src/pages/register/register.vue` - 注册页样式
- `src/pages/settings/settings.vue` - 设置页样式
- `src/pages/emergency/emergency.vue` - 急救页样式
- `src/pages/medication-list/medication-list.vue` - 药品列表页样式
- `src/pages/medication-detail/medication-detail.vue` - 药品详情页样式
- `src/pages/add-medication/add-medication.vue` - 添加药品页样式

---

### Task 1: 更新全局样式变量

**Files:**
- Modify: `src/styles/common.scss`

- [ ] **Step 1: 更新 CSS 变量**

将 `:root` 中的主题色更新为统一设计系统：

```scss
:root {
  --primary-color: #3B82F6;
  --primary-light: #60A5FA;
  --primary-dark: #1D4ED8;
  --primary-light-bg: #DBEAFE;
  --success-color: #10B981;
  --success-light: #34D399;
  --success-bg: #D1FAE5;
  --warning-color: #F59E0B;
  --warning-light: #FBBF24;
  --warning-bg: #FEF3C7;
  --danger-color: #EF4444;
  --danger-light: #F87171;
  --danger-bg: #FEE2E2;
  --emergency-color: #FF6B6B;
  --emergency-dark: #C62828;
  --text-primary: #1E293B;
  --text-secondary: #475569;
  --text-disabled: #94A3B8;
  --bg-color: #F1F5F9;
  --card-bg: #FFFFFF;
  --border-color: #E2E8F0;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
}
```

- [ ] **Step 2: 更新按钮样式**

将 `.btn-primary` 渐变更新为新主色：

```scss
.btn-primary {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

  &:active {
    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
}
```

- [ ] **Step 3: 更新 `.btn-danger` 样式**

```scss
.btn-danger {
  background: linear-gradient(135deg, var(--danger-color) 0%, #DC2626 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}
```

- [ ] **Step 4: 提交更改**

```bash
git add src/styles/common.scss
git commit -m "style: 更新全局 CSS 变量为统一设计系统"
```

---

### Task 2: 更新登录页样式

**Files:**
- Modify: `src/pages/login/login.vue`

- [ ] **Step 1: 更新页面背景渐变**

将 `.login-page` 背景从 `#2196F3` 更新为新主色：

```scss
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #3B82F6 0%, #1D4ED8 100%);
  display: flex;
  flex-direction: column;
}
```

- [ ] **Step 2: 更新 `.text-primary` 颜色**

```scss
.text-primary {
  color: #3B82F6;
}
```

- [ ] **Step 3: 更新紧急求助按钮文字颜色**

```scss
.emergency-text {
  color: white;
  font-size: 28rpx;
  text-decoration: underline;
}
```

- [ ] **Step 4: 提交更改**

```bash
git add src/pages/login/login.vue
git commit -m "style: 更新登录页背景渐变为新主色"
```

---

### Task 3: 更新注册页样式

**Files:**
- Modify: `src/pages/register/register.vue`

- [ ] **Step 1: 更新页面背景渐变**

```scss
.register-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #3B82F6 0%, #1D4ED8 100%);
  display: flex;
  flex-direction: column;
}
```

- [ ] **Step 2: 更新 `.text-primary` 颜色**

```scss
.text-primary {
  color: #3B82F6;
}
```

- [ ] **Step 3: 更新密码强度指示器颜色**

保持原有颜色逻辑（弱/中/强分别用红/橙/绿），仅确保颜色值与统一系统一致：

```scss
.strength-bar {
  &.active {
    &.bar-weak {
      background: var(--danger-color);
    }
    &.bar-medium {
      background: var(--warning-color);
    }
    &.bar-strong {
      background: var(--success-color);
    }
  }
}
```

- [ ] **Step 4: 提交更改**

```bash
git add src/pages/register/register.vue
git commit -m "style: 更新注册页背景渐变为新主色"
```

---

### Task 4: 更新设置页样式

**Files:**
- Modify: `src/pages/settings/settings.vue`

- [ ] **Step 1: 更新图标背景渐变**

将 `.setting-icon` 背景更新为新主色渐变：

```scss
.setting-icon {
  font-size: 44rpx;
  margin-right: 24rpx;
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-light-bg) 0%, var(--primary-light-bg) 100%);
  border-radius: 16rpx;
  flex-shrink: 0;
}
```

- [ ] **Step 2: 更新用户头像边框**

```scss
.avatar-img,
.avatar-placeholder {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(59, 130, 246, 0.2);
  transition: transform 0.2s ease;
}
```

- [ ] **Step 3: 更新编辑按钮样式**

```scss
.edit-btn {
  font-size: 28rpx;
  color: var(--primary-color);
  padding: 12rpx 24rpx;
  background: var(--primary-light-bg);
  border-radius: 20rpx;
  transition: all 0.2s ease;

  &:active {
    background: var(--primary-color);
    color: white;
    transform: scale(0.95);
  }
}
```

- [ ] **Step 4: 更新退出按钮样式**

```scss
.logout-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, var(--danger-color) 0%, #DC2626 100%);
  color: white;
  border: none;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  font-size: 32rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 24rpx rgba(239, 68, 68, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:active {
    transform: scale(0.96);
    box-shadow: 0 4rpx 12rpx rgba(239, 68, 68, 0.25);
  }
}
```

- [ ] **Step 5: 提交更改**

```bash
git add src/pages/settings/settings.vue
git commit -m "style: 更新设置页图标背景和按钮样式"
```

---

### Task 5: 更新急救页样式

**Files:**
- Modify: `src/pages/emergency/emergency.vue`

**注意**: 急救页保持原有的红色主题 (#FF6B6B → #C62828)，仅更新卡片组件样式与首页一致。

- [ ] **Step 1: 确认头部渐变保持不变**

```scss
.emergency-header {
  background: linear-gradient(135deg, #FF6B6B 0%, #C62828 100%);
  padding: 48rpx 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4rpx 24rpx rgba(255, 107, 107, 0.4);
}
```

- [ ] **Step 2: 更新场景卡片样式**

将 `.scenario-card` 样式更新为统一卡片规范：

```scss
.scenario-card {
  background: var(--card-bg);
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--shadow-md);
  transition: all 0.2s ease;
  min-height: 120rpx;
  border-left: 4rpx solid transparent;

  &:active {
    transform: scale(0.98);
    box-shadow: var(--shadow-sm);
  }
}
```

- [ ] **Step 3: 更新场景图标背景**

```scss
.scenario-icon {
  font-size: 52rpx;
  margin-right: 24rpx;
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FFEBEE 0%, rgba(255, 107, 107, 0.1) 100%);
  border-radius: 20rpx;
  flex-shrink: 0;
}
```

- [ ] **Step 4: 更新联系人卡片**

```scss
.contact-card {
  background: var(--card-bg);
  border-radius: 20rpx;
  padding: 32rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-md);
  border-left: 4rpx solid var(--emergency-color);
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.98);
    box-shadow: var(--shadow-sm);
  }
}
```

- [ ] **Step 5: 提交更改**

```bash
git add src/pages/emergency/emergency.vue
git commit -m "style: 更新急救页卡片样式为统一规范"
```

---

### Task 6: 更新药品列表页样式

**Files:**
- Modify: `src/pages/medication-list/medication-list.vue`

- [ ] **Step 1: 更新头部渐变**

```scss
.header {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  padding: 40rpx 32rpx;
}
```

- [ ] **Step 2: 更新统计卡片**

```scss
.stats-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 16rpx;
  padding: 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-around;
}
```

- [ ] **Step 3: 更新添加按钮样式**

```scss
.add-medication-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  border: none;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.2);
  }
}
```

- [ ] **Step 4: 更新药品卡片样式**

```scss
.medication-card {
  background: var(--card-bg);
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  box-shadow: var(--shadow-md);
  transition: all 0.2s ease;
  border-left: 4rpx solid transparent;

  &:active {
    box-shadow: var(--shadow-sm);
    transform: translateY(-1px);
  }
}
```

- [ ] **Step 5: 更新相互作用警告卡片**

```scss
.contraindication-card {
  background: var(--warning-bg);
  border-left: 6rpx solid var(--warning-color);
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
}
```

- [ ] **Step 6: 提交更改**

```bash
git add src/pages/medication-list/medication-list.vue
git commit -m "style: 更新药品列表页头部和卡片样式"
```

---

### Task 7: 更新药品详情页样式

**Files:**
- Modify: `src/pages/medication-detail/medication-detail.vue`

- [ ] **Step 1: 更新卡片圆角统一为 20rpx**

将所有 `.card` 的 `border-radius` 从 `16rpx` 更新为 `20rpx`。

- [ ] **Step 2: 更新 medication-avatar 渐变**

```scss
.medication-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(59, 130, 246, 0.2);
}
```

- [ ] **Step 3: 更新底部按钮样式**

```scss
.btn-primary {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
}

.btn-outline {
  background: transparent;
  border: 2rpx solid var(--primary-color);
  color: var(--primary-color);
}
```

- [ ] **Step 4: 更新统计区域颜色**

```scss
.stat-value {
  font-size: 36rpx;
  font-weight: bold;
  color: var(--primary-color);
}
```

- [ ] **Step 5: 提交更改**

```bash
git add src/pages/medication-detail/medication-detail.vue
git commit -m "style: 更新药品详情页卡片和按钮样式"
```

---

### Task 8: 更新添加药品页样式

**Files:**
- Modify: `src/pages/add-medication/add-medication.vue`

- [ ] **Step 1: 更新搜索按钮样式**

```scss
.search-btn {
  width: 140rpx;
  height: 88rpx;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: white;
  font-size: 30rpx;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
```

- [ ] **Step 2: 更新功能按钮样式**

```scss
.voice-btn {
  background: linear-gradient(135deg, var(--primary-light-bg) 0%, var(--primary-light-bg) 100%);
  color: var(--primary-color);
  border: 2rpx solid var(--primary-color);
}

.camera-btn {
  background: linear-gradient(135deg, var(--warning-bg) 0%, var(--warning-bg) 100%);
  color: var(--warning-color);
  border: 2rpx solid var(--warning-color);
}
```

- [ ] **Step 3: 更新 Tab 样式**

```scss
.tab {
  display: inline-block;
  padding: 16rpx 32rpx;
  font-size: 28rpx;
  color: var(--text-secondary);
  background: var(--bg-color);
  border-radius: 40rpx;
  transition: all 0.2s;

  &.active {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
    color: white;
    font-weight: 600;
    box-shadow: 0 4rpx 12px rgba(59, 130, 246, 0.3);
  }
}
```

- [ ] **Step 4: 更新下一步按钮样式**

```scss
.btn-next {
  flex: 2;
  height: 88rpx;
  padding: 0 48rpx;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

- [ ] **Step 5: 更新确认按钮样式**

```scss
.btn-confirm {
  flex: 2;
  height: 88rpx;
  padding: 0 48rpx;
  background: linear-gradient(135deg, var(--success-color) 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 24px rgba(16, 185, 129, 0.4);
}
```

- [ ] **Step 6: 提交更改**

```bash
git add src/pages/add-medication/add-medication.vue
git commit -m "style: 更新添加药品页按钮和 Tab 样式"
```

---

## 验收标准

### 视觉一致性
- [ ] 所有页面主色统一为 #3B82F6
- [ ] 渐变效果一致（主色 → 深色）
- [ ] 卡片圆角统一为 16rpx-20rpx
- [ ] 阴影效果一致

### 组件规范
- [ ] 按钮高度统一为 88rpx (大按钮) 或 72rpx (常规按钮)
- [ ] 触摸目标最小 44x44rpx
- [ ] 图标背景渐变统一
- [ ] 状态标签颜色统一

### 老年友好
- [ ] 主文本字号 ≥ 16px
- [ ] 按钮文字 ≥ 14px
- [ ] 对比度符合 WCAG AA 标准
- [ ] 点击区域足够大

### 测试步骤
1. 运行 `npm run dev:h5` 启动开发服务器
2. 依次访问以下页面验证样式：
   - `/pages/login/login` - 登录页
   - `/pages/register/register` - 注册页
   - `/pages/settings/settings` - 设置页
   - `/pages/emergency/emergency` - 急救页
   - `/pages/medication-list/medication-list` - 药品列表页
   - `/pages/medication-detail/medication-detail` - 药品详情页
   - `/pages/add-medication/add-medication` - 添加药品页
3. 检查各页面元素对齐、间距、颜色是否一致
4. 测试按钮点击反馈和动画效果

---

## 执行顺序

1. **Task 1** - 更新全局样式（基础）
2. **Task 2** - 登录页（高优先级）
3. **Task 3** - 注册页（高优先级）
4. **Task 4** - 设置页（中优先级）
5. **Task 5** - 急救页（中优先级）
6. **Task 6** - 药品列表页（低优先级）
7. **Task 7** - 药品详情页（低优先级）
8. **Task 8** - 添加药品页（低优先级）
