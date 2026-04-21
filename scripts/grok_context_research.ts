#!/usr/bin/env npx tsx
/**
 * Grok Context Research Script
 *
 * Grok (xAI) の Responses API + Built-in Tools (web_search / x_search) を活用し、
 * X(Twitter) のリアルタイム情報を含むコンテキストリサーチを実行する。
 *
 * Usage:
 *   npx tsx scripts/grok_context_research.ts "検索トピック" [--model grok-4.20-reasoning]
 *
 * Environment:
 *   XAI_API_KEY - x.ai コンソールで取得した API キー
 */

const XAI_API_BASE = "https://api.x.ai/v1";
const DEFAULT_MODEL = "grok-4.20-0309-reasoning";

interface ResponseItem {
  type: string;
  id?: string;
  role?: string;
  content?: Array<{ type: string; text?: string; annotations?: unknown[] }>;
  status?: string;
}

interface ResponsesAPIResponse {
  id: string;
  output: ResponseItem[];
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
}

// ---------- Config ----------

function getApiKey(): string {
  const key = process.env.XAI_API_KEY;
  if (!key) {
    console.error("Error: XAI_API_KEY が設定されていません");
    console.error("  export XAI_API_KEY='xai-...'");
    console.error("  取得先: https://console.x.ai/team/default/api-keys");
    process.exit(1);
  }
  return key;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let model = DEFAULT_MODEL;
  let outputFile: string | null = null;
  const topics: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--model" && args[i + 1]) {
      model = args[++i];
    } else if (args[i] === "--output" && args[i + 1]) {
      outputFile = args[++i];
    } else if (!args[i].startsWith("--")) {
      topics.push(args[i]);
    }
  }

  if (topics.length === 0) {
    console.error("Usage: npx tsx scripts/grok_context_research.ts <topic> [--model <model>] [--output <file>]");
    console.error("");
    console.error("Examples:");
    console.error('  npx tsx scripts/grok_context_research.ts "AI業界の最新動向"');
    console.error('  npx tsx scripts/grok_context_research.ts "OpenAI GPT-5" --output research.md');
    process.exit(1);
  }

  return { topics, model, outputFile };
}

// ---------- API ----------

async function responsesAPI(
  apiKey: string,
  model: string,
  instructions: string,
  userMessage: string
): Promise<ResponsesAPIResponse> {
  const body = {
    model,
    instructions,
    input: [
      {
        role: "user",
        content: userMessage,
      },
    ],
    tools: [
      { type: "web_search" },
      { type: "x_search" },
    ],
    temperature: 0.3,
  };

  const res = await fetch(`${XAI_API_BASE}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API Error ${res.status}: ${errText}`);
  }

  return res.json() as Promise<ResponsesAPIResponse>;
}

// ---------- Research Pipeline ----------

const SYSTEM_PROMPT = `あなたはリサーチアナリストです。以下のルールに従ってリサーチレポートを作成してください：

1. X(Twitter) およびWeb上の最新情報を検索・統合する
2. 情報源のURLがある場合は必ず引用として記載する
3. ファクトと推測を明確に区別する
4. 日本語で出力する
5. 以下のMarkdownフォーマットで出力する：

## エグゼクティブサマリー
（3-5行の要約）

## 主要な発見
### 1. [発見項目]
- 詳細
- ソース: [URL or X post reference]

### 2. [発見項目]
...

## X(Twitter) 上のトレンド・反応
- 主要な議論ポイント
- 注目の投稿・アカウント

## 今後の展望・注目ポイント
- 短期的な動き
- 中長期的なトレンド

## 情報ソース一覧
- [ソース1](URL)
- [ソース2](URL)
`;

async function runResearch(
  apiKey: string,
  model: string,
  topic: string
): Promise<string> {
  console.error(`\n🔍 リサーチ中: "${topic}" (model: ${model})`);
  console.error("   Grok web_search + x_search でX/Webから最新情報を取得...\n");

  const userMessage = `以下のトピックについて、X(Twitter)とWebの最新情報を統合したリサーチレポートを作成してください。\n\nトピック: ${topic}\n\n※ 過去1週間の最新動向を中心に調査してください。`;

  const response = await responsesAPI(apiKey, model, SYSTEM_PROMPT, userMessage);

  // Responses API の output からテキストを抽出
  let content = "";
  for (const item of response.output) {
    if (item.type === "message" && item.content) {
      for (const block of item.content) {
        if (block.type === "output_text" || block.type === "text") {
          content += block.text ?? "";
        }
      }
    }
  }

  if (!content) {
    content = "(レスポンスからテキストを抽出できませんでした)";
    console.error("   ⚠️ 出力が空です。レスポンス:", JSON.stringify(response.output, null, 2));
  }

  console.error(
    `   ✅ 完了 (tokens: input=${response.usage.input_tokens}, output=${response.usage.output_tokens})`
  );

  return content;
}

// ---------- OGP ----------

function extractUrls(markdown: string): string[] {
  const urlPattern = /https?:\/\/[^\s)\]>"]+/g;
  const matches = markdown.match(urlPattern) ?? [];
  // 重複排除、X投稿URLは除外（OGP画像が取れないため）
  const seen = new Set<string>();
  return matches.filter((url) => {
    if (seen.has(url)) return false;
    if (url.match(/^https?:\/\/(x\.com|twitter\.com)\//)) return false;
    seen.add(url);
    return true;
  });
}

async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GrokResearchBot/1.0)" },
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const html = await res.text();
    const match = html.match(
      /<meta\s+(?:[^>]*?\s+)?property\s*=\s*["']og:image["']\s+(?:[^>]*?\s+)?content\s*=\s*["']([^"']+)["']/i
    ) ?? html.match(
      /<meta\s+(?:[^>]*?\s+)?content\s*=\s*["']([^"']+)["']\s+(?:[^>]*?\s+)?property\s*=\s*["']og:image["']/i
    );

    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

async function buildOgpThumbnails(content: string): Promise<string> {
  const urls = extractUrls(content).slice(0, 5); // 最大5件
  if (urls.length === 0) return "";

  console.error("   🖼️  OGP画像を取得中...");
  const results = await Promise.all(
    urls.map(async (url) => {
      const ogImage = await fetchOgImage(url);
      return ogImage ? { url, ogImage } : null;
    })
  );

  const thumbnails = results.filter(Boolean) as { url: string; ogImage: string }[];
  if (thumbnails.length === 0) return "";

  console.error(`   🖼️  ${thumbnails.length}件のOGP画像を取得`);
  const lines = thumbnails.map(
    (t) => `[![thumbnail](${t.ogImage})](${t.url})`
  );
  return lines.join("\n\n") + "\n\n---\n\n";
}

// ---------- Output ----------

async function formatOutput(topic: string, content: string): Promise<string> {
  const now = new Date().toISOString().split("T")[0];
  const ogpSection = await buildOgpThumbnails(content);
  return `# リサーチレポート: ${topic}

> 生成日: ${now}
> Model: Grok (xAI)
> Source: X(Twitter) x_search + Web web_search

${ogpSection}${content}
`;
}

// ---------- Main ----------

async function main() {
  const apiKey = getApiKey();
  const { topics, model, outputFile } = parseArgs();

  const results: string[] = [];

  for (const topic of topics) {
    const content = await runResearch(apiKey, model, topic);
    const formatted = await formatOutput(topic, content);
    results.push(formatted);
  }

  const output = results.join("\n---\n\n");

  if (outputFile) {
    const fs = await import("node:fs");
    fs.writeFileSync(outputFile, output, "utf-8");
    console.error(`\n📄 レポート出力: ${outputFile}`);
  } else {
    console.log(output);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
