import Link from "next/link";
import { notFound } from "next/navigation";
import { getPage } from "@/lib/store";
import Markdown from "@/components/Markdown";

export const dynamic = "force-dynamic";

export default async function PageView({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const page = await getPage(id);
  if (!page) notFound();

  return (
    <article className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{page.title}</h1>
          <p className="mt-1 text-xs text-neutral-400">
            마지막 수정: {new Date(page.updatedAt).toLocaleString("ko-KR")}
          </p>
        </div>
        <Link
          href={`/pages/${page.id}/edit`}
          className="shrink-0 rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-100"
        >
          편집
        </Link>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        {page.content.trim() ? (
          <Markdown>{page.content}</Markdown>
        ) : (
          <p className="text-neutral-400">내용이 없습니다.</p>
        )}
      </div>

      <Link href="/" className="inline-block text-sm text-blue-700 hover:underline">
        ← 목록으로
      </Link>
    </article>
  );
}
