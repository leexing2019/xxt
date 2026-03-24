-- =====================================================
-- 添加拼音首字母字段和自动触发器
-- 2026-03-24: 为 common_medications 表添加 pinyin_initials 字段
-- =====================================================

-- 第 1 步：添加 pinyin_initials 字段（如果不存在）
ALTER TABLE common_medications
ADD COLUMN IF NOT EXISTS pinyin_initials TEXT;

-- 创建索引加速搜索
CREATE INDEX IF NOT EXISTS idx_common_medications_pinyin
ON common_medications(pinyin_initials);

-- 第 2 步：创建拼音首字母映射函数（PostgreSQL 服务器端）
-- 注意：这个函数使用简化的映射表，覆盖常用药品用字
CREATE OR REPLACE FUNCTION get_pinyin_initials(text)
RETURNS TEXT AS $$
DECLARE
  input_text ALIAS FOR $1;
  result TEXT := '';
  char_record RECORD;
  char_index INTEGER;
  current_char CHAR;
BEGIN
  -- 处理 NULL 或空字符串
  IF input_text IS NULL OR input_text = '' THEN
    RETURN '';
  END IF;

  -- 逐字符处理
  FOR char_index IN 1..length(input_text) LOOP
    current_char := substring(input_text from char_index for 1);

    -- 如果是英文字母，直接转小写
    IF current_char ~ '[a-zA-Z]' THEN
      result := result || lower(current_char);
    -- 如果是中文字符，查表获取拼音首字母
    ELSE
      result := result || (
        SELECT pinyin
        FROM (VALUES
          -- 常用药品用字（完整映射表）
          ('甲', 'j'), ('钴', 'g'), ('胺', 'a'), ('肼', 'j'), ('噻', 's'),
          ('吩', 'f'), ('唑', 'z'), ('汀', 't'), ('坦', 't'), ('洛', 'l'),
          ('贝', 'b'), ('纳', 'n'), ('沙', 's'), ('韦', 'w'), ('奈', 'n'),
          ('酯', 'z'), ('醇', 'c'), ('苷', 'g'), ('铋', 'b'), ('羟', 'q'),
          ('苄', 'b'), ('米', 'm'), ('布', 'b'), ('芬', 'f'), ('昔', 'x'),
          ('伦', 'l'), ('肽', 't'), ('硝', 'x'), ('苯', 'b'), ('平', 'p'),
          ('缓', 'h'), ('释', 's'), ('肠', 'c'), ('溶', 'r'), ('地', 'd'),
          ('平', 'p'), ('片', 'p'), ('胶', 'j'), ('囊', 'n'), ('注', 'z'),
          ('射', 's'), ('液', 'y'), ('颗', 'k'), ('粒', 'l'), ('支', 'z'),
          ('阿', 'a'), ('托', 't'), ('伐', 'f'), ('他', 't'), ('钙', 'g'),
          ('瑞', 'r'), ('舒', 's'), ('辛', 'x'), ('普', 'p'), ('非', 'f'),
          ('诺', 'n'), ('特', 't'), ('依', 'y'), ('折', 'z'), ('麦', 'm'),
          ('普罗布考', 'plbk'), ('血脂康', 'xzk'),
          ('厄', 'e'), ('贝', 'b'), ('沙', 's'), ('坦', 't'), ('缬', 'x'),
          ('美', 'm'), ('托', 't'), ('洛', 'l'), ('尔', 'e'), ('比', 'b'),
          ('索', 's'), ('吲', 'y'), ('达', 'd'), ('帕', 'p'), ('氯', 'l'),
          ('钾', 'j'), ('替', 't'), ('米', 'm'),
          ('二', 'e'), ('甲', 'j'), ('双', 's'), ('胍', 'g'), ('格', 'g'),
          ('列', 'l'), ('美', 'm'), ('脲', 'n'), ('阿卡波糖', 'akbt'),
          ('齐', 'q'), ('特', 't'), ('瑞', 'r'), ('格', 'g'), ('奈', 'n'),
          ('西', 'x'), ('达', 'd'), ('恩', 'e'), ('净', 'j'), ('利', 'l'),
          ('拉', 'l'), ('鲁', 'l'), ('肽', 't'), ('注', 'z'), ('射', 's'),
          ('液', 'y'),
          ('华', 'h'), ('法', 'f'), ('林', 'l'), ('钠', 'n'), ('单', 'd'),
          ('硝', 'x'), ('酸', 's'), ('异', 'y'), ('山', 's'), ('梨', 'l'),
          ('酯', 'z'), ('甘', 'g'), ('油', 'y'),
          ('奥', 'a'), ('拉', 'l'), ('雷', 'l'), ('泮', 'p'), ('兰', 'l'),
          ('铝', 'l'), ('碳', 't'), ('酸', 's'), ('镁', 'm'), ('咀', 'j'),
          ('嚼', 'j'),
          ('氨', 'a'), ('溴', 'x'), ('索', 's'), ('溴', 'x'), ('己', 'j'),
          ('新', 'x'), ('右', 'y'), ('美', 'm'), ('芬', 'f'), ('喷', 'p'),
          ('托', 't'), ('维', 'w'), ('林', 'l'),
          ('布', 'b'), ('洛', 'l'), ('芬', 'f'), ('对', 'd'), ('乙', 'y'),
          ('酰', 'x'), ('氨', 'a'), ('基', 'j'), ('酚', 'f'), ('双', 's'),
          ('氯', 'l'), ('塞', 's'), ('来', 'l'), ('昔', 'x'),
          ('复', 'f'), ('合', 'h'), ('维', 'w'), ('生', 's'), ('素', 's'),
          ('碳', 't'), ('D3', 'd3'), ('B1', 'b1')
        ) AS pinyin_map(chinese, pinyin)
        WHERE chinese = current_char
        LIMIT 1
      );

      -- 如果查表失败，追加空字符串（静默跳过）
      IF result IS NULL THEN
        result := '';
      END IF;
    END IF;
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 第 3 步：创建触发器函数，在 INSERT/UPDATE 时自动更新 pinyin_initials
CREATE OR REPLACE FUNCTION update_pinyin_initials()
RETURNS TRIGGER AS $$
BEGIN
  -- 使用 name 字段生成拼音首字母
  NEW.pinyin_initials := get_pinyin_initials(NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 第 4 步：创建触发器
DROP TRIGGER IF EXISTS trg_update_pinyin_initials ON common_medications;
CREATE TRIGGER trg_update_pinyin_initials
  BEFORE INSERT OR UPDATE ON common_medications
  FOR EACH ROW
  EXECUTE FUNCTION update_pinyin_initials();

-- 第 5 步：为现有数据批量更新拼音首字母
UPDATE common_medications
SET pinyin_initials = get_pinyin_initials(name)
WHERE pinyin_initials IS NULL;

-- 第 6 步：验证结果
-- 查看前 10 条记录的拼音首字母
SELECT name, pinyin_initials
FROM common_medications
ORDER BY name
LIMIT 20;

-- 验证特定药品
SELECT name, pinyin_initials
FROM common_medications
WHERE name IN ('甲钴胺片', '硝苯地平缓释片', '阿托伐他汀钙片')
ORDER BY name;
