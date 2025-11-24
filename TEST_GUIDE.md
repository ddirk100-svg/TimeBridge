# 🧪 TimeBridge 테스트 가이드

## 📋 사전 준비

### 1. 서버 시작
```bash
npm start
```

### 2. 브라우저 설정
- Chrome/Edge 브라우저 사용 권장
- 개발자 도구 열기: **F12** 또는 **Ctrl + Shift + I**
- Console 탭으로 이동

---

## ✅ 로그인/로그아웃 테스트

### Step 1: 페이지 로드 확인
1. `http://localhost:3000/home.html` 접속
2. 콘솔에서 다음 메시지 확인:
   ```
   🚀 Supabase 초기화 시작...
   ✅ Supabase 클라이언트 초기화 완료
   🔧 Auth.init() 시작
   🔍 Supabase 세션 확인 중...
   ```

### Step 2: 게스트 모드 확인
**콘솔 메시지:**
```
👤 로그인된 사용자 없음 (게스트 모드)
✅ Auth 초기화 완료
📱 홈 페이지 로드됨
🔄 updateUserInfoUI 호출됨
👤 현재 사용자: null
👤 게스트 모드 UI 적용
```

**UI 확인:**
- ✅ 우측 상단에 `[로그인]` 버튼만 표시
- ❌ 로그아웃, 프로필 버튼 없음

### Step 3: 로그인 테스트
1. 우측 상단 `[로그인]` 버튼 클릭
2. `login.html`로 이동
3. 이메일/비밀번호 입력 후 로그인
4. 로그인 성공 메시지 확인
5. `home.html`로 리다이렉트

### Step 4: 로그인 후 상태 확인
**콘솔 메시지:**
```
✅ 로그인된 사용자 발견: your-email@example.com
✅ Auth 초기화 완료
📱 홈 페이지 로드됨
🔄 updateUserInfoUI 호출됨
👤 현재 사용자: your-email@example.com
✅ 로그인 상태 UI 적용: {
  user: "your-email@example.com",
  loginBtn: "hidden",
  logoutBtn: "visible",
  profileBtn: "visible"
}
```

**UI 확인:**
- ❌ 로그인 버튼 없음
- ✅ `[로그아웃]` 버튼 표시 (빨간색)
- ✅ `[👤프로필]` 버튼 표시 (보라색)

### Step 5: 로그아웃 테스트
1. `[로그아웃]` 버튼 클릭
2. 확인 다이얼로그에서 "확인" 클릭
3. 콘솔에서 확인:
   ```
   🔄 Auth 상태 변경: SIGNED_OUT
   👤 사용자 로그아웃
   👤 게스트 모드 UI 적용
   ```
4. UI가 게스트 모드로 변경되었는지 확인

---

## ❌ 문제 해결

### 문제 1: "❌ Supabase 라이브러리가 로드되지 않았습니다"
**원인:** Supabase CDN이 로드되지 않음

**해결:**
1. 인터넷 연결 확인
2. HTML에서 CDN 링크 확인:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   ```
3. 브라우저 캐시 삭제 후 재시도

### 문제 2: "⚠️ Supabase 설정이 없습니다"
**원인:** `supabase-config.js`에 URL과 Key가 없음

**해결:**
1. `supabase-config.js` 열기
2. 5-7번째 줄 확인:
   ```javascript
   const SUPABASE_CONFIG = {
       url: 'https://your-project.supabase.co',
       anonKey: 'your-anon-key'
   };
   ```
3. Supabase 대시보드에서 올바른 값 복사

### 문제 3: 로그인 후에도 로그인 버튼이 표시됨
**원인:** Auth 초기화 실패 또는 세션 확인 실패

**디버깅 순서:**
1. 콘솔에서 에러 메시지 확인
2. `✅ Auth 초기화 완료` 메시지가 있는지 확인
3. `👤 현재 사용자: null` 인지 확인
4. 다음 명령어로 직접 확인:
   ```javascript
   // 콘솔에서 실행
   console.log('Auth:', auth);
   console.log('Current User:', auth.getCurrentUser());
   console.log('Supabase Client:', supabaseClient);
   ```

**해결:**
1. 브라우저 캐시 삭제: **Ctrl + Shift + Delete**
2. localStorage 초기화:
   ```javascript
   localStorage.clear();
   location.reload();
   ```
3. 시크릿 모드에서 테스트
4. Supabase 대시보드에서 세션 확인

### 문제 4: "Cannot read properties of undefined"
**원인:** 버튼 요소를 찾을 수 없음

**해결:**
1. HTML에서 버튼 ID 확인:
   - `id="loginBtn"`
   - `id="logoutBtnIcon"`
   - `id="profileBtn"`
2. 모두 존재하는지 확인

---

## 🎯 성공 기준

### ✅ 모든 테스트 통과 조건

- [ ] 페이지 로드 시 에러 없음
- [ ] 게스트 모드: 로그인 버튼만 표시
- [ ] 로그인 성공 후: 로그아웃 + 프로필 버튼 표시
- [ ] 로그아웃 후: 다시 로그인 버튼만 표시
- [ ] 콘솔에 ❌ 표시 없음

### 📊 체크리스트

**게스트 모드:**
```
✅ 🚀 Supabase 초기화 시작...
✅ ✅ Supabase 클라이언트 초기화 완료
✅ 👤 로그인된 사용자 없음 (게스트 모드)
✅ 📱 홈 페이지 로드됨
✅ 👤 게스트 모드 UI 적용
```

**로그인 후:**
```
✅ ✅ 로그인된 사용자 발견: user@email.com
✅ ✅ Auth 초기화 완료
✅ 📱 홈 페이지 로드됨
✅ ✅ 로그인 상태 UI 적용
```

---

## 📞 추가 도움

문제가 지속되면 다음 정보를 제공해주세요:

1. **콘솔 전체 로그** (스크린샷)
2. **브라우저 버전**
3. **발생 시점** (페이지 로드 직후? 로그인 후?)
4. **재현 단계**

---

**마지막 업데이트:** 2025-11-24
**버전:** 1.0.0

