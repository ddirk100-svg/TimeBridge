# TimeBridge 🌉

날짜 기반 일기 앱 - 당신의 소중한 순간을 기록하세요

## ✨ 주요 기능

- 📝 일기 작성, 수정, 삭제 (CRUD)
- 📷 이미지 업로드 (최대 3장)
- 🌤️ 날씨 정보 자동 저장 (Open-Meteo API)
- 🎭 기분 태그
- 🔍 필터링 (년도, 최저/최고 기온)
- 📱 반응형 디자인 (모바일/태블릿/데스크톱)
- 🎨 인스타그램 스타일 UI
- 💾 Supabase 백엔드 + localStorage fallback

## 🚀 배포 방법

### 1. Supabase 설정

1. [Supabase](https://supabase.com)에 가입하고 새 프로젝트 생성
2. SQL Editor에서 다음 테이블 생성:

```sql
create table diaries (
  id text primary key,
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

-- RLS (Row Level Security) 설정 - 모든 사용자 접근 허용
alter table diaries enable row level security;

create policy "Enable all access for everyone"
on diaries for all
using (true)
with check (true);
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

```
TimeBridge/
├── home.html              # 홈 페이지 (일기 목록)
├── new_entry.html         # 일기 작성/수정
├── view_entry.html        # 일기 상세 보기
├── style.css              # 스타일시트
├── app.js                 # 공통 유틸리티
├── home.js                # 홈 페이지 로직
├── new_entry.js           # 작성 페이지 로직
├── view_entry.js          # 상세 페이지 로직
├── supabase-config.js     # Supabase 설정
├── server.js              # Express 서버
├── package.json           # 의존성 관리
└── README.md              # 문서
```

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

## 📝 라이선스

MIT License

## 👤 개발자

TimeBridge Team

