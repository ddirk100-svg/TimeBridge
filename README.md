# TimeBridge 🌉

날짜 기반 일기 앱 - 당신의 소중한 순간을 기록하세요

## 📁 프로젝트 구조

```
TimeBridge_2차/
├── config/                    # 설정 파일
│   └── supabase-config.js    # Supabase 클라이언트 설정
├── public/                    # 정적 파일
│   ├── css/
│   │   └── style.css         # 전역 스타일
│   ├── js/
│   │   ├── app.js            # 공통 유틸리티
│   │   ├── auth.js           # 인증 로직
│   │   ├── home.js           # 홈 페이지 로직
│   │   ├── new_entry.js      # 일기 작성 로직
│   │   ├── view_entry.js     # 일기 상세 로직
│   │   └── profile.js        # 프로필 로직
│   └── assets/
│       └── images/           # 이미지 파일
├── views/                     # HTML 페이지
│   ├── home.html             # 홈/목록 페이지
│   ├── login.html            # 로그인/회원가입
│   ├── new_entry.html        # 일기 작성/수정
│   ├── view_entry.html       # 일기 상세
│   └── profile.html          # 프로필/설정
├── server.js                  # Express 서버
├── package.json              # 의존성 관리
├── .gitignore               # Git 제외 파일
├── README.md                # 프로젝트 문서
└── TEST_GUIDE.md            # 테스트 가이드
```

## ✨ 주요 기능

- 🔐 **회원가입/로그인 시스템** (Supabase Auth)
- 👤 **사용자별 데이터 분리** (RLS 보안)
- 📝 일기 작성, 수정, 삭제 (CRUD)
- 📷 이미지 업로드 (최대 3장)
- 🌤️ 날씨 정보 자동 저장 (Open-Meteo API)
- 🎭 기분 태그
- 🔍 필터링 (년도, 최저/최고 기온)
- 📱 반응형 디자인 (모바일/태블릿/데스크톱)
- 🎨 인스타그램 스타일 UI
- 💾 Supabase 백엔드 + localStorage fallback
- 🎮 **게스트 모드** 지원

## 🚀 배포 방법

### 1. Supabase 설정

1. [Supabase](https://supabase.com)에 가입하고 새 프로젝트 생성
2. **Authentication 활성화**: Settings → Authentication → Providers → **Email** 활성화
3. (**선택**) 이메일 확인 비활성화: Settings → Authentication → Email Auth → **Confirm email** 끄기
4. SQL Editor에서 다음 테이블 생성:

```sql
-- 사용자 프로필 테이블 (선택사항)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 일기 테이블 (사용자별로 분리)
create table diaries (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  date timestamp with time zone not null,
  title text,
  content text not null,
  images text[],
  mood jsonb,
  weather jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 인덱스 생성
create index idx_diaries_date on diaries(date desc);
create index idx_diaries_user_id on diaries(user_id);

-- RLS (Row Level Security) 활성화
alter table profiles enable row level security;
alter table diaries enable row level security;

-- 프로필 정책: 사용자는 자신의 프로필만 조회/수정 가능
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- 일기 정책: 사용자는 자신의 일기만 조회/수정/삭제 가능
create policy "Users can view own diaries"
  on diaries for select
  using (auth.uid() = user_id);

create policy "Users can insert own diaries"
  on diaries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own diaries"
  on diaries for update
  using (auth.uid() = user_id);

create policy "Users can delete own diaries"
  on diaries for delete
  using (auth.uid() = user_id);

-- 게스트 사용자를 위한 정책 (user_id가 NULL인 경우)
create policy "Anyone can view guest diaries"
  on diaries for select
  using (user_id is null);

create policy "Anyone can insert guest diaries"
  on diaries for insert
  with check (user_id is null);

create policy "Anyone can update guest diaries"
  on diaries for update
  using (user_id is null);

create policy "Anyone can delete guest diaries"
  on diaries for delete
  using (user_id is null);
```

3. Project Settings > API에서 다음 정보 복사:
   - **Project URL**
   - **Project API keys** > `anon` `public` (Publishable key)

### 2. 로컬 설정

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 Supabase 정보 입력

# 개발 서버 실행
npm run dev
```

### 3. Render 배포

1. [Render](https://render.com)에 가입
2. "New +" > "Web Service" 선택
3. GitHub 저장소 연결
4. 설정:
   - **Name**: timebridge
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Environment Variables 추가:
   - `SUPABASE_URL`: Supabase Project URL
   - `SUPABASE_ANON_KEY`: Supabase Anon Key
   - `NODE_ENV`: production
6. "Create Web Service" 클릭

### 4. 프론트엔드 설정

배포 후 `supabase-config.js` 파일의 설정을 업데이트하거나, 
HTML 파일들에서 Supabase CDN을 통해 직접 설정:

```html
<!-- Supabase CDN -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="supabase-config.js"></script>
```

## 📁 프로젝트 구조

### 현재 구조 (v1.0)
```
TimeBridge/
├── *.html                 # HTML 페이지들 (루트)
├── *.js                   # JavaScript 파일들 (루트)
├── *.css                  # 스타일시트 (루트)
├── server.js              # Express 서버
├── package.json           # 의존성 관리
└── README.md              # 문서
```

### 향후 구조 (v2.0 계획)
```
TimeBridge/
├── public/                # 정적 파일
│   ├── css/
│   │   ├── style.css      # 메인 스타일
│   │   ├── auth.css       # 인증 관련 스타일
│   │   └── components/    # 컴포넌트별 스타일
│   ├── js/
│   │   ├── core/          # 핵심 로직
│   │   │   ├── app.js
│   │   │   ├── auth.js
│   │   │   └── supabase-config.js
│   │   ├── pages/         # 페이지별 로직
│   │   │   ├── home.js
│   │   │   ├── new_entry.js
│   │   │   ├── view_entry.js
│   │   │   └── profile.js
│   │   └── utils/         # 유틸리티
│   │       ├── date.js
│   │       ├── weather.js
│   │       └── storage.js
│   └── assets/            # 이미지, 폰트 등
├── pages/                 # HTML 페이지
│   ├── index.html
│   ├── login.html
│   ├── home.html
│   ├── new_entry.html
│   ├── view_entry.html
│   └── profile.html
├── server.js              # Express 서버
├── package.json           # 의존성 관리
└── README.md              # 문서
```

### 주요 파일 설명
- **auth.js**: 🔐 Supabase 인증 관리 (로그인, 로그아웃, 세션)
- **supabase-config.js**: ☁️ Supabase 클라이언트 초기화 및 데이터 CRUD
- **app.js**: 🛠️ 공통 유틸리티 (날짜 포맷, 토스트, localStorage)
- **home.js**: 🏠 홈 페이지 (일기 목록, 필터, 뷰 전환)
- **profile.js**: 👤 프로필 페이지 (통계, 설정, 데이터 백업)

## 🛠️ 기술 스택

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Swiper.js (이미지 슬라이더)
- Open-Meteo API (날씨 정보)

### Backend
- Node.js + Express
- Supabase (PostgreSQL)
- Render (호스팅)

## 📱 반응형 브레이크포인트

- 모바일: ~ 375px
- 태블릿: 376px ~ 768px
- 데스크톱: 769px ~ 1199px
- 대형 데스크톱: 1200px ~

## 🎨 디자인 컨셉

- Notion + Between + Time Capsule 감성
- 미니멀하고 감성적인 UI
- 카드 기반 레이아웃
- 부드러운 애니메이션

## 🧪 테스트 및 디버깅

### 로컬 테스트
```bash
npm install
npm start
```
브라우저에서 `http://localhost:3000` 접속

### 회원가입/로그인 테스트
1. **브라우저 콘솔 열기** (F12) - 디버깅 로그 확인
2. `login.html`에서 회원가입
3. 이메일/비밀번호 입력 (Supabase 설정에 따라 이메일 확인 필요)
4. 로그인 후 콘솔에서 다음 확인:
   ```
   ✅ Auth 초기화 완료
   ✅ 로그인된 사용자 발견: your-email@example.com
   ✅ 로그인 상태 UI 적용
   ```
5. `home.html` 우측 상단에 `[로그아웃]` + `[👤프로필]` 버튼 확인
6. 일기 작성 후 Supabase 대시보드에서 데이터 확인
7. 다른 계정으로 로그인하면 다른 데이터만 보이는지 확인

### 게스트 모드 테스트
1. `login.html`에서 "게스트로 시작하기" 클릭
2. 콘솔에서 다음 확인:
   ```
   👤 로그인된 사용자 없음 (게스트 모드)
   👤 게스트 모드 UI 적용
   ```
3. 로그인 없이 일기 작성/조회 가능 (localStorage 사용)
4. `home.html` 우측 상단에 `[로그인]` 버튼만 표시 확인

### 문제 해결 (Troubleshooting)

#### 로그인 후에도 로그인 버튼이 표시되는 경우
1. **브라우저 콘솔 확인**:
   - `❌` 표시가 있는지 확인
   - `Auth 초기화 완료` 메시지가 있는지 확인
   - `현재 사용자: null` 인지 확인

2. **Supabase 설정 확인**:
   - `supabase-config.js`에 올바른 URL과 Anon Key가 입력되었는지 확인
   - Supabase 대시보드에서 Email Auth가 활성화되었는지 확인

3. **캐시 삭제**:
   - Ctrl + Shift + Delete → 캐시 삭제
   - 시크릿 모드로 테스트

4. **localStorage 확인**:
   - 콘솔에서 `localStorage.clear()` 실행
   - 페이지 새로고침

### 주의사항
- **데이터베이스 스키마**: Supabase에서 SQL 쿼리를 먼저 실행해야 합니다
- **RLS 정책**: Row Level Security가 활성화되어 있어야 사용자별 데이터 분리가 작동합니다
- **Email Auth**: Supabase에서 Email Provider를 활성화해야 합니다
- **콘솔 로그**: 문제 발생 시 브라우저 콘솔의 로그를 확인하세요

## 📝 라이선스

MIT License

## 👤 개발자

TimeBridge Team

