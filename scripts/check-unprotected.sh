#!/bin/bash
# 未保護ディレクトリ検出スクリプト
# CLAUDE.md があるのに .claude/hooks/ がないディレクトリを警告する
#
# 使い方: bash scripts/check-unprotected.sh /path/to/Objective-MGMT
# 推奨: 定期的に実行して未保護ディレクトリがないか確認する

set -e

TARGET="${1:?引数にObjective-MGMTのパスを指定してください}"

echo "=== 未保護ディレクトリ検出 ==="
echo "対象: $TARGET"
echo ""

TOTAL=0
PROTECTED=0
UNPROTECTED=0
ISSUES=()

find "$TARGET" -name "CLAUDE.md" -not -path '*/.*' | sort | while read -r claude_md; do
  DIR=$(dirname "$claude_md")
  REL=$(python3 -c "import os; print(os.path.relpath('$DIR', '$TARGET'))" 2>/dev/null || echo "$DIR")
  TOTAL=$((TOTAL + 1))

  MISSING=()

  # settings.json チェック
  if [ ! -f "$DIR/.claude/settings.json" ]; then
    MISSING+=("settings.json")
  fi

  # protect-files.sh チェック
  if [ ! -f "$DIR/.claude/hooks/protect-files.sh" ]; then
    MISSING+=("protect-files.sh")
  elif [ ! -x "$DIR/.claude/hooks/protect-files.sh" ]; then
    MISSING+=("protect-files.sh(実行権限なし)")
  fi

  # block-personal-info.sh チェック
  if [ ! -f "$DIR/.claude/hooks/block-personal-info.sh" ]; then
    MISSING+=("block-personal-info.sh")
  elif [ ! -x "$DIR/.claude/hooks/block-personal-info.sh" ]; then
    MISSING+=("block-personal-info.sh(実行権限なし)")
  fi

  # session-handoff.md チェック
  if [ ! -f "$DIR/.claude/skills/session-handoff.md" ]; then
    MISSING+=("session-handoff.md")
  fi

  # memory/active-context.md チェック
  if [ ! -f "$DIR/memory/active-context.md" ]; then
    MISSING+=("memory/active-context.md")
  fi

  if [ ${#MISSING[@]} -eq 0 ]; then
    echo "  ✅ $REL"
    PROTECTED=$((PROTECTED + 1))
  else
    echo "  ❌ $REL"
    for m in "${MISSING[@]}"; do
      echo "     不足: $m"
    done
    UNPROTECTED=$((UNPROTECTED + 1))
  fi
done

echo ""
echo "=== 結果 ==="
echo "検出ディレクトリ数: CLAUDE.md を持つ全ディレクトリ"
echo ""
echo "未保護ディレクトリがある場合は、以下で修復できます:"
echo "  bash scripts/apply-template.sh $TARGET"
