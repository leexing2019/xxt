# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev:h5              # Run H5 development server (port 3000)
npm run dev:app             # Run app development server
npm run dev:app-android     # Run Android app development
npm run dev:mp-weixin       # Run WeChat mini-program development

# Build
npm run build:h5            # Build for H5 (output: dist/build/h5)
npm run build:app           # Build for app
npm run build:app-android   # Build for Android app
npm run build:mp-weixin     # Build for WeChat mini-program
```

## Architecture

**Stack**: Vue 3 + TypeScript + Pinia + uni-app + Vite + Supabase

This is a cross-platform medication management app designed for elderly users, deployable to H5, Android (Capacitor), and WeChat mini-program.

### Directory Structure
- `src/pages/` - Page components (uni-app pages defined in pages.json)
- `src/store/` - Pinia stores (auth, medication, health)
- `src/services/` - Backend integration (Supabase client, API functions)
- `src/config/` - Configuration (Supabase credentials)
- `src/utils/` - Utility functions
- `src/data/` - Sample/mock data
- `sql/` - Database schema for Supabase
- `android/` - Capacitor Android native project

### State Management (Pinia)
- `auth.ts` - Authentication state, SMS OTP login, user profile management
- `medication.ts` - Medications, schedules, and服药 logs
- `health.ts` - Health records, medical history Q&A, compliance stats

### Database (Supabase)
Tables: `profiles`, `medications`, `medication_schedules`, `medication_logs`, `drug_contraindications`, `health_records`, `medical_history_answers`

All tables have RLS policies enforcing user isolation. See `sql/schema.sql` for full schema.

### Key Patterns
- Path alias `@/` maps to `src/` (configured in vite.config.ts and tsconfig.json)
- Supabase client configured in `src/services/supabase.ts` with auth session persistence
- Pages use uni-app APIs (`@dcloudio/uni-app`) for cross-platform compatibility
- SCSS for styling with common styles in `src/styles/common.scss`

## Superpowers 工作流

当用户提到"使用 superpowers 工作流"时，按以下顺序执行：

### 1. Brainstorm（头脑风暴）
- 探索用户意图和需求
- 收集相关信息和约束条件
- 确定设计方向和技术方案

### 2. Write-Plan（编写计划）
- 创建详细的实施计划文档（`docs/superpowers/plans/`）
- 定义任务清单（使用 checkbox `- [ ]` 语法）
- 映射文件结构和修改内容
- 指定验收标准

### 3. Execute-Plan（执行计划）
- 按计划逐项实现
- 使用 `superpowers:subagent-driven-development` 处理独立任务
- 测试验证

### 相关文档
- 设计文档：`docs/superpowers/specs/`
- 实施计划：`docs/superpowers/plans/`
