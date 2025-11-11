"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  user_name?: string | null;
}

interface TeamChatProps {
  teamId: string;
  currentUserId: string;
}

export function TeamChat({ teamId, currentUserId }: TeamChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // 현재 사용자 이름 가져오기
  useEffect(() => {
    const fetchCurrentUserName = async () => {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("name")
        .eq("id", currentUserId)
        .single();
      setCurrentUserName(profile?.name || null);
    };
    fetchCurrentUserName();
  }, [currentUserId, supabase]);

  // 메시지 목록 가져오기
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("team_chat_messages")
          .select("id, user_id, message, created_at")
          .eq("team_id", teamId)
          .order("created_at", { ascending: true })
          .limit(100);

        if (fetchError) throw fetchError;

        // 사용자 이름 가져오기
        if (data && data.length > 0) {
          const userIds = [...new Set(data.map((m) => m.user_id))];
          const { data: profiles } = await supabase
            .from("user_profiles")
            .select("id, name")
            .in("id", userIds);

          const profileMap = new Map(
            profiles?.map((p) => [p.id, p.name]) || []
          );

          const messagesWithNames = data.map((msg) => ({
            ...msg,
            user_name: profileMap.get(msg.user_id) || null,
          }));

          setMessages(messagesWithNames);
        }
      } catch (err: any) {
        setError(err.message || "메시지를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [teamId, supabase]);

  // 실시간 구독 설정
  useEffect(() => {
    const channel = supabase
      .channel(`team-chat-${teamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_chat_messages",
          filter: `team_id=eq.${teamId}`,
        },
        async (payload) => {
          // 새 메시지가 추가되면 사용자 이름 가져오기
          try {
            const { data: profile } = await supabase
              .from("user_profiles")
              .select("name")
              .eq("id", payload.new.user_id)
              .single();

            const newMessage: ChatMessage = {
              id: payload.new.id,
              user_id: payload.new.user_id,
              message: payload.new.message,
              created_at: payload.new.created_at,
              user_name: profile?.name || null,
            };

            setMessages((prev) => [...prev, newMessage]);
          } catch (err) {
            // 프로필을 가져오지 못해도 메시지는 표시
            const newMessage: ChatMessage = {
              id: payload.new.id,
              user_id: payload.new.user_id,
              message: payload.new.message,
              created_at: payload.new.created_at,
              user_name: null,
            };
            setMessages((prev) => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, supabase]);

  // 스크롤을 맨 아래로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from("team_chat_messages")
        .insert({
          team_id: teamId,
          user_id: currentUserId,
          message: newMessage.trim(),
        });

      if (insertError) throw insertError;

      setNewMessage("");
    } catch (err: any) {
      setError(err.message || "메시지 전송 중 오류가 발생했습니다.");
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}시간 전`;

    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-lg p-4 border border-[var(--border-soft)] bg-[var(--surface-1)]">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-[#A1A1AA]" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-1)] flex flex-col h-[500px]">
      {/* 채팅 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-soft)]">
        <h3 className="text-sm font-semibold text-[#F4F4F5]">팀 채팅</h3>
        <span className="text-xs text-[#71717A]">{messages.length}개 메시지</span>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-sm text-[#71717A]">
            아직 메시지가 없습니다. 첫 메시지를 보내보세요!
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.user_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}
              >
                {!isOwnMessage && (
                  <div className="flex flex-col items-start gap-1">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00C16A]/15 text-[#00E693] text-xs font-semibold shrink-0">
                      {(msg.user_name || "이름 없음").charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-[#71717A] max-w-[50px] truncate">
                      {msg.user_name || "이름 없음"}
                    </span>
                  </div>
                )}
                <div
                  className={`max-w-[70%] flex flex-col gap-1 ${
                    isOwnMessage ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`rounded-lg px-3 py-2 ${
                      isOwnMessage
                        ? "bg-[#00C16A] text-[#0F1115]"
                        : "bg-[var(--surface-2)] text-[#F4F4F5] border border-[var(--border-soft)]"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.message}
                    </p>
                  </div>
                  <span className={`text-xs text-[#71717A] px-2 ${isOwnMessage ? "text-right" : "text-left"}`}>
                    {formatTime(msg.created_at)}
                  </span>
                </div>
                {isOwnMessage && (
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00C16A]/30 text-[#0F1115] text-xs font-semibold shrink-0">
                      {(currentUserName || "나").charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-[#71717A] max-w-[50px] truncate">
                      {currentUserName || "나"}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="px-4 py-2 text-xs text-red-400 bg-red-500/10 border-t border-[var(--border-soft)]">
          {error}
        </div>
      )}

      {/* 메시지 입력 */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-[var(--border-soft)]"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="flex-1 px-3 py-2 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-2)] text-[#F4F4F5] placeholder-[#71717A] focus:outline-none focus:border-[#00C16A] focus:ring-1 focus:ring-[#00C16A] transition-colors"
            disabled={isSending}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="bg-[#00C16A] hover:bg-[#00E693] text-[#0F1115] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

