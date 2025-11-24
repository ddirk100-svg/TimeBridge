/* ========================================
   Auth.js - 인증 관련 로직
   ======================================== */

// Supabase 클라이언트 초기화
const auth = {
    // 현재 사용자 정보
    currentUser: null,
    
    // 초기화
    init: async function() {
        if (!supabaseClient) {
            console.warn('Supabase 클라이언트가 없습니다. 게스트 모드로 작동합니다.');
            return;
        }
        
        // 세션 확인
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (session) {
            this.currentUser = session.user;
            debug('로그인 상태:', this.currentUser.email);
        }
        
        // 인증 상태 변경 감지
        supabaseClient.auth.onAuthStateChange((event, session) => {
            debug('Auth state changed:', event);
            
            if (session) {
                this.currentUser = session.user;
            } else {
                this.currentUser = null;
            }
        });
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

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', async () => {
    // 인증 초기화
    await auth.init();
    
    // 페이지별 처리
    const currentPage = window.location.pathname.split('/').pop();
    
    // 로그인 페이지가 아닌데 로그인하지 않은 경우
    if (currentPage !== 'login.html' && currentPage !== '' && !auth.isAuthenticated() && supabaseClient) {
        // 로그인 페이지로 리다이렉트 (선택사항)
        // window.location.href = 'login.html';
    }
    
    // 로그인 페이지 로직
    if (currentPage === 'login.html' || currentPage === '') {
        setupLoginPage();
    }
});

// 로그인 페이지 설정
function setupLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const authTabs = document.querySelectorAll('.auth-tab');
    const guestBtn = document.getElementById('guestBtn');
    
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
            window.location.href = 'home.html';
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
                window.location.href = 'home.html';
            }, 1000);
        });
    }
}

