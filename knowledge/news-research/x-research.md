# X(Twitter) リサーチ手順 — Grok方式

## 概要

Grok (xAI) の **Live Search** 機能を使い、X(Twitter) + Web のリアルタイム情報を統合リサーチする。
従来の手動X検索やスクレイピングに代わり、Grok API 経由で自動化する。

## セットアップ

### 1. API キー取得

1. https://console.x.ai にアクセス（X アカウントでログイン）
2. **API Keys** ページでキーを生成
3. 環境変数に設定:

```bash
export XAI_API_KEY='xai-xxxxxxxxxxxxxxxxxx'
```

`.zshrc` に追加して永続化:

```bash
echo 'export XAI_API_KEY="xai-xxxxxxxxxxxxxxxxxx"' >> ~/.zshrc
```

### 2. 依存関係

- Node.js (v18+)
- npx tsx (TypeScript実行)

```bash
npm install -g tsx
```

## 使い方

### 基本実行

```bash
npx tsx scripts/grok_context_research.ts "トピック名"
```

### ファイル出力

```bash
npx tsx scripts/grok_context_research.ts "AI業界の最新動向" --output reports/ai-trends.md
```

### モデル指定

```bash
# デフォルト: grok-4.20-0309-reasoning（推論モデル）
npx tsx scripts/grok_context_research.ts "トピック" --model grok-4-1-fast-non-reasoning
```

### 複数トピック一括

```bash
npx tsx scripts/grok_context_research.ts "OpenAI動向" "Google AI" "Anthropic Claude"
```

## 利用可能モデル

| モデル | 特徴 | 用途 |
|--------|------|------|
| `grok-4.20-0309-reasoning` | 推論あり、最高精度 | 深いリサーチ（デフォルト） |
| `grok-4.20-0309-non-reasoning` | 推論なし、高速 | 速報的な調査 |
| `grok-4-1-fast-reasoning` | 高速+推論 | バランス型 |
| `grok-4-1-fast-non-reasoning` | 最速 | 大量トピックの一括処理 |

## 出力フォーマット

レポートは以下の構成で生成される：

1. **エグゼクティブサマリー** — 3-5行の要約
2. **主要な発見** — ソースURL付きの詳細
3. **X上のトレンド・反応** — 注目投稿・議論
4. **今後の展望** — 短期・中長期トレンド
5. **情報ソース一覧** — 引用URLリスト

## Grok方式の利点

- **X(Twitter) ネイティブ統合**: Grok は X のデータに直接アクセスできる唯一のLLM
- **リアルタイム性**: Live Search で直近の投稿・ニュースを反映
- **引用付き**: 情報ソースのURLを自動で付与
- **日本語対応**: 日本語トピックでも精度の高い検索が可能

## Claude Code からの利用

Claude Code セッション内で直接実行可能：

```
! npx tsx scripts/grok_context_research.ts "調査トピック" --output /tmp/research.md
```

生成されたレポートを読み込んで追加分析に活用できる。

## 注意事項

- API利用にはクレジットが必要（https://console.x.ai で購入）
- レート制限あり（詳細は xAI ドキュメント参照）
- Grok の検索結果には X の投稿が優先的に含まれる（バイアスに注意）
