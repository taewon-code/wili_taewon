import Anthropic from "@anthropic-ai/sdk";
import { getAllPages, type Page } from "@/lib/store";

const MODEL = "claude-opus-4-8";
const MAX_DOCS = 25; // 한 번에 Claude에 넘길 최대 문서 수

// 간단한 키워드 기반 사전 필터. 문서가 많아지면 관련 문서만 추려서 보냄.
// (Phase 2에서 임베딩 기반 벡터 검색으로 교체 예정)
function selectRelevant(pages: Page[], question: string): Page[] {
  if (pages.length <= MAX_DOCS) return pages;
  const terms = question
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1);
  const scored = pages.map((p) => {
    const hay = (p.title + "\n" + p.content).toLowerCase();
    let score = 0;
    for (const t of terms) if (hay.includes(t)) score += 1;
    return { p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, MAX_DOCS).map((s) => s.p);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const question: string = body?.question?.trim?.() ?? "";
  if (!question) {
    return Response.json({ error: "질문을 입력하세요." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({
      answer:
        "⚠️ ANTHROPIC_API_KEY가 설정되지 않았습니다. 프로젝트 루트의 `.env.local` 파일에 키를 넣고 서버를 다시 시작하세요.",
      sources: [],
    });
  }

  const pages = await getAllPages();
  if (pages.length === 0) {
    return Response.json({
      answer:
        "아직 위키에 문서가 없습니다. '새 문서'로 내용을 추가한 뒤 다시 질문해 주세요.",
      sources: [],
    });
  }

  const selected = selectRelevant(pages, question);

  const documents = selected.map((p) => ({
    type: "document" as const,
    source: {
      type: "text" as const,
      media_type: "text/plain" as const,
      data: p.content?.trim() ? p.content : "(빈 문서)",
    },
    title: p.title,
    citations: { enabled: true },
  }));

  const client = new Anthropic({ apiKey });

  try {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system:
        "당신은 팀 지식베이스 위키의 AI 도우미입니다. 반드시 제공된 문서 내용에만 근거해 한국어로 정확하게 답하세요. 문서에 근거가 없으면 '제공된 문서에서 답을 찾을 수 없습니다'라고 말하세요. 추측하거나 지어내지 마세요. 답변은 간결하게.",
      messages: [
        {
          role: "user",
          content: [...documents, { type: "text", text: question }],
        },
      ],
    });

    let answer = "";
    const citedIdx = new Set<number>();
    for (const block of resp.content) {
      if (block.type === "text") {
        answer += block.text;
        const citations = (block as { citations?: { document_index?: number }[] })
          .citations;
        if (citations) {
          for (const c of citations) {
            if (typeof c.document_index === "number") citedIdx.add(c.document_index);
          }
        }
      }
    }

    const sources = [...citedIdx]
      .map((i) => selected[i])
      .filter(Boolean)
      .map((p) => ({ id: p.id, title: p.title }));

    return Response.json({ answer: answer.trim(), sources });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return Response.json(
      { error: `Claude 호출 실패: ${message}` },
      { status: 502 }
    );
  }
}
