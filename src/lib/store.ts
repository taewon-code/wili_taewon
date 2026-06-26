import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

// MVP 데이터 저장소: JSON 파일 기반 (네이티브 의존성 없음).
// Phase 2에서 Postgres 등으로 교체 예정. 모든 접근을 이 모듈로 감싸 둠.

export type Page = {
  id: string;
  title: string;
  content: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "wiki.json");

async function readAll(): Promise<Page[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Page[]) : [];
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function writeAll(pages: Page[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(pages, null, 2), "utf8");
}

export async function getAllPages(): Promise<Page[]> {
  const pages = await readAll();
  return pages.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getPage(id: string): Promise<Page | null> {
  const pages = await readAll();
  return pages.find((p) => p.id === id) ?? null;
}

export async function createPage(input: {
  title: string;
  content: string;
  author?: string;
}): Promise<Page> {
  const pages = await readAll();
  const now = new Date().toISOString();
  const page: Page = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    content: input.content ?? "",
    author: input.author,
    createdAt: now,
    updatedAt: now,
  };
  pages.push(page);
  await writeAll(pages);
  return page;
}

export async function updatePage(
  id: string,
  input: { title: string; content: string }
): Promise<Page | null> {
  const pages = await readAll();
  const idx = pages.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  pages[idx] = {
    ...pages[idx],
    title: input.title.trim(),
    content: input.content ?? "",
    updatedAt: new Date().toISOString(),
  };
  await writeAll(pages);
  return pages[idx];
}

export async function deletePage(id: string): Promise<boolean> {
  const pages = await readAll();
  const next = pages.filter((p) => p.id !== id);
  if (next.length === pages.length) return false;
  await writeAll(next);
  return true;
}
