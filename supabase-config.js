// Supabase 클라이언트 설정
// 브라우저에서 사용할 설정 파일

// Supabase 프로젝트 정보 (환경 변수 또는 직접 입력)
const SUPABASE_CONFIG = {
    url: 'https://iyctjxnpwnwobyhiroua.supabase.co', // Supabase Project URL을 여기에 입력
    anonKey: 'sb_publishable_2bjVEDEF55i61KCaeLR1sQ_0YCdYtpb' // Supabase Anon Key를 여기에 입력
};

// Supabase 클라이언트 초기화
let supabaseClient = null;

function initSupabase() {
    if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
        console.warn('Supabase 설정이 없습니다. localStorage를 사용합니다.');
        return null;
    }
    
    try {
        supabaseClient = supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey
        );
        return supabaseClient;
    } catch (error) {
        console.error('Supabase 초기화 실패:', error);
        return null;
    }
}

// Supabase 저장소 관리
const supabaseStorage = {
    // 모든 일기 가져오기
    getAllDiaries: async () => {
        if (!supabaseClient) {
            return storage.getAllDiaries(); // localStorage fallback
        }
        
        try {
            const { data, error } = await supabaseClient
                .from('diaries')
                .select('*')
                .order('date', { ascending: false });
            
            if (error) throw error;
            return data || [];
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
            const { data, error } = await supabaseClient
                .from('diaries')
                .upsert(diary)
                .select()
                .single();
            
            if (error) throw error;
            
            // localStorage에도 백업
            storage.saveDiary(diary);
            
            return data;
        } catch (error) {
            console.error('일기 저장 실패:', error);
            return storage.saveDiary(diary);
        }
    },
    
    // ID로 일기 가져오기
    getDiaryById: async (id) => {
        if (!supabaseClient) {
            return storage.getDiaryById(id);
        }
        
        try {
            const { data, error } = await supabaseClient
                .from('diaries')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
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

// 페이지 로드 시 Supabase 초기화
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        initSupabase();
    });
}

