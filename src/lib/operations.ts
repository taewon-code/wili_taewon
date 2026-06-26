import { runAgent, type AgentResult } from "@/lib/agent";
import { ensureScaffold, readFileRel } from "@/lib/wiki";

async function schema(): Promise<string> {
  await ensureScaffold();
  return readFileRel("schema.md").catch(() => "");
}

const BASE = (s: string) =>
  `당신은 'LLM 위키'를 작성·유지하는 AI 사서입니다. 위키는 마크다운 파일들로 이루어진, 시간이 지날수록 풍부해지는 살아있는 지식베이스입니다.
도구(list_files, read_file, write_file, append_log)로 파일을 직접 읽고 씁니다. 항상 한국어로 작업하세요.

아래는 이 위키의 규칙(schema.md)입니다. 반드시 따르세요:

---
${s}
---`;

/** Ingest — 새 소스를 읽고 위키에 통합 */
export async function ingest(rawPath: string, title: string): Promise<AgentResult> {
  const s = await schema();
  const system =
    BASE(s) +
    `

[작업: 소스 수집(Ingest)]
한 개의 새 원본 소스를 위키에 통합합니다. 절차:
1. index.md 와 (관련 있어 보이는) 기존 위키 페이지를 read_file 로 확인한다.
2. 새 소스(${rawPath})를 read_file 로 읽는다.
3. 규칙에 따라 다음을 write_file 로 수행한다:
   - wiki/sources/ 에 이 소스의 요약 페이지 생성
   - 관련 엔티티(wiki/entities/)·개념(wiki/concepts/) 페이지를 생성하거나 갱신
   - 페이지 간 교차 링크 추가/강화
   - 기존 주장과 모순되면 "> ⚠️ 모순:" 으로 표기
   - index.md 갱신 (새/변경 페이지 반영)
4. append_log 로 한 줄 기록 추가: \`## [날짜] [ingest] | ${title}\` (날짜는 오늘 날짜를 적당히)
끝나면 무엇을 만들고 바꿨는지 한국어로 간단히 요약하세요.`;
  return runAgent({
    system,
    userPrompt: `새 소스 "${title}" (경로: ${rawPath}) 를 수집해 위키를 갱신하세요.`,
    allowWrite: true,
  });
}

/** Query — 위키를 검색해 출처와 함께 답변, 가치 있으면 새 페이지로 파일링 */
export async function query(question: string): Promise<AgentResult> {
  const s = await schema();
  const system =
    BASE(s) +
    `

[작업: 질의(Query)]
절차:
1. index.md 를 읽어 관련 페이지를 찾는다.
2. 관련 위키 페이지들을 read_file 로 정독한다.
3. 위키 내용에만 근거해 한국어로 답변을 종합한다. 추측 금지. 근거가 없으면 "위키에서 답을 찾을 수 없습니다"라고 한다.
4. 답변 본문에서 참고한 페이지를 마크다운 링크로 인용한다.
5. (선택) 답변이 재사용 가치가 크면 wiki/synthesis/ 에 새 페이지로 정리하고 index.md 에 반영한다.
최종 답변은 마크다운으로, 마지막에 "## 출처" 섹션에 참고한 페이지 경로 목록을 넣으세요.`;
  return runAgent({
    system,
    userPrompt: question,
    allowWrite: true,
  });
}

/** Lint — 위키 건강 점검 (읽기 전용) */
export async function lint(): Promise<AgentResult> {
  const s = await schema();
  const system =
    BASE(s) +
    `

[작업: 점검(Lint)] — 읽기 전용. 파일을 수정하지 마세요.
list_files 와 read_file 로 위키 전체를 살펴보고 다음을 점검해 한국어 보고서를 작성하세요:
- 페이지 간 모순
- 더 최신 소스로 대체된 오래된 주장
- 들어오는 링크가 없는 고아 페이지
- 언급되지만 전용 페이지가 없는 개념(누락)
- 빠진 교차 링크
- 추가 조사/소스가 필요한 데이터 공백 → 새 리서치 질문 제안
보고서는 항목별로 정리하고, 마지막에 "## 다음 할 일" 제안을 넣으세요.`;
  return runAgent({
    system,
    userPrompt: "위키 전체를 점검하고 보고서를 작성하세요.",
    allowWrite: false,
  });
}
