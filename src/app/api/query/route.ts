import { query } from "@/lib/operations";
import { NoApiKeyError } from "@/lib/agent";

const NO_KEY_MSG =
  "⚠️ ANTHROPIC_API_KEY가 설정되지 않았습니다. `.env.local`에 키를 넣고 서버를 다시 시작하세요.";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const question: string = body?.question?.trim?.() ?? "";
  if (!question) {
    return Response.json({ error: "질문을 입력하세요." }, { status: 400 });
  }

  try {
    const result = await query(question);
    return Response.json({
      answer: result.summary,
      changedFiles: result.changedFiles,
    });
  } catch (err) {
    if (err instanceof NoApiKeyError) {
      return Response.json({ answer: NO_KEY_MSG, changedFiles: [], noKey: true });
    }
    const msg = err instanceof Error ? err.message : "알 수 없는 오류";
    return Response.json({ error: `질의 실패: ${msg}` }, { status: 502 });
  }
}
