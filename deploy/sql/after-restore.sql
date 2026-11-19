-- Supabase에서 옮겨 온 직후(또는 백업에서 복원한 직후) 한 번 실행한다. 여러 번 실행해도 된다.

-- 1) RLS 끄기
-- Supabase에서는 표가 공개 REST API로 노출돼서 RLS를 켜 두었다(project_supabase_rls).
-- 학과 서버에는 그런 API가 없고, RLS가 켜져 있으면 정책이 없는 ai_reader는 0건을 읽게 된다.
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;

-- 2) AI 서버가 읽는 표만 허용
GRANT SELECT ON public.faqs, public.inquiries TO ai_reader;

-- 3) 통계 갱신 (복원 직후에는 비어 있어 첫 쿼리들이 느릴 수 있다)
ANALYZE;
