"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Shirt, Calendar, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function MobileBottomNav() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkAuth();
  }, []);

  // 로그인하지 않았거나 데스크톱에서는 표시하지 않음
  if (!isLoggedIn) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[200] border-t border-[#2C354B] bg-[#0F1115]/95 backdrop-blur-md supports-[backdrop-filter]:backdrop-blur-md md:hidden">
      <div className="flex h-16 items-center justify-around">
        <Link
          href="/"
          className={`flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] px-4 py-2 transition-colors touch-manipulation ${
            isActive("/")
              ? "text-[#00C16A]"
              : "text-[#A1A1AA] active:text-[#00C16A]"
          }`}
          aria-label="홈"
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-medium">홈</span>
        </Link>

        <Link
          href="/locker-room"
          className={`flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] px-4 py-2 transition-colors touch-manipulation ${
            isActive("/locker-room")
              ? "text-[#00C16A]"
              : "text-[#A1A1AA] active:text-[#00C16A]"
          }`}
          aria-label="라커룸"
        >
          <Shirt className="h-5 w-5" />
          <span className="text-[10px] font-medium">라커룸</span>
        </Link>

        <Link
          href="/match/new"
          className={`flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] px-4 py-2 transition-colors touch-manipulation ${
            isActive("/match/new")
              ? "text-[#00C16A]"
              : "text-[#A1A1AA] active:text-[#00C16A]"
          }`}
          aria-label="새 경기"
        >
          <Calendar className="h-5 w-5" />
          <span className="text-[10px] font-medium">경기</span>
        </Link>

        <Link
          href="/locker-room"
          className={`flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] px-4 py-2 transition-colors touch-manipulation ${
            isActive("/team")
              ? "text-[#00C16A]"
              : "text-[#A1A1AA] active:text-[#00C16A]"
          }`}
          aria-label="프로필"
        >
          <User className="h-5 w-5" />
          <span className="text-[10px] font-medium">내정보</span>
        </Link>
      </div>
    </nav>
  );
}

