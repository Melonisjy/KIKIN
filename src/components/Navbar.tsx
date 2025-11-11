"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Menu,
  X,
  LogOut,
  User,
  Sparkles,
  MessageSquare,
  Home,
  Shirt,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { FeedbackModal } from "@/components/FeedbackModal";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function Navbar() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // 프로필 정보 가져오기 함수 (API 라우트 사용)
  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/profile/get-name");
      const data = await response.json();
      return data.name || null;
    } catch (error) {
      console.error("프로필 조회 예외:", error);
      return null;
    }
  };

  useEffect(() => {
    let supabase;
    try {
      supabase = createClient();
    } catch (error) {
      console.error("Supabase client creation failed:", error);
      setHasError(true);
      return;
    }

    const checkUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setIsLoggedIn(!!user);
        setUserEmail(user?.email || null);

        // 프로필에서 이름 가져오기
        if (user) {
          const name = await fetchUserProfile();
          setUserName(name);
        } else {
          setUserName(null);
        }
      } catch (error) {
        console.error("Error checking user:", error);
        setHasError(true);
      }
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsLoggedIn(!!session);
      setUserEmail(session?.user?.email || null);

      // 프로필에서 이름 가져오기
      if (session?.user) {
        const name = await fetchUserProfile();
        setUserName(name);
      } else {
        setUserName(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 페이지 포커스 시 프로필 정보 새로고침 (이름 변경 후 반영)
  useEffect(() => {
    const handleFocus = async () => {
      if (isLoggedIn) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const name = await fetchUserProfile();
          setUserName(name);
        } else {
          setUserName(null);
        }
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isLoggedIn]);

  // 컴포넌트 마운트 후 추가로 프로필 조회
  useEffect(() => {
    if (isLoggedIn) {
      const refreshProfile = async () => {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const name = await fetchUserProfile();
          setUserName(name);
        }
      };

      refreshProfile();
    }
  }, [isLoggedIn]);

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 스크롤 이벤트 리스너
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      setIsScrolled(currentScrollY > 20);
    };

    // 초기 스크롤 위치 확인
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return; // 중복 클릭 방지

    setIsLoggingOut(true);

    // 쿠키 즉시 삭제
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
      if (name.startsWith("sb-")) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    });

    // signOut을 백그라운드에서 실행하되 기다리지 않음
    const supabase = createClient();
    supabase.auth.signOut().catch((error) => {
      console.error("SignOut error (ignored):", error);
    });

    // 즉시 리다이렉트
    window.location.href = "/";
  };

  const getInitials = (text: string) => {
    return text.charAt(0).toUpperCase();
  };

  // 이름이 있으면 이름 우선, 없으면 이메일
  const displayText = userName ? userName : userEmail || "";

  // 스크롤에 따른 헤더 스타일 계산
  const headerHeight = isMobile
    ? isScrolled
      ? "h-12"
      : "h-14"
    : isScrolled
    ? "h-14"
    : "h-16";
  const headerOpacity = isScrolled ? "bg-[#0F1115]/98" : "bg-[#0F1115]/95";
  const headerShadow = isScrolled ? "shadow-[0_4px_24px_rgba(0,0,0,0.4)]" : "";
  const logoSize = isMobile
    ? isScrolled
      ? "text-base"
      : "text-lg"
    : isScrolled
    ? "text-lg"
    : "text-xl";
  const borderOpacity = isScrolled ? "border-[#2C354B]/80" : "border-[#2C354B]";

  return (
    <>
      {/* 헤더 공간 확보 (스크롤 시 높이 조절) */}
      <div
        className={`${
          isMobile
            ? isScrolled
              ? "h-12"
              : "h-14"
            : isScrolled
            ? "h-14"
            : "h-16"
        } transition-all duration-300`}
        aria-hidden="true"
      />

      <nav
        className={`fixed top-0 left-0 right-0 z-[250] w-full border-b ${borderOpacity} ${headerOpacity} backdrop-blur-md supports-[backdrop-filter]:backdrop-blur-md transition-all duration-300 ${headerShadow}`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`flex ${headerHeight} items-center justify-between transition-all duration-300`}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <span
                className={`${logoSize} font-bold text-[#00C16A] transition-all duration-300 group-hover:text-[#00A85B]`}
              >
                킥-인
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/locker-room"
                    className="px-4 py-2 text-sm font-medium text-[#F4F4F5] hover:text-[#00C16A] transition-colors"
                  >
                    라커룸
                  </Link>
                  <NotificationBell />
                  <button
                    type="button"
                    onClick={() => setIsFeedbackOpen(true)}
                    className="relative inline-flex items-center gap-2 rounded-full border border-[#2C354B] bg-[#141824] px-4 py-2 text-sm font-medium text-[#F4F4F5] shadow-sm transition hover:border-[#00C16A] hover:text-[#00C16A]"
                  >
                    <Sparkles className="h-4 w-4 text-[#00C16A]" />
                    피드백
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#00C16A] animate-ping" />
                  </button>
                  <div className="flex items-center gap-3 pl-4 border-l">
                    {displayText && (
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00C16A] text-[#0F1115] text-xs font-semibold">
                          {getInitials(displayText)}
                        </div>
                        <span className="text-sm text-[#A1A1AA] max-w-[150px] truncate">
                          {displayText}
                        </span>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
                    </Button>
                  </div>
                </>
              ) : (
                <Link href="/login">
                  <Button variant="default">Login</Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button and Notification */}
            <div className="md:hidden flex items-center gap-1.5">
              {isLoggedIn && !isScrolled && <NotificationBell />}
              {isLoggedIn && isScrolled && (
                <Link
                  href="/locker-room"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md text-[#F4F4F5] hover:bg-[#141824] transition-colors touch-manipulation"
                  aria-label="라커룸"
                >
                  <Shirt className="h-5 w-5" />
                </Link>
              )}
              <button
                className="min-w-[44px] min-h-[44px] p-2 rounded-md text-[#F4F4F5] hover:bg-[#141824] transition-colors cursor-pointer touch-manipulation"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="메뉴 토글"
                aria-expanded={isMenuOpen}
                type="button"
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div
              className={`md:hidden border-t ${
                isScrolled ? "border-[#2C354B]/80" : "border-[#2C354B]"
              }`}
              role="menu"
              aria-label="메인 메뉴"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/locker-room"
                      className="flex items-center gap-2 px-3 py-2 text-base font-medium text-[#F4F4F5] hover:bg-[#141824] rounded-md transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      라커룸
                    </Link>
                    {displayText && (
                      <div className="flex items-center gap-2 px-3 py-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00C16A] text-[#0F1115] text-xs font-semibold">
                          {getInitials(displayText)}
                        </div>
                        <span className="text-sm text-[#A1A1AA] truncate flex-1">
                          {displayText}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      disabled={isLoggingOut}
                      className="flex w-full items-center gap-2 px-3 py-2 text-base font-medium text-[#F4F4F5] hover:bg-[#141824] rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <LogOut className="h-4 w-4" />
                      {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
                    </button>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsFeedbackOpen(true);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-base font-medium text-[#F4F4F5] hover:bg-[#141824] rounded-md transition-colors"
                      type="button"
                    >
                      <MessageSquare className="h-4 w-4 text-[#00C16A]" />
                      피드백 보내기
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="block px-3 py-2 text-base font-medium text-[#F4F4F5] hover:bg-[#141824] rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
      <Breadcrumb />
      {isLoggedIn && (
        <>
          <button
            type="button"
            onClick={() => setIsFeedbackOpen(true)}
            className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-[#00C16A] px-5 py-3 text-sm font-semibold text-[#0F1115] shadow-lg shadow-[#00C16A]/40 transition hover:bg-[#00E693] focus:outline-none focus:ring-2 focus:ring-[#00C16A] focus:ring-offset-2 focus:ring-offset-[#0F1115]"
            aria-label="피드백 보내기"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">피드백</span>
          </button>
          <FeedbackModal
            isOpen={isFeedbackOpen}
            onClose={() => setIsFeedbackOpen(false)}
            userName={userName}
            userEmail={userEmail}
          />
        </>
      )}
    </>
  );
}
