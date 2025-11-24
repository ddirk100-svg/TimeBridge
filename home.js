/* ========================================
   Home.html - 일기 목록 페이지
   ======================================== */

let currentYear = new Date().getFullYear();
let currentView = 'card'; // 'card' or 'list'
let filters = {
    year: 'all',
    minTempRange: [-20, 40],
    maxTempRange: [-20, 40]
};

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    debug('홈 페이지 로드됨');
    
    // 저장된 뷰 모드 불러오기
    const savedView = localStorage.getItem('timebridge_view_mode');
    if (savedView) {
        currentView = savedView;
        updateViewMode();
    }
    
    // 필터 설정
    setupFilters();
    
    // 뷰 토글 버튼 설정
    setupViewToggle();
    
    // 일기 목록 렌더링
    renderDiaries();
    
    // 검색 버튼 이벤트 (향후 확장 가능)
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            showToast('검색 기능은 곧 추가됩니다!');
        });
    }
});

// 뷰 토글 설정
function setupViewToggle() {
    const viewToggleBtn = document.querySelector('.view-toggle-btn');
    if (!viewToggleBtn) return;
    
    viewToggleBtn.addEventListener('click', () => {
        // 뷰 모드 전환
        currentView = currentView === 'card' ? 'list' : 'card';
        
        // 저장
        localStorage.setItem('timebridge_view_mode', currentView);
        
        // UI 업데이트
        updateViewMode();
        
        // 토스트 메시지
        showToast(currentView === 'card' ? '카드 보기' : '리스트 보기');
    });
}

// 뷰 모드 UI 업데이트
function updateViewMode() {
    const mainContent = document.querySelector('.main-content');
    const cardIcon = document.querySelector('.view-icon-card');
    const listIcon = document.querySelector('.view-icon-list');
    
    if (!mainContent) return;
    
    if (currentView === 'list') {
        mainContent.classList.add('list-view');
        if (cardIcon) cardIcon.style.display = 'none';
        if (listIcon) listIcon.style.display = 'block';
    } else {
        mainContent.classList.remove('list-view');
        if (cardIcon) cardIcon.style.display = 'block';
        if (listIcon) listIcon.style.display = 'none';
    }
}

// 연도 선택 설정
function setupYearSelector() {
    const yearBtn = document.querySelector('.year-btn');
    const yearText = document.querySelector('.year-text');
    const yearDropdown = document.querySelector('.year-dropdown');
    
    if (!yearBtn || !yearText || !yearDropdown) return;
    
    // 초기 연도 설정
    yearText.textContent = currentYear;
    
    // 드롭다운 생성
    renderYearDropdown();
    
    // 버튼 클릭 시 드롭다운 토글
    yearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleYearDropdown();
    });
    
    // 외부 클릭 시 드롭다운 닫기
    document.addEventListener('click', (e) => {
        if (!yearBtn.contains(e.target) && !yearDropdown.contains(e.target)) {
            closeYearDropdown();
        }
    });
}

// 연도 드롭다운 렌더링
function renderYearDropdown() {
    const yearDropdown = document.querySelector('.year-dropdown');
    if (!yearDropdown) return;
    
    // 실제 일기가 있는 연도만 가져오기
    const allDiaries = storage.getAllDiaries();
    const yearsWithDiaries = new Set();
    
    allDiaries.forEach(diary => {
        const year = new Date(diary.date).getFullYear();
        yearsWithDiaries.add(year);
    });
    
    // 현재 연도는 항상 포함
    if (typeof currentYear === 'number') {
        yearsWithDiaries.add(currentYear);
    }
    
    // 정렬 (최신순)
    const years = Array.from(yearsWithDiaries).sort((a, b) => b - a);
    
    // 드롭다운 HTML 생성 ('전체' 옵션 포함)
    yearDropdown.innerHTML = `
        <button class="year-option ${currentYear === 'all' ? 'selected' : ''}" data-year="all">
            전체
        </button>
        ${years.map(year => `
            <button class="year-option ${year === currentYear ? 'selected' : ''}" data-year="${year}">
                ${year}
            </button>
        `).join('')}
    `;
    
    // 각 연도 옵션에 클릭 이벤트 추가
    yearDropdown.querySelectorAll('.year-option').forEach(option => {
        option.addEventListener('click', () => {
            const selectedYear = option.dataset.year === 'all' ? 'all' : parseInt(option.dataset.year);
            selectYear(selectedYear);
        });
    });
}

// 드롭다운 열기/닫기
function toggleYearDropdown() {
    const yearBtn = document.querySelector('.year-btn');
    const yearDropdown = document.querySelector('.year-dropdown');
    
    if (!yearDropdown) return;
    
    const isOpen = yearDropdown.style.display === 'block';
    
    if (isOpen) {
        closeYearDropdown();
    } else {
        yearDropdown.style.display = 'block';
        yearBtn.classList.add('active');
    }
}

// 드롭다운 닫기
function closeYearDropdown() {
    const yearBtn = document.querySelector('.year-btn');
    const yearDropdown = document.querySelector('.year-dropdown');
    
    if (yearDropdown) {
        yearDropdown.style.display = 'none';
    }
    if (yearBtn) {
        yearBtn.classList.remove('active');
    }
}

// 연도 선택
function selectYear(year) {
    currentYear = year;
    
    // UI 업데이트
    const yearText = document.querySelector('.year-text');
    if (yearText) {
        yearText.textContent = year === 'all' ? '전체' : year;
    }
    
    // 드롭다운 닫기
    closeYearDropdown();
    
    // 선택된 연도 표시 업데이트
    document.querySelectorAll('.year-option').forEach(option => {
        const optionYear = option.dataset.year === 'all' ? 'all' : parseInt(option.dataset.year);
        if (optionYear === year) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
    
    // 일기 목록 새로고침
    renderDiaries();
}

// 일기 목록 렌더링
async function renderDiaries() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    // 모든 일기 가져오기
    let diaries;
    if (filters.year === 'all') {
        diaries = storage.getSortedDiaries();
    } else {
        diaries = storage.getDiariesByYear(filters.year);
    }
    
    // 기온 필터 적용
    const filteredDiaries = [];
    for (const diary of diaries) {
        const date = new Date(diary.date);
        
        // 날씨 데이터 가져오기
        try {
            const weatherData = await fetchWeatherData(date);
            
            // 최저 기온 필터
            if (weatherData.minTemp < filters.minTempRange[0] || weatherData.minTemp > filters.minTempRange[1]) {
                continue;
            }
            
            // 최고 기온 필터
            if (weatherData.maxTemp < filters.maxTempRange[0] || weatherData.maxTemp > filters.maxTempRange[1]) {
                continue;
            }
            
            filteredDiaries.push(diary);
        } catch (error) {
            // 날씨 정보를 가져올 수 없으면 일단 포함
            filteredDiaries.push(diary);
        }
    }
    
    debug('필터 적용 후 일기 개수:', filteredDiaries.length);
    
    // 기존 카드 제거
    mainContent.innerHTML = '';
    
    if (filteredDiaries.length === 0) {
        // 일기가 없을 때
        mainContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📔</div>
                <h3 class="empty-title">조건에 맞는 일기가 없습니다</h3>
            </div>
        `;
        return;
    }
    
    // 일기 카드 생성 (비동기 처리)
    const cardPromises = filteredDiaries.map(diary => createDiaryCard(diary));
    const cards = await Promise.all(cardPromises);
    
    cards.forEach(card => {
        mainContent.appendChild(card);
    });
}

// 일기 카드 생성
async function createDiaryCard(diary) {
    const article = document.createElement('article');
    const date = new Date(diary.date);
    const hasImage = diary.images && diary.images.length > 0;
    const title = diary.title || getFirstLine(diary.content);
    
    // 리스트 뷰일 때
    if (currentView === 'list') {
        article.className = hasImage ? 'diary-card' : 'diary-card card-no-image';
        
        // 날씨 정보 가져오기
        let weatherHTML = '';
        try {
            const weatherData = await fetchWeatherData(date);
            const weatherIcon = getWeatherIcon(weatherData.condition);
            weatherHTML = `
                <div class="list-weather">
                    <span class="list-weather-icon">${weatherIcon}</span>
                    <span class="list-weather-temp">${weatherData.maxTemp}° / ${weatherData.minTemp}°</span>
                </div>
            `;
        } catch (error) {
            weatherHTML = `<div class="list-weather"><span class="list-weather-icon">☀️</span></div>`;
        }
        
        if (hasImage) {
            article.innerHTML = `
                <div class="card-image">
                    <img src="${diary.images[0]}" alt="일기 사진">
                </div>
                <div class="card-content">
                    <div class="list-header">
                        <div class="card-date-text">${formatDate.simple(date)}</div>
                        ${weatherHTML}
                    </div>
                    <h3 class="card-title">${escapeHtml(truncateText(title, 25))}</h3>
                    <p class="card-preview">${escapeHtml(truncateText(diary.content, 50))}</p>
                </div>
            `;
        } else {
            article.innerHTML = `
                <div class="card-content">
                    <div class="list-header">
                        <div class="card-date-text">${formatDate.simple(date)}</div>
                        ${weatherHTML}
                    </div>
                    <h3 class="card-title">${escapeHtml(truncateText(title, 25))}</h3>
                    <p class="card-preview">${escapeHtml(truncateText(diary.content, 70))}</p>
                </div>
            `;
        }
    } else {
        // 카드 뷰일 때 (기존 코드)
        if (hasImage) {
            article.className = 'diary-card';
            article.innerHTML = `
                <div class="card-image">
                    <img src="${diary.images[0]}" alt="일기 사진">
                    <div class="card-date-badge">
                        <div class="date-day">${formatDate.dayOnly(date)}</div>
                        <div class="date-month">${formatDate.monthShort(date)}</div>
                    </div>
                </div>
                <div class="card-content">
                    <div class="card-date-text">${formatDate.full(date)}</div>
                    <p class="card-preview">${escapeHtml(truncateText(diary.content, 120))}</p>
                </div>
            `;
        } else {
            article.className = 'diary-card card-no-image';
            article.innerHTML = `
                <div class="card-content">
                    <div class="card-date-badge-inline">
                        <div class="date-day">${formatDate.dayOnly(date)}</div>
                        <div class="date-month">${formatDate.monthShort(date)}</div>
                    </div>
                    <div class="card-date-text">${formatDate.full(date)}</div>
                    <p class="card-preview">${escapeHtml(truncateText(diary.content, 150))}</p>
                </div>
            `;
        }
    }
    
    // 클릭 이벤트 - 상세 페이지로 이동
    article.addEventListener('click', () => {
        navigateTo('view_entry.html', { id: diary.id });
    });
    
    return article;
}

// 첫 줄 가져오기 (타이틀용)
function getFirstLine(text) {
    if (!text) return '제목 없음';
    const lines = text.split('\n');
    const firstLine = lines[0].trim();
    return firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : (firstLine || '제목 없음');
}

// 날씨 데이터 가져오기 (view_entry.js와 동일)
async function fetchWeatherData(date) {
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
    const icons = {
        sunny: '☀️',
        partlyCloudy: '⛅',
        cloudy: '☁️',
        rainy: '🌧️',
        storm: '⛈️',
        snowy: '❄️',
        foggy: '🌫️'
    };
    return icons[condition] || icons.partlyCloudy;
}

// 데모 데이터 생성 함수 (최초 사용 시)
function createDemoData() {
    const demoDiaries = [
        {
            date: new Date(2024, 10, 23).toISOString(),
            content: '오늘은 날씨가 정말 좋았다. 오랜만에 친구들과 카페에서 시간을 보냈는데, 이야기를 나누다 보니 시간 가는 줄 몰랐다. 최근에 바쁜 일상 속에서 서로 만나지 못했는데, 오늘 함께하니 정말 좋았다.',
            images: ['https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=600&h=400&fit=crop'],
            mood: { emoji: '😊', text: '행복해요' }
        },
        {
            date: new Date(2024, 10, 20).toISOString(),
            content: '혼자만의 시간을 가지며 생각을 정리했다. 가끔은 이렇게 조용한 시간이 필요한 것 같다. 내일은 더 나은 하루가 되길 바란다.',
            images: ['https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&h=400&fit=crop'],
            mood: { emoji: '😌', text: '평온해요' }
        },
        {
            date: new Date(2024, 10, 15).toISOString(),
            content: '주말을 맞이하는 금요일. 이번 주는 유난히 바빴지만 보람찬 한 주였다. 다음 주도 파이팅!',
            images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop'],
            mood: { emoji: '🥰', text: '설레요' }
        },
        {
            date: new Date(2024, 10, 10).toISOString(),
            content: '일요일 아침, 늦잠을 자고 일어났다. 특별한 일은 없었지만 여유로운 하루를 보냈다. 이런 날도 소중하다.',
            images: [],
            mood: { emoji: '😌', text: '평온해요' }
        }
    ];
    
    demoDiaries.forEach(demo => {
        const diary = createDiary(demo);
        storage.saveDiary(diary);
    });
    
    showToast('데모 일기가 추가되었습니다!');
    renderDiaries();
}

// 필터 설정
function setupFilters() {
    const filterBtn = document.querySelector('.filter-btn');
    const filterSheet = document.getElementById('filterSheet');
    const overlay = filterSheet?.querySelector('.bottom-sheet-overlay');
    const closeBtn = filterSheet?.querySelector('.bottom-sheet-close');
    const applyBtn = document.getElementById('applyFilters');
    const resetBtn = document.getElementById('resetFilters');
    
    if (!filterBtn || !filterSheet) return;
    
    // 필터 버튼 클릭
    filterBtn.addEventListener('click', () => {
        openFilterSheet();
    });
    
    // 오버레이 클릭 시 닫기
    overlay?.addEventListener('click', () => {
        closeFilterSheet();
    });
    
    // 닫기 버튼
    closeBtn?.addEventListener('click', () => {
        closeFilterSheet();
    });
    
    // 적용 버튼
    applyBtn?.addEventListener('click', () => {
        applyFilters();
        closeFilterSheet();
    });
    
    // 초기화 버튼
    resetBtn?.addEventListener('click', () => {
        resetFilters();
    });
    
    // 슬라이더 설정
    setupTempSliders();
}

// 필터 시트 열기
function openFilterSheet() {
    const filterSheet = document.getElementById('filterSheet');
    if (!filterSheet) return;
    
    // 년도 리스트 렌더링
    renderYearFilterList();
    
    // 현재 필터 값으로 슬라이더 초기화
    document.getElementById('minTempMin').value = filters.minTempRange[0];
    document.getElementById('minTempMax').value = filters.minTempRange[1];
    document.getElementById('maxTempMin').value = filters.maxTempRange[0];
    document.getElementById('maxTempMax').value = filters.maxTempRange[1];
    
    updateTempDisplay();
    
    filterSheet.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 필터 시트 닫기
function closeFilterSheet() {
    const filterSheet = document.getElementById('filterSheet');
    if (!filterSheet) return;
    
    filterSheet.style.display = 'none';
    document.body.style.overflow = '';
}

// 년도 필터 리스트 렌더링
function renderYearFilterList() {
    const yearList = document.querySelector('.filter-year-list');
    if (!yearList) return;
    
    const diaries = storage.getAllDiaries();
    const years = [...new Set(diaries.map(d => new Date(d.date).getFullYear()))].sort((a, b) => b - a);
    
    yearList.innerHTML = '';
    
    // 전체 옵션
    const allOption = document.createElement('div');
    allOption.className = 'filter-year-item' + (filters.year === 'all' ? ' selected' : '');
    allOption.textContent = '전체';
    allOption.addEventListener('click', () => selectYearFilter('all'));
    yearList.appendChild(allOption);
    
    // 각 년도
    years.forEach(year => {
        const yearItem = document.createElement('div');
        yearItem.className = 'filter-year-item' + (filters.year === year ? ' selected' : '');
        yearItem.textContent = `${year}년`;
        yearItem.addEventListener('click', () => selectYearFilter(year));
        yearList.appendChild(yearItem);
    });
}

// 년도 필터 선택
function selectYearFilter(year) {
    filters.year = year;
    
    // 선택 상태 업데이트
    document.querySelectorAll('.filter-year-item').forEach(item => {
        item.classList.remove('selected');
    });
    event.target.classList.add('selected');
}

// 기온 슬라이더 설정
function setupTempSliders() {
    const minTempMin = document.getElementById('minTempMin');
    const minTempMax = document.getElementById('minTempMax');
    const maxTempMin = document.getElementById('maxTempMin');
    const maxTempMax = document.getElementById('maxTempMax');
    
    if (!minTempMin || !minTempMax || !maxTempMin || !maxTempMax) return;
    
    // 최저 기온 슬라이더
    minTempMin.addEventListener('input', () => {
        if (parseInt(minTempMin.value) > parseInt(minTempMax.value)) {
            minTempMin.value = minTempMax.value;
        }
        updateTempDisplay();
    });
    
    minTempMax.addEventListener('input', () => {
        if (parseInt(minTempMax.value) < parseInt(minTempMin.value)) {
            minTempMax.value = minTempMin.value;
        }
        updateTempDisplay();
    });
    
    // 최고 기온 슬라이더
    maxTempMin.addEventListener('input', () => {
        if (parseInt(maxTempMin.value) > parseInt(maxTempMax.value)) {
            maxTempMin.value = maxTempMax.value;
        }
        updateTempDisplay();
    });
    
    maxTempMax.addEventListener('input', () => {
        if (parseInt(maxTempMax.value) < parseInt(maxTempMin.value)) {
            maxTempMax.value = maxTempMin.value;
        }
        updateTempDisplay();
    });
}

// 기온 표시 업데이트
function updateTempDisplay() {
    const minTempMin = document.getElementById('minTempMin');
    const minTempMax = document.getElementById('minTempMax');
    const maxTempMin = document.getElementById('maxTempMin');
    const maxTempMax = document.getElementById('maxTempMax');
    
    document.getElementById('minTempValue').textContent = `${minTempMin.value}°C`;
    document.getElementById('maxMinTempValue').textContent = `${minTempMax.value}°C`;
    document.getElementById('maxTempValue').textContent = `${maxTempMin.value}°C`;
    document.getElementById('maxMaxTempValue').textContent = `${maxTempMax.value}°C`;
}

// 필터 적용
function applyFilters() {
    const minTempMin = parseInt(document.getElementById('minTempMin').value);
    const minTempMax = parseInt(document.getElementById('minTempMax').value);
    const maxTempMin = parseInt(document.getElementById('maxTempMin').value);
    const maxTempMax = parseInt(document.getElementById('maxTempMax').value);
    
    filters.minTempRange = [minTempMin, minTempMax];
    filters.maxTempRange = [maxTempMin, maxTempMax];
    
    // 필터 칩 업데이트
    updateFilterChips();
    
    // 일기 목록 다시 렌더링
    renderDiaries();
    
    showToast('필터가 적용되었습니다');
}

// 필터 초기화
function resetFilters() {
    filters = {
        year: 'all',
        minTempRange: [-20, 40],
        maxTempRange: [-20, 40]
    };
    
    // 슬라이더 초기화
    document.getElementById('minTempMin').value = -20;
    document.getElementById('minTempMax').value = 40;
    document.getElementById('maxTempMin').value = -20;
    document.getElementById('maxTempMax').value = 40;
    
    updateTempDisplay();
    renderYearFilterList();
    updateFilterChips();
    
    showToast('필터가 초기화되었습니다');
}

// 필터 칩 업데이트
function updateFilterChips() {
    const chipsContainer = document.querySelector('.filter-chips');
    if (!chipsContainer) return;
    
    chipsContainer.innerHTML = '';
    
    // 년도 필터
    if (filters.year !== 'all') {
        const chip = createFilterChip(`${filters.year}년`, () => {
            filters.year = 'all';
            updateFilterChips();
            renderDiaries();
        });
        chipsContainer.appendChild(chip);
    }
    
    // 최저 기온 필터
    if (filters.minTempRange[0] !== -20 || filters.minTempRange[1] !== 40) {
        const chip = createFilterChip(
            `최저 ${filters.minTempRange[0]}°C ~ ${filters.minTempRange[1]}°C`,
            () => {
                filters.minTempRange = [-20, 40];
                updateFilterChips();
                renderDiaries();
            }
        );
        chipsContainer.appendChild(chip);
    }
    
    // 최고 기온 필터
    if (filters.maxTempRange[0] !== -20 || filters.maxTempRange[1] !== 40) {
        const chip = createFilterChip(
            `최고 ${filters.maxTempRange[0]}°C ~ ${filters.maxTempRange[1]}°C`,
            () => {
                filters.maxTempRange = [-20, 40];
                updateFilterChips();
                renderDiaries();
            }
        );
        chipsContainer.appendChild(chip);
    }
}

// 필터 칩 생성
function createFilterChip(text, onRemove) {
    const chip = document.createElement('div');
    chip.className = 'filter-chip';
    
    const label = document.createElement('span');
    label.textContent = text;
    chip.appendChild(label);
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'filter-chip-remove';
    removeBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    `;
    removeBtn.addEventListener('click', onRemove);
    chip.appendChild(removeBtn);
    
    return chip;
}

// 개발자 도구용 - 콘솔에서 호출 가능
window.createDemoData = createDemoData;
window.clearAllDiaries = () => {
    if (confirm('모든 일기를 삭제하시겠습니까?')) {
        localStorage.removeItem(STORAGE_KEY);
        renderDiaries();
        showToast('모든 일기가 삭제되었습니다');
    }
};
