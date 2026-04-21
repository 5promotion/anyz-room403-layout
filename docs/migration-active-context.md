# active-context.md → active-context/ 移行手順

> この変更は保護対象ファイルに関わるため、管理者がローカルで直接実施する。

## 概要

`memory/active-context.md`（単一ファイル）を `memory/active-context/`（担当者別ディレクトリ）に移行する。
これにより、複数社員の同時セッション終了によるデータ消失を防止する。

**変更前:**
```
memory/active-context.md    ← 全員が同一ファイルに上書き（競合リスク）
```

**変更後:**
```
memory/active-context/
├── _README.md              ← ルール説明
├── _template.md            ← 新規担当者用テンプレート
├── 若松.md                 ← 若松さん専用（他の人は読み取りのみ）
├── 石井.md                 ← 石井さん専用
└── 三宅.md                 ← 三宅さん専用
```

## 手順

### 1. CLAUDE.md のセッション開始手順を変更

```diff
 ## セッション開始時（必須）

-1. `memory/active-context.md` を読む — 前回の作業状態
+1. `memory/active-context/` 内の**全 .md ファイル**を読む — 全担当者の作業状態
 2. `profile/preferences.md` を読む — 好み・要件
 3. `profile/resources.md` を読む — リソース（**更新日から30日以上経過時は警告**）
 4. `learnings/insights.md` を読む — 累積知見
```

### 2. CLAUDE.md のセッション終了手順に追記

```diff
 ## セッション終了時（必須）

 `.claude/skills/session-handoff.md` の手順に従い、コンテキストを永続化する。
+**`memory/active-context/{担当者名}.md` のみ更新すること（他人のファイルは編集禁止）。**
```

### 3. session-handoff.md の「2. active-context.md の更新」を変更

```diff
-### 2. active-context.md の更新
+### 2. active-context（担当者別）の更新

-`memory/active-context.md` を最新状態に更新:
+`memory/active-context/{担当者名}.md` を最新状態に更新:
+（担当者名はセッション開始時にユーザーが申告した名前を使用）
+
+**他の担当者のファイルは絶対に編集しない。**

 - **最終更新日時**を記入
 - **現在の作業状態**を更新
 - **直近の重要な決定**を反映
 - **次セッションへの引継ぎ事項**を記載
 - **未解決の課題**を更新
```

### 4. 旧 active-context.md の移行

既存の `memory/active-context.md` の内容を確認し、最後に更新した担当者のファイルに移動:

```bash
# 例: 最後の更新者が若松さんだった場合
mv memory/active-context.md memory/active-context/若松.md
```

### 5. 全ブランドディレクトリに同じ変更を適用

各ブランドの CLAUDE.md と session-handoff.md にも同じ変更を行う。
`memory/active-context/` ディレクトリを各ブランドに作成し、`_README.md` と `_template.md` を配置する。
