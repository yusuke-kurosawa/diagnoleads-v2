-- DiagnoLeads v2 - PostgreSQL 初期化スクリプト
-- このファイルは docker-compose up 時に自動実行されます

-- 必要な拡張機能を有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "ltree";

-- データベースの設定
ALTER DATABASE diagnoleads_dev SET timezone TO 'Asia/Tokyo';

-- 開発用のログ設定
ALTER DATABASE diagnoleads_dev SET log_statement = 'all';
ALTER DATABASE diagnoleads_dev SET log_duration = on;

-- フルテキスト検索用の設定（日本語対応）
-- pg_trgm を使用してトライグラム検索を有効化
CREATE TEXT SEARCH CONFIGURATION japanese ( COPY = simple );

COMMENT ON DATABASE diagnoleads_dev IS 'DiagnoLeads v2 開発環境データベース';
