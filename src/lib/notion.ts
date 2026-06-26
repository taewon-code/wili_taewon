import { Client, isFullPage } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export class NoNotionTokenError extends Error {}

export type NotionPage = { id: string; title: string; url: string };

function getClient(): Client {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new NoNotionTokenError("NOTION_TOKEN이 설정되지 않았습니다.");
  return new Client({ auth: token });
}

function pageTitle(page: PageObjectResponse): string {
  for (const key of Object.keys(page.properties)) {
    const prop = page.properties[key];
    if (prop.type === "title") {
      const text = prop.title.map((r) => r.plain_text).join("").trim();
      if (text) return text;
    }
  }
  return "(제목 없음)";
}

/** 인티그레이션이 접근 가능한(공유된) 페이지 목록 */
export async function listNotionPages(): Promise<NotionPage[]> {
  const notion = getClient();
  const res = await notion.search({
    filter: { property: "object", value: "page" },
    page_size: 100,
  });
  const pages: NotionPage[] = [];
  for (const r of res.results) {
    if (isFullPage(r)) {
      pages.push({ id: r.id, title: pageTitle(r), url: r.url });
    }
  }
  return pages;
}

/** Notion 페이지를 마크다운으로 변환 */
export async function notionPageToMarkdown(
  pageId: string
): Promise<{ title: string; markdown: string }> {
  const notion = getClient();
  const page = await notion.pages.retrieve({ page_id: pageId });
  const title = isFullPage(page) ? pageTitle(page) : "notion-page";

  const n2m = new NotionToMarkdown({ notionClient: notion });
  const blocks = await n2m.pageToMarkdown(pageId);
  const markdown = n2m.toMarkdownString(blocks).parent ?? "";

  return { title, markdown };
}
