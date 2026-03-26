# 用户服药依从性追踪功能设计

**创建日期**: 2026-03-26
**状态**: 已批准

## 概述

在后台管理系统的 Dashboard 中添加用户每日服药依从性数据查看功能，让管理员能够：
1. 查看所有用户的服药依从性统计
2. 查看单个用户的日历热力图
3. 查看指定日期的详细服药记录

## 问题修复

同时修复 Dashboard 中"药品总数"统计错误的问题：
- **当前**: 查询 `medications` 表（用户个人药品，受 RLS 限制）
- **修正**: 查询 `common_medications` 表（公共药品库，后台管理）

## 设计方案

### 整体架构

```
Dashboard.vue (数据统计首页)
  │
  ├─ 平均依从性卡片 (点击触发)
  │     ↓
  │  ComplianceDrawer.vue (新增组件 - 用户依从性列表)
  │     │
  │     ├─ 用户表格：今日/7 日/30 日依从率
  │     └─ 点击用户 → UserComplianceDetailDrawer.vue (新增组件 - 详情)
  │           │
  │           ├─ 日历热力图 (12 个月视图)
  │           └─ 单日服药时间线
  │
  └─ 药品总数卡片 (修复查询逻辑)
```

### 组件结构

```
admin/src/
├── views/
│   └── Dashboard.vue (修改)
├── components/
│   └── compliance/
│       ├── ComplianceDrawer.vue (新增)
│       └── UserComplianceDetailDrawer.vue (新增)
└── services/
    └── compliance.ts (新增 - 依从性数据查询)
```

### 数据流

```
用户点击"平均依从性"卡片
    ↓
fetchComplianceStats() - 获取所有用户依从性
    ↓
显示 ComplianceDrawer (用户列表)
    ↓
点击某用户
    ↓
fetchUserComplianceDetail(userId) - 获取该用户详情
    ↓
显示 UserComplianceDetailDrawer (热力图 + 时间线)
    ↓
点击日历某天
    ↓
fetchDailyMedicationLog(userId, date) - 获取当日服药记录
    ↓
更新单日详情显示
```

### 依从性计算逻辑

```typescript
// 判定标准
按时 (taken): scheduled_time ± 30 分钟内服用
延迟 (delayed): 超过 30 分钟但未超过 2 小时
漏服 (missed): 超过 2 小时或 status = 'missed'

// 计算公式
日依从率 = (taken_count + delayed_count × 0.5) / total_scheduled × 100%
7 日平均 = 近 7 天日依从率的平均值
30 日平均 = 近 30 天日依从率的平均值
```

### 数据库查询

需要查询的表：
- `medication_logs` - 服药记录
- `medication_schedules` - 用药计划（获取应服次数）
- `profiles` - 用户信息
- `common_medications` - 公共药品库（修复药品总数统计）

注意：后台使用 anon key 查询，受 RLS 限制，需要通过以下方案之一：
1. 创建后台专用的 view + policy
2. 使用 Edge Function 代理查询
3. 使用 service role key（仅限可信环境）

**采用方案**: 创建后台专用的 SQL view 和 policy

### SQL View 设计

```sql
-- 用户依从性统计视图
CREATE VIEW admin_user_compliance_stats AS
SELECT
  p.id as user_id,
  p.username,
  p.phone,
  -- 今日统计
  COUNT(DISTINCT CASE WHEN DATE(ml.scheduled_time) = CURRENT_DATE THEN ml.id END) as today_total,
  COUNT(DISTINCT CASE WHEN DATE(ml.scheduled_time) = CURRENT_DATE AND ml.status = 'taken' THEN ml.id END) as today_taken,
  COUNT(DISTINCT CASE WHEN DATE(ml.scheduled_time) = CURRENT_DATE AND ml.status = 'delayed' THEN ml.id END) as today_delayed,
  -- 7 日统计
  COUNT(DISTINCT CASE WHEN ml.scheduled_time >= CURRENT_DATE - INTERVAL '7 days' THEN ml.id END) as week_total,
  COUNT(DISTINCT CASE WHEN ml.scheduled_time >= CURRENT_DATE - INTERVAL '7 days' AND ml.status = 'taken' THEN ml.id END) as week_taken,
  COUNT(DISTINCT CASE WHEN ml.scheduled_time >= CURRENT_DATE - INTERVAL '7 days' AND ml.status = 'delayed' THEN ml.id END) as week_delayed
FROM profiles p
LEFT JOIN medication_logs ml ON p.id = ml.user_id
GROUP BY p.id, p.username, p.phone;
```

### UI 设计

#### 1. ComplianceDrawer - 用户依从性列表

```
┌─────────────────────────────────────────────────────┐
│  服药依从性统计                              [×]    │
│  ─────────────────────────────────────────────────  │
│  日期：[< 2026-03-26 >]                            │
│                                                     │
│  ┌─────────────────────────────────────────────────┐│
│  │ 用户名 │ 今日  │ 7 日平均 │ 30 日平均 │ 操作  ││
│  │────────┼──────┼─────────┼─────────┼───────││
│  │ 张三   │ 95%  │ 88%     │ 85%     │ 详情  ││
│  │ 李四   │ 72%  │ 78%     │ 80%     │ 详情  ││
│  └─────────────────────────────────────────────────┘│
│                                                     │
│  [导出报表]                                         │
└─────────────────────────────────────────────────────┘
```

#### 2. UserComplianceDetailDrawer - 用户详情

```
┌─────────────────────────────────────────────────────┐
│  张三 - 服药详情                             [×]    │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  日历热力图                                         │
│  ┌─────────────────────────────────────────────────┐│
│  │ Jan  ████▓▓▓▓░░▒▒████                         ││
│  │ Feb  ▓▓▓▓████▒▒░░▓▓▓▓                         ││
│  │ ...                                            ││
│  └─────────────────────────────────────────────────┘│
│                                                     │
│  2026-03-26 详情                                    │
│  ┌─────────────────────────────────────────────────┐│
│  │ 应服：8 次   实服：7 次   漏服：1 次   延迟：0 次 ││
│  │ ──────────────────────────────────────────────  ││
│  │ 08:00 ✅ 甲钴胺片 (红色圆形) 计划 08:00 实际 08:05││
│  │ 12:00 ✅ 阿司匹林肠溶片 计划 12:00 实际 12:10    ││
│  │ 20:00 ❌ 阿托伐他汀钙片 计划 20:00 未服用        ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### 颜色规范

| 依从率 | 颜色 | 标签 |
|--------|------|------|
| ≥90% | #22c55e (绿色) | 优秀 |
| 70-89% | #eab308 (黄色) | 良好 |
| <70% | #ef4444 (红色) | 需关注 |

### 验收标准

1. [ ] Dashboard"药品总数"显示正确的公共药品库数量
2. [ ] 点击"平均依从性"卡片弹出用户列表抽屉
3. [ ] 用户列表显示今日/7 日/30 日依从率
4. [ ] 点击用户弹出详情抽屉
5. [ ] 详情抽屉显示日历热力图
6. [ ] 点击日期显示当日服药时间线
7. [ ] 时间线显示药品图标、计划时间、实际时间、状态

## 后续讨论

确认后进入实施计划阶段。
