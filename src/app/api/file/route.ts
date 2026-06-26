import { writeFileRel } from "@/lib/wiki";

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  if (typeof body?.path !== "string" || typeof body?.content !== "string") {
    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  try {
    await writeFileRel(body.path, body.content);
    return Response.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "오류";
    return Response.json({ error: msg }, { status: 400 });
  }
}
