# User 타입 메뉴 관리 시스템 사용 가이드

## 시스템 개요

한국형 관리자 스타일의 메뉴 관리 시스템입니다.
- **레이아웃**: 좌측 트리(50%) + 우측 편집 폼(50%)
- **메뉴 타입**: user (마이페이지 메뉴)
- **특징**: 모달 없이 인라인 편집, MUI 테마 색상 사용

---

## 1. 시스템 구성

### Frontend (React + TypeScript + MUI)
```
frontend/src/
├── components/admin/menu/
│   ├── MenuManager.tsx    # 메인 컨테이너 (좌측 트리 + 우측 폼)
│   ├── MenuTree.tsx       # 좌측 트리 패널
│   └── MenuForm.tsx       # 우측 편집 폼
├── types/menu.ts          # 타입 정의
└── lib/menuApi.ts         # API 클라이언트
```

### Backend (Node.js + Express + MySQL)
```
middleware/node/
├── api/
│   ├── menuHandler.js       # 공개 메뉴 조회 API
│   └── menuAdminHandler.js  # 관리자 메뉴 관리 API
└── db/schema/
    └── menu_schema.sql      # 데이터베이스 스키마
```

---

## 2. 데이터베이스 설정

### 스키마 생성

```bash
# MySQL 접속
mysql -u dbuser -p egov

# 스키마 실행
source /Users/bumsuklee/PhpstormProjects/20240418-git-test-prototype-cms/middleware/node/db/schema/menu_schema.sql
```

### 주요 테이블

| 테이블명 | 설명 |
|---------|------|
| `menus` | 통합 메뉴 테이블 (user, site, admin 등 타입별 저장) |
| `user_groups` | 사용자 그룹 |
| `roles` | 역할 |
| `menu_permissions` | 메뉴별 권한 설정 |

### 기본 데이터 확인

```sql
-- user 타입 메뉴 조회
SELECT id, menu_name, menu_code, parent_id, depth, sort_order
FROM menus
WHERE menu_type = 'user' AND is_deleted = 0
ORDER BY parent_id, sort_order;
```

**기본 메뉴 구조**:
```
마이페이지 (mypage)
  ├─ 회원정보 수정 (mypage_profile)
  ├─ 비밀번호 변경 (mypage_password)
  ├─ 회원등급/혜택 (mypage_grade)
  └─ 회원탈퇴 (mypage_withdraw)

주문/배송 (orders)
  ├─ 주문내역 (orders_list)
  ├─ 배송조회 (orders_delivery)
  └─ 취소/반품/교환 (orders_cancel)

활동내역 (activity)
  ├─ 찜목록 (activity_wishlist)
  ├─ 최근 본 상품 (activity_recent)
  ├─ 내가 쓴 글 (activity_posts)
  └─ 포인트/쿠폰 (activity_point)

고객지원 (my_support)
  ├─ 1:1 문의내역 (my_support_inquiry)
  └─ 상품 Q&A (my_support_qna)
```

---

## 3. 시스템 시작

### 3.1 Backend 시작

```bash
cd middleware/node
npm install
node server.js
```

**실행 확인**:
```
[Menu Admin MySQL] Successfully connected to the database.
[Menu Public MySQL] Successfully connected to the database.
Server is running on port 3001
```

### 3.2 Frontend 시작

```bash
cd frontend
npm install
npm start
```

**브라우저 접속**: http://localhost:4000

---

## 4. 메뉴 관리 페이지 접속

### 4.1 Sidebar에서 접근

1. 좌측 사이드바에서 **Admin** 카테고리 펼치기
2. **메뉴관리** 클릭
3. `/admin/menus` 라우트로 이동

### 4.2 직접 URL 접속

```
http://localhost:4000/admin/menus
```

---

## 5. 관리자 권한 설정 (개발 환경)

현재 백엔드 API는 세션 기반 관리자 권한 체크를 수행합니다.

### 방법 1: 임시로 권한 체크 비활성화 (개발용)

**파일**: `middleware/node/api/menuAdminHandler.js`

```javascript
// 기존 코드 (51-56줄)
const checkAdminPermission = (session) => {
  if (!session || !session.isLoggedIn || !session.isAdmin) {
    return false;
  }
  return true;
};

// 개발 환경 임시 수정
const checkAdminPermission = (session) => {
  return true; // 개발 환경에서 임시로 항상 true 반환
};
```

### 방법 2: 세션에 관리자 정보 설정 (권장)

**파일**: `middleware/node/api/authHandler.js` (로그인 핸들러)

```javascript
// 로그인 성공 시 세션 설정
req.session.isLoggedIn = true;
req.session.isAdmin = true;  // 관리자 권한
req.session.userId = 'admin';
```

### 방법 3: 테스트용 미들웨어 추가

**파일**: `middleware/node/server.js`

```javascript
// 개발 환경 전용: 모든 요청에 관리자 세션 자동 설정
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    req.session.isLoggedIn = true;
    req.session.isAdmin = true;
    req.session.userId = 'dev_admin';
    next();
  });
}
```

---

## 6. 메뉴 관리 기능 사용법

### 6.1 메뉴 선택

1. **좌측 트리**에서 메뉴 클릭
2. **우측 폼**에 선택한 메뉴 정보 표시
3. 편집 후 **저장** 버튼 클릭

### 6.2 최상위 메뉴 추가

1. 좌측 트리 헤더의 **+ 버튼** 클릭
2. 우측 폼에 새 메뉴 정보 입력
3. **저장** 버튼 클릭

### 6.3 하위 메뉴 추가

1. 좌측 트리에서 부모 메뉴 **hover**
2. 나타나는 **+** (초록색) 아이콘 클릭
3. 우측 폼에 "상위 메뉴: [부모메뉴명]" 표시
4. 하위 메뉴 정보 입력 후 **저장**

### 6.4 메뉴 삭제

1. 좌측 트리에서 삭제할 메뉴 **hover**
2. 나타나는 **휴지통** (빨간색) 아이콘 클릭
3. 확인 다이얼로그에서 **삭제** 클릭

### 6.5 메뉴 수정

1. 좌측 트리에서 메뉴 선택
2. 우측 폼에서 정보 수정
3. **저장** 버튼 클릭

---

## 7. 폼 필드 설명

### 기본 정보

| 필드 | 설명 | 필수 여부 | 제약 조건 |
|------|------|----------|----------|
| 메뉴명 | 화면에 표시되는 이름 | 필수 | 최대 100자 |
| 메뉴 코드 | 시스템 내부 고유 코드 | 필수 | 영문, 숫자, _ 만 허용 (수정 불가) |
| 설명 | 메뉴 설명 | 선택 | 최대 500자 |
| 아이콘 | Material Design Icon 클래스명 | 선택 | 예: mdi-account-circle |

### 연동 설정

| 연동 타입 | 설명 | 링크 URL 예시 |
|----------|------|--------------|
| URL | 현재 창에서 이동 | /mypage/profile |
| 새창 | 새 창에서 열기 | /mypage/orders |
| 모달 | 모달 팝업으로 표시 | - |
| 외부 링크 | 외부 사이트로 이동 | https://example.com |
| 없음 | 링크 없음 (폴더) | - |

### 권한 설정

| 권한 타입 | 설명 |
|----------|------|
| 전체 공개 | 모든 방문자 접근 가능 |
| 로그인 회원 | 로그인한 회원만 접근 |
| 특정 그룹 | user_groups 테이블의 특정 그룹만 |
| 특정 사용자 | 지정된 사용자만 |
| 특정 역할 | roles 테이블의 특정 역할만 |
| 관리자 | 관리자만 접근 |

### 표시 조건 (유틸리티 메뉴용)

| 표시 조건 | 설명 |
|----------|------|
| 항상 표시 | 모든 상황에서 표시 |
| 로그인 시 | 로그인 상태에서만 표시 |
| 로그아웃 시 | 비로그인 상태에서만 표시 |
| 사용자 정의 | 별도의 조건식 사용 |

---

## 8. API 엔드포인트

### 관리자 API (인증 필요)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/admin/menus?type=user` | user 타입 메뉴 전체 조회 |
| GET | `/api/admin/menus/:id` | 메뉴 상세 조회 |
| POST | `/api/admin/menus` | 메뉴 생성 |
| PUT | `/api/admin/menus/:id` | 메뉴 수정 |
| DELETE | `/api/admin/menus/:id` | 메뉴 삭제 (Soft Delete) |
| PUT | `/api/admin/menus/reorder` | 메뉴 순서 변경 |

### 공개 API (인증 불필요)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/menus?type=user` | user 타입 메뉴 조회 (활성화된 것만) |
| GET | `/api/menus/utility/header` | 헤더 유틸리티 메뉴 |
| GET | `/api/menus/sitemap` | 사이트맵 |

---

## 9. 데이터 구조 예시

### 메뉴 생성 요청 Body

```json
{
  "menu_type": "user",
  "parent_id": null,
  "menu_name": "새 메뉴",
  "menu_code": "new_menu",
  "description": "메뉴 설명",
  "icon": "mdi-star",
  "link_type": "url",
  "link_url": "/mypage/new",
  "permission_type": "member",
  "show_condition": "always",
  "sort_order": 5,
  "is_visible": true,
  "is_active": true
}
```

### 메뉴 조회 응답

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "menu_type": "user",
      "parent_id": null,
      "menu_name": "마이페이지",
      "menu_code": "mypage",
      "icon": "mdi-account-circle",
      "link_type": "none",
      "link_url": null,
      "permission_type": "member",
      "show_condition": "always",
      "depth": 0,
      "sort_order": 1,
      "is_visible": true,
      "is_active": true,
      "is_deleted": false,
      "created_at": "2026-01-02T14:00:00.000Z",
      "parent_name": null
    }
  ]
}
```

---

## 10. UI 특징

### 좌측 트리 패널

- **폴더 아이콘**: 하위 메뉴가 있는 경우
- **파일 아이콘**: 말단 메뉴
- **트리 아이템 높이**: 28px (한국형 관리자 스타일)
- **hover 시 액션 버튼 표시**:
  - 초록색 **+**: 하위 메뉴 추가
  - 빨간색 **휴지통**: 메뉴 삭제
- **선택 시**: 좌측 파란색 테두리, Primary 색상 하이라이트

### 우측 편집 폼

- **섹션 구분**:
  1. 기본 정보
  2. 연동 설정
  3. 권한 설정
  4. 기타 설정 (정렬 순서, 표시/활성화)
- **하단 버튼**:
  - **취소**: 편집 취소 (선택 해제)
  - **저장**: 변경사항 저장

### 색상 (MUI 테마)

- Primary: 선택된 메뉴, 버튼
- Success: 하위 메뉴 추가 아이콘
- Error: 삭제 아이콘
- Grey[50]: 헤더 배경
- Divider: 테두리

---

## 11. 트러블슈팅

### 403 에러: 관리자 권한이 필요합니다

**원인**: 세션에 관리자 정보가 없음

**해결**:
1. 위의 "5. 관리자 권한 설정" 참조
2. 로그인 API에서 `req.session.isAdmin = true` 설정
3. 또는 개발 환경에서 `checkAdminPermission` 함수를 임시로 `return true`로 수정

### 메뉴가 표시되지 않음

**확인 사항**:
```sql
-- 메뉴 데이터 확인
SELECT * FROM menus WHERE menu_type = 'user' AND is_deleted = 0;

-- is_active, is_visible 확인
SELECT id, menu_name, is_active, is_visible, is_deleted
FROM menus
WHERE menu_type = 'user';
```

### DB 연결 실패

**확인**:
```bash
# .env 파일 또는 server.js의 DB 설정
MYSQL_HOST=localhost
MYSQL_USER=dbuser
MYSQL_PASSWORD=dbuser
MYSQL_DATABASE=egov
```

**테스트**:
```bash
mysql -h localhost -u dbuser -p egov
```

---

## 12. 개발자 참고사항

### Security

- **SQL Injection 방지**: Parameterized Query 사용
- **XSS 방지**: 입력값 검증 (validateInput 함수)
- **인증/인가**: 모든 관리자 API에 `checkAdminPermission` 체크

### 코딩 가이드 준수

- 입력 검증 → 인증/인가 → 에러 핸들링 → 비즈니스 로직 순서
- 모든 에러는 try-catch로 처리
- 프로덕션 에러 응답: `{ success: false, error_code: "...", message: "..." }`

### 타입 안전성

- TypeScript 타입 정의: `frontend/src/types/menu.ts`
- API 응답 타입: `ApiResponse<T>`

---

## 13. 향후 개선 사항

- [ ] 드래그 앤 드롭으로 메뉴 순서 변경
- [ ] 메뉴 복사/붙여넣기 기능
- [ ] 메뉴 검색 기능
- [ ] 메뉴 아이콘 선택 UI (Material Design Icon 목록)
- [ ] 메뉴별 권한 상세 설정 UI (groups, roles, users)
- [ ] 메뉴 일괄 활성화/비활성화
- [ ] 메뉴 미리보기 기능

---

## 문의

시스템 관련 문의 사항은 프로젝트 README.md를 참고하세요.
