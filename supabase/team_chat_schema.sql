-- Team Chat Messages Table
CREATE TABLE IF NOT EXISTS team_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_team_chat_messages_team_id ON team_chat_messages(team_id);
CREATE INDEX IF NOT EXISTS idx_team_chat_messages_created_at ON team_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_chat_messages_user_id ON team_chat_messages(user_id);

-- Enable RLS
ALTER TABLE team_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- 팀 멤버만 메시지를 볼 수 있음
CREATE POLICY "Team members can view messages"
  ON team_chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.team_id = team_chat_messages.team_id
      AND members.user_id = auth.uid()
    )
  );

-- 팀 멤버만 메시지를 보낼 수 있음
CREATE POLICY "Team members can send messages"
  ON team_chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.team_id = team_chat_messages.team_id
      AND members.user_id = auth.uid()
    )
    AND auth.uid() = user_id
  );

-- 본인이 작성한 메시지만 수정 가능
CREATE POLICY "Users can update their own messages"
  ON team_chat_messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 본인이 작성한 메시지만 삭제 가능
CREATE POLICY "Users can delete their own messages"
  ON team_chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime for team_chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE team_chat_messages;

