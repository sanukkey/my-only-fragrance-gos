# G-OS Prototype — MY ONLY FRAGRANCE

日本発オーダーメイドフレグランスブランド『MY ONLY FRAGRANCE』向け **次世代経営OS（G-OS）** のプロトタイプです。

## デザイン・トンマナ

- **背景**: オフホワイト `#F9F9F9` と深い墨色 `#1A1A1A` のコントラスト
- **フォント**: セリフ体（Cormorant Garamond）＋サンセリフ（DM Sans）
- **トーン**: 静寂とパーソナルな体験をUIに反映

## 3つのコア機能（タブ切り替え）

| タブ | 内容 |
|------|------|
| **Dashboard** | 15店舗一括管理、KPI（売上・客単価・予約充足率・LINE登録率）、Rechartsグラフ、離職リスク・在庫アラートのAIバッジ |
| **AI-Alchemist** | Top/Middle/Base の香り選択 → 黄金比率の算出、ベテラン風アドバイス表示 |
| **LTV-Hub** | レシピID入力 → 過去の好み解析、半年後熟成に合わせたルームスプレー提案メッセージ案 |

## 技術スタック

- **Next.js** (App Router)
- **Tailwind CSS**
- **Lucide React**（アイコン）
- **Recharts**（グラフ）

## セットアップ

```bash
npm install
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## Vercel へのデプロイ

```bash
# 1. Vercel CLI をインストール（初回のみ）
npm i -g vercel

# 2. Vercel にログイン（ブラウザが開くので認証）
vercel login

# 3. プロジェクト直下で公開開始
cd /Users/sanukkey/my-only-fragrance-gos
vercel
```

グローバルインストールを使わない場合は `npx vercel` でもデプロイできます。

## プロジェクト構成

```
app/
  layout.tsx    # フォント・メタデータ
  page.tsx      # タブナビ・各ビュー切り替え
  globals.css   # カラー変数・ユーティリティ
  components/
    Dashboard.tsx   # 15店舗・KPI・AIバッジ
    AIAlchemist.tsx # 調香アシスタント
    LTVHub.tsx      # 香りの資産化デモ
```
