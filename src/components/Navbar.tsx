"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, LogOut, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

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
      } catch (error) {
        console.error("Error checking user:", error);
        setHasError(true);
      }
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      setUserEmail(session?.user?.email || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  return (
    <nav className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <span className="text-xl font-bold text-foreground bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent group-hover:from-[#764ba2] group-hover:to-[#667eea] transition-all duration-300">
              킥-인
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  대시보드
                </Link>
                <div className="flex items-center gap-3 pl-4 border-l">
                  {userEmail && (
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white text-xs font-medium shadow-sm">
                        {getInitials(userEmail)}
                      </div>
                      <span className="text-sm text-muted-foreground max-w-[150px] truncate">
                        {userEmail}
                      </span>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    로그아웃
                  </Button>
                </div>
              </>
            ) : (
              <Link href="/login">
                <Button variant="default">Login</Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-foreground hover:bg-muted transition-colors cursor-pointer"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-3 py-2 text-base font-medium text-foreground hover:bg-muted rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    대시보드
                  </Link>
                  {userEmail && (
                    <div className="flex items-center gap-2 px-3 py-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white text-xs font-medium shadow-sm">
                        {getInitials(userEmail)}
                      </div>
                      <span className="text-sm text-muted-foreground truncate flex-1">
                        {userEmail}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-base font-medium text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    로그아웃
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="block px-3 py-2 text-base font-medium text-foreground hover:bg-muted rounded-md transition-colors"
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
  );
}
