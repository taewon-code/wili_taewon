import Link from "next/link";
import { notFound } from "next/navigation";
import { readFileRel, exists, titleOf } from "@/lib/wiki";
import WikiView from "@/components/WikiView";

export const dynamic = "force-dynamic";

export default async function WikiPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const rel = slug.map(decodeURIComponent).join("/") + ".md";

  if (!(await exists(rel))) notFound();

  const content = await readFileRel(rel);
  const editable = rel.startsWith("wiki/");
  const isRaw = rel.startsWith("raw/");

  return (
    <article className="space-y-4">
      <div>
        <p className="text-xs text-neutral-400">
          {isRaw ? "원본 소스 (불변)" : rel}
        </p>
        <h1 className="text-2xl font-bold">{titleOf(content, rel)}</h1>
      </div>

      <WikiView path={rel} initialContent={content} editable={editable} />

      <Link href="/" className="inline-block text-sm text-violet-700 hover:underline">
        ← 홈으로
      </Link>
    </article>
  );
}
