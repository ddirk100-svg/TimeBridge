/* ========================================
   Auth.js - 인증 관련 로직
   ======================================== */

// Supabase 클라이언트 초기화
const auth = {
    // 현재 사용자 정보
    currentUser: null,
    
    // 초기화
    init: async function() {
        console.log('🔧 Auth.init() 시작');
        
        if (!supabaseClient) {
            console.warn('⚠️ Supabase 클라이언트가 없습니다. 게스트 모드로 작동합니다.');
            this.currentUser = null;
            return false;
        }
        
        try {
            // 세션 확인
            console.log('🔍 Supabase 세션 확인 중...');
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            
            if (error) {
                console.error('❌ 세션 확인 오류:', error);
                this.currentUser = null;
                return false;
            }
            
            if (session && session.user) {
                this.currentUser = session.user;
                console.log('✅ 로그인된 사용자 발견:', this.currentUser.email);
            } else {
                this.currentUser = null;
                console.log('👤 로그인된 사용자 없음 (게스트 모드)');
            }
            
            // 인증 상태 변경 감지
            supabaseClient.auth.onAuthStateChange((event, session) => {
                console.log('🔄 Auth 상태 변경:', event);
                
                if (session && session.user) {
                    this.currentUser = session.user;
                    console.log('✅ 사용자 로그인:', this.currentUser.email);
                    
                    // UI 업데이트 이벤트 발생
                    if (typeof updateUserInfoUI === 'function') {
                        updateUserInfoUI();
                    }
                } else {
                    this.currentUser = null;
                    console.log('👤 사용자 로그아웃');
                    
                    // UI 업데이트 이벤트 발생
                    if (typeof updateUserInfoUI === 'function') {
                        updateUserInfoUI();
                    }
                }
            });
            
            return true;
        } catch (error) {
            console.error('❌ Auth 초기화 실패:', error);
            this.currentUser = null;
            return false;
        }
    },
    
    // 회원가입
    signUp: async function(email, password, name) {
        if (!supabaseClient) {
            showToast('회원가입 기능을 사용할 수 없습니다');
            return { error: 'No Supabase client' };
        }
        
        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        name: name
                    }
                }
            });
            
            if (error) throw error;
            
            debug('회원가입 성공:', data);
            return { data, error: null };
        } catch (error) {
            console.error('회원가입 실패:', error);
            return { data: null, error };
        }
    },
    
    // 로그인
    signIn: async function(email, password) {
        if (!supabaseClient) {
            showToast('로그인 기능을 사용할 수 없습니다');
            return { error: 'No Supabase client' };
        }
        
        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) throw error;
            
            this.currentUser = data.user;
            debug('로그인 성공:', data.user.email);
            return { data, error: null };
        } catch (error) {
            console.error('로그인 실패:', error);
            return { data: null, error };
        }
    },
    
    // 로그아웃
    signOut: async function() {
        if (!supabaseClient) return;
        
        try {
            const { error } = await supabaseClient.auth.signOut();
            
            if (error) throw error;
            
            this.currentUser = null;
            debug('로그아웃 성공');
            
            // localStorage도 정리
            localStorage.removeItem('timebridge_diaries');
            
            return { error: null };
        } catch (error) {
            console.error('로그아웃 실패:', error);
            return { error };
        }
    },
    
    // 현재 사용자 가져오기
    getCurrentUser: function() {
        return this.currentUser;
    },
    
    // 로그인 여부 확인
    isAuthenticated: function() {
        return this.currentUser !== null;
    }
};

// 전역 초기화 완료 플래그
window.authReady = false;
window.authReadyPromise = null;

// 즉시 초기화 실행
window.authReadyPromise = (async function() {
    // Supabase 클라이언트가 로드될 때까지 대기
    let attempts = 0;
    while (typeof supabase === 'undefined' && attempts < 100) {
        await new Promise(resolve => setTimeout(resolve, 50));
        attempts++;
    }
    
    if (typeof supabase === 'undefined') {
        console.error('❌ Supabase 로드 실패');
        return false;
    }
    
    // 인증 초기화
    await auth.init();
    window.authReady = true;
    console.log('✅ Auth 초기화 완료');
    
    // 커스텀 이벤트 발생
    window.dispatchEvent(new CustomEvent('authReady', { 
        detail: { user: auth.getCurrentUser() } 
    }));
    
    return true;
})();

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', async () => {
    // 인증 초기화 대기
    await window.authReadyPromise;
    
    // 페이지별 처리
    const currentPath = window.location.pathname;
    
    // 로그인 페이지가 아닌데 로그인하지 않은 경우
    if (currentPath !== '/login' && currentPath !== '/' && !auth.isAuthenticated() && supabaseClient) {
        // 로그인 페이지로 리다이렉트 (선택사항)
        // window.location.href = '/login';
    }
    
    // 로그인 페이지 로직
    if (currentPath === '/login') {
        setupLoginPage();
    }
});

// 로그인 페이지 설정
function setupLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const authTabs = document.querySelectorAll('.auth-tab');
    const guestBtn = document.getElementById('guestBtn');
    
    // 로그인 페이지가 아니면 종료
    if (!loginForm || !signupForm) return;
    
    // 탭 전환
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // 탭 활성화
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // 폼 전환
            if (tabName === 'login') {
                loginForm.style.display = 'block';
                signupForm.style.display = 'none';
            } else {
                loginForm.style.display = 'none';
                signupForm.style.display = 'block';
            }
        });
    });
    
    // 로그인 폼 제출
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        showToast('로그인 중...');
        
        const { data, error } = await auth.signIn(email, password);
        
        if (error) {
            showToast('로그인 실패: ' + error.message);
            return;
        }
        
        showToast('로그인 성공!');
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    });
    
    // 회원가입 폼 제출
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
        const name = document.getElementById('signupName').value;
        
        // 비밀번호 확인
        if (password !== passwordConfirm) {
            showToast('비밀번호가 일치하지 않습니다');
            return;
        }
        
        showToast('회원가입 중...');
        
        const { data, error } = await auth.signUp(email, password, name);
        
        if (error) {
            showToast('회원가입 실패: ' + error.message);
            return;
        }
        
        showToast('회원가입 성공! 이메일을 확인해주세요.');
        
        // 로그인 탭으로 전환
        setTimeout(() => {
            document.querySelector('[data-tab="login"]').click();
        }, 2000);
    });
    
    // 게스트 버튼
    if (guestBtn) {
        guestBtn.addEventListener('click', () => {
            showToast('게스트 모드로 시작합니다');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        });
    }
}

