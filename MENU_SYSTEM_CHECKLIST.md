# User 메뉴 관리 시스템 체크리스트

## 시스템 구성 요소 확인

### 1. 데이터베이스

- [x] **스키마 파일 존재**: `middleware/node/db/schema/menu_schema.sql`
- [ ] **테이블 생성 완료**: `menus`, `user_groups`, `roles` 등
- [ ] **기본 데이터 INSERT 완료**: user 타입 메뉴 4개 + 하위 메뉴

**확인 명령어**:
```bash
mysql -u dbuser -p egov -e "
SELECT COUNT(*) as menu_count
FROM menus
WHERE menu_type = 'user' AND is_deleted = 0;
"
```

**예상 결과**: `menu_count: 16` (4개 1차 메뉴 + 12개 2차 메뉴)

---

### 2. Backend (Node.js)

#### 파일 존재 확인

- [x] `middleware/node/api/menuHandler.js` - 공개 API
- [x] `middleware/node/api/menuAdminHandler.js` - 관리자 API
- [x] `middleware/node/server.js` - 라우트 등록

#### 라우트 등록 확인

**파일**: `middleware/node/server.js`

```javascript
// 213-214줄
const { getMenuTree, getUtilityMenu, getSitemap } = require('./api/menuHandler');
const { getAllMenus, getMenuById, createMenu, updateMenu, deleteMenu, reorderMenus } = require('./api/menuAdminHandler');

// 257-267줄
app.get('/api/menus', getMenuTree);
app.get('/api/menus/utility/:utilityType', getUtilityMenu);
app.get('/api/menus/sitemap', getSitemap);

app.get('/api/admin/menus', getAllMenus);
app.get('/api/admin/menus/:id', getMenuById);
app.post('/api/admin/menus', createMenu);
app.put('/api/admin/menus/:id', updateMenu);
app.delete('/api/admin/menus/:id', deleteMenu);
app.put('/api/admin/menus/reorder', reorderMenus);
```

- [x] Public API 라우트 등록
- [x] Admin API 라우트 등록

#### 서버 시작 테스트

```bash
cd middleware/node
node server.js
```

**확인 메시지**:
```
[Menu Admin MySQL] Successfully connected to the database.
[Menu Public MySQL] Successfully connected to the database.
Server is running on port 3001
```

- [ ] MySQL 연결 성공
- [ ] 포트 3001에서 서버 실행

---

### 3. Frontend (React)

#### 파일 존재 확인

- [x] `frontend/src/types/menu.ts` - 타입 정의
- [x] `frontend/src/lib/menuApi.ts` - API 클라이언트
- [x] `frontend/src/components/admin/menu/MenuManager.tsx` - 메인 컨테이너
- [x] `frontend/src/components/admin/menu/MenuTree.tsx` - 트리 패널
- [x] `frontend/src/components/admin/menu/MenuForm.tsx` - 편집 폼

#### 라우트 등록 확인

**파일**: `frontend/src/App.tsx`

```typescript
// 29줄
import MenuManager from './components/admin/menu/MenuManager';

// 270-272줄
<Route
  path="/admin/menus"
  element={<TabComponent name="admin_menus" component={<MenuManager />} />}
/>
```

- [x] MenuManager 컴포넌트 import
- [x] /admin/menus 라우트 등록

#### Sidebar 메뉴 확인

**파일**: `frontend/src/components/common/Sidebar.tsx`

```typescript
// 56줄
{ name: 'admin_menus', path: '/admin/menus', icon: <MenuIcon />, label: '메뉴관리', category: 'admin' }
```

- [x] Sidebar에 메뉴관리 항목 추가

#### 프론트엔드 시작 테스트

```bash
cd frontend
npm start
```

**확인**:
- [ ] http://localhost:4000 접속 가능
- [ ] Sidebar에서 "Admin > 메뉴관리" 메뉴 보임

---

## 기능 테스트

### 1. 메뉴 조회

#### 1.1 Backend API 테스트 (curl)

```bash
# Public API: user 타입 메뉴 조회
curl -X GET 'http://localhost:3001/api/menus?type=user' \
  -H 'Content-Type: application/json'
```

**예상 응답**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "menu_type": "user",
      "menu_name": "마이페이지",
      "menu_code": "mypage",
      ...
    }
  ]
}
```

- [ ] 응답 성공 (success: true)
- [ ] data 배열에 메뉴 데이터 존재

#### 1.2 Admin API 테스트 (세션 필요)

**참고**: 현재는 세션 체크로 인해 403 에러가 발생할 수 있습니다.

```bash
# 세션 쿠키 포함 요청
curl -X GET 'http://localhost:3001/api/admin/menus?type=user' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: JSESSIONID=...'
```

**예상 에러** (세션 없을 경우):
```json
{
  "success": false,
  "error_code": "ACCESS_DENIED",
  "message": "관리자 권한이 필요합니다."
}
```

**임시 해결**: `menuAdminHandler.js`의 `checkAdminPermission` 함수 수정
```javascript
const checkAdminPermission = (session) => {
  return true; // 개발 환경 임시
};
```

---

### 2. Frontend UI 테스트

#### 2.1 메뉴 관리 페이지 접속

1. [ ] http://localhost:4000 접속
2. [ ] 좌측 Sidebar에서 "Admin" 펼치기
3. [ ] "메뉴관리" 클릭
4. [ ] URL이 `/admin/menus`로 변경
5. [ ] 화면에 "사용자 메뉴 관리" 헤더 보임

#### 2.2 좌측 트리 확인

- [ ] 좌측 패널에 "메뉴 구조" 헤더
- [ ] 최상위 메뉴 4개 표시:
  - 마이페이지 (폴더 아이콘)
  - 주문/배송 (폴더 아이콘)
  - 활동내역 (폴더 아이콘)
  - 고객지원 (폴더 아이콘)
- [ ] 폴더 아이콘 클릭 시 하위 메뉴 펼침/접힘
- [ ] 메뉴 hover 시 + (초록) / 휴지통 (빨강) 아이콘 표시

#### 2.3 우측 폼 확인

- [ ] 초기 상태: "메뉴를 선택하거나 추가해주세요" 메시지
- [ ] 트리에서 메뉴 선택 시 우측에 폼 표시
- [ ] 폼 섹션:
  - 기본 정보 (메뉴명, 메뉴 코드, 설명, 아이콘)
  - 연동 설정 (연동 타입, 링크 URL)
  - 권한 설정 (권한 타입, 표시 조건)
  - 기타 설정 (정렬 순서, 표시/활성화 스위치)
- [ ] 하단 버튼: 취소 / 저장

---

### 3. 기능 동작 테스트

#### 3.1 메뉴 선택 및 수정

1. [ ] 좌측 트리에서 "마이페이지" 클릭
2. [ ] 우측 폼에 메뉴 정보 로딩
3. [ ] "메뉴명"을 "마이페이지 (수정)"로 변경
4. [ ] "저장" 버튼 클릭
5. [ ] 성공 메시지 표시: "메뉴가 수정되었습니다."
6. [ ] 좌측 트리에서 메뉴명 변경 확인

#### 3.2 최상위 메뉴 추가

1. [ ] 좌측 트리 헤더의 **+** 버튼 클릭
2. [ ] 우측 폼 헤더: "메뉴 추가"
3. [ ] 폼 입력:
   - 메뉴명: "테스트 메뉴"
   - 메뉴 코드: "test_menu"
   - 연동 타입: URL
   - 링크 URL: "/test"
4. [ ] "저장" 버튼 클릭
5. [ ] 성공 메시지: "메뉴가 추가되었습니다."
6. [ ] 좌측 트리에 "테스트 메뉴" 추가 확인

#### 3.3 하위 메뉴 추가

1. [ ] 좌측 트리에서 "마이페이지" hover
2. [ ] 초록색 **+** 아이콘 클릭
3. [ ] 우측 폼 헤더: "메뉴 추가"
4. [ ] 상위 메뉴 표시: "상위 메뉴: 마이페이지"
5. [ ] 폼 입력:
   - 메뉴명: "새 하위 메뉴"
   - 메뉴 코드: "mypage_new"
6. [ ] "저장" 버튼 클릭
7. [ ] 성공 메시지 확인
8. [ ] "마이페이지" 펼쳤을 때 "새 하위 메뉴" 표시 확인

#### 3.4 메뉴 삭제

1. [ ] 좌측 트리에서 "새 하위 메뉴" hover
2. [ ] 빨간색 휴지통 아이콘 클릭
3. [ ] 삭제 확인 다이얼로그 표시
4. [ ] "삭제" 버튼 클릭
5. [ ] 성공 메시지: "메뉴가 삭제되었습니다."
6. [ ] 좌측 트리에서 "새 하위 메뉴" 사라짐 확인

#### 3.5 입력 검증 테스트

1. [ ] 상단 "메뉴 추가" 버튼 클릭
2. [ ] 메뉴 코드에 "test menu" (공백 포함) 입력
3. [ ] "저장" 버튼 클릭
4. [ ] 에러 메시지: "메뉴 코드는 영문, 숫자, 언더스코어(_)만 사용할 수 있습니다."

---

### 4. 에러 처리 테스트

#### 4.1 네트워크 에러

1. [ ] Backend 서버 중지
2. [ ] 프론트엔드에서 메뉴 저장 시도
3. [ ] 에러 메시지 표시

#### 4.2 중복 메뉴 코드

1. [ ] 메뉴 추가 시 기존 메뉴 코드(예: "mypage") 입력
2. [ ] "저장" 클릭
3. [ ] 에러 메시지: "이미 존재하는 메뉴 코드입니다."

---

## 최종 체크

### Backend

- [ ] 서버 정상 실행 (port 3001)
- [ ] MySQL 연결 성공
- [ ] API 엔드포인트 응답 정상
- [ ] 입력 검증 동작
- [ ] 에러 핸들링 동작

### Frontend

- [ ] React 앱 정상 실행 (port 4000)
- [ ] /admin/menus 라우트 접근 가능
- [ ] Sidebar 메뉴 표시
- [ ] 좌측 트리 렌더링
- [ ] 우측 폼 렌더링
- [ ] MUI 테마 색상 적용

### 기능

- [ ] 메뉴 조회
- [ ] 메뉴 선택
- [ ] 메뉴 생성 (최상위)
- [ ] 메뉴 생성 (하위)
- [ ] 메뉴 수정
- [ ] 메뉴 삭제
- [ ] 입력 검증
- [ ] 에러 처리

### UI/UX

- [ ] 트리 아이템 높이 28px
- [ ] 폴더/파일 아이콘 구분
- [ ] hover 시 액션 버튼 표시
- [ ] 선택 시 좌측 파란 테두리
- [ ] 50:50 레이아웃 (트리:폼)
- [ ] 성공/에러 메시지 표시

---

## 권한 테스트 (선택)

### 세션 설정 후 테스트

**방법 1**: `menuAdminHandler.js` 수정
```javascript
const checkAdminPermission = (session) => {
  return true;
};
```

**방법 2**: 로그인 후 테스트
1. [ ] /login 접속
2. [ ] 로그인 성공 시 세션에 isAdmin=true 설정
3. [ ] /admin/menus 접속
4. [ ] 정상 동작 확인

---

## 문제 해결

### 403 에러

**증상**: "관리자 권한이 필요합니다."

**해결**:
1. `menuAdminHandler.js`의 `checkAdminPermission` 수정
2. 또는 로그인 API에서 세션 설정

### 빈 트리

**증상**: 좌측 트리에 "메뉴가 없습니다" 표시

**확인**:
```sql
SELECT * FROM menus WHERE menu_type = 'user' AND is_deleted = 0;
```

**해결**: `menu_schema.sql` 재실행

### CORS 에러

**증상**: 브라우저 콘솔에 CORS 에러

**확인**: `server.js`의 whitelist에 `http://localhost:4000` 포함 여부

---

## 완료

모든 체크리스트를 통과했다면 user 타입 메뉴 관리 시스템이 정상적으로 작동합니다.

다음 단계:
1. 실제 세션 인증 연동
2. site, admin 타입 메뉴 시스템 추가
3. 드래그 앤 드롭 순서 변경 구현
4. 메뉴 권한 상세 설정 UI 추가
