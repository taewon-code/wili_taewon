import { getAllPages, createPage } from "@/lib/store";

export async function GET() {
  const pages = await getAllPages();
  return Response.json(pages);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.title !== "string" || !body.title.trim()) {
    return Response.json({ error: "제목을 입력하세요." }, { status: 400 });
  }
  const page = await createPage({
    title: body.title,
    content: typeof body.content === "string" ? body.content : "",
    author: typeof body.author === "string" ? body.author : undefined,
  });
  return Response.json(page, { status: 201 });
}
