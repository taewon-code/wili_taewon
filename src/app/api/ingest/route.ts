import { addRawSource, titleOf } from "@/lib/wiki";
import { ingest } from "@/lib/operations";
import { NoApiKeyError } from "@/lib/agent";

const NO_KEY_MSG =
  "⚠️ ANTHROPIC_API_KEY가 설정되지 않았습니다. `.env.local`에 키를 넣고 서버를 다시 시작하면 AI 수집이 작동합니다. (소스는 raw/에 저장되었습니다.)";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const content: string = body?.content?.trim?.() ?? "";
  if (!content) {
    return Response.json({ error: "소스 내용을 입력하세요." }, { status: 400 });
  }
  const title: string =
    body?.title?.trim?.() || titleOf(content, "untitled-source");

  // 원본은 항상 raw/ 에 저장 (불변)
  const rawPath = await addRawSource(title, content);

  try {
    const result = await ingest(rawPath, title);
    return Response.json({ ...result, rawPath, title });
  } catch (err) {
    if (err instanceof NoApiKeyError) {
      return Response.json({
        summary: NO_KEY_MSG,
        changedFiles: [],
        rawPath,
        title,
        noKey: true,
      });
    }
    const msg = err instanceof Error ? err.message : "알 수 없는 오류";
    return Response.json({ error: `수집 실패: ${msg}`, rawPath }, { status: 502 });
  }
}
