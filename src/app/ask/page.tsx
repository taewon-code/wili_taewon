"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Markdown from "@/components/Markdown";

function pageHref(rel: string): string {
  return "/page/" + rel.replace(/\.md$/, "");
}

export default function AskPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [filed, setFiled] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [asked, setAsked] = useState(false);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError("");
    setAnswer("");
    setFiled([]);
    setAsked(true);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "오류가 발생했습니다.");
      setAnswer(d.answer || "");
      setFiled(d.changedFiles || []);
      if ((d.changedFiles || []).length) router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">질의 (Query)</h1>
        <p className="mt-1 text-sm text-neutral-500">
          위키 내용을 근거로 출처와 함께 답합니다. 가치 있는 답은 위키에 새 페이지로
          정리되기도 합니다.
        </p>
      </div>

      <form onSubmit={ask} className="space-y-3">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") ask(e);
          }}
          placeholder="예: A와 B 개념의 차이를 정리해줘"
          className="min-h-[90px] w-full rounded-lg border border-neutral-300 px-4 py-3 focus:border-violet-500 focus:outline-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-400">⌘/Ctrl + Enter 로 전송</span>
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="rounded-md bg-violet-600 px-5 py-2 font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? "위키를 찾는 중..." : "질문하기"}
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {asked && !error && (
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            {loading ? (
              <p className="text-neutral-400">
                위키 페이지를 읽고 답변을 작성하고 있어요...
              </p>
            ) : (
              <Markdown>{answer}</Markdown>
            )}
          </div>
          {filed.length > 0 && (
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
              <p className="mb-2 text-sm font-semibold text-violet-800">
                위키에 정리된 페이지
              </p>
              <ul className="space-y-1">
                {filed.map((f) => (
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
