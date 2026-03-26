-- 用户服药依从性追踪视图
-- 创建日期：2026-03-26
-- 用途：为后台管理系统提供用户服药依从性统计数据

-- ============================================================================
-- 1. 用户每日依从性统计表
-- ============================================================================

-- 删除已存在的视图
DROP VIEW IF EXISTS user_daily_compliance CASCADE;

-- 创建用户每日依从性视图
CREATE OR REPLACE VIEW user_daily_compliance AS
SELECT
  p.id AS user_id,
  p.username,
  p.phone,
  DATE(ml.scheduled_time) AS log_date,
  COUNT(ml.id) AS total_scheduled,
  COUNT(CASE WHEN ml.status = 'taken' THEN 1 END) AS taken_count,
  COUNT(CASE WHEN ml.status = 'delayed' THEN 1 END) AS delayed_count,
  COUNT(CASE WHEN ml.status = 'missed' THEN 1 END) AS missed_count,
  ROUND(
    (COUNT(CASE WHEN ml.status = 'taken' THEN 1 END) * 1.0 +
     COUNT(CASE WHEN ml.status = 'delayed' THEN 1 END) * 0.5) /
    NULLIF(COUNT(ml.id), 0) * 100,
    2
  ) AS compliance_rate
FROM profiles p
LEFT JOIN medication_logs ml ON p.id = ml.user_id
GROUP BY p.id, p.username, p.phone, DATE(ml.scheduled_time);

-- ============================================================================
-- 2. 依从性统计函数（支持日期范围查询）
-- ============================================================================

-- 删除已存在的函数
DROP FUNCTION IF EXISTS get_user_compliance_stats(text, integer);

-- 创建获取用户依从性统计的函数
CREATE OR REPLACE FUNCTION get_user_compliance_stats(
  target_date text DEFAULT CURRENT_DATE::text,
  days_range integer DEFAULT 1
)
RETURNS TABLE (
  user_id uuid,
  username text,
  phone text,
  total_scheduled bigint,
  taken_count bigint,
  delayed_count bigint,
  missed_count bigint,
  compliance_rate numeric
)
LANGUAGE plpgsql
AS $$
DECLARE
  start_date date;
  end_date date;
BEGIN
  -- 计算日期范围
  start_date := GREATEST((target_date::date - (days_range - 1)), '2024-01-01'::date);
  end_date := target_date::date;

  RETURN QUERY
  SELECT
    p.id AS user_id,
    p.username,
    p.phone,
    COUNT(ml.id) AS total_scheduled,
    COUNT(CASE WHEN ml.status = 'taken' THEN 1 END) AS taken_count,
    COUNT(CASE WHEN ml.status = 'delayed' THEN 1 END) AS delayed_count,
    COUNT(CASE WHEN ml.status = 'missed' THEN 1 END) AS missed_count,
    ROUND(
      (COUNT(CASE WHEN ml.status = 'taken' THEN 1 END) * 1.0 +
       COUNT(CASE WHEN ml.status = 'delayed' THEN 1 END) * 0.5) /
      NULLIF(COUNT(ml.id), 0) * 100,
      2
    ) AS compliance_rate
  FROM profiles p
  LEFT JOIN medication_logs ml ON p.id = ml.user_id
    AND DATE(ml.scheduled_time) BETWEEN start_date AND end_date
  WHERE p.created_at <= end_date
  GROUP BY p.id, p.username, p.phone
  ORDER BY compliance_rate DESC NULLS LAST;
END;
$$;

-- ============================================================================
-- 3. 创建索引优化查询性能
-- ============================================================================

-- 删除已存在的索引
DROP INDEX IF EXISTS idx_medication_logs_user_date;
DROP INDEX IF EXISTS idx_medication_logs_user_status;

-- 创建组合索引加速依从性查询
CREATE INDEX IF NOT EXISTS idx_medication_logs_user_date
ON medication_logs(user_id, scheduled_time);

CREATE INDEX IF NOT EXISTS idx_medication_logs_user_status
ON medication_logs(user_id, status);

-- ============================================================================
-- 4. 创建 RLS 策略（允许后台管理员访问）
-- ============================================================================

-- 为视图创建 RLS 策略
-- 注意：后台管理系统使用 anon key，需要确保策略允许认证用户访问
ALTER VIEW user_daily_compliance ENABLE ROW LEVEL SECURITY;

-- 删除已有策略
DROP POLICY IF EXISTS "Backend can view compliance stats" ON user_daily_compliance;

-- 创建允许所有认证用户查看的策略
CREATE POLICY "Backend can view compliance stats" ON user_daily_compliance
FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- 5. 测试查询
-- ============================================================================

-- 测试视图
-- SELECT * FROM user_daily_compliance WHERE log_date = CURRENT_DATE LIMIT 10;

-- 测试函数（今日数据）
-- SELECT * FROM get_user_compliance_stats(CURRENT_DATE::text, 1);

-- 测试函数（7 日数据）
-- SELECT * FROM get_user_compliance_stats(CURRENT_DATE::text, 7);

-- 测试函数（30 日数据）
-- SELECT * FROM get_user_compliance_stats(CURRENT_DATE::text, 30);

-- ============================================================================
-- 说明
-- ============================================================================
-- 依从率计算公式：
-- 依从率 = (按时服药次数 + 延迟服药次数 × 0.5) / 总应服药次数 × 100%
--
-- 状态说明：
-- - taken: 按时服药（scheduled_time ± 30 分钟内）
-- - delayed: 延迟服药（超过 30 分钟但未超过 2 小时）
-- - missed: 漏服（超过 2 小时或明确标记为 missed）
