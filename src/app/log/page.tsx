import { readFileRel, ensureScaffold } from "@/lib/wiki";
import Markdown from "@/components/Markdown";

export const dynamic = "force-dynamic";

export default async function LogPage() {
  await ensureScaffold();
  const log = await readFileRel("log.md").catch(() => "");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">작업 로그</h1>
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <Markdown>{log || "기록이 없습니다."}</Markdown>
      </div>
    </div>
  );
}
