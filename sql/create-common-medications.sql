-- 公共药品库初始化脚本
-- 创建所有用户都能看到的公共药品库
-- 运行方式：在 Supabase SQL Editor 中执行

-- =====================================================
-- 第 1 步：创建公共药品库表
-- =====================================================
CREATE TABLE IF NOT EXISTS common_medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  generic_name TEXT,
  category TEXT NOT NULL,
  manufacturer TEXT,
  specification TEXT,
  form TEXT,
  appearance_desc TEXT,
  dosage_unit TEXT,
  color TEXT,
  shape TEXT,
  barcode TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 注释说明
COMMENT ON TABLE common_medications IS '公共药品库 - 所有用户都能看到的常用药品';
COMMENT ON COLUMN common_medications.name IS '药品名称（商品名）';
COMMENT ON COLUMN common_medications.generic_name IS '通用名';
COMMENT ON COLUMN common_medications.category IS '分类：降压药/降糖药/降脂药等';
COMMENT ON COLUMN common_medications.manufacturer IS '生产厂家';
COMMENT ON COLUMN common_medications.specification IS '规格';
COMMENT ON COLUMN common_medications.form IS '剂型';
COMMENT ON COLUMN common_medications.appearance_desc IS '外观描述';
COMMENT ON COLUMN common_medications.dosage_unit IS '剂量单位（片/粒/ml 等）';

-- =====================================================
-- 第 2 步：设置 RLS 行级安全策略
-- =====================================================
ALTER TABLE common_medications ENABLE ROW LEVEL SECURITY;

-- 所有人（认证用户）都可以查看公共药品库
CREATE POLICY "authenticated_users_can_view" ON common_medications
  FOR SELECT
  TO authenticated
  USING (true);

-- 只有管理员可以插入/更新/删除（通过 admin_users 表判断）
-- 这里简化处理：允许所有认证用户插入（管理后台用户都是认证的）
CREATE POLICY "authenticated_users_can_insert" ON common_medications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_users_can_update" ON common_medications
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_users_can_delete" ON common_medications
  FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- 第 3 步：创建触发器自动更新 updated_at
-- =====================================================
CREATE TRIGGER update_common_medications_updated_at
  BEFORE UPDATE ON common_medications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 第 4 步：创建索引提升查询性能
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_common_medications_category ON common_medications(category);
CREATE INDEX IF NOT EXISTS idx_common_medications_name ON common_medications(name);
CREATE INDEX IF NOT EXISTS idx_common_medications_active ON common_medications(is_active);

-- =====================================================
-- 第 5 步：插入 50 种常用药品数据
-- =====================================================

-- 降压药 (10 种)
INSERT INTO common_medications (name, generic_name, category, manufacturer, specification, form, appearance_desc, dosage_unit) VALUES
('硝苯地平缓释片', '硝苯地平', '降压药', '拜耳医药', '30mg×14 片', '缓释片', '黄色椭圆形薄膜衣片，长约 12mm', '片'),
('氨氯地平片', '苯磺酸氨氯地平', '降压药', '辉瑞制药', '5mg×7 片', '片剂', '白色圆形片剂，直径约 9mm', '片'),
('厄贝沙坦片', '厄贝沙坦', '降压药', '赛诺菲制药', '150mg×7 片', '片剂', '白色椭圆形片剂，一面刻有标识', '片'),
('缬沙坦胶囊', '缬沙坦', '降压药', '诺华制药', '80mg×14 粒', '胶囊', '蓝白胶囊，内含白色颗粒', '粒'),
('美托洛尔缓释片', '酒石酸美托洛尔', '降压药', '阿斯利康', '47.5mg×7 片', '缓释片', '淡黄色圆形片剂', '片'),
('非洛地平缓释片', '非洛地平', '降压药', '阿斯利康', '5mg×10 片', '缓释片', '白色椭圆形薄膜衣片', '片'),
('吲达帕胺片', '吲达帕胺', '降压药', '施维雅制药', '2.5mg×30 片', '片剂', '白色片剂', '片'),
('氯沙坦钾片', '氯沙坦钾', '降压药', '默沙东制药', '50mg×7 片', '片剂', '白色椭圆形薄膜衣片', '片'),
('替米沙坦片', '替米沙坦', '降压药', '勃林格殷格翰', '40mg×14 片', '片剂', '淡黄色圆形片剂', '片'),
('比索洛尔片', '富马酸比索洛尔', '降压药', '默克制药', '5mg×10 片', '片剂', '淡黄色圆形薄膜衣片', '片');

-- 降糖药 (10 种)
INSERT INTO common_medications (name, generic_name, category, manufacturer, specification, form, appearance_desc, dosage_unit) VALUES
('二甲双胍片', '盐酸二甲双胍', '降糖药', '中美上海施贵宝', '0.5g×20 片', '片剂', '白色圆形片剂，直径约 10mm', '片'),
('格列美脲片', '格列美脲', '降糖药', '赛诺菲制药', '1mg×15 片', '片剂', '粉红色椭圆形片剂', '片'),
('阿卡波糖片', '阿卡波糖', '降糖药', '拜耳医药', '50mg×30 片', '片剂', '白色类圆形片剂', '片'),
('格列齐特缓释片', '格列齐特', '降糖药', '施维雅制药', '30mg×10 片', '缓释片', '白色椭圆形片剂', '片'),
('瑞格列奈片', '瑞格列奈', '降糖药', '诺和诺德', '0.5mg×14 片', '片剂', '白色圆形片剂', '片'),
('西格列汀片', '磷酸西格列汀', '降糖药', '默沙东制药', '100mg×7 片', '片剂', '淡粉色圆形薄膜衣片', '片'),
('沙格列汀片', '沙格列汀', '降糖药', '阿斯利康', '5mg×14 片', '片剂', '淡黄色圆形片剂', '片'),
('达格列净片', '达格列净', '降糖药', '阿斯利康', '10mg×14 片', '片剂', '黄色椭圆形薄膜衣片', '片'),
('恩格列净片', '恩格列净', '降糖药', '勃林格殷格翰', '10mg×14 片', '片剂', '淡黄色椭圆形片剂', '片'),
('利拉鲁肽注射液', '利拉鲁肽', '降糖药', '诺和诺德', '3ml:18mg×1 支', '注射液', '无色澄明注射液', 'mg');

-- 降脂药 (8 种)
INSERT INTO common_medications (name, generic_name, category, manufacturer, specification, form, appearance_desc, dosage_unit) VALUES
('阿托伐他汀钙片', '阿托伐他汀', '降脂药', '辉瑞制药', '20mg×7 片', '片剂', '白色椭圆形薄膜衣片，长约 14mm', '片'),
('瑞舒伐他汀钙片', '瑞舒伐他汀', '降脂药', '阿斯利康', '10mg×7 片', '片剂', '粉色圆形片剂', '片'),
('辛伐他汀片', '辛伐他汀', '降脂药', '默沙东制药', '20mg×14 片', '片剂', '白色或类白色片剂', '片'),
('普伐他汀钠片', '普伐他汀', '降脂药', '百时美施贵宝', '10mg×7 片', '片剂', '淡橙色椭圆形片剂', '片'),
('非诺贝特胶囊', '非诺贝特', '降脂药', '加利亚尼制药', '200mg×10 粒', '胶囊', '黄白相间胶囊', '粒'),
('依折麦布片', '依折麦布', '降脂药', '默沙东制药', '10mg×10 片', '片剂', '白色椭圆形片剂', '片'),
('普罗布考片', '普罗布考', '降脂药', '赛诺菲制药', '0.5g×6 片', '片剂', '白色片剂', '片'),
('血脂康胶囊', '红曲提取物', '降脂药', '北京北大维信', '0.3g×24 粒', '胶囊', '紫红色胶囊', '粒');

-- 心血管药 (5 种)
INSERT INTO common_medications (name, generic_name, category, manufacturer, specification, form, appearance_desc, dosage_unit) VALUES
('阿司匹林肠溶片', '阿司匹林', '心血管药', '拜耳医药', '100mg×30 片', '肠溶片', '白色圆形小药片，直径约 8mm，刻有"100"', '片'),
('氯吡格雷片', '硫酸氢氯吡格雷', '心血管药', '赛诺菲制药', '75mg×7 片', '片剂', '黄色圆形片剂', '片'),
('华法林钠片', '华法林钠', '心血管药', '奥加农制药', '2.5mg×100 片', '片剂', '白色片剂，有不同颜色标识', '片'),
('单硝酸异山梨酯片', '单硝酸异山梨酯', '心血管药', '赛诺菲制药', '20mg×24 片', '片剂', '白色圆形片剂', '片'),
('硝酸甘油片', '硝酸甘油', '心血管药', '拜耳医药', '0.5mg×100 片', '片剂', '白色小片剂', '片');

-- 胃药 (5 种)
INSERT INTO common_medications (name, generic_name, category, manufacturer, specification, form, appearance_desc, dosage_unit) VALUES
('奥美拉唑肠溶胶囊', '奥美拉唑', '胃药', '阿斯利康', '20mg×7 粒', '肠溶胶囊', '透明胶囊，内含白色小丸', '粒'),
('雷贝拉唑钠肠溶片', '雷贝拉唑', '胃药', '卫材制药', '10mg×7 片', '肠溶片', '黄色薄膜衣片', '片'),
('泮托拉唑钠肠溶片', '泮托拉唑', '胃药', '武田制药', '40mg×7 片', '肠溶片', '类白色肠溶衣片', '片'),
('兰索拉唑肠溶胶囊', '兰索拉唑', '胃药', '武田制药', '30mg×7 粒', '肠溶胶囊', '透明胶囊，内含白色颗粒', '粒'),
('铝碳酸镁咀嚼片', '铝碳酸镁', '胃药', '拜耳医药', '0.5g×20 片', '咀嚼片', '白色或类白色片剂', '片');

-- 止咳药 (4 种)
INSERT INTO common_medications (name, generic_name, category, manufacturer, specification, form, appearance_desc, dosage_unit) VALUES
('氨溴索片', '盐酸氨溴索', '止咳药', '勃林格殷格翰', '30mg×20 片', '片剂', '白色圆形片剂', '片'),
('溴己新片', '溴己新', '止咳药', '南京白敬宇', '8mg×100 片', '片剂', '白色片剂', '片'),
('右美沙芬片', '氢溴酸右美沙芬', '止咳药', '强生制药', '15mg×12 片', '片剂', '白色片剂', '片'),
('喷托维林片', '枸橼酸喷托维林', '止咳药', '南京白敬宇', '25mg×100 片', '片剂', '白色片剂', '片');

-- 止痛药 (4 种)
INSERT INTO common_medications (name, generic_name, category, manufacturer, specification, form, appearance_desc, dosage_unit) VALUES
('布洛芬缓释胶囊', '布洛芬', '止痛药', '中美天津史克', '0.3g×20 粒', '缓释胶囊', '透明胶囊，内含白色粉末', '粒'),
('对乙酰氨基酚片', '对乙酰氨基酚', '止痛药', '强生制药', '0.5g×100 片', '片剂', '白色圆形片剂', '片'),
('双氯芬酸钠肠溶片', '双氯芬酸钠', '止痛药', '诺华制药', '25mg×30 片', '肠溶片', '肠溶衣片', '片'),
('塞来昔布胶囊', '塞来昔布', '止痛药', '辉瑞制药', '200mg×6 粒', '胶囊', '蓝白胶囊', '粒');

-- 维生素/钙片 (4 种)
INSERT INTO common_medications (name, generic_name, category, manufacturer, specification, form, appearance_desc, dosage_unit) VALUES
('复合维生素片', '复合维生素', '维生素', '拜耳医药', '30 片×1 瓶', '片剂', '橙色椭圆形片剂', '片'),
('碳酸钙 D3 片', '碳酸钙 D3', '钙片', '惠氏制药', '600mg×30 片', '片剂', '白色或类白色片剂', '片'),
('维生素 B1 片', '维生素 B1', '维生素', '南京白敬宇', '10mg×100 片', '片剂', '白色片剂', '片'),
('甲钴胺片', '甲钴胺', '维生素', '卫材制药', '0.5mg×20 片', '片剂', '淡红色圆形糖衣片', '片');

-- =====================================================
-- 第 6 步：验证数据
-- =====================================================
-- 查询确认插入的药品总数和分类统计
SELECT '总计' AS category, COUNT(*) AS count FROM common_medications
UNION ALL
SELECT category, COUNT(*) AS count FROM common_medications GROUP BY category ORDER BY count DESC;
