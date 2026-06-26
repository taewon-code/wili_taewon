"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Markdown from "@/components/Markdown";

type Initial = { id: string; title: string; content: string };

export default function PageEditor({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);

  async function save() {
    if (!title.trim()) {
      setError("제목을 입력하세요.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        initial ? `/api/pages/${initial.id}` : "/api/pages",
        {
          method: initial ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content }),
        }
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "저장에 실패했습니다.");
      }
      const page = await res.json();
      router.push(`/pages/${page.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했습니다.");
      setSaving(false);
    }
  }

  async function remove() {
    if (!initial) return;
    if (!window.confirm("이 문서를 삭제할까요? 되돌릴 수 없습니다.")) return;
    setSaving(true);
    const res = await fetch(`/api/pages/${initial.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("삭제에 실패했습니다.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="문서 제목"
        className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-lg font-semibold focus:border-blue-500 focus:outline-none"
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-500">마크다운 지원</span>
        <button
          type="button"
          onClick={() => setPreview((v) => !v)}
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          {preview ? "✏️ 편집으로" : "👁 미리보기"}
        </button>
      </div>

      {preview ? (
        <div className="min-h-[300px] rounded-lg border border-neutral-200 bg-white p-4">
          {content.trim() ? (
            <Markdown>{content}</Markdown>
          ) : (
            <p className="text-neutral-400">내용이 없습니다.</p>
          )}
        </div>
      ) : (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={"# 제목\n\n여기에 마크다운으로 내용을 작성하세요."}
          className="min-h-[300px] w-full rounded-lg border border-neutral-300 px-4 py-3 font-mono text-sm focus:border-blue-500 focus:outline-none"
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-md bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md px-4 py-2 font-medium text-neutral-600 hover:bg-neutral-100"
        >
          취소
        </button>
        {initial && (
          <button
            type="button"
            onClick={remove}
            disabled={saving}
            className="ml-auto rounded-md px-4 py-2 font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            삭제
          </button>
        )}
      </div>
    </div>
  );
}
