import Link from "next/link";
import { getAllPages } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const pages = await getAllPages();

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white">
        <h1 className="text-2xl font-bold">무엇이 궁금하신가요?</h1>
        <p className="mt-2 text-blue-100">
          위키에 쌓인 문서를 바탕으로 AI가 출처와 함께 답해드립니다.
        </p>
        <Link
          href="/ask"
          className="mt-4 inline-block rounded-lg bg-white px-5 py-2.5 font-semibold text-blue-700 hover:bg-blue-50"
        >
          AI에게 질문하기 →
        </Link>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">문서 ({pages.length})</h2>
          <Link
            href="/pages/new"
            className="text-sm font-medium text-blue-700 hover:underline"
          >
            + 새 문서
          </Link>
        </div>

        {pages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 p-10 text-center text-neutral-500">
            아직 문서가 없습니다.{" "}
            <Link href="/pages/new" className="font-medium text-blue-700 hover:underline">
              첫 문서를 작성
            </Link>
            해 보세요.
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white">
            {pages.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/pages/${p.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50"
                >
                  <span className="font-medium">{p.title}</span>
                  <span className="text-xs text-neutral-400">
                    {new Date(p.updatedAt).toLocaleDateString("ko-KR")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
