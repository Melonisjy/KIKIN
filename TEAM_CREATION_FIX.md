# 팀 생성 문제 해결 가이드

## 문제

팀 생성 시 에러가 발생합니다. 이는 RLS (Row Level Security) 정책 문제입니다.

## 해결 방법

### 1단계: Supabase에서 RLS 정책 수정

1. Supabase Dashboard > SQL Editor로 이동
2. `supabase/fix_team_creation.sql` 파일의 내용을 복사
3. SQL Editor에 붙여넣고 실행

이 스크립트는:
- 기존의 "Team leaders can add members" 정책을 제거
- 새로운 정책 생성: 팀 생성자가 자신을 첫 멤버로 추가할 수 있도록 허용
- 팀 SELECT 정책도 업데이트하여 생성자가 즉시 팀을 볼 수 있도록 함

### 2단계: 브라우저 콘솔 확인

개발자 도구(F12) > Console 탭에서 자세한 에러 메시지를 확인하세요:

- `Team creation error:` - 팀 생성 에러
- `Member creation error:` - 멤버 추가 에러
- `Error details:` - 상세 에러 정보

### 3단계: 일반적인 문제들

#### 문제 1: "new row violates row-level security policy"
**원인**: RLS 정책이 INSERT를 차단
**해결**: `fix_team_creation.sql` 실행

#### 문제 2: "permission denied for table teams"
**원인**: 테이블 권한 문제
**해결**: Supabase에서 RLS가 올바르게 설정되었는지 확인

#### 문제 3: "relation does not exist"
**원인**: 테이블이 생성되지 않음
**해결**: `supabase/schema.sql`을 먼저 실행

## 빠른 체크리스트

- [ ] `supabase/schema.sql` 실행 완료
- [ ] `supabase/fix_team_creation.sql` 실행 완료
- [ ] 브라우저 콘솔에서 에러 메시지 확인
- [ ] 사용자가 로그인되어 있는지 확인
- [ ] Supabase 프로젝트가 올바르게 설정되었는지 확인

## 테스트

1. `/team/new` 페이지 접속
2. 팀 이름 입력 (예: "테스트팀")
3. 설명 입력 (선택사항)
4. "팀 생성" 클릭
5. 성공하면 `/team/[teamId]`로 리다이렉트되어야 함

## 여전히 안 되는 경우

브라우저 콘솔의 전체 에러 메시지를 확인하고 다음을 체크하세요:

1. **RLS 정책 확인**:
   - Supabase Dashboard > Authentication > Policies
   - `teams` 테이블과 `members` 테이블의 정책 확인

2. **테이블 존재 확인**:
   - Supabase Dashboard > Table Editor
   - `teams`와 `members` 테이블이 존재하는지 확인

3. **사용자 인증 확인**:
   - 로그인이 올바르게 되어 있는지 확인
   - Supabase Dashboard > Authentication > Users에서 사용자 확인

