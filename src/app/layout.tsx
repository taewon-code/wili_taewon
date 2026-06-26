import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "LLM 위키",
  description: "AI가 소스를 읽고 스스로 작성·유지하는 살아있는 지식베이스",
};

const NAV = [
  { href: "/", label: "홈" },
  { href: "/ingest", label: "소스 수집" },
  { href: "/import/notion", label: "Notion" },
  { href: "/ask", label: "질의" },
  { href: "/lint", label: "점검" },
  { href: "/log", label: "로그" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        <header className="border-b border-neutral-200 bg-white">
          <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="shrink-0 text-lg font-bold">
              🧠 LLM 위키
            </Link>
            <div className="flex items-center gap-1 text-sm">
              {NAV.slice(1).map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-md px-3 py-1.5 font-medium text-neutral-600 hover:bg-neutral-100"
                >
                  {n.label}
                </Link>
              ))}
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-neutral-200 py-4 text-center text-xs text-neutral-400">
          LLM 위키 · Ingest · Query · Lint · Next.js + Claude
        </footer>
      </body>
    </html>
  );
}
