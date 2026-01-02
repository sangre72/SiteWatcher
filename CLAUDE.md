# AI/ML Prototype CMS

AI/ML 기능이 통합된 프로토타입 CMS 시스템입니다. 이미지/텍스트 시맨틱 검색, PDF 분석, RAG, 시스템 모니터링 기능을 제공합니다.

## Development Principles (개발 원칙)

> **중요**: 모든 코드 작성 시 아래 원칙을 반드시 준수합니다.

### 1. Security First (보안 우선)
- **모든 사용자 입력은 검증 필수**: SQL Injection, XSS, Command Injection 방지
- **인증/인가 체크**: 모든 API 엔드포인트에 적절한 권한 검사
- **민감 정보 보호**: API 키, 비밀번호, 토큰은 환경변수로 관리 (`.env.local`)
- **OWASP Top 10 취약점 방지**: 코드 작성 전 보안 취약점 고려

### 2. Error Handling First (오류 처리 우선)
- **try-catch 필수**: 외부 API 호출, 파일 I/O, DB 작업 시 예외 처리
- **적절한 에러 응답**: 사용자에게 유의미한 에러 메시지 제공
- **로깅**: 에러 발생 시 디버깅을 위한 충분한 로그 기록
- **실패 시 안전한 상태 유지**: graceful degradation 적용

### 3. Implementation Order (구현 순서)
코드 작성 시 다음 순서로 구현합니다:
1. 입력 검증 (Input Validation)
2. 인증/인가 확인 (Authentication/Authorization)
3. 에러 핸들링 구조 설정 (Error Handling Setup)
4. 비즈니스 로직 구현 (Business Logic)
5. 응답 처리 (Response Handling)

@.claude/rules/security.md

## Architecture

```
Frontend (React/TypeScript) ← → Middleware (Node.js/Express) ← → LLM Server (Python/Flask/FastAPI)
Port: 4000                      Port: 3001                        Custom Ports
```

### 주요 컴포넌트

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18.2 + TypeScript | UI Framework |
| **Middleware** | Node.js + Express 4.19 | API Gateway & Business Logic |
| **LLM Server** | Python 3.11+ + PyTorch/TensorFlow | ML/AI Processing |

## Project Structure

```
├── frontend/          # React 프론트엔드 애플리케이션
│   └── src/
│       ├── components/    # React 컴포넌트
│       │   ├── ai/        # AI 기능 (ImageSearch, TextSearch)
│       │   ├── utils/     # 유틸리티 컴포넌트
│       │   └── ...
│       ├── layout/        # 레이아웃 컴포넌트
│       └── page/          # 페이지 컴포넌트
├── middleware/        # Node.js 미들웨어 서버
│   └── node/
│       ├── api/           # API 핸들러 (GPT, Gemini 등)
│       ├── monitor/       # 시스템 모니터링
│       ├── file/          # 파일 관리
│       └── db/            # 데이터베이스 핸들러
└── llm-server/        # Python LLM 서버
    └── llm_server/
        ├── pdf_analysis/  # PDF 분석 모듈
        ├── video_image_create/  # 이미지/비디오 생성
        ├── text/          # 텍스트 처리
        └── fine_tune/     # 모델 파인튜닝
```

## Quick Start (빠른 시작)

### 전체 시스템 시작
각 터미널에서 순서대로 실행합니다:

```bash
# Terminal 1: LLM Server (먼저 시작)
cd llm-server && ./start.sh

# Terminal 2: Middleware
cd middleware/node && ./start.sh

# Terminal 3: Frontend
cd frontend && ./start.sh
```

### 환경 변수 설정
시작 전 `.env.local` 파일을 프로젝트 루트에 생성합니다:

```bash
# .env.local
OPENAI_API_KEY=sk-...
HF_TOKEN=hf_...
DATABASE_URL=postgresql://user:password@localhost:5432/db_vector
```

## 서버별 상세 구동 방법

### 1. LLM Server (Python)
- **Port**: 5000 (Flask 기본)
- **요구사항**: Python 3.11+, CUDA (GPU 사용 시)

```bash
cd llm-server

# 가상환경 생성 (최초 1회)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 서버 시작
python llm_server/server.py

# PDF 분석 서버 (별도 포트)
python llm_server/pdf_analysis/server.py
```

**스크립트 사용**: `./start.sh` (setup + 실행 통합)

### 2. Middleware (Node.js)
- **Port**: 3001
- **요구사항**: Node.js 18+

```bash
cd middleware/node

# 의존성 설치 (최초 또는 package.json 변경 시)
npm install

# 서버 시작
node server.js

# 개발 모드 (nodemon)
npm run dev
```

**스크립트 사용**: `./start.sh`

### 3. Frontend (React)
- **Port**: 4000
- **요구사항**: Node.js 18+

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 시작
npm start

# 프로덕션 빌드
npm run build
```

**스크립트 사용**: `./start.sh`

## 개발 환경 세팅

### macOS
```bash
# Node.js (nvm 사용 권장)
nvm install 18
nvm use 18

# Python (pyenv 사용 권장)
pyenv install 3.11.9
pyenv local 3.11.9

# PostgreSQL (Homebrew)
brew install postgresql@15
brew services start postgresql@15
```

### 데이터베이스 설정
```bash
# PostgreSQL 벡터 확장
psql -d postgres -c "CREATE DATABASE db_vector;"
psql -d db_vector -c "CREATE EXTENSION vector;"
```

## 서비스 URL

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:4000 | React 웹 애플리케이션 |
| Middleware API | http://localhost:3001 | Node.js API 서버 |
| LLM Server | http://localhost:5000 | Flask ML 서버 |
| PDF Analysis | http://localhost:5001 | PDF 분석 서버 |

## Common Commands

### Frontend
```bash
cd frontend
npm install          # 의존성 설치
npm start            # 개발 서버 시작 (PORT=4000)
npm run build        # 프로덕션 빌드
npm test             # 테스트 실행
```

### Middleware
```bash
cd middleware/node
npm install          # 의존성 설치
node server.js       # 서버 시작 (PORT=3001)
```

### LLM Server
```bash
cd llm-server
pip install -r requirements.txt  # 의존성 설치
python llm_server/server.py      # 메인 서버 시작
```

## Key Features

1. **AI/ML 기능**
   - CLIP 기반 이미지 시맨틱 검색
   - Sentence Transformers 텍스트 검색
   - PDF 문서 분석 및 질의응답
   - RAG (Retrieval Augmented Generation)
   - Stable Diffusion 이미지 생성

2. **시스템 모니터링**
   - 호스트 리소스 모니터링 (CPU, Memory, Disk)
   - SSH 기반 원격 모니터링
   - JMX Java 애플리케이션 모니터링
   - WAS 상태 체크

3. **파일 관리**
   - 파일 트리 브라우저
   - 파일 내용 편집
   - 파일 업로드

4. **API 통합**
   - OpenAI GPT (Assistants, Chat)
   - Google Generative AI (Gemini)

## Code Style

@.claude/rules/code-style.md

## Testing Guidelines

@.claude/rules/testing.md

## Architecture Details

@.claude/rules/architecture.md

## Git Workflow

- 커밋 메시지는 Conventional Commits 형식 사용
- 브랜치: `master` (메인), `dev` (개발)
- PR 전 테스트 통과 필수

## Security Notes

- API 키는 `.env.local`에 저장 (git에서 제외)
- Helmet 미들웨어로 HTTP 보안 헤더 설정
- CORS 화이트리스트: `localhost:4000`, `localhost:3000`
- 비밀번호는 bcrypt로 해싱

---

## Claude Code Skills

> **사용 가능한 스킬**: 아래 명령어를 사용하여 자동화된 작업을 수행할 수 있습니다.

### Git 관련 스킬

| 명령어 | 설명 |
|--------|------|
| `/gitpush` | 변경사항 분석 → Conventional Commits 커밋 → dev merge → push |
| `/gitpull` | dev 브랜치 pull → 현재 브랜치에 merge → 현재 브랜치 pull |
| `/gitignore` | 프로젝트에 맞는 `.gitignore` 자동 생성 |

### 코드 품질 스킬

| 명령어 | 설명 |
|--------|------|
| `/coding-guide` | 프로젝트에 맞는 코딩 가이드라인 생성 |
| `/modular-check` | 모듈화 상태 분석 및 준수율 측정 |
| `/refactor` | 타입 중복, 유틸 중복, 모듈화 검사 및 자동 수정 |

### 콘텐츠 생성 스킬

| 명령어 | 설명 |
|--------|------|
| `/storyboard` | 시나리오 분석 → 장면 분리 → AI 이미지 프롬프트 생성 |

---

## Coding Guidelines (코딩 규칙)

> **참조**: `~/.claude/skills/coding-guide/SKILL.md`

### TypeScript/JavaScript 네이밍 컨벤션

| 구분 | 규칙 | 예시 |
|------|------|------|
| 변수/함수 | `camelCase` | `getUserInfo`, `isLoading` |
| 상수 | `UPPER_SNAKE_CASE` | `MAX_RETRIES`, `API_URL` |
| 컴포넌트/클래스 | `PascalCase` | `UserProfile`, `ImageSearch` |
| Boolean | `is`, `has`, `should` 접두사 | `isActive`, `hasPermission` |
| 이벤트 핸들러 | `handle` 접두사 | `handleClick`, `handleSubmit` |

### Python 네이밍 컨벤션

| 구분 | 규칙 | 예시 |
|------|------|------|
| 변수/함수 | `snake_case` | `get_user_info`, `process_image` |
| 상수 | `UPPER_SNAKE_CASE` | `MAX_RETRIES`, `MODEL_PATH` |
| 클래스 | `PascalCase` | `ImageProcessor`, `PDFAnalyzer` |
| Private | `_` 접두사 | `_internal_method`, `_helper` |

### Import 순서

**JavaScript/TypeScript:**
1. 외부 라이브러리 (react, express 등)
2. 내부 패키지 (@project/shared 등)
3. 상대 경로 (../components 등)
4. 타입 import (type { ... })

**Python:**
1. 표준 라이브러리
2. 서드파티 라이브러리
3. 로컬 모듈

### 보안 라이브러리 규칙

> **CRITICAL**: 보안 관련 기능은 검증된 라이브러리만 사용합니다.

| 기능 | Python | Node.js |
|------|--------|---------|
| JWT | `python-jose[cryptography]` | `jose` |
| 비밀번호 해싱 | `passlib[bcrypt]`, `bcrypt` | `bcrypt` |
| 암호화 | `cryptography` | `crypto` (내장) |

**금지 사항:**
- 비밀번호 평문 저장/로깅
- 토큰을 localStorage에 저장 (XSS 취약)
- 직접 암호화 알고리즘 구현
- SQL 문자열 직접 조합

### 데이터베이스 테이블 필수 컬럼

모든 테이블은 다음 컬럼을 포함해야 합니다:

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | UUID / BIGINT | Primary Key |
| `created_at` | TIMESTAMP | 생성일시 |
| `created_by` | UUID / VARCHAR | 생성자 ID |
| `updated_at` | TIMESTAMP | 수정일시 |
| `updated_by` | UUID / VARCHAR | 수정자 ID |
| `is_active` | BOOLEAN | 사용 여부 |
| `is_deleted` | BOOLEAN | 삭제 여부 (Soft Delete) |

### 프론트엔드 UX 필수 요소

| 상황 | 필수 요소 |
|------|----------|
| 다단계 폼 | "이전으로" 버튼 (첫 단계 제외) |
| 가입/신청 프로세스 | "취소" 링크 |
| 모달/팝업 | 닫기 버튼 (X) |
| 상세 페이지 | "목록으로" 버튼 |

### 프로덕션 에러 응답 규칙

```javascript
// 프로덕션: HTTP 상태 코드 대신 success 필드 사용
{
  "success": false,
  "message": "요청을 처리할 수 없습니다.",
  "error_code": "INTERNAL_ERROR"
}
```

| 내부 상태 | error_code | 사용자 메시지 |
|----------|------------|--------------|
| 401 | `AUTH_REQUIRED` | 로그인이 필요합니다 |
| 403 | `ACCESS_DENIED` | 접근 권한이 없습니다 |
| 404 | `NOT_FOUND` | 요청한 정보를 찾을 수 없습니다 |
| 500 | `INTERNAL_ERROR` | 요청을 처리할 수 없습니다 |

---

## Modular Architecture (모듈화 원칙)

> **참조**: `~/.claude/skills/modular-check/SKILL.md`, `~/.claude/skills/refactor/SKILL.md`

### 프론트엔드 레이아웃 구조

```
┌─────────────────────────────────────────┐
│              Header                      │  ← 로고, 주요 네비게이션
├─────────────────────────────────────────┤
│           Header Utility                 │  ← 검색, 알림, 사용자 메뉴
├─────────────────────────────────────────┤
│              Menu                        │  ← 서브 네비게이션, 탭
├─────────────────────────────────────────┤
│             Contents                     │  ← 메인 콘텐츠 영역
├─────────────────────────────────────────┤
│              Footer                      │  ← 링크, 저작권
└─────────────────────────────────────────┘
```

### 디렉토리 구조 권장

```
src/
├── components/
│   ├── common/      # Header, Footer, Layout
│   ├── auth/        # 인증 컴포넌트
│   ├── forms/       # 폼 요소
│   └── [domain]/    # 도메인별 컴포넌트
├── hooks/           # 커스텀 훅
├── lib/             # 유틸리티, API 클라이언트
├── stores/          # 전역 상태
└── types/           # 타입 정의
```

### 모듈화 검사 항목

- **타입 중복 (30%)**: 공유 타입은 `shared/types/`에만 정의
- **순환 의존성 (20%)**: 단방향 의존성 유지
- **레이어 분리 (20%)**: lib(로직), components(UI), hooks(상태) 분리
- **앱별 타입 분리 (15%)**: 앱 전용 타입은 `apps/*/types/`에 분리
- **Public API (15%)**: `index.ts`에서 명시적 export

### 컴포넌트 크기 제한

- 단일 컴포넌트: **최대 200줄**
- 200줄 초과 시: 하위 컴포넌트로 분리
- 복잡한 로직: 커스텀 훅으로 추출
