# User 메뉴 관리 시스템

사용자 메뉴(마이페이지)를 관리하는 통합 시스템입니다.

## 시스템 구성

### Frontend (React + TypeScript + MUI)

```
frontend/src/
├── types/
│   └── menu.ts                    # 메뉴 타입 정의
├── lib/
│   └── menuApi.ts                 # API 클라이언트
└── components/admin/menu/
    ├── MenuManager.tsx            # 메인 컴포넌트 (50:50 레이아웃)
    ├── MenuTree.tsx               # 좌측 트리 (28px 높이)
    └── MenuForm.tsx               # 우측 편집 폼
```

### Backend (Node.js + Express + MySQL)

```
middleware/node/api/
├── menuHandler.js                 # 공개 API (사용자용)
└── menuAdminHandler.js            # 관리 API (관리자용)
```

### Database

```sql
menus 테이블 (통합 테이블)
- menu_type: 'user' (마이페이지 메뉴)
- parent_id: 트리 구조 (NULL = 최상위)
- sort_order: 정렬 순서
```

## 주요 기능

### 1. 트리 구조 메뉴 관리
- 무한 depth 지원
- 폴더/파일 아이콘으로 시각적 구분
- 드래그앤드롭 순서 변경 (향후 추가 가능)

### 2. 인라인 편집 (모달 없음)
- 좌측: 트리 (50%)
- 우측: 상세/편집 폼 (50%)
- 한국형 관리자 스타일

### 3. 메뉴 속성
- **기본 정보**: 메뉴명, 메뉴 코드, 설명, 아이콘
- **연동 설정**: URL, 새창, 모달, 외부 링크, 없음
- **권한 설정**: 전체 공개, 로그인 회원, 특정 그룹, 특정 사용자, 특정 역할, 관리자
- **표시 조건**: 항상, 로그인 시, 로그아웃 시, 사용자 정의

### 4. 보안 기능
- SQL Injection 방지 (Parameterized Query)
- XSS 방지 (입력값 검증)
- 관리자 권한 체크
- 입력값 길이 제한

## 사용 방법

### 1. 메뉴 관리 접근

```
http://localhost:4000/admin/menus
```

또는 좌측 사이드바에서:
```
Admin > 메뉴관리
```

### 2. 메뉴 추가

#### 최상위 메뉴 추가
1. 좌측 상단 `+` 버튼 클릭
2. 우측 폼에서 정보 입력
3. "저장" 클릭

#### 하위 메뉴 추가
1. 부모 메뉴에 마우스 오버
2. 나타나는 `+` 버튼 클릭
3. 우측 폼에서 정보 입력
4. "저장" 클릭

### 3. 메뉴 수정

1. 좌측 트리에서 메뉴 선택
2. 우측 폼에서 정보 수정
3. "저장" 클릭

### 4. 메뉴 삭제

1. 메뉴에 마우스 오버
2. 나타나는 `🗑️` 버튼 클릭
3. 확인 다이얼로그에서 "삭제" 클릭

> **주의**: 하위 메뉴가 있는 경우 함께 삭제되지 않습니다. 먼저 하위 메뉴를 삭제해야 합니다.

## 기본 메뉴 데이터

### USER 타입 메뉴 (마이페이지)

```
📁 마이페이지 (mypage)
  ├─ 📄 회원정보 수정 (mypage_profile)
  ├─ 📄 비밀번호 변경 (mypage_password)
  ├─ 📄 회원등급/혜택 (mypage_grade)
  └─ 📄 회원탈퇴 (mypage_withdraw)

📁 주문/배송 (orders)
  ├─ 📄 주문내역 (orders_list)
  ├─ 📄 배송조회 (orders_delivery)
  └─ 📄 취소/반품/교환 (orders_cancel)

📁 활동내역 (activity)
  ├─ 📄 찜목록 (activity_wishlist)
  ├─ 📄 최근 본 상품 (activity_recent)
  ├─ 📄 내가 쓴 글 (activity_posts)
  └─ 📄 포인트/쿠폰 (activity_point)

📁 고객지원 (my_support)
  ├─ 📄 1:1 문의내역 (my_support_inquiry)
  └─ 📄 상품 Q&A (my_support_qna)
```

## API 엔드포인트

### 공개 API (사용자용)

```
GET /api/menus?type=user
- 사용자 메뉴 트리 조회 (활성화된 메뉴만)

GET /api/menus/utility/header
- 헤더 유틸리티 메뉴

GET /api/menus/sitemap
- 사이트맵 (site + user)
```

### 관리 API (관리자용)

```
GET /api/admin/menus?type=user
- 전체 메뉴 조회 (비활성 포함)

GET /api/admin/menus/:id
- 메뉴 상세 조회

POST /api/admin/menus
- 메뉴 생성

PUT /api/admin/menus/:id
- 메뉴 수정

DELETE /api/admin/menus/:id
- 메뉴 삭제 (Soft Delete)

PUT /api/admin/menus/reorder
- 메뉴 순서 변경
```

## 디자인 원칙

### 한국형 관리자 스타일

- **레이아웃**: 좌측 트리 + 우측 폼 (50:50)
- **모달 없음**: 모든 편집이 인라인으로 이루어짐
- **작은 아이템 높이**: 28px (많은 메뉴를 한눈에)
- **폴더/파일 아이콘**: 시각적 구분 명확
- **호버 액션**: 마우스 오버 시 추가/삭제 버튼 표시

### MUI 테마 색상 사용

```typescript
// ❌ 하드코딩 금지
bgcolor: '#1976d2'

// ✅ 테마 색상 사용
bgcolor: 'primary.main'
bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1)
```

### 트리 아이템 높이

```typescript
sx={{
  height: 28,
  minHeight: 28,
  py: 0,
  // ...
}}
```

## 보안 체크리스트

### 입력 검증

```javascript
// ✅ 필수 필드 체크
if (!menu_name.trim()) {
  throw new Error('메뉴명은 필수입니다.');
}

// ✅ 메뉴 코드 형식 검증
if (!/^[a-zA-Z0-9_]+$/.test(menu_code)) {
  throw new Error('메뉴 코드는 영문, 숫자, 언더스코어(_)만 사용 가능');
}

// ✅ 길이 제한
inputProps={{ maxLength: 100 }}
```

### SQL Injection 방지

```javascript
// ❌ 문자열 직접 조합
const query = `SELECT * FROM menus WHERE id = '${id}'`;

// ✅ Parameterized Query
const query = 'SELECT * FROM menus WHERE id = ?';
connection.query(query, [id], callback);
```

### XSS 방지

```javascript
const validateInput = (input, fieldName, maxLength = 100) => {
  if (typeof input !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  const dangerous = /<script|javascript:|onerror=|onclick=|--/i;
  if (dangerous.test(input)) {
    throw new Error(`${fieldName} contains invalid characters`);
  }
  return input.trim();
};
```

### 권한 체크

```javascript
const checkAdminPermission = (session) => {
  if (!session || !session.isLoggedIn || !session.isAdmin) {
    return false;
  }
  return true;
};

// 모든 관리 API에서 체크
if (!checkAdminPermission(req.session)) {
  return res.status(403).json({
    success: false,
    error_code: 'ACCESS_DENIED',
    message: '관리자 권한이 필요합니다.'
  });
}
```

## 에러 처리

### Frontend

```typescript
try {
  await menuApi.createMenu(formData);
  setSuccessMessage('메뉴가 추가되었습니다.');
} catch (err: any) {
  setError(err.message || '저장 중 오류가 발생했습니다.');
}
```

### Backend

```javascript
try {
  // 비즈니스 로직
  res.json({ success: true, data: result });
} catch (error) {
  console.error('[Menu Admin] Error:', error);
  res.status(500).json({
    success: false,
    error_code: 'INTERNAL_ERROR',
    message: '요청 처리 중 오류가 발생했습니다.'
  });
}
```

## 향후 개선 사항

### 1. 드래그앤드롭 순서 변경
```bash
npm install @dnd-kit/core @dnd-kit/sortable
```

### 2. 메뉴 권한 상세 설정
- 그룹별 권한 할당 UI
- 역할별 권한 할당 UI
- 사용자별 권한 할당 UI

### 3. 메뉴 미리보기
- 실제 사용자 화면에서 메뉴가 어떻게 보이는지 미리보기

### 4. 메뉴 복사/붙여넣기
- 메뉴 구조 복제 기능

### 5. 다국어 지원
- 메뉴명 다국어 버전 관리

## 트러블슈팅

### 메뉴가 표시되지 않음

1. **is_active = true** 확인
2. **is_deleted = false** 확인
3. **is_visible = true** 확인 (공개 API만)
4. **menu_type = 'user'** 확인

### 하위 메뉴가 삭제되지 않음

- 현재는 하위 메뉴가 있는 경우 상위 메뉴만 삭제됩니다.
- 하위 메뉴를 먼저 삭제한 후 상위 메뉴를 삭제하세요.
- 향후 "하위 메뉴 포함 삭제" 옵션 추가 예정

### 메뉴 코드 중복 오류

```
error_code: 'DUPLICATE_MENU_CODE'
message: '이미 존재하는 메뉴 코드입니다.'
```

- 메뉴 코드는 `menu_type` 내에서 고유해야 합니다.
- 다른 코드를 사용하세요.

## 개발자 가이드

### 새로운 메뉴 타입 추가

1. DB 스키마 수정
```sql
ALTER TABLE menus
MODIFY menu_type ENUM('site', 'user', 'admin', 'header_utility', 'footer_utility', 'quick_menu', 'new_type');
```

2. TypeScript 타입 추가
```typescript
// frontend/src/types/menu.ts
export type MenuType = 'site' | 'user' | 'admin' | ... | 'new_type';
```

3. 새 관리 페이지 생성 (MenuManager 복사)

### 디버깅

```bash
# Backend 로그 확인
cd middleware/node
node server.js

# Frontend 개발자 도구
- Network 탭에서 API 응답 확인
- Console 탭에서 에러 메시지 확인
```

## 라이선스

MIT License

## 문의

프로젝트 이슈 트래커를 사용하세요.
