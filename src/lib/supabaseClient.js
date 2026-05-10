import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // 개발 중 환경변수 누락을 바로 알기 위한 메시지입니다.
  // 실제 서비스에서는 Vercel Environment Variables에 값을 넣어주세요.
  console.warn('Supabase 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
