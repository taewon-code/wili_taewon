import { getPage, updatePage, deletePage } from "@/lib/store";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/pages/[id]">
) {
  const { id } = await ctx.params;
  const page = await getPage(id);
  if (!page) return Response.json({ error: "문서를 찾을 수 없습니다." }, { status: 404 });
  return Response.json(page);
}

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/pages/[id]">
) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.title !== "string" || !body.title.trim()) {
    return Response.json({ error: "제목을 입력하세요." }, { status: 400 });
  }
  const page = await updatePage(id, {
    title: body.title,
    content: typeof body.content === "string" ? body.content : "",
  });
  if (!page) return Response.json({ error: "문서를 찾을 수 없습니다." }, { status: 404 });
  return Response.json(page);
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/pages/[id]">
) {
  const { id } = await ctx.params;
  const ok = await deletePage(id);
  if (!ok) return Response.json({ error: "문서를 찾을 수 없습니다." }, { status: 404 });
  return Response.json({ ok: true });
}
