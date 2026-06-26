import Anthropic from "@anthropic-ai/sdk";
import {
  ensureScaffold,
  listAllFiles,
  readFileRel,
  writeFileRel,
  appendLog,
} from "@/lib/wiki";

const MODEL = "claude-opus-4-8";
const MAX_ITERATIONS = 40;
const READ_LIMIT = 24000; // 파일 1개 읽기 최대 글자 수

export class NoApiKeyError extends Error {}

export type AgentResult = {
  summary: string;
  changedFiles: string[];
  iterations: number;
};

type ToolDef = Anthropic.Tool;

const READ_TOOLS: ToolDef[] = [
  {
    name: "list_files",
    description:
      "위키의 모든 파일 경로 목록을 반환합니다 (index.md, log.md, schema.md, wiki/** , raw/**).",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "read_file",
    description: "지정한 경로의 파일 내용을 읽습니다. 경로는 list_files의 경로를 그대로 사용하세요.",
    input_schema: {
      type: "object",
      properties: { path: { type: "string", description: "예: wiki/entities/foo.md" } },
      required: ["path"],
    },
  },
];

const WRITE_TOOLS: ToolDef[] = [
  {
    name: "write_file",
    description:
      "위키 페이지를 생성하거나 덮어씁니다. 허용 경로: wiki/** , index.md, schema.md. (raw/** 와 log.md 는 쓰기 불가)",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "예: wiki/concepts/machine-learning.md" },
        content: { type: "string", description: "파일 전체 내용(마크다운)" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "append_log",
    description: "log.md 에 한 줄 기록을 추가합니다. 형식: ## [YYYY-MM-DD] [operation] | 제목",
    input_schema: {
      type: "object",
      properties: { line: { type: "string" } },
      required: ["line"],
    },
  },
];

function textOf(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

export async function runAgent(opts: {
  system: string;
  userPrompt: string;
  allowWrite: boolean;
}): Promise<AgentResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new NoApiKeyError("ANTHROPIC_API_KEY가 설정되지 않았습니다.");

  await ensureScaffold();
  const client = new Anthropic({ apiKey });
  const tools = opts.allowWrite ? [...READ_TOOLS, ...WRITE_TOOLS] : READ_TOOLS;
  const changed = new Set<string>();

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: opts.userPrompt },
  ];

  let summary = "";
  let iterations = 0;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    iterations = i + 1;
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: opts.system,
      tools,
      messages,
    });

    messages.push({ role: "assistant", content: resp.content });

    if (resp.stop_reason !== "tool_use") {
      summary = textOf(resp.content);
      break;
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of resp.content) {
      if (block.type !== "tool_use") continue;
      const { content, isError } = await execTool(
        block.name,
        block.input as Record<string, unknown>,
        changed
      );
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content,
        ...(isError ? { is_error: true } : {}),
      });
    }
    messages.push({ role: "user", content: toolResults });
  }

  return { summary, changedFiles: [...changed], iterations };
}

async function execTool(
  name: string,
  input: Record<string, unknown>,
  changed: Set<string>
): Promise<{ content: string; isError?: boolean }> {
  try {
    switch (name) {
      case "list_files": {
        const files = await listAllFiles();
        return { content: files.join("\n") || "(빈 위키)" };
      }
      case "read_file": {
        const p = String(input.path ?? "");
        const text = await readFileRel(p);
        return {
          content: text.length > READ_LIMIT ? text.slice(0, READ_LIMIT) + "\n...(생략)" : text,
        };
      }
      case "write_file": {
        const p = String(input.path ?? "");
        const content = String(input.content ?? "");
        await writeFileRel(p, content);
        changed.add(p);
        return { content: `저장됨: ${p}` };
      }
      case "append_log": {
        await appendLog(String(input.line ?? ""));
        return { content: "로그 추가됨" };
      }
      default:
        return { content: `알 수 없는 도구: ${name}`, isError: true };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { content: `오류: ${msg}`, isError: true };
  }
}
