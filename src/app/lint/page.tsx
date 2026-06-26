"use client";

import { useState } from "react";
import Markdown from "@/components/Markdown";

export default function LintPage() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");
  const [error, setError] = useState("");
  const [ran, setRan] = useState(false);

  async function run() {
    setLoading(true);
    setError("");
    setReport("");
    setRan(true);
    try {
      const res = await fetch("/api/lint", { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "점검에 실패했습니다.");
      setReport(d.report || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">점검 (Lint)</h1>
        <p className="mt-1 text-sm text-neutral-500">
          위키 전체를 살펴 모순·고아 페이지·오래된 내용·누락된 링크/개념·데이터 공백을
          찾고, 다음에 보강할 거리를 제안합니다. (읽기 전용)
        </p>
      </div>

      <button
        onClick={run}
        disabled={loading}
        className="rounded-md bg-violet-600 px-5 py-2 font-medium text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {loading ? "위키를 점검하는 중..." : "점검 실행"}
      </button>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {ran && !error && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          {loading ? (
            <p className="text-neutral-400">위키를 읽으며 점검 중이에요...</p>
          ) : (
            <Markdown>{report}</Markdown>
          )}
        </div>
      )}
    </div>
  );
}
