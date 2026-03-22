-- 常用药品库数据初始化脚本
-- 用于在 Supabase 数据库中创建公共药品库
-- 这些药品作为系统级别的参考数据，供所有用户选择使用

-- 重要说明：
-- 由于 medications 表有 RLS 策略限制，需要先禁用 RLS 或创建一个特殊的系统用户
-- 推荐方案：在 Supabase Dashboard 中执行此 SQL

-- 步骤 1: 创建一个公共药品库表（独立于用户数据）
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

-- 启用 RLS，允许所有认证用户读取
ALTER TABLE common_medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view common_medications" ON common_medications
  FOR SELECT USING (true);
CREATE POLICY "Admin can insert common_medications" ON common_medications
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can update common_medications" ON common_medications
  FOR UPDATE USING (true);

-- 插入常用药品数据 - 降压药 (10 种)
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

-- 插入常用药品数据 - 降糖药 (10 种)
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

-- 插入常用药品数据 - 降脂药 (8 种)
INSERT INTO common_medications (name, generic_name, category, manufacturer, specification, form, appearance_desc, dosage_unit) VALUES
('阿托伐他汀钙片', '阿托伐他汀', '降脂药', '辉瑞制药', '20mg×7 片', '片剂', '白色椭圆形薄膜衣片，长约 14mm', '片'),
('瑞舒伐他汀钙片', '瑞舒伐他汀', '降脂药', '阿斯利康', '10mg×7 片', '片剂', '粉色圆形片剂', '片'),
('辛伐他汀片', '辛伐他汀', '降脂药', '默沙东制药', '20mg×14 片', '片剂', '白色或类白色片剂', '片'),
('普伐他汀钠片', '普伐他汀', '降脂药', '百时美施贵宝', '10mg×7 片', '片剂', '淡橙色椭圆形片剂', '片'),
('非诺贝特胶囊', '非诺贝特', '降脂药', '加利亚尼制药', '200mg×10 粒', '胶囊', '黄白相间胶囊', '粒'),
('依折麦布片', '依折麦布', '降脂药', '默沙东制药', '10mg×10 片', '片剂', '白色椭圆形片剂', '片'),
('普罗布考片', '普罗布考', '降脂药', '赛诺菲制药', '0.5g×6 片', '片剂', '白色片剂', '片'),
('血脂康胶囊', '红曲提取物', '降脂药', '北京北大维信', '0.3g×24 粒', '胶囊', '紫红色胶囊', '粒');

-- 插入常用药品数据 - 心血管药 (5 种)
INSERT INTO common_medications (name, generic_name, category, manufacturer, specification, form, appearance_desc, dosage_unit) VALUES
('阿司匹林肠溶片', '阿司匹林', '心血管药', '拜耳医药', '100mg×30 片', '肠溶片', '白色圆形小药片，直径约 8mm，刻有"100"', '片'),
('氯吡格雷片', '硫酸氢氯吡格雷', '心血管药', '赛诺菲制药', '75mg×7 片', '片剂', '黄色圆形片剂', '片'),
('华法林钠片', '华法林钠', '心血管药', '奥加农制药', '2.5mg×100 片', '片剂', '白色片剂，有不同颜色标识', '片'),
('单硝酸异山梨酯片', '单硝酸异山梨酯', '心血管药', '赛诺菲制药', '20mg×24 片', '片剂', '白色圆形片剂', '片'),
('硝酸甘油片', '硝酸甘油', '心血管药', '拜耳医药', '0.5mg×100 片', '片剂', '白色小片剂', '片');

-- 插入常用药品数据 - 胃药 (5 种)
INSERT INTO common_medications (name, generic_name, category, manufacturer, specification, form, appearance_desc, dosage_unit) VALUES
('奥美拉唑肠溶胶囊', '奥美拉唑', '胃药', '阿斯利康', '20mg×7 粒', '肠溶胶囊', '透明胶囊，内含白色小丸', '粒'),
('雷贝拉唑钠肠溶片', '雷贝拉唑', '胃药', '卫材制药', '10mg×7 片', '肠溶片', '黄色薄膜衣片', '片'),
('泮托拉唑钠肠溶片', '泮托拉唑', '胃药', '武田制药', '40mg×7 片', '肠溶片', '类白色肠溶衣片', '片'),
('兰索拉唑肠溶胶囊', '兰索拉唑', '胃药', '武田制药', '30mg×7 粒', '肠溶胶囊', '透明胶囊，内含白色颗粒', '粒'),
('铝碳酸镁咀嚼片', '铝碳酸镁', '胃药', '拜耳医药', '0.5g×20 片', '咀嚼片', '白色或类白色片剂', '片');

-- 插入常用药品数据 - 止咳药 (4 种)
INSERT INTO common_medications (name, generic_name, category, manufacturer, specification, form, appearance_desc, dosage_unit) VALUES
('氨溴索片', '盐酸氨溴索', '止咳药', '勃林格殷格翰', '30mg×20 片', '片剂', '白色圆形片剂', '片'),
('溴己新片', '溴己新', '止咳药', '南京白敬宇', '8mg×100 片', '片剂', '白色片剂', '片'),
('右美沙芬片', '氢溴酸右美沙芬', '止咳药', '强生制药', '15mg×12 片', '片剂', '白色片剂', '片'),
('喷托维林片', '枸橼酸喷托维林', '止咳药', '南京白敬宇', '25mg×100 片', '片剂', '白色片剂', '片');

-- 插入常用药品数据 - 止痛药 (4 种)
INSERT INTO common_medications (name, generic_name, category, manufacturer, specification, form, appearance_desc, dosage_unit) VALUES
('布洛芬缓释胶囊', '布洛芬', '止痛药', '中美天津史克', '0.3g×20 粒', '缓释胶囊', '透明胶囊，内含白色粉末', '粒'),
('对乙酰氨基酚片', '对乙酰氨基酚', '止痛药', '强生制药', '0.5g×100 片', '片剂', '白色圆形片剂', '片'),
('双氯芬酸钠肠溶片', '双氯芬酸钠', '止痛药', '诺华制药', '25mg×30 片', '肠溶片', '肠溶衣片', '片'),
('塞来昔布胶囊', '塞来昔布', '止痛药', '辉瑞制药', '200mg×6 粒', '胶囊', '蓝白胶囊', '粒');

-- 插入常用药品数据 - 维生素/钙片 (4 种)
INSERT INTO common_medications (name, generic_name, category, manufacturer, specification, form, appearance_desc, dosage_unit) VALUES
('复合维生素片', '复合维生素', '维生素', '拜耳医药', '30 片×1 瓶', '片剂', '橙色椭圆形片剂', '片'),
('碳酸钙 D3 片', '碳酸钙 D3', '钙片', '惠氏制药', '600mg×30 片', '片剂', '白色或类白色片剂', '片'),
('维生素 B1 片', '维生素 B1', '维生素', '南京白敬宇', '10mg×100 片', '片剂', '白色片剂', '片'),
('甲钴胺片', '甲钴胺', '维生素', '卫材制药', '0.5mg×20 片', '片剂', '淡红色圆形糖衣片', '片');

-- 添加额外常用药 - 抗生素 (5 种)
INSERT INTO common_medications (name, generic_name, category, manufacturer, specification, form, appearance_desc, dosage_unit) VALUES
('阿莫西林胶囊', '阿莫西林', '抗生素', '白云山制药', '0.25g×24 粒', '胶囊', '绿黄相间胶囊', '粒'),
('头孢呋辛酯片', '头孢呋辛酯', '抗生素', '葛兰素史克', '0.25g×6 片', '片剂', '黄色薄膜衣片', '片'),
('阿奇霉素片', '阿奇霉素', '抗生素', '辉瑞制药', '0.25g×6 片', '片剂', '白色或类白色片剂', '片'),
('左氧氟沙星片', '左氧氟沙星', '抗生素', '第一三共', '0.5g×10 片', '片剂', '淡黄色圆形片剂', '片'),
('克拉霉素片', '克拉霉素', '抗生素', '雅培制药', '0.25g×10 片', '片剂', '白色或类白色片剂', '片');

-- 添加额外常用药 - 抗过敏药 (4 种)
INSERT INTO common_medications (name, generic_name, category, manufacturer, specification, form, appearance_desc, dosage_unit) VALUES
('氯雷他定片', '氯雷他定', '抗过敏药', '拜耳医药', '10mg×6 片', '片剂', '白色或类白色片剂', '片'),
('西替利嗪片', '盐酸西替利嗪', '抗过敏药', '强生制药', '10mg×12 片', '片剂', '白色或类白色片剂', '片'),
('扑尔敏片', '马来酸氯苯那敏', '抗过敏药', '南京白敬宇', '4mg×100 片', '片剂', '白色片剂', '片'),
('依巴斯汀片', '依巴斯汀', '抗过敏药', '艾伯维制药', '10mg×10 片', '片剂', '白色或类白色片剂', '片');

-- 添加额外常用药 - 其他常用药 (6 种)
INSERT INTO common_medications (name, generic_name, category, manufacturer, specification, form, appearance_desc, dosage_unit) VALUES
('艾司唑仑片', '艾司唑仑', '安眠药', '华海药业', '1mg×24 片', '片剂', '白色或类白色片剂', '片'),
('阿普唑仑片', '阿普唑仑', '安眠药', '辉瑞制药', '0.4mg×20 片', '片剂', '白色或类白色片剂', '片'),
('佐匹克隆片', '佐匹克隆', '安眠药', '赛诺菲制药', '7.5mg×7 片', '片剂', '白色或类白色片剂', '片'),
('蒙脱石散', '蒙脱石散', '消化系统', '博福 - 益普生', '3g×10 袋', '散剂', '灰白色或淡黄色粉末', '袋'),
('速效救心丸', '川芎、冰片', '心血管药', '天津中新药业', '40mg×60 粒', '丸剂', '棕色小丸', '粒'),
('云南白药胶囊', '三七等', '其他', '云南白药集团', '0.25g×16 粒', '胶囊', '红黑相间胶囊', '粒');

-- 创建触发器自动更新 updated_at
CREATE TRIGGER update_common_medications_updated_at
  BEFORE UPDATE ON common_medications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 查询确认插入的药品总数
SELECT COUNT(*) AS total_medications FROM common_medications;
