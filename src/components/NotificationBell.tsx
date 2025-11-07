"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/Toast";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_id?: string | null;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const fetchNotifications = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (fetchError) {
        // 테이블이 없거나 RLS 정책 문제일 수 있으므로 에러를 무시하고 빈 배열 반환
        setNotifications([]);
        setError(null);
      } else {
        setNotifications(data || []);
        setError(null);
      }
    } catch (err) {
      setNotifications([]);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // 실시간 업데이트를 위한 구독
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const { error: updateError } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("user_id", user.id);

      if (updateError) {
        toast.error("알림 읽음 처리 중 오류가 발생했습니다.");
      } else {
        // 로컬 상태 업데이트
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
      }
    } catch (err) {
      toast.error("알림 읽음 처리 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const { error: deleteError } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId)
        .eq("user_id", user.id);

      if (deleteError) {
        toast.error("알림 삭제 중 오류가 발생했습니다.");
      } else {
        // 로컬 상태에서 제거
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notificationId)
        );
        toast.success("알림이 삭제되었습니다.");
      }
    } catch (err) {
      toast.error("알림 삭제 중 오류가 발생했습니다.");
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (isLoading) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative min-w-[44px] min-h-[44px]"
        aria-label="알림"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-[#27272A] bg-[#181A1F] shadow-lg z-50 max-h-[500px] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-[#27272A]">
            <h3 className="text-lg font-semibold text-[#F4F4F5]">알림</h3>
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-500/10 text-red-400 px-2 py-1 text-xs font-medium">
                읽지 않음 {unreadCount}개
              </span>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {error ? (
              <div className="p-4 text-center text-sm text-[#A1A1AA]">
                알림을 불러올 수 없습니다.
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="mx-auto h-8 w-8 text-[#A1A1AA] mb-2" />
                <p className="text-sm text-[#A1A1AA]">알림이 없습니다.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#27272A]">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-[#27272A]/50 transition-colors ${
                      !notification.is_read
                        ? "bg-[#00C16A]/5 border-l-2 border-l-[#00C16A]"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h4
                          className={`text-sm font-medium mb-1 ${
                            notification.is_read
                              ? "text-[#A1A1AA]"
                              : "text-[#F4F4F5]"
                          }`}
                        >
                          {notification.title}
                        </h4>
                        <p
                          className={`text-xs mb-2 ${
                            notification.is_read
                              ? "text-[#71717A]"
                              : "text-[#A1A1AA]"
                          }`}
                        >
                          {notification.message}
                        </p>
                        <p className="text-xs text-[#71717A]">
                          {new Date(notification.created_at).toLocaleString(
                            "ko-KR"
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.is_read && (
                          <Button
                            onClick={() => handleMarkAsRead(notification.id)}
                            size="icon-sm"
                            variant="ghost"
                            className="min-w-[32px] min-h-[32px]"
                            aria-label="읽음 처리"
                            type="button"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDelete(notification.id)}
                          size="icon-sm"
                          variant="ghost"
                          className="min-w-[32px] min-h-[32px] text-[#71717A] hover:text-red-400"
                          aria-label="삭제"
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

