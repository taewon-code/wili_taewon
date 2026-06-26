# AI 위키 (팀 지식베이스)

마크다운으로 문서를 작성하고, 질문하면 **Claude(AI)가 위키 문서를 근거로 출처와 함께 답변**해 주는 팀용 지식베이스입니다.

## 기능 (Phase 1 — MVP)

- 📝 문서 작성 / 편집 / 삭제 (마크다운 + 미리보기)
- 🔍 문서 목록 보기
- 🤖 AI 질문하기 — 관련 문서를 찾아 **출처와 함께** 답변 (Claude `claude-opus-4-8`, 인용 기능 사용)

데이터는 MVP 단계에서 `data/wiki.json` 파일에 저장됩니다(네이티브 의존성 없음). Phase 2에서 Postgres로 교체 예정.

## 시작하기

1. 의존성 설치 (이미 설치되어 있으면 생략)
   ```bash
   npm install
   ```
2. API 키 설정 — `.env.example`를 복사해 `.env.local`을 만들고 키를 넣으세요.
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
   키는 https://console.anthropic.com 에서 발급합니다.
3. 개발 서버 실행
   ```bash
   npm run dev
   ```
   브라우저에서 http://localhost:3000 접속.

> API 키가 없어도 위키 작성/편집은 동작합니다. AI 질문 기능만 키가 필요합니다.

## 기술 스택

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS
- Claude API (`@anthropic-ai/sdk`)
- react-markdown

## 다음 단계 (Phase 2)

- 사용자 로그인 / 팀 권한
- Notion · 구글드라이브 문서 가져오기
- 임베딩 기반 벡터 검색
- 클라우드 배포 (Postgres)
