# CLAUDE.md — ポータブル電源 AEO特化型サイト 完全自動運用ルール

## 目的

AIエージェント（ChatGPT / Perplexity / Gemini 等）に選ばれる「AEO最適化」されたポータブル電源比較サイトを構築し、楽天アフィリエイトで月100万円の収益を実現する。

---

## 行動原則（MUST）

1. **手動コーディング禁止** — すべての実装はスキルまたはスクリプトで自動実行すること。
2. **自己検証必須** — コード生成後は必ず構文チェック・動作テストを実行し、エラーがないことを確認してから報告すること。エラーが残ったまま報告しない。
3. **環境変数管理** — APIキー・シークレットは `.env.local` で管理し、コードにハードコードしない。
4. **レートリミット厳守** — 楽天API: 1秒1リクエスト / Amazon: robots.txt 準拠。

---

## 学習ルール（Conventions）

- 私が指摘したミスや決定事項は **即座に以下の [Conventions] セクションに追記**し、二度と同じミスをしない。
- Conventionsは上書きではなく**追記のみ**。削除は私の指示があった場合のみ。

### [Conventions]

- **楽天APIエンドポイント**: 新規アプリは `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260401` を使用。旧 `app.rakuten.co.jp/services/api/...` は新規UUID形式のapplicationIdでは動作しない。
- **楽天API認証**: `applicationId`（UUID形式）と `accessKey`（`pk_`始まり）の両方をクエリパラメータとして必須送信。
- **取得データの混入**: `-reviewCount`ソートでは充電ケーブル等の関連商品が混入するため、processed段階でキーワードフィルタリング（Wh/EcoFlow/Jackery等）が必要。

---

## プロジェクト構成

```
/
├── CLAUDE.md                        # 本ファイル（脳）
├── .claude/
│   └── skills/
│       ├── fetch-trending-data.md   # データ取得スキル
│       └── generate-aeo-page.md     # AEOページ生成スキル
├── data/
│   └── portable-power/
│       └── YYYY-MM-DD_portable-power.json
├── scripts/
│   ├── fetch-trending-data.ts       # データ取得スクリプト
│   └── generate-aeo-page.ts         # ページ生成スクリプト
├── app/                             # Next.js App Router
│   ├── components/
│   ├── lib/
│   ├── types/
│   └── api/
├── public/
└── .env.local                       # APIキー（gitignore対象）
```

---

## 技術スタック

| 役割 | 技術 |
|---|---|
| フレームワーク | Next.js 14 (App Router) |
| スタイリング | Tailwind CSS |
| 言語 | TypeScript |
| データソース | 楽天商品検索API・楽天アフィリエイト |
| 補助データ | Amazon商品 (スクレイピング・PA-API) |
| デプロイ | Vercel |
| 自動化 | Vercel Cron Jobs |

---

## AEO最適化ルール

- 各ページに **JSON-LD構造化データ** を必ず付与（`Product` + `FAQPage` + `BreadcrumbList`）
- FAQは最低5問、AIが回答しやすい「一問一答形式」で記述
- 見出し構造: H1（1個） → H2 → H3 の順序厳守
- メタディスクリプション: 120文字以内・疑問形推奨（例: 「2024年最強のポータブル電源はどれ？」）
- Core Web Vitals: LCP < 2.5s / CLS < 0.1 / FID < 100ms
- OGP・Twitter Card を全ページに設定

---

## 収益化ルール

- アフィリエイトリンクは必ず楽天アフィリエイトID付きURLを使用
- 商品リンクは `rel="nofollow sponsored"` を付与
- 比較表には「楽天で見る」「Amazonで見る」を併記（CVR最大化）

---

## コーディング規約

- コンポーネント: `app/components/`
- データフェッチ関数: `app/lib/`
- 型定義: `app/types/`
- APIルート: `app/api/`
- スクリプト: `scripts/`
- サーバーコンポーネント優先、`'use client'` は最小限に
- `any` 型使用禁止

---

## データ仕様

- ファイル命名: `YYYY-MM-DD_portable-power.json`
- エンコーディング: UTF-8
- 更新頻度: 24時間に1回（Vercel Cron: `0 3 * * *` JST）
- 保存件数: 最大90件/回（楽天API 3ページ分）

---

## 環境変数

```
RAKUTEN_APP_ID=          # 楽天アプリID
RAKUTEN_AFFILIATE_ID=    # 楽天アフィリエイトID
AMAZON_ACCESS_KEY=       # Amazon PA-APIキー（任意）
AMAZON_SECRET_KEY=       # Amazon PA-APIシークレット（任意）
AMAZON_ASSOCIATE_TAG=    # Amazonアソシエイトタグ（任意）
NEXT_PUBLIC_SITE_URL=    # 本番サイトURL
```

---

## スキル一覧

| スキル | ファイル | 役割 |
|---|---|---|
| データ取得 | `.claude/skills/fetch-trending-data.md` | 楽天/Amazonから売れ筋商品データを取得・JSON保存 |
| ページ生成 | `.claude/skills/generate-aeo-page.md` | JSONからJSON-LD付きAEO最適化HTMLを生成 |
