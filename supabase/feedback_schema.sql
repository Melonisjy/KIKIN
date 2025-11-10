-- Feedback submissions table for user reports
CREATE TABLE IF NOT EXISTS feedback_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_code TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  screenshot_url TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT '접수',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_submissions_ticket_code
  ON feedback_submissions(ticket_code);

ALTER TABLE feedback_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "사용자는 피드백을 등록할 수 있음"
  ON feedback_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "티켓으로 피드백을 조회할 수 있음"
  ON feedback_submissions FOR SELECT
  USING (true);

