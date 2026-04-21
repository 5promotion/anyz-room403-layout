#!/bin/bash
# Objective-MGMT 配下の全ブランドディレクトリにテンプレートを適用するスクリプト
# 使い方: bash scripts/apply-template.sh /path/to/Objective-MGMT

set -e

DEST="${1:?引数にObjective-MGMTのパスを指定してください}"

# テンプレートのあるディレクトリ（このスクリプトのあるリポジトリのルート）
TEMPLATE_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# ── 1. ルートレベルに共通ファイルを配置 ──
echo "=== ルートレベルの共通ファイルを配置 ==="

# チーム利用ガイドライン
mkdir -p "$DEST/docs"
cp "$TEMPLATE_DIR/docs/team-usage-guide.md" "$DEST/docs/"
echo "  ✓ docs/team-usage-guide.md"

# ── 2. CLAUDE.md を持つディレクトリを検出し、フックを配置 ──
echo ""
echo "=== CLAUDE.md を持つディレクトリにフックを配置 ==="

find "$DEST" -name "CLAUDE.md" -not -path "*/.*" | while read -r claude_md; do
  DIR=$(dirname "$claude_md")
  RELATIVE=$(python3 -c "import os; print(os.path.relpath('$DIR', '$DEST'))")

  echo ""
  echo "  ── $RELATIVE ──"

  # .claude/hooks ディレクトリ作成
  mkdir -p "$DIR/.claude/hooks"

  # settings.json をコピー
  cp "$TEMPLATE_DIR/.claude/settings.json" "$DIR/.claude/"
  echo "    ✓ .claude/settings.json"

  # フックスクリプトをコピー
  cp "$TEMPLATE_DIR/.claude/hooks/protect-files.sh" "$DIR/.claude/hooks/"
  cp "$TEMPLATE_DIR/.claude/hooks/block-personal-info.sh" "$DIR/.claude/hooks/"
  chmod +x "$DIR/.claude/hooks/"*.sh
  echo "    ✓ .claude/hooks/protect-files.sh"
  echo "    ✓ .claude/hooks/block-personal-info.sh"

  # learnings ディレクトリがなければ作成
  if [ ! -d "$DIR/learnings" ]; then
    mkdir -p "$DIR/learnings"
    cp "$TEMPLATE_DIR/learnings/insights.md" "$DIR/learnings/"
    echo "    ✓ learnings/insights.md (新規作成)"
  fi

  # memory ディレクトリがなければ作成
  if [ ! -d "$DIR/memory" ]; then
    mkdir -p "$DIR/memory/sessions"
    cp "$TEMPLATE_DIR/memory/active-context.md" "$DIR/memory/"
    cp "$TEMPLATE_DIR/memory/decisions.md" "$DIR/memory/"
    echo "    ✓ memory/ (新規作成)"
  fi

  # profile ディレクトリがなければ作成
  if [ ! -d "$DIR/profile" ]; then
    mkdir -p "$DIR/profile"
    cp "$TEMPLATE_DIR/profile/preferences.md" "$DIR/profile/"
    cp "$TEMPLATE_DIR/profile/resources.md" "$DIR/profile/"
    echo "    ✓ profile/ (新規作成)"
  fi

  # session-handoff スキルがなければ作成
  if [ ! -d "$DIR/.claude/skills" ]; then
    mkdir -p "$DIR/.claude/skills"
    cp "$TEMPLATE_DIR/.claude/skills/session-handoff.md" "$DIR/.claude/skills/"
    echo "    ✓ .claude/skills/session-handoff.md (新規作成)"
  fi

done

echo ""
echo "=== 適用完了 ==="
echo ""
echo "注意: block-personal-info.sh 内の @example.com を"
echo "      実際の社内ドメイン (@5inc.jp) に変更してください"
