#!/bin/bash
# run-daily-update.sh
# ローカルMacで毎日実行するデータ更新スクリプト。
# launchdまたは手動で実行する。
# 登録済みIP（202.229.19.137）から楽天APIを叩き、git pushまで自動完了。

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_FILE="$SCRIPT_DIR/logs/daily-update.log"
mkdir -p "$SCRIPT_DIR/logs"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

log "========================================="
log "  ポータブル電源データ 日次更新開始"
log "========================================="

cd "$SCRIPT_DIR"

# 1. 楽天APIからデータ取得
log "[1/4] 楽天APIからデータ取得中..."
npx tsx scripts/fetch-trending-data.ts >> "$LOG_FILE" 2>&1
log "      取得完了"

# 2. AEO最適化JSONを生成
log "[2/4] AEO最適化JSON生成中..."
python3 scripts/process-aeo-data.py >> "$LOG_FILE" 2>&1
log "      生成完了"

# 3. git commit & push
log "[3/4] GitHubにプッシュ中..."
git add data/portable-power/
if git diff --cached --quiet; then
  log "      変更なし。スキップ。"
else
  TODAY=$(date +%Y-%m-%d)
  ITEMS=$(python3 -c "
import json, glob
files = sorted(glob.glob('data/portable-power/processed/*-processed.json'), reverse=True)
print(json.load(open(files[0]))['meta']['totalItems'] if files else 0)
" 2>/dev/null || echo "0")
  git commit -m "data: ${TODAY} 楽天ポータブル電源データ更新 (${ITEMS}件)"
  git push origin main
  log "      プッシュ完了: ${ITEMS}件"
fi

# 4. 完了
log "[4/4] 完了 → Vercelが自動デプロイします"
log "      URL: https://my-only-fragrance-gos.vercel.app/portable-power"
log "========================================="
