# ターミナルが動かないときの Vercel デプロイ方法

## 方法A: ターミナルを直す

1. **Cursor で新しいターミナルを開く**  
   `ターミナル` → `新しいターミナル` または `` Ctrl+` ``（バッククォート）

2. **macOS の「ターミナル」アプリを使う**  
    Spotlight（Cmd+Space）で「ターミナル」と入力して起動し、そこでコマンドを実行する。

3. **Cursor を再起動する**  
    Cursor を一度終了して開き直す。

---

## 方法B: ターミナルを使わずに Vercel へデプロイ（おすすめ）

### 手順1: プロジェクトを GitHub に上げる

- **Cursor の Git 機能を使う**
  1. 左サイドバーの **ソース管理（枝マーク）** を開く
  2. 「リポジトリを初期化」をクリック（まだ Git 管理していない場合）
  3. 変更をステージング → コミット
  4. 「発行」または「GitHub に公開」で新しいリポジトリを作成してプッシュ

- または **GitHub Desktop** を使う  
  https://desktop.github.com でインストールし、  
  `File` → `Add Local Repository` で  
  `my-only-fragrance-gos` フォルダを指定してから「Publish repository」で GitHub に公開。

### 手順2: Vercel の Web からデプロイ

1. ブラウザで **https://vercel.com** を開く
2. **Sign Up / Log In** で GitHub アカウントを使ってログイン
3. ダッシュボードで **「Add New…」→「Project」**
4. **Import Git Repository** で、さきほどプッシュした  
   `my-only-fragrance-gos` のリポジトリを選択
5. **Framework Preset** は **Next.js** のまま
6. **Deploy** をクリック

数分でデプロイが終わり、`https://xxxx.vercel.app` のような URL が発行されます。

---

## まとめ

| やり方 | 必要なもの |
|--------|------------|
| 方法A | 動くターミナル（Cursor または macOS のターミナル） |
| 方法B | GitHub アカウント + Cursor の Git UI または GitHub Desktop |

ターミナルが使えない場合は **方法B（GitHub に上げて Vercel の Web で Import）** でデプロイできます。
