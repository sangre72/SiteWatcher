# 사용자 메뉴 관리 시스템 구축 완료

## 생성 완료 파일 목록

### 1. Database Schema
- `/middleware/node/db/schema/menu_schema.sql`
  - 통합 메뉴 테이블 (menus)
  - 사용자 그룹 테이블 (user_groups)
  - 사용자-그룹 매핑 (user_group_members)
  - 역할 테이블 (roles)
  - 사용자-역할 매핑 (user_roles)
  - 메뉴 권한 매핑 (menu_permissions)
  - 관련 사이트 테이블 (related_sites)
  - 기본 데이터 (그룹, 역할, user 타입 메뉴)

### 2. Backend API
- `/middleware/node/api/menuHandler.js`
  - 메뉴 트리 조회 (GET /api/menus?type=user)
  - 유틸리티 메뉴 조회 (GET /api/menus/utility/:utilityType)
  - 사이트맵 조회 (GET /api/menus/sitemap)
  - 권한 필터링 로직
  - 표시 조건 필터링 로직

- `/middleware/node/api/menuAdminHandler.js`
  - 전체 메뉴 조회 (GET /api/admin/menus)
  - 메뉴 상세 조회 (GET /api/admin/menus/:id)
  - 메뉴 생성 (POST /api/admin/menus)
  - 메뉴 수정 (PUT /api/admin/menus/:id)
  - 메뉴 삭제 (DELETE /api/admin/menus/:id)
  - 메뉴 순서 변경 (PUT /api/admin/menus/reorder)

- `/middleware/node/server.js` (라우트 추가)
  - Public 메뉴 API 라우트
  - Admin 메뉴 API 라우트

### 3. Frontend Types
- `/frontend/src/types/menu.ts`
  - MenuType, LinkType, PermissionType 등 타입 정의
  - Menu, UserGroup, Role, MenuPermission 인터페이스
  - MenuFormData 인터페이스

### 4. Frontend API Client
- `/frontend/src/lib/menuApi.ts`
  - menuApi: Public API 클라이언트
    - getMenuTree()
    - getHeaderUtility()
    - getFooterUtility()
    - getSitemap()
  - menuAdminApi: Admin API 클라이언트
    - getAllMenus()
    - getMenuById()
    - createMenu()
    - updateMenu()
    - deleteMenu()
    - reorderMenus()

### 5. Frontend Components
- `/frontend/src/components/admin/menu/MenuManager.tsx`
  - 메뉴 관리 메인 페이지
  - 탭으로 타입 전환 (user/site/admin/header_utility/footer_utility)
  - 메뉴 추가/수정/삭제 다이얼로그

- `/frontend/src/components/admin/menu/MenuTree.tsx`
  - 트리 구조 메뉴 렌더링
  - 계층 구조 표시 (들여쓰기)
  - 확장/축소 기능
  - 권한/링크타입/상태 표시 (Chip)
  - 수정/삭제 버튼

- `/frontend/src/components/admin/menu/MenuForm.tsx`
  - 메뉴 추가/수정 폼
  - 필드: 메뉴 이름, 코드, 설명, 아이콘, 링크 타입/URL
  - 권한 타입, 표시 조건, 정렬 순서
  - 활성화/표시 스위치

---

## 사용 방법

### 1. 데이터베이스 초기화

```bash
cd /Users/bumsuklee/PhpstormProjects/20240418-git-test-prototype-cms/middleware/node

# MySQL에 접속하여 스키마 실행
mysql -u dbuser -p egov < db/schema/menu_schema.sql
```

### 2. 서버 시작

```bash
# Backend 서버 시작
cd /Users/bumsuklee/PhpstormProjects/20240418-git-test-prototype-cms/middleware/node
npm start

# Frontend 서버 시작 (별도 터미널)
cd /Users/bumsuklee/PhpstormProjects/20240418-git-test-prototype-cms/frontend
npm start
```

### 3. 메뉴 관리 페이지 접속

관리자로 로그인 후:
- URL: http://localhost:4000/admin/menus

---

## 기본 생성된 메뉴 (USER 타입)

### 1차 메뉴
1. 마이페이지 (mypage)
2. 주문/배송 (orders)
3. 활동내역 (activity)
4. 고객지원 (my_support)

### 2차 메뉴 - 마이페이지
- 회원정보 수정 (mypage_profile) → /mypage/profile
- 비밀번호 변경 (mypage_password) → /mypage/password
- 회원등급/혜택 (mypage_grade) → /mypage/grade
- 회원탈퇴 (mypage_withdraw) → /mypage/withdraw

### 2차 메뉴 - 주문/배송
- 주문내역 (orders_list) → /mypage/orders
- 배송조회 (orders_delivery) → /mypage/delivery
- 취소/반품/교환 (orders_cancel) → /mypage/cancel

### 2차 메뉴 - 활동내역
- 찜목록 (activity_wishlist) → /mypage/wishlist
- 최근 본 상품 (activity_recent) → /mypage/recent
- 내가 쓴 글 (activity_posts) → /mypage/posts
- 포인트/쿠폰 (activity_point) → /mypage/point

### 2차 메뉴 - 고객지원
- 1:1 문의내역 (my_support_inquiry) → /mypage/inquiry
- 상품 Q&A (my_support_qna) → /mypage/qna

---

## API 엔드포인트 정리

### Public API (인증 불필요, 세션 기반 권한 필터링)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menus?type=user` | 사용자 메뉴 트리 조회 |
| GET | `/api/menus?type=site` | 사이트 메뉴 트리 조회 |
| GET | `/api/menus?type=admin` | 관리자 메뉴 트리 조회 |
| GET | `/api/menus/utility/header` | 헤더 유틸리티 메뉴 조회 |
| GET | `/api/menus/utility/footer` | 푸터 유틸리티 메뉴 조회 |
| GET | `/api/menus/sitemap` | 사이트맵 조회 |

### Admin API (관리자 전용)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/menus` | 전체 메뉴 조회 |
| GET | `/api/admin/menus?type=user` | 특정 타입 메뉴 조회 |
| GET | `/api/admin/menus/:id` | 메뉴 상세 조회 |
| POST | `/api/admin/menus` | 메뉴 생성 |
| PUT | `/api/admin/menus/:id` | 메뉴 수정 |
| DELETE | `/api/admin/menus/:id` | 메뉴 삭제 (Soft Delete) |
| PUT | `/api/admin/menus/reorder` | 메뉴 순서 변경 |

---

## 주요 기능

### 1. 트리 구조 메뉴
- 무한 depth 지원
- parent_id 기반 계층 구조
- depth, sort_order로 정렬

### 2. 권한 관리
- **permission_type**:
  - `public`: 모든 방문자
  - `member`: 로그인 회원
  - `admin`: 관리자
  - `groups`: 특정 그룹
  - `users`: 특정 사용자
  - `roles`: 특정 역할

### 3. 표시 조건 (유틸리티 메뉴용)
- **show_condition**:
  - `always`: 항상 표시
  - `logged_in`: 로그인 시만
  - `logged_out`: 로그아웃 시만
  - `custom`: 커스텀 조건식

### 4. 링크 타입
- **link_type**:
  - `url`: 일반 URL
  - `new_window`: 새 창 열기
  - `modal`: 모달 팝업
  - `external`: 외부 링크
  - `none`: 링크 없음 (폴더)

### 5. 보안 기능
- SQL Injection 방지 (Parameterized Query)
- XSS 방지 (입력값 검증)
- 관리자 권한 체크
- 세션 기반 권한 필터링

### 6. Soft Delete
- `is_deleted` 플래그로 삭제 처리
- 데이터 복구 가능
- 외래키 제약 조건 안전

---

## 다음 단계

### 1. 실제 페이지에서 메뉴 사용
```typescript
// 사용자 메뉴 표시 예시
import { menuApi } from '@/lib/menuApi';

const UserMenu = () => {
  const { data: menus } = useQuery({
    queryKey: ['userMenu'],
    queryFn: () => menuApi.getMenuTree('user')
  });

  return (
    <nav>
      {menus?.map(menu => (
        <MenuItem key={menu.id} menu={menu} />
      ))}
    </nav>
  );
};
```

### 2. 헤더/푸터에 유틸리티 메뉴 추가
```typescript
// 헤더 유틸리티 메뉴
const HeaderUtility = () => {
  const { data: menus } = useQuery({
    queryKey: ['headerUtility'],
    queryFn: () => menuApi.getHeaderUtility()
  });
  // ...
};
```

### 3. 추가 기능 구현
- 드래그 앤 드롭으로 순서 변경 (react-beautiful-dnd)
- 아이콘 선택기
- 메뉴 복사/붙여넣기
- 메뉴 일괄 수정
- 권한 관리 UI (그룹/역할 매핑)

---

## 테스트 체크리스트

- [ ] 데이터베이스 스키마 실행 확인
- [ ] Backend 서버 정상 시작
- [ ] Frontend 서버 정상 시작
- [ ] 메뉴 관리 페이지 접속 (관리자)
- [ ] 메뉴 추가 기능 테스트
- [ ] 메뉴 수정 기능 테스트
- [ ] 메뉴 삭제 기능 테스트
- [ ] 메뉴 순서 변경 테스트
- [ ] Public API 조회 테스트
- [ ] 권한 필터링 테스트

---

## 문제 해결

### 데이터베이스 연결 실패
```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# 환경 변수 확인
echo $MYSQL_HOST
echo $MYSQL_USER
```

### API 호출 실패 (CORS)
`middleware/node/server.js`에서 CORS 설정 확인:
```javascript
const whitelist = ['http://localhost:4000', 'http://localhost:3000'];
```

### 관리자 권한 없음
세션에 `isAdmin: true` 설정 필요 (로그인 시)

---

## 참고 자료

- 기존 패턴: `boardHandler.js`, `BoardManagement.tsx`
- MUI 컴포넌트: https://mui.com/
- React Query: https://tanstack.com/query/latest

---

생성 완료: 2026-01-02
타입: user (사용자 메뉴)
