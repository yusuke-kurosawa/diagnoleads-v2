# Backup Strategy

DiagnoLeads データベースバックアップ戦略ドキュメント

## 概要

本ドキュメントでは、DiagnoLeadsの本番環境におけるデータバックアップ戦略を定義します。

## バックアップ対象

### 1. PostgreSQL データベース
- **テーブル**: leads, organizations, users, webhook_configs, webhook_deliveries, audit_logs など
- **重要度**: 最高（ビジネスクリティカル）
- **データ量**: 組織数・リード数に応じて増加

### 2. ファイルストレージ（将来的）
- アップロードされたドキュメント
- プロフィール画像

## バックアップ方式

### Neon Database (推奨)

Neon PostgreSQLを使用する場合、以下の機能が利用可能：

#### 自動バックアップ
- **Point-in-Time Recovery (PITR)**: 過去7日間（Proプラン）または30日間（Scaleプラン）
- **自動スナップショット**: 毎日自動的に作成
- **ブランチ機能**: 本番データのコピーを即座に作成可能

#### 設定手順
```bash
# Neon CLIのインストール
npm install -g neonctl

# プロジェクトのバックアップブランチ作成
neonctl branches create --name backup-$(date +%Y%m%d)

# バックアップブランチの一覧
neonctl branches list
```

### Supabase Database

Supabaseを使用する場合：

#### 自動バックアップ
- **日次バックアップ**: 自動（Proプラン以上）
- **PITR**: 7日間（Proプラン）または30日間（Teamプラン）

#### 手動バックアップ
```bash
# pg_dumpを使用したバックアップ
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# 圧縮バックアップ
pg_dump $DATABASE_URL | gzip > backup-$(date +%Y%m%d).sql.gz
```

### 汎用バックアップスクリプト

```bash
#!/bin/bash
# scripts/backup-database.sh

set -e

# 設定
BACKUP_DIR="/backups/diagnoleads"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/diagnoleads_$DATE.sql.gz"

# バックアップディレクトリ作成
mkdir -p $BACKUP_DIR

# バックアップ実行
echo "Starting backup at $(date)"
pg_dump $DATABASE_URL | gzip > $BACKUP_FILE

# バックアップサイズ確認
BACKUP_SIZE=$(ls -lh $BACKUP_FILE | awk '{print $5}')
echo "Backup completed: $BACKUP_FILE ($BACKUP_SIZE)"

# 古いバックアップの削除
find $BACKUP_DIR -name "diagnoleads_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "Cleaned up backups older than $RETENTION_DAYS days"

# 成功通知（オプション）
# curl -X POST $SLACK_WEBHOOK_URL -d '{"text":"Database backup completed successfully"}'
```

## バックアップスケジュール

| バックアップ種別 | 頻度 | 保持期間 | 方式 |
|-----------------|------|----------|------|
| フルバックアップ | 毎日 | 30日 | 自動（クラウドプロバイダー） |
| PITR | 継続的 | 7-30日 | 自動（クラウドプロバイダー） |
| 手動スナップショット | リリース前 | 90日 | 手動 |
| オフサイトバックアップ | 週次 | 1年 | 手動/自動 |

## リストア手順

### Neon Database

```bash
# ブランチからのリストア
neonctl branches restore --source backup-20240101 --target main

# 特定時点へのリストア
neonctl branches create --name restore-point --parent main --at "2024-01-01T12:00:00Z"
```

### 汎用リストア

```bash
#!/bin/bash
# scripts/restore-database.sh

set -e

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore-database.sh <backup_file>"
  exit 1
fi

echo "WARNING: This will overwrite the current database!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Restore cancelled"
  exit 0
fi

# リストア実行
gunzip -c $BACKUP_FILE | psql $DATABASE_URL

echo "Restore completed from $BACKUP_FILE"
```

## 災害復旧計画

### RTO (Recovery Time Objective)
- **目標復旧時間**: 4時間以内
- **優先順位**:
  1. データベース復旧
  2. アプリケーション再デプロイ
  3. DNS切り替え（必要な場合）

### RPO (Recovery Point Objective)
- **目標復旧時点**: 1時間以内のデータ損失
- PITRを活用し、最新の一貫性のある状態にリストア

### 復旧手順

1. **障害検知**
   - Sentryアラート
   - Vercelステータス監視
   - データベースヘルスチェック

2. **影響範囲の特定**
   - 影響を受けたテーブル/データの特定
   - 最終正常時点の特定

3. **リストア実行**
   - PITR または スナップショットからリストア
   - データ整合性の確認

4. **サービス復旧**
   - アプリケーション再起動
   - キャッシュクリア
   - ユーザー通知

## バックアップ検証

### 月次検証タスク

- [ ] バックアップファイルの整合性確認
- [ ] テスト環境へのリストア実行
- [ ] リストアデータの検証
- [ ] 復旧時間の計測

### 検証スクリプト

```bash
#!/bin/bash
# scripts/verify-backup.sh

set -e

BACKUP_FILE=$1
TEST_DB_URL="postgresql://localhost:5432/diagnoleads_verify"

# テストDBにリストア
gunzip -c $BACKUP_FILE | psql $TEST_DB_URL

# 基本的な整合性チェック
psql $TEST_DB_URL -c "SELECT COUNT(*) FROM leads;"
psql $TEST_DB_URL -c "SELECT COUNT(*) FROM organizations;"
psql $TEST_DB_URL -c "SELECT COUNT(*) FROM users;"

echo "Backup verification completed successfully"
```

## セキュリティ考慮事項

### バックアップの暗号化
- 転送中: TLS/SSL必須
- 保存時: AES-256暗号化（クラウドプロバイダー提供）

### アクセス制御
- バックアップへのアクセスは管理者のみ
- バックアップ操作は監査ログに記録

### コンプライアンス
- GDPR: ユーザーデータ削除時はバックアップからも削除を考慮
- データ保持ポリシーに従った自動削除

## 監視とアラート

### バックアップ監視項目
- バックアップジョブの成功/失敗
- バックアップファイルサイズの異常
- ストレージ使用量

### アラート設定
```yaml
# 例: バックアップ失敗時のアラート
alerts:
  - name: backup_failed
    condition: backup_status != "success"
    channels:
      - slack: "#alerts"
      - email: "admin@diagnoleads.com"
```

## 関連ドキュメント

- [デプロイメントガイド](./deployment-guide.md)
- [セキュリティポリシー](./security-policy.md)
- [インシデント対応手順](./incident-response.md)
