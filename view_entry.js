/* ========================================
   view_entry.html - 일기 상세 보기 페이지 (카드 스타일)
   ======================================== */

let currentDiary = null;

// 날씨 아이콘 맵핑
const WEATHER_ICONS = {
    'sunny': '☀️',
    'cloudy': '☁️',
    'rainy': '🌧️',
    'snowy': '❄️',
    'windy': '💨',
    'storm': '⛈️',
    'foggy': '🌫️',
    'partlyCloudy': '⛅'
};

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    debug('일기 상세 페이지 로드됨');
    
    // URL에서 일기 ID 가져오기
    const diaryId = getUrlParam('id');
    
    if (!diaryId) {
        showToast('일기를 찾을 수 없습니다');
        navigateTo('home.html');
        return;
    }
    
    // 일기 불러오기
    loadDiary(diaryId);
    
    // 이벤트 리스너 설정
    setupEventListeners();
});

// 일기 불러오기
async function loadDiary(id) {
    // Supabase에서 가져오기
    if (supabaseClient) {
        currentDiary = await supabaseStorage.getDiaryById(id);
    } else {
        currentDiary = storage.getDiaryById(id);
    }
    
    if (!currentDiary) {
        showToast('일기를 찾을 수 없습니다');
        navigateTo('home.html');
        return;
    }
    
    debug('일기 로드됨:', currentDiary);
    
    // 페이지 렌더링
    renderDiary();
}

// 일기 렌더링
function renderDiary() {
    if (!currentDiary) return;
    
    const date = new Date(currentDiary.date);
    
    // 이미지 섹션
    renderImageSection();
    
    // 카드 컨텐츠
    renderCardContent(date);
}

// 이미지 섹션 렌더링
function renderImageSection() {
    const imageSection = document.querySelector('.view-image-section-card');
    if (!imageSection) return;
    
    const images = currentDiary.images || [];
    
    if (images.length === 0) {
        // 이미지가 없으면 기본 이미지 또는 숨김
        imageSection.innerHTML = `
            <div class="no-image-placeholder">
                <div class="no-image-icon">📷</div>
            </div>
        `;
        return;
    }
    
    imageSection.style.display = 'block';
    
    // Swiper 슬라이더 HTML 생성
    imageSection.innerHTML = `
        <div class="swiper diary-swiper">
            <div class="swiper-wrapper">
                ${images.map((img, index) => `
                    <div class="swiper-slide">
                        <img src="${img}" alt="일기 사진 ${index + 1}" class="diary-image">
                    </div>
                `).join('')}
            </div>
            ${images.length > 1 ? `
                <div class="swiper-button-prev"></div>
                <div class="swiper-button-next"></div>
                <div class="swiper-pagination"></div>
            ` : ''}
        </div>
    `;
    
    // Swiper 초기화
    if (images.length > 1) {
        setTimeout(() => {
            const swiper = new Swiper('.diary-swiper', {
                slidesPerView: 1,
                spaceBetween: 0,
                loop: false,
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                    hideOnClick: false,
                },
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                    dynamicBullets: false,
                },
                keyboard: {
                    enabled: true,
                },
                grabCursor: true,
                threshold: 10,
                speed: 350,
                on: {
                    reachBeginning: function () {
                        this.navigation.prevEl.style.opacity = '0';
                        this.navigation.prevEl.style.pointerEvents = 'none';
                    },
                    reachEnd: function () {
                        this.navigation.nextEl.style.opacity = '0';
                        this.navigation.nextEl.style.pointerEvents = 'none';
                    },
                    fromEdge: function () {
                        this.navigation.prevEl.style.opacity = '1';
                        this.navigation.prevEl.style.pointerEvents = 'auto';
                        this.navigation.nextEl.style.opacity = '1';
                        this.navigation.nextEl.style.pointerEvents = 'auto';
                    },
                    slideChange: function () {
                        if (this.isBeginning) {
                            this.navigation.prevEl.style.opacity = '0';
                            this.navigation.prevEl.style.pointerEvents = 'none';
                            this.navigation.nextEl.style.opacity = '1';
                            this.navigation.nextEl.style.pointerEvents = 'auto';
                        } else if (this.isEnd) {
                            this.navigation.nextEl.style.opacity = '0';
                            this.navigation.nextEl.style.pointerEvents = 'none';
                            this.navigation.prevEl.style.opacity = '1';
                            this.navigation.prevEl.style.pointerEvents = 'auto';
                        } else {
                            this.navigation.prevEl.style.opacity = '1';
                            this.navigation.prevEl.style.pointerEvents = 'auto';
                            this.navigation.nextEl.style.opacity = '1';
                            this.navigation.nextEl.style.pointerEvents = 'auto';
                        }
                    }
                }
            });
        }, 10);
    }
}

// 카드 컨텐츠 렌더링
async function renderCardContent(date) {
    const createdDate = new Date(currentDiary.createdAt);
    
    // 작성일
    const entryDate = document.querySelector('.entry-date');
    if (entryDate) {
        const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        entryDate.textContent = `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()} / ${date.getFullYear()}`;
    }
    
    // 타이틀
    const entryTitle = document.querySelector('.entry-title');
    if (entryTitle) {
        const content = currentDiary.text || currentDiary.content || '';
        entryTitle.textContent = currentDiary.title || getFirstLine(content);
    }
    
    // 날씨 - API에서 가져오기
    const entryWeather = document.querySelector('.entry-weather');
    if (entryWeather) {
        try {
            const weatherData = await fetchWeatherData(date);
            const weatherIcon = currentDiary.weather ? WEATHER_ICONS[currentDiary.weather] : getWeatherIcon(weatherData.condition);
            
            entryWeather.innerHTML = `
                <div class="weather-icon">${weatherIcon}</div>
                <div class="weather-temp">
                    <div class="weather-temp-row">
                        <span class="temp-label">최고</span>
                        <span class="temp-value">${weatherData.maxTemp}°C</span>
                    </div>
                    <div class="weather-temp-row">
                        <span class="temp-label">최저</span>
                        <span class="temp-value">${weatherData.minTemp}°C</span>
                    </div>
                </div>
            `;
        } catch (error) {
            debug('날씨 정보 가져오기 실패:', error);
            const weatherIcon = currentDiary.weather ? WEATHER_ICONS[currentDiary.weather] : WEATHER_ICONS.partlyCloudy;
            entryWeather.innerHTML = `<div class="weather-icon">${weatherIcon}</div>`;
        }
    }
    
    // 일기 내용
    const entryText = document.querySelector('.entry-text');
    if (entryText) {
        entryText.textContent = currentDiary.text || currentDiary.content || '';
    }
    
    // 작성 시간
    const entryTimestamp = document.querySelector('.entry-timestamp');
    if (entryTimestamp) {
        entryTimestamp.textContent = `${formatDate.time(createdDate)}에 작성됨`;
    }
}

// 날씨 데이터 가져오기 (Open-Meteo API 사용 - 무료, 인증 불필요)
async function fetchWeatherData(date) {
    // 서울 좌표
    const latitude = 37.5665;
    const longitude = 126.9780;
    
    const dateStr = date.toISOString().split('T')[0];
    
    try {
        const response = await fetch(
            `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${dateStr}&end_date=${dateStr}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Asia/Seoul`
        );
        
        if (!response.ok) throw new Error('날씨 API 오류');
        
        const data = await response.json();
        
        return {
            maxTemp: Math.round(data.daily.temperature_2m_max[0]),
            minTemp: Math.round(data.daily.temperature_2m_min[0]),
            condition: getWeatherConditionFromCode(data.daily.weathercode[0])
        };
    } catch (error) {
        debug('날씨 API 에러:', error);
        // 기본값 반환
        return {
            maxTemp: 25,
            minTemp: 15,
            condition: 'partlyCloudy'
        };
    }
}

// WMO 날씨 코드를 조건으로 변환
function getWeatherConditionFromCode(code) {
    if (code === 0) return 'sunny';
    if (code >= 1 && code <= 3) return 'partlyCloudy';
    if (code >= 45 && code <= 48) return 'foggy';
    if (code >= 51 && code <= 67) return 'rainy';
    if (code >= 71 && code <= 77) return 'snowy';
    if (code >= 80 && code <= 82) return 'rainy';
    if (code >= 85 && code <= 86) return 'snowy';
    if (code >= 95 && code <= 99) return 'storm';
    return 'cloudy';
}

// 날씨 조건에서 아이콘 가져오기
function getWeatherIcon(condition) {
    return WEATHER_ICONS[condition] || WEATHER_ICONS.partlyCloudy;
}

// 첫 줄 가져오기 (타이틀용)
function getFirstLine(text) {
    if (!text) return '제목 없음';
    const lines = text.split('\n');
    const firstLine = lines[0].trim();
    return firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : (firstLine || '제목 없음');
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 뒤로가기 버튼
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('home.html');
        });
    }
    
    // 더보기 메뉴 토글
    const moreBtn = document.querySelector('.more-btn');
    const moreMenu = document.querySelector('.more-menu');
    if (moreBtn && moreMenu) {
        moreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isVisible = moreMenu.style.display === 'block';
            moreMenu.style.display = isVisible ? 'none' : 'block';
        });
        
        // 메뉴 외부 클릭 시 닫기
        document.addEventListener('click', () => {
            moreMenu.style.display = 'none';
        });
        
        moreMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    // 수정 버튼
    const editBtn = document.querySelector('.edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentDiary) {
                navigateTo('new_entry.html', { id: currentDiary.id });
            }
        });
    }
    
    // 삭제 버튼
    const deleteBtn = document.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', handleDelete);
    }
}

// 일기 삭제
async function handleDelete() {
    if (!currentDiary) return;
    
    const confirmMessage = '정말로 이 일기를 삭제하시겠습니까?\n삭제된 일기는 복구할 수 없습니다.';
    
    if (confirm(confirmMessage)) {
        // Supabase에서 삭제
        if (supabaseClient) {
            await supabaseStorage.deleteDiary(currentDiary.id);
        } else {
            storage.deleteDiary(currentDiary.id);
        }
        
        showToast('일기가 삭제되었습니다');
        
        setTimeout(() => {
            navigateTo('home.html');
        }, 500);
    }
}
