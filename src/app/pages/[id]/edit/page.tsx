import { notFound } from "next/navigation";
import { getPage } from "@/lib/store";
import PageEditor from "@/components/PageEditor";

export const dynamic = "force-dynamic";

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const page = await getPage(id);
  if (!page) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">문서 편집</h1>
      <PageEditor
        initial={{ id: page.id, title: page.title, content: page.content }}
      />
    </div>
  );
}
