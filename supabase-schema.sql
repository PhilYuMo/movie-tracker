-- 创建 movies 表
CREATE TABLE IF NOT EXISTS movies (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title         TEXT NOT NULL,
  year          SMALLINT,
  poster        TEXT,
  genres        TEXT[],
  director      TEXT,
  cast          TEXT,
  rating        REAL CHECK (rating >= 0 AND rating <= 10),
  douban_rating REAL CHECK (douban_rating >= 0 AND douban_rating <= 10),
  douban_url    TEXT UNIQUE,
  overview      TEXT,
  watch_date    DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引：按豆瓣评分和观看日期排序常用
CREATE INDEX IF NOT EXISTS idx_movies_douban_rating ON movies (douban_rating DESC);
CREATE INDEX IF NOT EXISTS idx_movies_watch_date ON movies (watch_date DESC);
CREATE INDEX IF NOT EXISTS idx_movies_genres ON movies USING GIN (genres);

-- RLS 启用（外松内紧，后续可收紧）
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

-- 宽松策略：允许所有人所有操作（后续可按需收紧）
DROP POLICY IF EXISTS \"Allow all on movies\" ON movies;
CREATE POLICY \"Allow all on movies\" ON movies
  FOR ALL
  USING (true)
  WITH CHECK (true);
