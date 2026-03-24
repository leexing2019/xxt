-- 迁移脚本：更新 common_medications 表的 form 字段为标准值
-- 2026-03-24: 简化剂型为三种：tablet（药片）、capsule（胶囊）、liquid（口服液）

-- 添加 color 字段（如果不存在）
ALTER TABLE common_medications ADD COLUMN IF NOT EXISTS color TEXT;

-- 更新 form 字段值映射
-- tablet-round, tablet-oval, 片剂，缓释片，肠溶片 → tablet
-- capsule, 胶囊 → capsule
-- liquid, 口服液，药水 → liquid
-- injection, 注射液，针剂 → tablet (归类为药片)

UPDATE common_medications
SET form = 'tablet'
WHERE form IN ('tablet-round', 'tablet-oval', '片剂', '缓释片', '肠溶片', '缓释胶囊');

UPDATE common_medications
SET form = 'capsule'
WHERE form IN ('胶囊');

UPDATE common_medications
SET form = 'liquid'
WHERE form IN ('口服液', '药水', '糖浆');

-- 将 form 为 NULL 的设置为默认值 'tablet'
UPDATE common_medications
SET form = 'tablet'
WHERE form IS NULL OR form = '';

-- 为已有颜色描述的药品设置 color 字段
UPDATE common_medications
SET color = '#FFEB3B'
WHERE appearance_desc LIKE '%黄色%' AND (color IS NULL OR color = '');

UPDATE common_medications
SET color = '#FFFFFF'
WHERE appearance_desc LIKE '%白色%' AND (color IS NULL OR color = '');

UPDATE common_medications
SET color = '#F48FB1'
WHERE appearance_desc LIKE '%粉色%' AND (color IS NULL OR color = '');

UPDATE common_medications
SET color = '#4CAF50'
WHERE appearance_desc LIKE '%绿色%' AND (color IS NULL OR color = '');

UPDATE common_medications
SET color = '#2196F3'
WHERE appearance_desc LIKE '%蓝色%' AND (color IS NULL OR color = '');

UPDATE common_medications
SET color = '#FF9800'
WHERE appearance_desc LIKE '%橙色%' AND (color IS NULL OR color = '');
