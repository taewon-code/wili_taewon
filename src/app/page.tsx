import Link from "next/link";
import { getTree, readFileRel, ensureScaffold, CATEGORIES } from "@/lib/wiki";
import Markdown from "@/components/Markdown";

export const dynamic = "force-dynamic";

const CAT_LABEL: Record<string, string> = {
  entities: "엔티티",
  concepts: "개념",
  sources: "소스 요약",
  synthesis: "종합 분석",
};

function pageHref(rel: string): string {
  return "/page/" + rel.replace(/\.md$/, "");
}

export default async function Home() {
  await ensureScaffold();
  const tree = await getTree();
  const index = await readFileRel("index.md").catch(() => "");
  const totalPages = Object.values(tree.categories).reduce(
    (n, a) => n + a.length,
    0
  );

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-8 text-white">
        <h1 className="text-2xl font-bold">AI가 키워가는 지식베이스</h1>
        <p className="mt-2 max-w-2xl text-violet-100">
          소스를 넣으면 AI가 읽고 위키 페이지를 작성·통합합니다. 질문하면 위키를
          근거로 답하고, 점검으로 모순·공백을 찾아 더 단단해집니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/ingest"
            className="rounded-lg bg-white px-4 py-2 font-semibold text-violet-700 hover:bg-violet-50"
          >
            + 소스 수집
          </Link>
          <Link
            href="/ask"
            className="rounded-lg bg-violet-500/40 px-4 py-2 font-semibold text-white ring-1 ring-white/40 hover:bg-violet-500/60"
          >
            질의하기
          </Link>
          <Link
            href="/lint"
            className="rounded-lg bg-violet-500/40 px-4 py-2 font-semibold text-white ring-1 ring-white/40 hover:bg-violet-500/60"
          >
            위키 점검
          </Link>
        </div>
        <p className="mt-4 text-sm text-violet-200">
          위키 페이지 {totalPages}개 · 원본 소스 {tree.raw.length}개
        </p>
      </section>

      {totalPages === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-10 text-center text-neutral-500">
          아직 위키가 비어 있습니다.{" "}
          <Link href="/ingest" className="font-medium text-violet-700 hover:underline">
            첫 소스를 수집
          </Link>
          하면 AI가 페이지를 만들기 시작합니다.
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2">
          {CATEGORIES.map((cat) => (
            <div
              key={cat}
              className="rounded-xl border border-neutral-200 bg-white p-4"
            >
              <h2 className="mb-2 text-sm font-bold text-neutral-700">
                {CAT_LABEL[cat]} ({tree.categories[cat].length})
              </h2>
              {tree.categories[cat].length === 0 ? (
                <p className="text-sm text-neutral-400">—</p>
              ) : (
                <ul className="space-y-1">
                  {tree.categories[cat].map((p) => (
                    <li key={p.path}>
                      <Link
                        href={pageHref(p.path)}
                        className="text-sm text-violet-700 hover:underline"
                      >
                        {p.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {index.trim() && (
        <section className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-3 text-lg font-bold">인덱스</h2>
          <Markdown>{index}</Markdown>
        </section>
      )}
    </div>
  );
}
