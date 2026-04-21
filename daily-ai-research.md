# Daily AI Research — 実行指示書

## 概要

Grok (xAI) の Responses API を使い、6カテゴリのAIニュースリサーチを実行し、
結果を GitHub Issue として `5co-hub/template` リポジトリに自動作成する。

## 実行手順

### 1. 環境確認

- `XAI_API_KEY` が環境変数またはリポジトリの secrets に設定されていること
- Node.js と tsx が利用可能であること

### 2. カテゴリ別リサーチ実行

以下の6カテゴリを順に実行する:

| カテゴリ | ラベル | 検索トピック |
|---------|--------|-------------|
| 自律エージェント | auto-agents | 自律エージェント AgentOps agent framework AI agent 最新動向 |
| マルチエージェント | multi-agents | マルチエージェント A2A agent-to-agent orchestration multi-agent 最新動向 |
| ローカルLLM | local-llm | ローカルLLM open source LLM quantization ollama llama 最新動向 |
| Claude Code / Anthropic | claude-code | Claude Code Anthropic MCP model context protocol 最新動向 |
| AI×EC | ai-ec | AI EC Amazon AI 楽天AI agentic commerce パーソナライズ 最新動向 |
| AI業界その他 | others | AI資金調達 AI規制 AI業界動向 funding regulation 最新ニュース |

### 3. 実行コマンド

各カテゴリについて以下を実行:

```bash
npx tsx scripts/grok_context_research.ts "<検索トピック>" --output "/tmp/research-<ラベル>.md"
```

### 4. GitHub Issue 作成

各カテゴリのレポートを GitHub Issue として作成:

```bash
DATE=$(TZ=Asia/Tokyo date '+%Y-%m-%d')
gh issue create \
  --repo 5co-hub/template \
  --title "📊 ${DATE} <カテゴリ名> リサーチレポート" \
  --body "$(cat /tmp/research-<ラベル>.md)" \
  --label "<ラベル>,news-tracking"
```

### 5. サマリー Issue 作成

全カテゴリ完了後、サマリー Issue を作成:

```bash
DATE=$(TZ=Asia/Tokyo date '+%Y-%m-%d')
gh issue create \
  --repo 5co-hub/template \
  --title "📋 ${DATE} デイリーリサーチ サマリー" \
  --body "<全issueへのリンクを含むサマリー>" \
  --label "news-tracking,summary"
```

## 注意事項

- エラーが発生した場合はスキップして次のカテゴリに進む
- 全カテゴリ失敗した場合はエラーサマリーを Issue として作成する
- レポートは日本語で出力する
