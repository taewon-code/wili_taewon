import { promises as fs } from "fs";
import path from "path";

// LLM Wiki 파일 저장소.
// 구조:
//   wiki-data/
//     raw/                  원본 소스 (불변)
//     wiki/entities|concepts|sources|synthesis/   AI가 생성/유지하는 페이지
//     index.md              카탈로그 (링크 + 요약)
//     log.md                시간순 기록 (append-only)
//     schema.md             위키 규칙(스키마)

export const WIKI_ROOT = path.join(process.cwd(), "wiki-data");
export const CATEGORIES = ["entities", "concepts", "sources", "synthesis"] as const;
export type Category = (typeof CATEGORIES)[number];

const SPECIAL_FILES = ["index.md", "log.md", "schema.md"];

const DEFAULT_INDEX = `# 위키 인덱스

이 위키의 모든 페이지 카탈로그입니다. 새 소스를 수집하면 AI가 이 파일을 갱신합니다.

## 엔티티 (entities)

## 개념 (concepts)

## 소스 요약 (sources)

## 종합 분석 (synthesis)
`;

const DEFAULT_LOG = `# 작업 로그

형식: \`## [YYYY-MM-DD] [operation] | 제목\`
`;

const DEFAULT_SCHEMA = `# 위키 스키마 (규칙 문서)

이 문서는 AI가 위키를 작성·유지할 때 따르는 규칙입니다. 사용자와 함께 시간이 지나며 다듬어집니다.

## 디렉터리 규칙
- \`wiki/entities/\` — 인물·조직·제품 등 고유 대상 페이지. 파일명: \`<이름>.md\` (소문자, 공백은 \`-\`).
- \`wiki/concepts/\` — 개념·주제·아이디어 페이지.
- \`wiki/sources/\` — 수집한 원본 소스별 요약 페이지. 파일명: 소스와 매칭.
- \`wiki/synthesis/\` — 비교표·분석·타임라인 등 종합 페이지.

## 페이지 작성 규칙
- 모든 페이지는 \`# 제목\`(H1)으로 시작.
- 프런트매터 대신 본문 상단에 한 줄 요약을 둔다.
- 교차 링크는 마크다운 링크로: \`[페이지 이름](../entities/foo.md)\`. 양방향으로 연결한다.
- 기존 페이지가 있으면 새로 만들지 말고 갱신한다.
- 기존 주장과 모순되는 내용은 삭제하지 말고 "> ⚠️ 모순:" 표기로 함께 남긴다.

## 갱신 프로토콜 (소스 수집 시)
1. 소스 요약 페이지 생성/갱신 (\`wiki/sources/\`)
2. 관련 엔티티 페이지 갱신
3. 관련 개념 페이지 갱신
4. 교차 링크 추가/강화
5. \`index.md\` 갱신
6. \`log.md\`에 한 줄 기록 추가

## 로그 규칙
- 한 줄 형식: \`## [YYYY-MM-DD] [ingest|query|lint] | 제목\`
`;

function safeResolve(rel: string): string {
  const clean = rel.replace(/\\/g, "/").replace(/^\/+/, "");
  const abs = path.resolve(WIKI_ROOT, clean);
  if (abs !== WIKI_ROOT && !abs.startsWith(WIKI_ROOT + path.sep)) {
    throw new Error(`잘못된 경로(루트 밖): ${rel}`);
  }
  return abs;
}

export async function ensureScaffold(): Promise<void> {
  await fs.mkdir(path.join(WIKI_ROOT, "raw"), { recursive: true });
  for (const c of CATEGORIES) {
    await fs.mkdir(path.join(WIKI_ROOT, "wiki", c), { recursive: true });
  }
  await seedIfMissing("index.md", DEFAULT_INDEX);
  await seedIfMissing("log.md", DEFAULT_LOG);
  await seedIfMissing("schema.md", DEFAULT_SCHEMA);
}

async function seedIfMissing(rel: string, content: string): Promise<void> {
  const abs = safeResolve(rel);
  try {
    await fs.access(abs);
  } catch {
    await fs.writeFile(abs, content, "utf8");
  }
}

async function walk(absDir: string, baseRel: string): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(absDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const e of entries) {
    const rel = baseRel ? `${baseRel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...(await walk(path.join(absDir, e.name), rel)));
    else if (e.isFile() && e.name.endsWith(".md")) out.push(rel);
  }
  return out;
}

export async function listWikiFiles(): Promise<string[]> {
  return (await walk(path.join(WIKI_ROOT, "wiki"), "wiki")).sort();
}

export async function listRawFiles(): Promise<string[]> {
  return (await walk(path.join(WIKI_ROOT, "raw"), "raw")).sort();
}

/** AI에게 보여줄 전체 파일 목록 (특수 파일 + wiki + raw) */
export async function listAllFiles(): Promise<string[]> {
  const wiki = await listWikiFiles();
  const raw = await listRawFiles();
  return [...SPECIAL_FILES, ...wiki, ...raw];
}

export async function readFileRel(rel: string): Promise<string> {
  return fs.readFile(safeResolve(rel), "utf8");
}

export async function exists(rel: string): Promise<boolean> {
  try {
    await fs.access(safeResolve(rel));
    return true;
  } catch {
    return false;
  }
}

/** wiki/ 하위 또는 index.md/schema.md 만 쓰기 허용 (raw/ 는 불변, log.md는 append 전용) */
export async function writeFileRel(rel: string, content: string): Promise<void> {
  const clean = rel.replace(/\\/g, "/").replace(/^\/+/, "");
  const allowed =
    clean.startsWith("wiki/") || clean === "index.md" || clean === "schema.md";
  if (!allowed) {
    throw new Error(`쓰기 불가 경로: ${rel} (wiki/ 하위, index.md, schema.md만 허용)`);
  }
  const abs = safeResolve(clean);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, content, "utf8");
}

export async function appendLog(line: string): Promise<void> {
  const abs = safeResolve("log.md");
  const text = line.endsWith("\n") ? line : line + "\n";
  await fs.appendFile(abs, text, "utf8");
}

function slugify(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "source"
  );
}

/** 원본 소스를 raw/ 에 저장하고 상대 경로 반환 */
export async function addRawSource(name: string, content: string): Promise<string> {
  await ensureScaffold();
  const base = slugify(name);
  let rel = `raw/${base}.md`;
  let i = 2;
  while (await exists(rel)) {
    rel = `raw/${base}-${i}.md`;
    i++;
  }
  await fs.writeFile(safeResolve(rel), content, "utf8");
  return rel;
}

export function titleOf(content: string, fallback: string): string {
  const m = content.match(/^\s*#\s+(.+)$/m);
  return m ? m[1].trim() : fallback;
}

export type WikiTree = {
  categories: Record<Category, { path: string; title: string }[]>;
  raw: { path: string; title: string }[];
};

export async function getTree(): Promise<WikiTree> {
  await ensureScaffold();
  const tree: WikiTree = {
    categories: { entities: [], concepts: [], sources: [], synthesis: [] },
    raw: [],
  };
  for (const rel of await listWikiFiles()) {
    const cat = rel.split("/")[1] as Category;
    if (!CATEGORIES.includes(cat)) continue;
    const content = await readFileRel(rel).catch(() => "");
    tree.categories[cat].push({
      path: rel,
      title: titleOf(content, path.basename(rel, ".md")),
    });
  }
  for (const rel of await listRawFiles()) {
    const content = await readFileRel(rel).catch(() => "");
    tree.raw.push({ path: rel, title: titleOf(content, path.basename(rel, ".md")) });
  }
  return tree;
}
