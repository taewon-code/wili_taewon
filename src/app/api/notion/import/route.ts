import { notionPageToMarkdown, NoNotionTokenError } from "@/lib/notion";
import { addRawSource } from "@/lib/wiki";
import { ingest } from "@/lib/operations";
import { NoApiKeyError } from "@/lib/agent";

const NO_TOKEN_MSG =
  "NOTION_TOKEN이 설정되지 않았습니다. `.env.local`에 토큰을 넣고 서버를 다시 시작하세요.";
const NO_KEY_MSG =
  "⚠️ ANTHROPIC_API_KEY가 없어 AI 통합은 건너뛰었습니다. Notion 내용은 raw/에 저장되었습니다. 키를 넣으면 수집됩니다.";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const pageId: string = body?.pageId ?? "";
  if (!pageId) {
    return Response.json({ error: "pageId가 필요합니다." }, { status: 400 });
  }

  let title: string;
  let markdown: string;
  try {
    const fetched = await notionPageToMarkdown(pageId);
    title = body?.title?.trim?.() || fetched.title;
    markdown = fetched.markdown;
  } catch (err) {
    if (err instanceof NoNotionTokenError) {
      return Response.json({ noToken: true, error: NO_TOKEN_MSG });
    }
    const msg = err instanceof Error ? err.message : "알 수 없는 오류";
    return Response.json({ error: `Notion 가져오기 실패: ${msg}` }, { status: 502 });
  }

  const content = `# ${title}\n\n_출처: Notion_\n\n${markdown}`;
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
