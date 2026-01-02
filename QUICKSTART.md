# User 메뉴 관리 시스템 - 빠른 시작

## 3분 만에 시작하기

### 1단계: DB 설정 (30초)

```bash
mysql -u dbuser -p egov < middleware/node/db/schema/menu_schema.sql
```

**확인**:
```bash
mysql -u dbuser -p egov -e "SELECT COUNT(*) FROM menus WHERE menu_type='user';"
```
예상 결과: 16개

---

### 2단계: Backend 시작 (30초)

```bash
cd middleware/node
node server.js
```

**확인 메시지**:
```
[Menu Admin MySQL] Successfully connected to the database.
Server is running on port 3001
```

---

### 3단계: Frontend 시작 (30초)

새 터미널에서:
```bash
cd frontend
npm start
```

브라우저 자동 실행: http://localhost:4000

---

### 4단계: 개발 환경 권한 설정 (60초)

**파일**: `middleware/node/api/menuAdminHandler.js`

51-56줄을 찾아서:
```javascript
const checkAdminPermission = (session) => {
  if (!session || !session.isLoggedIn || !session.isAdmin) {
    return false;
  }
  return true;
};
```

아래와 같이 수정:
```javascript
const checkAdminPermission = (session) => {
  return true; // 개발 환경 임시
};
```

Backend 재시작:
```bash
# Ctrl+C로 중지 후
node server.js
```

---

### 5단계: 메뉴 관리 시작 (30초)

1. http://localhost:4000 접속
2. 좌측 Sidebar > **Admin** 펼치기
3. **메뉴관리** 클릭
4. 완료! 🎉

---

## 기본 메뉴 확인

좌측 트리에 다음 메뉴들이 표시됩니다:

```
📁 마이페이지
   📄 회원정보 수정
   📄 비밀번호 변경
   📄 회원등급/혜택
   📄 회원탈퇴

📁 주문/배송
   📄 주문내역
   📄 배송조회
   📄 취소/반품/교환

📁 활동내역
   📄 찜목록
   📄 최근 본 상품
   📄 내가 쓴 글
   📄 포인트/쿠폰

📁 고객지원
   📄 1:1 문의내역
   📄 상품 Q&A
```

---

## 기본 사용법

### 메뉴 선택
- 좌측 트리에서 메뉴 클릭 → 우측에 폼 표시

### 메뉴 수정
1. 좌측 트리에서 메뉴 선택
2. 우측 폼에서 정보 수정
3. **저장** 버튼 클릭

### 최상위 메뉴 추가
1. 좌측 트리 헤더의 **+** 버튼 클릭
2. 우측 폼에 정보 입력
3. **저장** 클릭

### 하위 메뉴 추가
1. 좌측 트리에서 부모 메뉴 **hover**
2. 초록색 **+** 아이콘 클릭
3. 폼 입력 후 **저장**

### 메뉴 삭제
1. 좌측 트리에서 메뉴 **hover**
2. 빨간색 **휴지통** 아이콘 클릭
3. 확인 다이얼로그에서 **삭제** 클릭

---

## 문제 해결

### "관리자 권한이 필요합니다" 에러
→ 4단계의 권한 설정 확인

### 빈 트리 (메뉴가 없습니다)
→ 1단계의 DB 스키마 실행 확인

### CORS 에러
→ `server.js`의 whitelist에 `http://localhost:4000` 있는지 확인

---

## 상세 문서

- **전체 가이드**: `MENU_SYSTEM_USER_GUIDE.md`
- **시스템 요약**: `MENU_SYSTEM_SUMMARY.md`
- **테스트 체크리스트**: `MENU_SYSTEM_CHECKLIST.md`
- **아키텍처**: `MENU_SYSTEM_ARCHITECTURE.md`

---

## 지금 바로 시작하세요!

```bash
# 한 번에 실행 (3개 터미널 필요)
# Terminal 1: DB 설정
mysql -u dbuser -p egov < middleware/node/db/schema/menu_schema.sql

# Terminal 2: Backend
cd middleware/node && node server.js

# Terminal 3: Frontend
cd frontend && npm start
```

그리고 `menuAdminHandler.js`의 권한 체크만 임시로 수정하면 끝!
