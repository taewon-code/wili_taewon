"use client";

import { useState } from "react";
import Link from "next/link";
import Markdown from "@/components/Markdown";

type Source = { id: string; title: string };

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState("");
  const [asked, setAsked] = useState(false);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError("");
    setAnswer("");
    setSources([]);
    setAsked(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "오류가 발생했습니다.");
      setAnswer(d.answer || "");
      setSources(d.sources || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">AI에게 질문하기</h1>

      <form onSubmit={ask} className="space-y-3">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") ask(e);
          }}
          placeholder="예: 신규 입사자 온보딩 절차가 어떻게 되나요?"
          className="min-h-[90px] w-full rounded-lg border border-neutral-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-400">⌘/Ctrl + Enter 로 전송</span>
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="rounded-md bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "생각 중..." : "질문하기"}
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
              <p className="text-neutral-400">관련 문서를 찾아 답변을 작성하고 있어요...</p>
            ) : (
              <Markdown>{answer}</Markdown>
            )}
          </div>

          {sources.length > 0 && (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="mb-2 text-sm font-semibold text-neutral-600">출처</p>
              <ul className="space-y-1">
                {sources.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/pages/${s.id}`}
                      className="text-sm text-blue-700 hover:underline"
                    >
                      📄 {s.title}
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
