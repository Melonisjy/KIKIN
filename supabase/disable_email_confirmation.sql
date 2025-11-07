-- 개발 환경용: 이메일 확인 자동 처리
-- 이 SQL을 Supabase SQL Editor에서 실행하면 새로 가입한 사용자의 이메일이 자동으로 확인됩니다.

-- 함수: 새 사용자 가입 시 이메일 자동 확인
CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
  -- 이메일 확인 상태를 자동으로 true로 설정
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id AND email_confirmed_at IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거: 사용자 생성 시 자동으로 이메일 확인
DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_auto_confirm
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_email();

-- 기존 미확인 사용자들의 이메일도 확인 처리 (선택사항)
-- 주의: 이 SQL을 실행하면 모든 미확인 사용자의 이메일이 확인됩니다.
-- UPDATE auth.users
-- SET email_confirmed_at = NOW()
-- WHERE email_confirmed_at IS NULL;

