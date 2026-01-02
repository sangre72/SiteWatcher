# Multi Board System (멀티게시판 시스템)

그누보드 스타일의 멀티게시판 시스템입니다. 게시판별로 독립적인 설정을 가지며, 다양한 기능을 제공합니다.

## 주요 기능

- **멀티게시판**: 여러 게시판을 독립적으로 관리
- **카테고리**: 게시판별 카테고리 설정
- **권한 관리**: 읽기/쓰기/댓글 권한 설정 (public, member, admin)
- **공지사항**: 게시판 상단 고정 공지글
- **비밀글**: 작성자와 관리자만 볼 수 있는 게시글
- **첨부파일**: 파일 업로드 및 다운로드
- **좋아요**: 게시글 좋아요 기능
- **댓글**: 계층형 댓글 (대댓글)

## 설치 및 설정

### 1. 데이터베이스 스키마 생성

MySQL에 접속하여 스키마를 실행합니다:

```bash
# MySQL 접속
mysql -u dbuser -p egov

# 스키마 실행
mysql> source /path/to/middleware/node/db/schema/multi_board_schema.sql
```

또는 직접 SQL 실행:

```bash
mysql -u dbuser -p egov < middleware/node/db/schema/multi_board_schema.sql
```

**생성되는 테이블:**
- `boards`: 게시판 설정
- `board_categories`: 카테고리
- `board_posts`: 게시글
- `board_comments`: 댓글
- `board_attachments`: 첨부파일
- `board_likes`: 좋아요

**기본 게시판:**
- 공지사항 (notice)
- 자유게시판 (free)
- Q&A (qna)

### 2. Backend 서버 재시작

```bash
cd middleware/node
node server.js
```

서버가 정상적으로 시작되면 다음 메시지가 표시됩니다:

```
[Board MySQL] Successfully connected to the database.
[BoardComment MySQL] Successfully connected to the database.
```

### 3. Frontend 패키지 설치 및 실행

필요한 패키지가 이미 설치되어 있습니다:
- @mui/material
- @mui/icons-material
- axios
- react-router-dom
- date-fns

```bash
cd frontend
npm start
```

## API 엔드포인트

### 게시판 관리

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/boards` | 게시판 목록 조회 |
| GET | `/api/boards/:boardCode` | 게시판 상세 조회 |

### 게시글 관리

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/boards/:boardCode/posts` | 게시글 목록 조회 |
| GET | `/api/boards/:boardCode/posts/:postId` | 게시글 상세 조회 |
| POST | `/api/boards/:boardCode/posts` | 게시글 작성 |
| PUT | `/api/boards/:boardCode/posts/:postId` | 게시글 수정 |
| DELETE | `/api/boards/:boardCode/posts/:postId` | 게시글 삭제 |

### 댓글 관리

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/boards/:boardCode/posts/:postId/comments` | 댓글 목록 조회 |
| POST | `/api/boards/:boardCode/posts/:postId/comments` | 댓글 작성 |
| PUT | `/api/boards/:boardCode/posts/:postId/comments/:commentId` | 댓글 수정 |
| DELETE | `/api/boards/:boardCode/posts/:postId/comments/:commentId` | 댓글 삭제 |

## 프론트엔드 페이지

| URL | Component | Description |
|-----|-----------|-------------|
| `/boards` | BoardList | 게시판 목록 |
| `/boards/:boardCode` | PostList | 게시글 목록 |
| `/boards/:boardCode/posts/:postId` | PostView | 게시글 상세 |
| `/boards/:boardCode/write` | PostForm | 게시글 작성 |
| `/boards/:boardCode/posts/:postId/edit` | PostForm | 게시글 수정 |

## 사용 방법

### 1. 게시판 접근

브라우저에서 `http://localhost:4000/boards` 접속

### 2. 게시판 목록에서 원하는 게시판 선택

예시:
- 공지사항: `http://localhost:4000/boards/notice`
- 자유게시판: `http://localhost:4000/boards/free`
- Q&A: `http://localhost:4000/boards/qna`

### 3. 게시글 작성

- 우측 상단 "글쓰기" 버튼 클릭
- 제목, 내용 입력
- 카테고리 선택 (카테고리 사용 게시판인 경우)
- 공지사항 체크 (관리자만)
- 비밀글 체크 (비밀글 기능 사용 게시판인 경우)

### 4. 게시글 검색

- 상단 검색창에 키워드 입력
- 제목 또는 내용에서 검색

### 5. 댓글 작성

- 게시글 하단 댓글 입력창에 내용 입력
- 전송 버튼 클릭

## 게시판 추가 방법

새로운 게시판을 추가하려면 `boards` 테이블에 데이터를 삽입합니다:

```sql
INSERT INTO boards (
  board_code,
  board_name,
  description,
  board_type,
  read_permission,
  write_permission,
  comment_permission,
  use_category,
  use_notice,
  use_secret,
  use_attachment,
  use_like,
  posts_per_page,
  display_order,
  created_by,
  updated_by
) VALUES (
  'gallery',                    -- 게시판 코드 (URL에 사용)
  '갤러리',                      -- 게시판 이름
  '사진을 공유하세요.',           -- 설명
  'gallery',                    -- 게시판 타입
  'public',                     -- 읽기 권한
  'member',                     -- 쓰기 권한
  'member',                     -- 댓글 권한
  1,                            -- 카테고리 사용
  1,                            -- 공지사항 사용
  0,                            -- 비밀글 미사용
  1,                            -- 첨부파일 사용
  1,                            -- 좋아요 사용
  20,                           -- 페이지당 게시글 수
  4,                            -- 표시 순서
  'admin',                      -- 생성자
  'admin'                       -- 수정자
);
```

카테고리 추가:

```sql
INSERT INTO board_categories (board_id, category_name, category_order, created_by, updated_by)
SELECT id, '풍경', 1, 'admin', 'admin' FROM boards WHERE board_code = 'gallery'
UNION ALL
SELECT id, '인물', 2, 'admin', 'admin' FROM boards WHERE board_code = 'gallery'
UNION ALL
SELECT id, '기타', 3, 'admin', 'admin' FROM boards WHERE board_code = 'gallery';
```

## 권한 설정

### 읽기 권한 (read_permission)

- `public`: 모든 사용자 (비로그인 포함)
- `member`: 회원만
- `admin`: 관리자만

### 쓰기 권한 (write_permission)

- `public`: 모든 사용자
- `member`: 회원만
- `admin`: 관리자만

### 댓글 권한 (comment_permission)

- `public`: 모든 사용자
- `member`: 회원만
- `admin`: 관리자만
- `disabled`: 댓글 비활성화

## 보안 기능

### 입력 검증

- XSS 방지: `<script>`, `javascript:` 등 위험한 태그 차단
- SQL Injection 방지: 파라미터 바인딩 사용
- 최대 길이 검증: 제목 500자, 내용 50,000자

### 권한 검증

- 게시판 읽기/쓰기 권한 확인
- 게시글 수정/삭제 시 작성자 또는 관리자 확인
- 댓글 수정/삭제 시 작성자 또는 관리자 확인
- 비밀글 접근 제어: 작성자 또는 관리자만

### 에러 처리

- 프로덕션 에러: `success: false`, `error_code` 사용
- 내부 정보 노출 금지
- 에러 로깅

## 파일 구조

```
프로젝트/
├── middleware/node/
│   ├── db/schema/
│   │   └── multi_board_schema.sql      # 데이터베이스 스키마
│   └── api/
│       ├── boardHandler.js              # 게시판/게시글 API
│       └── boardCommentHandler.js       # 댓글 API
│
└── frontend/src/
    ├── types/
    │   └── board.ts                     # TypeScript 타입 정의
    ├── lib/
    │   └── boardApi.ts                  # API 클라이언트
    └── components/board/
        ├── BoardList.tsx                # 게시판 목록
        ├── PostList.tsx                 # 게시글 목록
        ├── PostView.tsx                 # 게시글 상세
        └── PostForm.tsx                 # 게시글 작성/수정
```

## 문제 해결

### 데이터베이스 연결 실패

```
[Board MySQL] Connection failed
```

**해결 방법:**
1. MySQL 서버 실행 확인
2. 환경변수 확인 (MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE)
3. 데이터베이스 존재 확인

### 게시판이 표시되지 않음

**해결 방법:**
1. 데이터베이스 스키마 실행 확인
2. `boards` 테이블에 데이터 존재 확인
3. `is_active = 1`, `is_deleted = 0` 확인

### 게시글 작성 시 401 에러

**해결 방법:**
1. 로그인 상태 확인
2. 세션 쿠키 전송 확인 (`withCredentials: true`)
3. 게시판 `write_permission` 확인

## 추가 기능 구현 가이드

### 좋아요 기능 구현

`board_likes` 테이블을 사용하여 좋아요 기능을 구현할 수 있습니다:

```javascript
// Backend
const toggleLike = async (req, res) => {
  const { boardCode, postId } = req.params;
  const userId = req.session.userId;

  // 좋아요 존재 확인
  const checkQuery = 'SELECT id FROM board_likes WHERE post_id = ? AND user_id = ?';

  connection.query(checkQuery, [postId, userId], (error, results) => {
    if (results.length > 0) {
      // 좋아요 취소
      connection.query('DELETE FROM board_likes WHERE id = ?', [results[0].id]);
    } else {
      // 좋아요 추가
      connection.query('INSERT INTO board_likes (post_id, user_id) VALUES (?, ?)', [postId, userId]);
    }

    // 게시글 좋아요 수 업데이트
    connection.query(
      'UPDATE board_posts SET like_count = (SELECT COUNT(*) FROM board_likes WHERE post_id = ?) WHERE id = ?',
      [postId, postId]
    );
  });
};
```

### 첨부파일 업로드 구현

Multer를 사용하여 파일 업로드를 구현할 수 있습니다:

```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: './uploads/board/',
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  }
});
```

## 라이선스

이 프로젝트는 프로토타입 CMS의 일부입니다.
