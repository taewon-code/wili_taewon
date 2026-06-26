"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Markdown from "@/components/Markdown";

type Result = { summary: string; changedFiles: string[]; noKey?: boolean };

function pageHref(rel: string): string {
  return "/page/" + rel.replace(/\.md$/, "");
}

export default function IngestPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function run() {
    if (!content.trim()) {
      setError("소스 내용을 입력하세요.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "수집에 실패했습니다.");
      setResult({
        summary: d.summary || "",
        changedFiles: d.changedFiles || [],
        noKey: d.noKey,
      });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">소스 수집 (Ingest)</h1>
        <p className="mt-1 text-sm text-neutral-500">
          원본 텍스트를 넣으면 AI가 읽고 위키 페이지를 만들거나 갱신합니다. 한 소스가
          여러 페이지를 동시에 바꿀 수 있어요.
        </p>
      </div>

      <div className="space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="소스 제목 (선택, 비우면 자동 추출)"
          className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 focus:border-violet-500 focus:outline-none"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="기사, 메모, 회의록, 문서 본문 등 원본 내용을 붙여넣으세요."
          className="min-h-[260px] w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          onClick={run}
          disabled={loading}
          className="rounded-md bg-violet-600 px-5 py-2 font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {loading ? "AI가 위키를 갱신하는 중..." : "수집하기"}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="mb-2 text-sm font-bold text-neutral-700">수집 결과</h2>
            <Markdown>{result.summary || "(요약 없음)"}</Markdown>
          </div>
          {result.changedFiles.length > 0 && (
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
              <p className="mb-2 text-sm font-semibold text-violet-800">
                생성·변경된 페이지 ({result.changedFiles.length})
              </p>
              <ul className="space-y-1">
                {result.changedFiles.map((f) => (
                  <li key={f}>
                    <Link
                      href={pageHref(f)}
                      className="text-sm text-violet-700 hover:underline"
                    >
                      📄 {f}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
