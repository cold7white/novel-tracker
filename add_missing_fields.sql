-- 为 novels 表添加缺失的字段
-- 在 Supabase 的 SQL Editor 中执行以下语句

-- 添加 cover_image 字段（用于存储封面图片 Base64）
ALTER TABLE novels
ADD COLUMN IF NOT EXISTS cover_image TEXT;

-- 验证字段是否添加成功
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'novels'
AND column_name IN ('cover_image', 'excerpts');
