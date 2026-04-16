-- 为 novels 表添加 excerpts 字段
-- 在 Supabase 的 SQL Editor 中执行以下语句

ALTER TABLE novels
ADD COLUMN IF NOT EXISTS excerpts JSONB DEFAULT '[]'::jsonb;

-- 检查字段是否添加成功
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'novels'
AND column_name = 'excerpts';
