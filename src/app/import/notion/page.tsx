"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Markdown from "@/components/Markdown";

type NotionPage = { id: string; title: string; url: string };
type ImportState = {
  status: "loading" | "done" | "error";
  summary?: string;
  changed?: string[];
  error?: string;
  noKey?: boolean;
};

function pageHref(rel: string): string {
  return "/page/" + rel.replace(/\.md$/, "");
}

export default function NotionImportPage() {
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [noToken, setNoToken] = useState(false);
  const [listError, setListError] = useState("");
  const [states, setStates] = useState<Record<string, ImportState>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/notion/list");
        const d = await res.json();
        if (d.noToken) setNoToken(true);
        else if (!res.ok) setListError(d.error || "목록 조회 실패");
        else setPages(d.pages || []);
      } catch {
        setListError("목록 조회에 실패했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function importPage(p: NotionPage) {
    setStates((s) => ({ ...s, [p.id]: { status: "loading" } }));
    try {
      const res = await fetch("/api/notion/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: p.id, title: p.title }),
      });
      const d = await res.json();
      if (!res.ok || d.error) throw new Error(d.error || "가져오기 실패");
      setStates((s) => ({
        ...s,
        [p.id]: {
          status: "done",
          summary: d.summary,
          changed: d.changedFiles || [],
          noKey: d.noKey,
        },
      }));
    } catch (e) {
      setStates((s) => ({
        ...s,
        [p.id]: {
          status: "error",
          error: e instanceof Error ? e.message : "오류",
        },
      }));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Notion 가져오기</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Notion 페이지를 불러와 위키로 통합합니다. 각 페이지를 마크다운으로 변환해
          raw/에 저장하고, AI가 위키에 반영합니다.
        </p>
      </div>

      {loading && <p className="text-neutral-400">Notion 페이지를 불러오는 중...</p>}

      {noToken && (
        <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-semibold">Notion 연결 설정이 필요합니다</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              <a
                href="https://www.notion.so/my-integrations"
                target="_blank"
                rel="noreferrer"
                className="text-amber-800 underline"
              >
                notion.so/my-integrations
              </a>{" "}
              → <b>New integration</b> 생성 → <b>Internal Integration Token</b>(
              <code>ntn_…</code>) 복사
            </li>
            <li>
              가져올 Notion 페이지에서 우측 상단 <b>⋯ → Connections</b> → 방금 만든
              인티그레이션 연결(공유)
            </li>
            <li>
              프로젝트 <code>.env.local</code> 에 <code>NOTION_TOKEN=토큰</code> 추가
              후 서버 재시작
            </li>
          </ol>
        </div>
      )}

      {listError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {listError}
        </div>
      )}

      {!loading && !noToken && !listError && pages.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          접근 가능한 페이지가 없습니다. Notion에서 페이지를 인티그레이션과 공유했는지
          확인하세요.
        </div>
      )}

      {pages.length > 0 && (
        <ul className="divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white">
          {pages.map((p) => {
            const st = states[p.id];
            return (
              <li key={p.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.title}</p>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-neutral-400 hover:underline"
                    >
                      Notion에서 열기 ↗
                    </a>
                  </div>
                  <button
                    onClick={() => importPage(p)}
                    disabled={st?.status === "loading"}
                    className="shrink-0 rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                  >
                    {st?.status === "loading"
                      ? "가져오는 중..."
                      : st?.status === "done"
                        ? "다시 가져오기"
                        : "가져오기"}
                  </button>
                </div>

                {st?.status === "error" && (
                  <p className="mt-2 text-sm text-red-600">{st.error}</p>
                )}
                {st?.status === "done" && (
                  <div className="mt-3 space-y-2 rounded-lg bg-neutral-50 p-3">
                    <div className="text-sm">
                      <Markdown>{st.summary || "(완료)"}</Markdown>
                    </div>
                    {st.changed && st.changed.length > 0 && (
                      <ul className="space-y-0.5">
                        {st.changed.map((f) => (
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
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
