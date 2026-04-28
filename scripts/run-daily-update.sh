#!/bin/bash
# run-daily-update.sh
# ローカルMacで毎日実行するデータ更新スクリプト。
# launchdまたは手動で実行する。
# 登録済みIP（202.229.19.137）から楽天APIを叩き、git pushまで自動完了。
#
# カテゴリ追加時は以下のパターンをコピーして末尾に追加する:
#   log "      60秒待機中（APIレートリミット対策）..."
#   sleep 60
#   log "[X/Y] <カテゴリ名>: 楽天APIからデータ取得中..."
#   npx tsx scripts/fetch-trending-data.ts --keyword "<検索語>" --slug "<slug>" >> "$LOG_FILE" 2>&1
#   log "[X/Y] <カテゴリ名>: AEO最適化JSON生成中..."
#   python3 scripts/process-aeo-data.py --slug "<slug>" >> "$LOG_FILE" 2>&1

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_FILE="$SCRIPT_DIR/logs/daily-update.log"
mkdir -p "$SCRIPT_DIR/logs"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

log "========================================="
log "  日次データ更新開始"
log "========================================="

cd "$SCRIPT_DIR"

# ──────────────────────────────────────────
# [1] ポータブル電源
# ──────────────────────────────────────────
log "[1/8] ポータブル電源: 楽天APIからデータ取得中..."
npx tsx scripts/fetch-trending-data.ts --keyword "ポータブル電源" --slug "portable-power" >> "$LOG_FILE" 2>&1
log "      取得完了"

log "[2/8] ポータブル電源: AEO最適化JSON生成中..."
python3 scripts/process-aeo-data.py --slug "portable-power" >> "$LOG_FILE" 2>&1
log "      生成完了"

# ──────────────────────────────────────────
# [2] ドラム式洗濯機
# ──────────────────────────────────────────
log "      60秒待機中（APIレートリミット対策）..."
sleep 60

log "[3/8] ドラム式洗濯機: 楽天APIからデータ取得中..."
npx tsx scripts/fetch-trending-data.ts --keyword "洗濯乾燥機" --slug "drum-washing-machine" >> "$LOG_FILE" 2>&1
log "      取得完了"

log "[4/8] ドラム式洗濯機: AEO最適化JSON生成中..."
python3 scripts/process-aeo-data.py --slug "drum-washing-machine" >> "$LOG_FILE" 2>&1
log "      生成完了"

# ──────────────────────────────────────────
# [3] 大型冷蔵庫
# ──────────────────────────────────────────
log "      60秒待機中（APIレートリミット対策）..."
sleep 60

log "[5/8] 大型冷蔵庫: 楽天APIからデータ取得中..."
npx tsx scripts/fetch-trending-data.ts --keyword "大型冷蔵庫" --slug "refrigerator" >> "$LOG_FILE" 2>&1
log "      取得完了"

log "[6/8] 大型冷蔵庫: AEO最適化JSON生成中..."
python3 scripts/process-aeo-data.py --slug "refrigerator" >> "$LOG_FILE" 2>&1
log "      生成完了"

# ──────────────────────────────────────────
# git commit & push
# ──────────────────────────────────────────
log "[7/8] GitHubにプッシュ中..."
git add data/portable-power/ data/drum-washing-machine/ data/refrigerator/
if git diff --cached --quiet; then
  log "      変更なし。スキップ。"
else
  TODAY=$(date +%Y-%m-%d)
  PP_ITEMS=$(python3 -c "
import json, glob
files = sorted(glob.glob('data/portable-power/processed/*-processed.json'), reverse=True)
print(json.load(open(files[0]))['meta']['totalItems'] if files else 0)
" 2>/dev/null || echo "0")
  DWM_ITEMS=$(python3 -c "
import json, glob
files = sorted(glob.glob('data/drum-washing-machine/processed/*-processed.json'), reverse=True)
print(json.load(open(files[0]))['meta']['totalItems'] if files else 0)
" 2>/dev/null || echo "0")
  REF_ITEMS=$(python3 -c "
import json, glob
files = sorted(glob.glob('data/refrigerator/processed/*-processed.json'), reverse=True)
print(json.load(open(files[0]))['meta']['totalItems'] if files else 0)
" 2>/dev/null || echo "0")
  git commit -m "data: ${TODAY} 楽天データ更新 (電源${PP_ITEMS}件 / 洗濯機${DWM_ITEMS}件 / 冷蔵庫${REF_ITEMS}件)"
  git push origin main
  log "      プッシュ完了: 電源${PP_ITEMS}件 / 洗濯機${DWM_ITEMS}件 / 冷蔵庫${REF_ITEMS}件"
fi

# ──────────────────────────────────────────
log "[8/8] 完了 → Vercelが自動デプロイします"
log "      電源URL:   https://my-only-fragrance-gos.vercel.app/portable-power"
log "      洗濯機URL: https://my-only-fragrance-gos.vercel.app/drum-washing-machine"
log "      冷蔵庫URL: https://my-only-fragrance-gos.vercel.app/refrigerator"
log "========================================="
