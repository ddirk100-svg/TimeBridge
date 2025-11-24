/* ========================================
   Profile.html - 프로필 페이지
   ======================================== */

let currentUser = null;

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', async () => {
    debug('프로필 페이지 로드됨');
    
    // 인증 확인
    await new Promise(resolve => setTimeout(resolve, 100));
    currentUser = auth.getCurrentUser();
    
    if (!currentUser) {
        showToast('로그인이 필요합니다');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
        return;
    }
    
    // 프로필 정보 표시
    loadProfile();
    
    // 통계 로드
    loadStats();
    
    // 이벤트 리스너 설정
    setupEventListeners();
});

// 프로필 정보 로드
function loadProfile() {
    if (!currentUser) {
        // 게스트 모드
        const guestNickname = getGuestNickname();
        updateProfileAvatar(guestNickname, null, false);
        
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        
        if (profileName) profileName.textContent = guestNickname;
        if (profileEmail) profileEmail.textContent = '게스트 모드';
        
        debug('게스트 프로필 로드:', guestNickname);
        return;
    }
    
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    
    // 이름 (user_metadata에서 가져오거나 이메일 사용)
    const displayName = currentUser.user_metadata?.name || currentUser.email.split('@')[0];
    const profilePicture = currentUser.user_metadata?.avatar_url || localStorage.getItem('profile_picture');
    
    // 아바타 업데이트
    updateProfileAvatar(displayName, profilePicture, true);
    
    // 이름
    if (profileName) {
        profileName.textContent = displayName;
    }
    
    // 이메일
    if (profileEmail) {
        profileEmail.textContent = currentUser.email;
    }
    
    debug('프로필 정보 로드됨:', displayName, currentUser.email);
}

// 프로필 아바타 업데이트
function updateProfileAvatar(name, imageUrl, isLoggedIn) {
    const profileAvatarText = document.getElementById('profileAvatarText');
    const profileAvatarImg = document.getElementById('profileAvatarImg');
    const profileAvatarLarge = document.getElementById('profileAvatarLarge');
    
    if (imageUrl) {
        // 이미지가 있으면 이미지 표시
        if (profileAvatarImg) {
            profileAvatarImg.src = imageUrl;
            profileAvatarImg.style.display = 'block';
        }
        if (profileAvatarText) {
            profileAvatarText.style.display = 'none';
        }
    } else {
        // 이미지가 없으면 첫 글자 표시
        const initial = name.charAt(0).toUpperCase();
        if (profileAvatarText) {
            profileAvatarText.textContent = initial;
            profileAvatarText.style.display = 'block';
        }
        if (profileAvatarImg) {
            profileAvatarImg.style.display = 'none';
        }
    }
    
    // 배경색 설정
    if (profileAvatarLarge) {
        if (isLoggedIn) {
            profileAvatarLarge.style.background = 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))';
        } else {
            profileAvatarLarge.style.background = 'linear-gradient(135deg, #95a5a6, #7f8c8d)';
        }
    }
}

// 통계 로드
async function loadStats() {
    try {
        let diaries = [];
        
        // Supabase에서 일기 가져오기
        if (supabaseClient) {
            diaries = await supabaseStorage.getAllDiaries();
        } else {
            diaries = storage.getAllDiaries();
        }
        
        // 총 일기 수
        const totalDiariesEl = document.getElementById('totalDiaries');
        if (totalDiariesEl) {
            totalDiariesEl.textContent = diaries.length;
        }
        
        // 이번 달 일기 수
        const now = new Date();
        const thisMonthDiaries = diaries.filter(diary => {
            const diaryDate = new Date(diary.date);
            return diaryDate.getMonth() === now.getMonth() && 
                   diaryDate.getFullYear() === now.getFullYear();
        });
        
        const thisMonthDiariesEl = document.getElementById('thisMonthDiaries');
        if (thisMonthDiariesEl) {
            thisMonthDiariesEl.textContent = thisMonthDiaries.length;
        }
        
        // 총 사진 수
        const totalImages = diaries.reduce((sum, diary) => {
            return sum + (diary.images ? diary.images.length : 0);
        }, 0);
        
        const totalImagesEl = document.getElementById('totalImages');
        if (totalImagesEl) {
            totalImagesEl.textContent = totalImages;
        }
        
        debug('통계 로드됨:', {
            total: diaries.length,
            thisMonth: thisMonthDiaries.length,
            images: totalImages
        });
    } catch (error) {
        console.error('통계 로드 실패:', error);
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 뒤로가기 버튼
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            navigateTo('home.html');
        });
    }
    
    // 아바타 업로드 버튼
    const avatarUploadBtn = document.getElementById('avatarUploadBtn');
    const avatarUploadInput = document.getElementById('avatarUploadInput');
    
    if (avatarUploadBtn && avatarUploadInput) {
        avatarUploadBtn.addEventListener('click', () => {
            avatarUploadInput.click();
        });
        
        avatarUploadInput.addEventListener('change', handleAvatarUpload);
    }
    
    // 프로필 수정 버튼
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            showToast('프로필 수정 기능은 곧 추가됩니다!');
        });
    }
    
    // 비밀번호 변경 버튼
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            showToast('비밀번호 변경 기능은 곧 추가됩니다!');
        });
    }
    
    // 데이터 내보내기 버튼
    const dataExportBtn = document.getElementById('dataExportBtn');
    if (dataExportBtn) {
        dataExportBtn.addEventListener('click', handleDataExport);
    }
    
    // 로그아웃 버튼
    const logoutBtnFull = document.getElementById('logoutBtnFull');
    if (logoutBtnFull) {
        logoutBtnFull.addEventListener('click', handleLogout);
    }
}

// 아바타 업로드 처리
async function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('파일 크기는 5MB 이하여야 합니다');
        return;
    }
    
    // 이미지 파일인지 체크
    if (!file.type.startsWith('image/')) {
        showToast('이미지 파일만 업로드 가능합니다');
        return;
    }
    
    try {
        showToast('프로필 사진 업로드 중...');
        
        // Base64로 변환
        const base64 = await convertImageToBase64(file);
        
        // localStorage에 저장
        localStorage.setItem('profile_picture', base64);
        
        // UI 업데이트
        const profileAvatarImg = document.getElementById('profileAvatarImg');
        const profileAvatarText = document.getElementById('profileAvatarText');
        
        if (profileAvatarImg) {
            profileAvatarImg.src = base64;
            profileAvatarImg.style.display = 'block';
        }
        
        if (profileAvatarText) {
            profileAvatarText.style.display = 'none';
        }
        
        showToast('프로필 사진이 변경되었습니다');
        debug('프로필 사진 업로드 완료');
        
        // TODO: 나중에 Supabase Storage에 업로드
        // if (supabaseClient && currentUser) {
        //     const { data, error } = await supabaseClient.storage
        //         .from('avatars')
        //         .upload(`${currentUser.id}/avatar.jpg`, file);
        // }
        
    } catch (error) {
        console.error('프로필 사진 업로드 실패:', error);
        showToast('프로필 사진 업로드에 실패했습니다');
    }
}

// 데이터 내보내기
async function handleDataExport() {
    try {
        let diaries = [];
        
        // Supabase에서 일기 가져오기
        if (supabaseClient) {
            diaries = await supabaseStorage.getAllDiaries();
        } else {
            diaries = storage.getAllDiaries();
        }
        
        if (diaries.length === 0) {
            showToast('내보낼 일기가 없습니다');
            return;
        }
        
        // JSON 파일로 다운로드
        const dataStr = JSON.stringify(diaries, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `timebridge_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast(`${diaries.length}개의 일기를 내보냈습니다`);
        debug('데이터 내보내기 완료:', diaries.length);
    } catch (error) {
        console.error('데이터 내보내기 실패:', error);
        showToast('데이터 내보내기에 실패했습니다');
    }
}

// 로그아웃 처리
async function handleLogout() {
    const confirmed = confirm('로그아웃하시겠습니까?');
    if (!confirmed) return;
    
    const { error } = await auth.signOut();
    
    if (error) {
        showToast('로그아웃 실패: ' + error.message);
        return;
    }
    
    showToast('로그아웃되었습니다');
    
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

