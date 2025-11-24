// Supabase 클라이언트 설정
// 브라우저에서 사용할 설정 파일

// 환경 감지: 로컬 개발 환경인지 확인
const isDevelopment = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname === '';

// 환경에 따른 Supabase 설정
const SUPABASE_CONFIG = isDevelopment 
    ? {
        // 🔧 로컬 개발: Supabase 사용 안함 (localStorage만 사용)
        url: '',
        anonKey: ''
    }
    : {
        // 🌐 프로덕션: Supabase 사용
        url: 'https://iyctjxnpwnwobyhiroua.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5Y3RqeG5wd253b2J5aGlyb3VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzOTI1OTQsImV4cCI6MjA0Nzk2ODU5NH0.PJ4gfJZ1iFY5rTrNVvH97RVQVVD8Y7OwYvf47AkP_hU'
    };

console.log(`🔧 환경: ${isDevelopment ? '로컬 개발 (localStorage)' : '프로덕션 (Supabase)'}`);
console.log(`📍 호스트: ${window.location.hostname}`);

// Supabase 클라이언트 초기화
let supabaseClient = null;

function initSupabase() {
    if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
        console.warn('⚠️ Supabase 설정이 없습니다. localStorage를 사용합니다.');
        return null;
    }
    
    if (typeof supabase === 'undefined') {
        console.error('❌ Supabase 라이브러리가 로드되지 않았습니다.');
        return null;
    }
    
    try {
        supabaseClient = supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey
        );
        console.log('✅ Supabase 클라이언트 초기화 완료');
        return supabaseClient;
    } catch (error) {
        console.error('❌ Supabase 초기화 실패:', error);
        return null;
    }
}

// 즉시 초기화 실행!
console.log('🚀 Supabase 초기화 시작...');
supabaseClient = initSupabase();

// Supabase 저장소 관리 (사용자 인증 반영)
const supabaseStorage = {
    // 현재 사용자 ID 가져오기
    getCurrentUserId: async () => {
        if (!supabaseClient) return null;
        
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            return user?.id || null;
        } catch (error) {
            console.error('사용자 정보 가져오기 실패:', error);
            return null;
        }
    },
    
    // 모든 일기 가져오기 (현재 사용자 것만 또는 게스트)
    getAllDiaries: async () => {
        if (!supabaseClient) {
            return storage.getAllDiaries(); // localStorage fallback
        }
        
        try {
            const userId = await supabaseStorage.getCurrentUserId();
            
            debug('현재 사용자 ID:', userId);
            
            let query = supabaseClient
                .from('diaries')
                .select('*')
                .order('date', { ascending: false });
            
            // 로그인한 사용자면 자신의 일기만, 아니면 게스트 일기만
            if (userId) {
                query = query.eq('user_id', userId);
            } else {
                query = query.is('user_id', null);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            debug('Supabase에서 가져온 일기:', data);
            
            // 데이터 변환 (content -> text)
            const transformedData = (data || []).map(diary => ({
                ...diary,
                text: diary.content || diary.text // content를 text로 매핑
            }));
            
            return transformedData;
        } catch (error) {
            console.error('일기 가져오기 실패:', error);
            return storage.getAllDiaries();
        }
    },
    
    // 일기 저장
    saveDiary: async (diary) => {
        if (!supabaseClient) {
            return storage.saveDiary(diary);
        }
        
        try {
            const userId = await supabaseStorage.getCurrentUserId();
            
            debug('일기 저장 시도 - 사용자 ID:', userId);
            
            // user_id 추가 및 필드명 변환 (text -> content)
            const diaryData = {
                id: diary.id,
                user_id: userId,
                date: diary.date,
                title: diary.title,
                content: diary.text || diary.content, // text를 content로 변환
                images: diary.images,
                mood: diary.mood,
                weather: diary.weather
            };
            
            debug('Supabase에 저장할 데이터:', diaryData);
            
            const { data, error } = await supabaseClient
                .from('diaries')
                .upsert(diaryData)
                .select()
                .single();
            
            if (error) throw error;
            
            debug('Supabase 저장 성공:', data);
            
            // localStorage에도 백업
            storage.saveDiary(diary);
            
            return data;
        } catch (error) {
            console.error('일기 저장 실패:', error);
            showToast('일기 저장 실패: ' + error.message);
            return storage.saveDiary(diary);
        }
    },
    
    // ID로 일기 가져오기
    getDiaryById: async (id) => {
        if (!supabaseClient) {
            return storage.getDiaryById(id);
        }
        
        try {
            const userId = await supabaseStorage.getCurrentUserId();
            
            let query = supabaseClient
                .from('diaries')
                .select('*')
                .eq('id', id);
            
            // 사용자 필터링 (RLS가 처리하지만 명시적으로 추가)
            if (userId) {
                query = query.eq('user_id', userId);
            } else {
                query = query.is('user_id', null);
            }
            
            const { data, error } = await query.single();
            
            if (error) throw error;
            
            // 데이터 변환 (content -> text)
            if (data) {
                return {
                    ...data,
                    text: data.content || data.text
                };
            }
            
            return data;
        } catch (error) {
            console.error('일기 가져오기 실패:', error);
            return storage.getDiaryById(id);
        }
    },
    
    // 일기 삭제
    deleteDiary: async (id) => {
        if (!supabaseClient) {
            return storage.deleteDiary(id);
        }
        
        try {
            const { error } = await supabaseClient
                .from('diaries')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            // localStorage에서도 삭제
            storage.deleteDiary(id);
        } catch (error) {
            console.error('일기 삭제 실패:', error);
            storage.deleteDiary(id);
        }
    }
};
