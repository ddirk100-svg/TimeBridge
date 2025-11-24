/* ========================================
   new_entry.html - 새 일기 작성/수정 페이지
   ======================================== */

let selectedDate = new Date();
let uploadedImages = [];
let selectedMood = null;
let editingDiaryId = null;

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    debug('일기 작성/수정 페이지 로드됨');
    
    // 수정 모드인지 확인
    editingDiaryId = getUrlParam('id');
    
    if (editingDiaryId) {
        loadDiaryForEdit(editingDiaryId);
    }
    
    // 날짜 표시 업데이트
    updateDateDisplay();
    
    // 이벤트 리스너 설정
    setupEventListeners();
});

// 수정할 일기 불러오기
async function loadDiaryForEdit(id) {
    let diary;
    
    // Supabase에서 가져오기
    if (supabaseClient) {
        diary = await supabaseStorage.getDiaryById(id);
    } else {
        diary = storage.getDiaryById(id);
    }
    
    if (!diary) {
        showToast('일기를 찾을 수 없습니다');
        navigateTo('home.html');
        return;
    }
    
    debug('수정 모드:', diary);
    
    // 페이지 타이틀 변경
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) {
        pageTitle.textContent = '일기 수정';
    }
    
    // 날짜 설정
    selectedDate = new Date(diary.date);
    updateDateDisplay();
    
    // 제목 설정
    const titleInput = document.querySelector('.diary-title-input');
    if (titleInput) {
        titleInput.value = diary.title || '';
    }
    
    // 텍스트 설정 (text 또는 content)
    const textarea = document.querySelector('.diary-textarea');
    if (textarea) {
        textarea.value = diary.text || diary.content || '';
    }
    
    // 이미지 설정
    uploadedImages = diary.images || [];
    updateImagePreview();
    
    // 감정 태그 설정
    if (diary.mood) {
        selectedMood = diary.mood;
        highlightSelectedMood();
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 뒤로가기 버튼
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('작성 중인 내용이 저장되지 않습니다. 나가시겠습니까?')) {
                navigateTo('home.html');
            }
        });
    }
    
    // 캘린더 버튼
    const calendarBtn = document.querySelector('.calendar-btn');
    if (calendarBtn) {
        calendarBtn.addEventListener('click', showDatePicker);
    }
    
    // 이미지 업로드
    const imageInputs = document.querySelectorAll('.image-upload-box input[type="file"]');
    imageInputs.forEach((input, index) => {
        input.addEventListener('change', (e) => handleImageUpload(e, index));
    });
    
    // 감정 태그 선택
    const moodTags = document.querySelectorAll('.mood-tag');
    moodTags.forEach((tag, index) => {
        tag.addEventListener('click', () => selectMood(index, tag));
    });
    
    // 저장 버튼
    const saveBtn = document.querySelector('.btn-save');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveDiary);
    }
}

// 날짜 표시 업데이트
function updateDateDisplay() {
    const dateDisplay = document.querySelector('.date-display');
    if (!dateDisplay) return;
    
    dateDisplay.innerHTML = `
        <div class="date-large">${formatDate.dayOnly(selectedDate)}</div>
        <div class="date-details">
            <div class="date-month-year">${formatDate.monthYear(selectedDate)}</div>
            <div class="date-day-name">${formatDate.dayName(selectedDate)}</div>
        </div>
    `;
}

// 날짜 선택
function showDatePicker() {
    const dateString = selectedDate.toISOString().split('T')[0];
    const input = document.createElement('input');
    input.type = 'date';
    input.value = dateString;
    input.style.position = 'absolute';
    input.style.opacity = '0';
    
    document.body.appendChild(input);
    
    input.addEventListener('change', (e) => {
        if (e.target.value) {
            selectedDate = new Date(e.target.value + 'T12:00:00');
            updateDateDisplay();
            showToast('날짜가 변경되었습니다');
        }
        document.body.removeChild(input);
    });
    
    input.showPicker();
}

// 이미지 업로드 처리
async function handleImageUpload(event, index) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
        showToast('이미지 크기는 5MB 이하여야 합니다');
        return;
    }
    
    // 이미지 파일인지 확인
    if (!file.type.startsWith('image/')) {
        showToast('이미지 파일만 업로드 가능합니다');
        return;
    }
    
    try {
        const base64 = await imageToBase64(file);
        uploadedImages[index] = base64;
        updateImagePreview();
        showToast('이미지가 추가되었습니다');
    } catch (error) {
        debug('이미지 업로드 오류:', error);
        showToast('이미지 업로드에 실패했습니다');
    }
}

// 이미지 미리보기 업데이트
function updateImagePreview() {
    const imageBoxes = document.querySelectorAll('.image-upload-box');
    
    imageBoxes.forEach((box, index) => {
        if (uploadedImages[index]) {
            // 이미지가 있으면 미리보기 표시
            box.style.backgroundImage = `url(${uploadedImages[index]})`;
            box.style.backgroundSize = 'cover';
            box.style.backgroundPosition = 'center';
            box.innerHTML = `
                <input type="file" accept="image/*" style="display: none;">
                <button class="remove-image-btn" onclick="removeImage(${index})">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            `;
        } else {
            // 이미지가 없으면 업로드 UI 표시
            box.style.backgroundImage = 'none';
            box.innerHTML = `
                <input type="file" accept="image/*" style="display: none;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <span>사진 추가</span>
            `;
            
            // 이벤트 리스너 다시 추가
            const input = box.querySelector('input[type="file"]');
            input.addEventListener('change', (e) => handleImageUpload(e, index));
        }
    });
}

// 이미지 제거
window.removeImage = function(index) {
    uploadedImages[index] = null;
    updateImagePreview();
    showToast('이미지가 제거되었습니다');
};

// 감정 선택
function selectMood(index, element) {
    const mood = MOODS[index];
    
    // 같은 감정 클릭 시 선택 해제
    if (selectedMood && selectedMood.text === mood.text) {
        selectedMood = null;
    } else {
        selectedMood = mood;
    }
    
    highlightSelectedMood();
}

// 선택된 감정 하이라이트
function highlightSelectedMood() {
    const moodTags = document.querySelectorAll('.mood-tag');
    
    moodTags.forEach((tag) => {
        tag.classList.remove('mood-selected');
    });
    
    if (selectedMood) {
        moodTags.forEach((tag) => {
            if (tag.textContent.includes(selectedMood.text)) {
                tag.classList.add('mood-selected');
            }
        });
    }
}

// 일기 저장
async function saveDiary() {
    const titleInput = document.querySelector('.diary-title-input');
    const textarea = document.querySelector('.diary-textarea');
    const title = titleInput ? titleInput.value.trim() : '';
    const content = textarea ? textarea.value.trim() : '';
    
    // 내용 검증
    if (!content) {
        showToast('일기 내용을 입력해주세요');
        textarea?.focus();
        return;
    }
    
    // 일기 객체 생성
    const diaryData = {
        id: editingDiaryId || undefined,
        date: selectedDate.toISOString(),
        title: title,
        text: content, // text 필드 사용
        content: content, // content 필드도 유지 (호환성)
        images: uploadedImages.filter(img => img !== null && img !== undefined),
        mood: selectedMood,
        weather: null // 나중에 날씨 선택 기능 추가
    };
    
    // 수정 모드일 경우 기존 생성일 유지
    if (editingDiaryId) {
        let existingDiary;
        if (supabaseClient) {
            existingDiary = await supabaseStorage.getDiaryById(editingDiaryId);
        } else {
            existingDiary = storage.getDiaryById(editingDiaryId);
        }
        
        if (existingDiary) {
            diaryData.createdAt = existingDiary.createdAt || existingDiary.created_at;
        }
    }
    
    const diary = createDiary(diaryData);
    
    // Supabase에 저장
    if (supabaseClient) {
        await supabaseStorage.saveDiary(diary);
    } else {
        storage.saveDiary(diary);
    }
    
    debug('일기 저장됨:', diary);
    
    // 성공 메시지 및 페이지 이동
    showToast(editingDiaryId ? '일기가 수정되었습니다' : '일기가 저장되었습니다');
    
    setTimeout(() => {
        navigateTo('view_entry.html', { id: diary.id });
    }, 500);
}

