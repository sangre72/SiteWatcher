# User 메뉴 관리 시스템 아키텍처

## 전체 시스템 구조

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser (React App)                           │
│                      http://localhost:4000                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  /admin/menus 라우트                                                 │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │             MenuManager 컴포넌트                              │   │
│  │  ┌───────────────────┬──────────────────────────────────┐   │   │
│  │  │  MenuTree (50%)   │   MenuForm (50%)                 │   │   │
│  │  │                   │                                   │   │   │
│  │  │  ┌─────────────┐  │  ┌────────────────────────────┐  │   │   │
│  │  │  │ 메뉴 구조    │  │  │ 메뉴 추가/수정             │  │   │   │
│  │  │  ├─────────────┤  │  ├────────────────────────────┤  │   │   │
│  │  │  │ 📁 마이페이지│ ◀┼─▶│ 기본 정보                  │  │   │   │
│  │  │  │   📄 회원정보│  │  │  ├ 메뉴명: [       ]       │  │   │   │
│  │  │  │   📄 비번변경│  │  │  ├ 메뉴 코드: [     ]      │  │   │   │
│  │  │  │ 📁 주문/배송 │  │  │  └ 설명: [         ]      │  │   │   │
│  │  │  │   📄 주문내역│  │  │                            │  │   │   │
│  │  │  │   📄 배송조회│  │  │ 연동 설정                  │  │   │   │
│  │  │  │ 📁 활동내역  │  │  │  ├ 연동 타입: [▼]          │  │   │   │
│  │  │  │   📄 찜목록  │  │  │  └ 링크 URL: [     ]      │  │   │   │
│  │  │  │   📄 최근본  │  │  │                            │  │   │   │
│  │  │  │ 📁 고객지원  │  │  │ 권한 설정                  │  │   │   │
│  │  │  │   📄 문의내역│  │  │  ├ 권한 타입: [▼]          │  │   │   │
│  │  │  └─────────────┘  │  │  └ 표시 조건: [▼]          │  │   │   │
│  │  │                   │  │                            │  │   │   │
│  │  │  hover 시:        │  │ ┌──────┬──────┐           │  │   │   │
│  │  │  + (하위추가)     │  │ │ 취소 │ 저장 │           │  │   │   │
│  │  │  🗑 (삭제)         │  │ └──────┴──────┘           │  │   │   │
│  │  └───────────────────┴──────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  lib/menuApi.ts: API 호출 (axios)                                   │
└────────────────────────┬─────────────────────────────────────────────┘
                         │ HTTP REST API
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Node.js + Express Server                          │
│                     http://localhost:3001                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  api/menuHandler.js (Public)                                        │
│  ├─ GET  /api/menus?type=user                                       │
│  └─ GET  /api/menus/utility/:type                                   │
│                                                                      │
│  api/menuAdminHandler.js (Admin - 세션 체크)                        │
│  ├─ GET    /api/admin/menus?type=user    (전체 조회)                │
│  ├─ GET    /api/admin/menus/:id          (상세 조회)                │
│  ├─ POST   /api/admin/menus              (메뉴 생성)                │
│  ├─ PUT    /api/admin/menus/:id          (메뉴 수정)                │
│  ├─ DELETE /api/admin/menus/:id          (메뉴 삭제)                │
│  └─ PUT    /api/admin/menus/reorder      (순서 변경)                │
│                                                                      │
│  보안 기능:                                                          │
│  ├─ checkAdminPermission(): 세션 기반 관리자 권한 체크              │
│  ├─ validateInput(): XSS/SQL Injection 방지                         │
│  └─ Parameterized Query: SQL Injection 완전 차단                    │
│                                                                      │
└────────────────────────┬─────────────────────────────────────────────┘
                         │ MySQL2 Connection
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      MySQL Database (egov)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  menus 테이블 (통합 메뉴)                                            │
│  ┌────┬───────────┬──────────┬─────────┬──────────┬────────────┐   │
│  │ id │ menu_type │ parent_id│ depth   │ menu_name│ menu_code  │   │
│  ├────┼───────────┼──────────┼─────────┼──────────┼────────────┤   │
│  │  1 │ user      │ NULL     │ 0       │마이페이지│ mypage     │   │
│  │  2 │ user      │ 1        │ 1       │회원정보  │mypage_prof │   │
│  │  3 │ user      │ 1        │ 1       │비번변경  │mypage_pwd  │   │
│  │  4 │ user      │ NULL     │ 0       │주문/배송 │ orders     │   │
│  │  5 │ user      │ 4        │ 1       │주문내역  │orders_list │   │
│  │  6 │ user      │ NULL     │ 0       │활동내역  │ activity   │   │
│  │ .. │ ...       │ ...      │ ...     │ ...      │ ...        │   │
│  └────┴───────────┴──────────┴─────────┴──────────┴────────────┘   │
│                                                                      │
│  user_groups (사용자 그룹)                                           │
│  ┌────┬────────────┬────────────┬──────────┐                        │
│  │ id │ group_name │ group_code │ priority │                        │
│  ├────┼────────────┼────────────┼──────────┤                        │
│  │  1 │ 전체 회원  │ all_members│    0     │                        │
│  │  2 │ 일반 회원  │ regular    │   10     │                        │
│  │  3 │ VIP 회원   │ vip        │   50     │                        │
│  └────┴────────────┴────────────┴──────────┘                        │
│                                                                      │
│  roles (역할)                                                        │
│  ┌────┬──────────────┬────────────┬──────────┬───────────┐          │
│  │ id │ role_name    │ role_code  │ priority │role_scope │          │
│  ├────┼──────────────┼────────────┼──────────┼───────────┤          │
│  │  1 │슈퍼관리자    │super_admin │   100    │ admin     │          │
│  │  2 │관리자        │admin       │    50    │ admin     │          │
│  │  3 │매니저        │manager     │    30    │ admin     │          │
│  └────┴──────────────┴────────────┴──────────┴───────────┘          │
│                                                                      │
│  menu_permissions (메뉴 권한)                                        │
│  user_group_members, user_roles (매핑 테이블)                        │
│  related_sites (관련 사이트 - 푸터용)                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 데이터 흐름도

### 1. 메뉴 조회 (Read)

```
Frontend                 Backend                    Database
   │                        │                           │
   │  GET /api/admin/menus  │                           │
   │  ?type=user            │                           │
   ├───────────────────────▶│                           │
   │                        │  checkAdminPermission()   │
   │                        │  (세션 체크)              │
   │                        │                           │
   │                        │  SELECT * FROM menus      │
   │                        │  WHERE menu_type='user'   │
   │                        │  AND is_deleted=0         │
   │                        ├──────────────────────────▶│
   │                        │                           │
   │                        │  [메뉴 데이터 배열]       │
   │                        │◀──────────────────────────┤
   │                        │                           │
   │  buildMenuTree()       │                           │
   │  (트리 구조 변환)       │                           │
   │◀───────────────────────┤                           │
   │                        │                           │
   │  MenuTree 렌더링       │                           │
   │  (좌측 패널)           │                           │
   │                        │                           │
```

### 2. 메뉴 생성 (Create)

```
Frontend                 Backend                    Database
   │                        │                           │
   │  사용자가 폼 입력      │                           │
   │  (메뉴명, 코드 등)     │                           │
   │                        │                           │
   │  POST /api/admin/menus │                           │
   │  { menu_name, ... }    │                           │
   ├───────────────────────▶│                           │
   │                        │  checkAdminPermission()   │
   │                        │                           │
   │                        │  validateInput()          │
   │                        │  (XSS, SQL Injection 체크)│
   │                        │                           │
   │                        │  INSERT INTO menus        │
   │                        │  VALUES (?, ?, ...)       │
   │                        ├──────────────────────────▶│
   │                        │                           │
   │                        │  { insertId: 123 }        │
   │                        │◀──────────────────────────┤
   │                        │                           │
   │  성공 메시지 표시      │                           │
   │  메뉴 목록 재조회      │                           │
   │◀───────────────────────┤                           │
   │                        │                           │
```

### 3. 메뉴 수정 (Update)

```
Frontend                 Backend                    Database
   │                        │                           │
   │  트리에서 메뉴 선택    │                           │
   │  폼에서 수정           │                           │
   │                        │                           │
   │  PUT /api/admin/menus/:id │                        │
   │  { menu_name, ... }    │                           │
   ├───────────────────────▶│                           │
   │                        │  checkAdminPermission()   │
   │                        │  validateInput()          │
   │                        │                           │
   │                        │  UPDATE menus SET ...     │
   │                        │  WHERE id=? AND           │
   │                        │  is_deleted=0             │
   │                        ├──────────────────────────▶│
   │                        │                           │
   │                        │  { affectedRows: 1 }      │
   │                        │◀──────────────────────────┤
   │                        │                           │
   │  성공 메시지           │                           │
   │  메뉴 목록 재조회      │                           │
   │◀───────────────────────┤                           │
```

### 4. 메뉴 삭제 (Soft Delete)

```
Frontend                 Backend                    Database
   │                        │                           │
   │  휴지통 아이콘 클릭    │                           │
   │  확인 다이얼로그       │                           │
   │                        │                           │
   │  DELETE /api/admin/menus/:id │                     │
   ├───────────────────────▶│                           │
   │                        │  checkAdminPermission()   │
   │                        │                           │
   │                        │  UPDATE menus             │
   │                        │  SET is_deleted=1         │
   │                        │  WHERE id=?               │
   │                        ├──────────────────────────▶│
   │                        │                           │
   │                        │  { affectedRows: 1 }      │
   │                        │◀──────────────────────────┤
   │                        │                           │
   │  성공 메시지           │                           │
   │  메뉴 목록 재조회      │                           │
   │  (삭제된 메뉴 제외)    │                           │
   │◀───────────────────────┤                           │
```

---

## 컴포넌트 관계도

```
App.tsx
  │
  ├─ Route: /admin/menus
  │   └─ MenuManager
  │       │
  │       ├─ useState (menus, selectedMenu, isLoading, error)
  │       │
  │       ├─ useEffect: loadMenus()
  │       │   └─ menuApi.getAllMenus('user')
  │       │
  │       ├─ buildMenuTree()
  │       │   └─ Flat array → Tree structure
  │       │
  │       ├─ MenuTree (좌측 50%)
  │       │   │
  │       │   ├─ Props:
  │       │   │   ├─ menus (트리 구조)
  │       │   │   ├─ selectedMenuId
  │       │   │   ├─ onSelectMenu
  │       │   │   ├─ onAddMenu
  │       │   │   └─ onDeleteMenu
  │       │   │
  │       │   └─ TreeNode (재귀 컴포넌트)
  │       │       ├─ 폴더/파일 아이콘
  │       │       ├─ 메뉴명 표시
  │       │       ├─ hover 시 액션 버튼
  │       │       └─ children 재귀 렌더링
  │       │
  │       └─ MenuForm (우측 50%)
  │           │
  │           ├─ Props:
  │           │   ├─ menu (선택된 메뉴 또는 null)
  │           │   ├─ parentMenuName
  │           │   ├─ onSave
  │           │   └─ onCancel
  │           │
  │           ├─ useState (formData, error, isSaving)
  │           │
  │           ├─ useEffect: menu → formData
  │           │
  │           ├─ 기본 정보 섹션
  │           ├─ 연동 설정 섹션
  │           ├─ 권한 설정 섹션
  │           ├─ 기타 설정 섹션
  │           └─ 액션 버튼 (취소/저장)
  │
  └─ Dialog (삭제 확인)
```

---

## 상태 관리 흐름

```
MenuManager 컴포넌트 상태:

┌──────────────────────────────────────┐
│ menus: Menu[]                        │  ← menuApi.getAllMenus()
│  (전체 메뉴 데이터, 트리 구조)         │
├──────────────────────────────────────┤
│ selectedMenu: Menu | null            │  ← 트리에서 선택
│  (현재 선택된 메뉴)                   │
├──────────────────────────────────────┤
│ isLoading: boolean                   │  ← API 호출 중
├──────────────────────────────────────┤
│ error: string | null                 │  ← 에러 메시지
├──────────────────────────────────────┤
│ successMessage: string | null        │  ← 성공 메시지
├──────────────────────────────────────┤
│ isAddMode: boolean                   │  ← 추가 모드 여부
├──────────────────────────────────────┤
│ parentId: number | null              │  ← 하위 메뉴 추가 시
├──────────────────────────────────────┤
│ deleteConfirmOpen: boolean           │  ← 삭제 확인 다이얼로그
└──────────────────────────────────────┘

MenuForm 컴포넌트 상태:

┌──────────────────────────────────────┐
│ formData: MenuFormData               │  ← 입력 데이터
│  ├─ menu_name                        │
│  ├─ menu_code                        │
│  ├─ link_type                        │
│  ├─ permission_type                  │
│  └─ ...                              │
├──────────────────────────────────────┤
│ error: string | null                 │  ← 폼 입력 에러
├──────────────────────────────────────┤
│ isSaving: boolean                    │  ← 저장 중
└──────────────────────────────────────┘
```

---

## 보안 계층

```
1. Frontend 입력 검증
   ├─ TypeScript 타입 체크
   ├─ 필수 필드 검증
   ├─ 메뉴 코드 패턴 검증 (^[a-zA-Z0-9_]+$)
   └─ 최대 길이 제한

2. Backend 입력 검증
   ├─ validateInput() 함수
   │   ├─ 타입 체크 (typeof === 'string')
   │   ├─ 빈 값 체크
   │   ├─ 길이 제한 체크
   │   └─ 위험한 문자 체크 (/<script|javascript:|onerror=/i)
   └─ Parameterized Query
       └─ SQL Injection 완전 차단

3. 세션 기반 인증
   ├─ checkAdminPermission(session)
   ├─ session.isLoggedIn
   └─ session.isAdmin

4. Soft Delete
   └─ 물리적 삭제 대신 is_deleted 플래그 사용
```

---

## 파일 트리

```
프로젝트/
│
├─ frontend/src/
│   ├─ types/
│   │   └─ menu.ts              (✅ 타입 정의)
│   ├─ lib/
│   │   └─ menuApi.ts           (✅ API 클라이언트)
│   ├─ components/
│   │   ├─ admin/menu/
│   │   │   ├─ MenuManager.tsx  (✅ 메인 컨테이너)
│   │   │   ├─ MenuTree.tsx     (✅ 트리 패널)
│   │   │   └─ MenuForm.tsx     (✅ 편집 폼)
│   │   └─ common/
│   │       └─ Sidebar.tsx      (✅ 메뉴 항목 추가)
│   └─ App.tsx                  (✅ 라우트 등록)
│
├─ middleware/node/
│   ├─ api/
│   │   ├─ menuHandler.js       (✅ 공개 API)
│   │   └─ menuAdminHandler.js  (✅ 관리자 API)
│   ├─ db/schema/
│   │   └─ menu_schema.sql      (✅ DB 스키마)
│   └─ server.js                (✅ 라우트 등록)
│
└─ 문서/
    ├─ MENU_SYSTEM_SUMMARY.md       (✅ 시스템 요약)
    ├─ MENU_SYSTEM_USER_GUIDE.md    (✅ 사용 가이드)
    ├─ MENU_SYSTEM_CHECKLIST.md     (✅ 테스트 체크리스트)
    └─ MENU_SYSTEM_ARCHITECTURE.md  (✅ 아키텍처 문서)
```

---

## 기술 스택

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 18.2 |
| | TypeScript | 4.x+ |
| | Material-UI | 5.x |
| | Axios | Latest |
| Backend | Node.js | 18+ |
| | Express | 4.19 |
| | MySQL2 | 3.x |
| Database | MySQL | 8.0+ |
| | Character Set | utf8mb4 |

---

## 결론

**완전하고 안전한 메뉴 관리 시스템**

- ✅ 계층 구조 (무한 depth)
- ✅ CRUD 완전 구현
- ✅ 보안 (SQL Injection, XSS 방지)
- ✅ 인증/인가 (세션 기반)
- ✅ 타입 안전성 (TypeScript)
- ✅ 한국형 관리자 UI
- ✅ MUI 테마 통합
- ✅ 에러 처리
- ✅ 즉시 사용 가능
