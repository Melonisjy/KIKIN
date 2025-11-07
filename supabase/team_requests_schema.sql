-- 팀 가입 요청 테이블 생성
CREATE TABLE IF NOT EXISTS team_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, team_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_team_requests_user_id ON team_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_team_requests_team_id ON team_requests(team_id);
CREATE INDEX IF NOT EXISTS idx_team_requests_status ON team_requests(status);

-- RLS 활성화
ALTER TABLE team_requests ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 가입 요청을 볼 수 있음
CREATE POLICY "Users can view their own requests"
  ON team_requests FOR SELECT
  USING (user_id = auth.uid());

-- RLS 정책: 팀장은 자신의 팀의 가입 요청을 볼 수 있음
CREATE POLICY "Team leaders can view requests for their teams"
  ON team_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_requests.team_id
      AND teams.created_by = auth.uid()
    )
  );

-- RLS 정책: 사용자는 자신의 가입 요청을 생성할 수 있음
CREATE POLICY "Users can create join requests"
  ON team_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS 정책: 팀장은 자신의 팀의 가입 요청을 승인/거절할 수 있음
CREATE POLICY "Team leaders can update requests for their teams"
  ON team_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_requests.team_id
      AND teams.created_by = auth.uid()
    )
  );

-- RLS 정책: 팀장은 자신의 팀의 가입 요청을 삭제할 수 있음
CREATE POLICY "Team leaders can delete requests for their teams"
  ON team_requests FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_requests.team_id
      AND teams.created_by = auth.uid()
    )
  );

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_team_requests_updated_at
  BEFORE UPDATE ON team_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

