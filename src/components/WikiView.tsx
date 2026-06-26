"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Markdown from "@/components/Markdown";

export default function WikiView({
  path,
  initialContent,
  editable,
}: {
  path: string;
  initialContent: string;
  editable: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/file", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "저장 실패");
      }
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[400px] w-full rounded-lg border border-neutral-300 px-4 py-3 font-mono text-sm focus:border-violet-500 focus:outline-none"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-md bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
          <button
            onClick={() => {
              setContent(initialContent);
              setEditing(false);
            }}
            className="rounded-md px-4 py-2 font-medium text-neutral-600 hover:bg-neutral-100"
          >
            취소
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {editable && (
        <div className="flex justify-end">
          <button
            onClick={() => setEditing(true)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-100"
          >
            편집
          </button>
        </div>
      )}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        {content.trim() ? (
          <Markdown>{content}</Markdown>
        ) : (
          <p className="text-neutral-400">내용이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
