import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 위키",
  description: "팀 지식베이스 — 질문하면 AI가 출처와 함께 답해주는 위키",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        <header className="border-b border-neutral-200 bg-white">
          <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold">
              📚 AI 위키
            </Link>
            <div className="flex items-center gap-2 text-sm">
              <Link
                href="/ask"
                className="rounded-md px-3 py-1.5 font-medium text-blue-700 hover:bg-blue-50"
              >
                AI에게 질문
              </Link>
              <Link
                href="/pages/new"
                className="rounded-md bg-neutral-900 px-3 py-1.5 font-medium text-white hover:bg-neutral-700"
              >
                새 문서
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-neutral-200 py-4 text-center text-xs text-neutral-400">
          AI 위키 · Next.js + Claude
        </footer>
      </body>
    </html>
  );
}
