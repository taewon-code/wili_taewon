import { lint } from "@/lib/operations";
import { NoApiKeyError } from "@/lib/agent";

const NO_KEY_MSG =
  "⚠️ ANTHROPIC_API_KEY가 설정되지 않았습니다. `.env.local`에 키를 넣고 서버를 다시 시작하세요.";

export async function POST() {
  try {
    const result = await lint();
    return Response.json({ report: result.summary });
  } catch (err) {
    if (err instanceof NoApiKeyError) {
      return Response.json({ report: NO_KEY_MSG, noKey: true });
    }
    const msg = err instanceof Error ? err.message : "알 수 없는 오류";
    return Response.json({ error: `점검 실패: ${msg}` }, { status: 502 });
  }
}
