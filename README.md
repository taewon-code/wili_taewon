# LLM 위키 (AI 유지 지식베이스)

소스를 넣으면 **AI가 읽고 위키 페이지를 직접 작성·통합**하는, 시간이 지날수록 풍부해지는 지식베이스입니다. Andrej Karpathy의 [LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) 패턴을 따릅니다.

## 핵심 동작

- **Ingest (소스 수집)** — 원본을 넣으면 AI가 읽고 소스 요약·엔티티·개념 페이지를 만들거나 갱신하고, 교차 링크를 잇고, 모순을 표시하고, index·log를 갱신합니다.
- **Query (질의)** — 위키를 근거로 출처와 함께 답하고, 가치 있는 답은 종합 페이지로 정리합니다.
- **Lint (점검)** — 모순·고아 페이지·오래된 내용·누락된 개념/링크·데이터 공백을 찾고 다음 할 일을 제안합니다.
- **Notion 가져오기** — Notion 페이지를 마크다운으로 변환해 수집합니다.

## 데이터 구조 (`wiki-data/`, git 미추적)

```
raw/                         원본 소스 (불변)
wiki/entities|concepts|sources|synthesis/   AI가 생성·유지하는 페이지
index.md   카탈로그   log.md   작업 기록   schema.md   위키 규칙
```

## 시작하기

```bash
npm install
cp .env.example .env.local   # 키 입력 후
npm run dev                  # http://localhost:3000
```

`.env.local` 설정:
- `ANTHROPIC_API_KEY` — https://console.anthropic.com (Ingest/Query/Lint에 필요)
- `NOTION_TOKEN` — (선택) https://www.notion.so/my-integrations 에서 발급, 가져올 페이지를 인티그레이션과 공유

> 키가 없어도 소스는 raw/에 저장되고 페이지는 수동 편집할 수 있습니다. AI 동작만 키가 필요합니다.

## 기술 스택

- Next.js 16 (App Router, TypeScript) · Tailwind CSS
- Claude API (`@anthropic-ai/sdk`, `claude-opus-4-8`) — 파일 도구 실행 루프로 위키를 직접 유지
- Notion SDK + notion-to-md · react-markdown

## 동작 방식

`src/lib/agent.ts`의 Claude **도구 실행 루프**가 `list_files`·`read_file`·`write_file`·`append_log` 도구로 `wiki-data/`를 직접 읽고 씁니다. 세 동작의 프롬프트는 `src/lib/operations.ts`, 파일 헬퍼는 `src/lib/wiki.ts`에 있습니다.

## 다음 단계

- 구글드라이브 가져오기
- 임베딩 기반 벡터 검색 (대규모 위키)
- 사용자 로그인 / 팀 권한 · 클라우드 배포(Postgres)
