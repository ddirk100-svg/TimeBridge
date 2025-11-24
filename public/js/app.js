/* ========================================
   TimeBridge - 공통 유틸리티 함수
   ======================================== */

// 로컬 스토리지 키
const STORAGE_KEY = 'timebridge_diaries';

// ========================================
// 게스트 닉네임 생성
// ========================================

function generateGuestNickname() {
    const adjectives = [
        '행복한', '즐거운', '신나는', '차분한', '활기찬',
        '조용한', '명랑한', '귀여운', '용감한', '똑똑한',
        '친절한', '재미있는', '멋진', '훌륭한', '사랑스러운',
        '반짝이는', '따뜻한', '시원한', '부지런한', '느긋한',
        '혼란스런', '당황한', '어리둥절한', '신비로운', '환상적인'
    ];
    
    const nouns = [
        '무지', '토끼', '고양이', '판다', '코알라',
        '펭귄', '여우', '사슴', '다람쥐', '햄스터',
        '병아리', '강아지', '곰돌이', '물고기', '나비',
        '별', '구름', '바람', '햇살', '달빛',
        '커피', '케이크', '쿠키', '마카롱', '도넛'
    ];
    
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return randomAdj + randomNoun;
}

// 게스트 닉네임 가져오기 또는 생성
function getGuestNickname() {
    let nickname = localStorage.getItem('guest_nickname');
    if (!nickname) {
        nickname = generateGuestNickname();
        localStorage.setItem('guest_nickname', nickname);
    }
    return nickname;
}

// 날짜 포맷 함수
const formatDate = {
    // "2024. 11. 23. 토요일" 형식
    full: (date) => {
        const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dayName = days[date.getDay()];
        return `${year}. ${month}. ${day}. ${dayName}`;
    },
    
    // "2025.05.25(일)" 형식 - 간단한 날짜 표시용
    simple: (date) => {
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dayShort = days[date.getDay()];
        return `${year}.${month}.${day}(${dayShort})`;
    },
    
    // "2024년 11월" 형식
    monthYear: (date) => {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        return `${year}년 ${month}월`;
    },
    
    // "토요일" 형식
    dayName: (date) => {
        const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        return days[date.getDay()];
    },
    
    // "23" 형식 (날짜만)
    dayOnly: (date) => {
        return String(date.getDate());
    },
    
    // "11월" 형식 (월만)
    monthShort: (date) => {
        const month = date.getMonth() + 1;
        return `${month}월`;
    },
    
    // "오후 6:24" 형식
    time: (date) => {
        const hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const period = hours >= 12 ? '오후' : '오전';
        const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
        return `${period} ${displayHours}:${minutes}`;
    },
    
    // ISO 형식 (저장용)
    iso: (date) => {
        return date.toISOString();
    }
};

// 로컬 스토리지 관리
const storage = {
    // 모든 일기 가져오기
    getAllDiaries: () => {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },
    
    // 일기 저장
    saveDiary: (diary) => {
        const diaries = storage.getAllDiaries();
        const index = diaries.findIndex(d => d.id === diary.id);
        
        if (index >= 0) {
            // 수정
            diaries[index] = diary;
        } else {
            // 새로 생성
            diaries.push(diary);
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(diaries));
        return diary;
    },
    
    // ID로 일기 가져오기
    getDiaryById: (id) => {
        const diaries = storage.getAllDiaries();
        return diaries.find(d => d.id === id);
    },
    
    // 일기 삭제
    deleteDiary: (id) => {
        const diaries = storage.getAllDiaries();
        const filtered = diaries.filter(d => d.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    },
    
    // 날짜별로 정렬된 일기 가져오기 (최신순)
    getSortedDiaries: () => {
        const diaries = storage.getAllDiaries();
        return diaries.sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    
    // 연도별 일기 가져오기
    getDiariesByYear: (year) => {
        const diaries = storage.getAllDiaries();
        return diaries.filter(d => {
            const diaryYear = new Date(d.date).getFullYear();
            return diaryYear === parseInt(year);
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }
};

// 일기 객체 생성
const createDiary = (data) => {
    return {
        id: data.id || `diary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: data.date || new Date().toISOString(),
        title: data.title || '',
        content: data.content || '',
        images: data.images || [], // Base64 이미지 배열
        mood: data.mood || null, // { emoji: '😊', text: '행복해요' }
        weather: data.weather || null, // 날씨 정보
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
};

// 이미지를 Base64로 변환
const imageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
};

// URL 파라미터 가져오기
const getUrlParam = (param) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
};

// 페이지 이동
const navigateTo = (page, params = {}) => {
    const queryString = Object.keys(params)
        .map(key => `${key}=${encodeURIComponent(params[key])}`)
        .join('&');
    
    window.location.href = queryString ? `${page}?${queryString}` : page;
};

// 확인 대화상자
const confirm = (message) => {
    return window.confirm(message);
};

// 알림 표시 (간단한 토스트)
const showToast = (message, duration = 2000) => {
    // 기존 토스트 제거
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // 새 토스트 생성
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // 애니메이션
    setTimeout(() => toast.classList.add('show'), 10);
    
    // 제거
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
};

// 텍스트 미리보기 (최대 길이 제한)
const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// 감정 목록
const MOODS = [
    { emoji: '😊', text: '행복해요' },
    { emoji: '🥰', text: '설레요' },
    { emoji: '😌', text: '평온해요' },
    { emoji: '😔', text: '우울해요' },
    { emoji: '😤', text: '화나요' },
    { emoji: '🤔', text: '생각이 많아요' }
];

// 연도 목록 생성 (최근 10년)
const getYearList = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 10; i++) {
        years.push(currentYear - i);
    }
    return years;
};

// HTML 이스케이프 (XSS 방지)
const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

// 디버그 로그 (개발 시에만)
const debug = (...args) => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('[TimeBridge]', ...args);
    }
};

