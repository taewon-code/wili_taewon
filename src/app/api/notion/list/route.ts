import { listNotionPages, NoNotionTokenError } from "@/lib/notion";

const NO_TOKEN_MSG =
  "NOTION_TOKEN이 설정되지 않았습니다. Notion 인티그레이션 토큰을 `.env.local`에 넣고 서버를 다시 시작하세요.";

export async function GET() {
  try {
    const pages = await listNotionPages();
    return Response.json({ pages });
  } catch (err) {
    if (err instanceof NoNotionTokenError) {
      return Response.json({ pages: [], noToken: true, error: NO_TOKEN_MSG });
    }
    const msg = err instanceof Error ? err.message : "알 수 없는 오류";
    return Response.json({ error: `Notion 목록 조회 실패: ${msg}` }, { status: 502 });
  }
}
