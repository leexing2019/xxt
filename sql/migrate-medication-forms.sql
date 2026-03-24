-- 药品剂型标准化迁移脚本
-- 将 common_medications 表的 form 字段值标准化为以下类型：
-- - tablet-round: 圆形片剂
-- - tablet-oval: 椭圆形片剂
-- - capsule: 胶囊
-- - injection: 注射液
-- - tablet-other: 其他片剂

-- =====================================================
-- 第 1 步：更新 form 字段为标准化值
-- =====================================================

-- 胶囊类
UPDATE common_medications
SET form = 'capsule'
WHERE form LIKE '%胶囊%' OR appearance_desc LIKE '%胶囊%';

-- 注射液类
UPDATE common_medications
SET form = 'injection'
WHERE form LIKE '%注射%' OR appearance_desc LIKE '%注射%';

-- 椭圆形片剂
UPDATE common_medications
SET form = 'tablet-oval'
WHERE (form LIKE '%椭圆%' OR appearance_desc LIKE '%椭圆%')
  AND form NOT LIKE '%胶囊%'
  AND form NOT LIKE '%注射%';

-- 圆形片剂
UPDATE common_medications
SET form = 'tablet-round'
WHERE (form LIKE '%圆形%' OR appearance_desc LIKE '%圆形%')
  AND form NOT LIKE '%胶囊%'
  AND form NOT LIKE '%注射%'
  AND form NOT LIKE '%椭圆%';

-- 其他片剂（缓释片、肠溶片、咀嚼片等）
UPDATE common_medications
SET form = 'tablet-other'
WHERE form IN ('缓释片', '肠溶片', '缓释胶囊', '肠溶胶囊', '咀嚼片', '薄膜衣片', '糖衣片', '片剂')
  AND form NOT LIKE '%胶囊%'
  AND form NOT LIKE '%注射%';

-- 剩余未匹配的默认为 tablet-round
UPDATE common_medications
SET form = 'tablet-round'
WHERE form IS NULL OR form = '';

-- =====================================================
-- 第 2 步：验证更新结果
-- =====================================================
-- 查看各剂型的药品数量
SELECT form, COUNT(*) as count
FROM common_medications
GROUP BY form
ORDER BY count DESC;

-- 查看所有药品的 form 值
SELECT name, form, appearance_desc
FROM common_medications
ORDER BY form, name;
