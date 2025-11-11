"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface BreadcrumbItem {
  label: string;
  href: string;
}

export function Breadcrumb() {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [matchTitle, setMatchTitle] = useState<string | null>(null);

  useEffect(() => {
    const generateBreadcrumbs = async () => {
      const items: BreadcrumbItem[] = [];

      // 홈은 항상 첫 번째
      if (pathname !== "/") {
        items.push({ label: "홈", href: "/" });
      }

      // 경로 분석
      const pathSegments = pathname.split("/").filter(Boolean);

      for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        const href = "/" + pathSegments.slice(0, i + 1).join("/");

        if (segment === "locker-room") {
          items.push({ label: "라커룸", href });
        } else if (segment === "team") {
          if (pathSegments[i + 1] === "new") {
            items.push({ label: "새 팀 만들기", href });
            break;
          } else if (pathSegments[i + 1]) {
            // 팀 ID가 있는 경우, 팀 이름 가져오기
            const teamId = pathSegments[i + 1];
            if (!teamName) {
              try {
                const supabase = createClient();
                const {
                  data: { user },
                } = await supabase.auth.getUser();
                if (user) {
                  const { data: team } = await supabase
                    .from("teams")
                    .select("name")
                    .eq("id", teamId)
                    .single();
                  if (team) {
                    setTeamName(team.name);
                    items.push({ label: team.name, href });
                  } else {
                    items.push({ label: "팀", href });
                  }
                } else {
                  items.push({ label: "팀", href });
                }
              } catch (error) {
                items.push({ label: "팀", href });
              }
            } else {
              items.push({ label: teamName, href });
            }
          }
        } else if (segment === "match") {
          if (pathSegments[i + 1] === "new") {
            items.push({ label: "새 경기 만들기", href });
            break;
          } else if (pathSegments[i + 1]) {
            // 경기 ID가 있는 경우
            const matchId = pathSegments[i + 1];
            if (!matchTitle) {
              try {
                const supabase = createClient();
                const {
                  data: { user },
                } = await supabase.auth.getUser();
                if (user) {
                  const { data: match } = await supabase
                    .from("matches")
                    .select("date, time, location")
                    .eq("id", matchId)
                    .single();
                  if (match) {
                    const matchDate = new Date(`${match.date}T${match.time || "00:00"}`);
                    const formattedDate = new Intl.DateTimeFormat("ko-KR", {
                      month: "long",
                      day: "numeric",
                    }).format(matchDate);
                    const title = `${formattedDate} 경기`;
                    setMatchTitle(title);
                    items.push({ label: title, href });
                  } else {
                    items.push({ label: "경기", href });
                  }
                } else {
                  items.push({ label: "경기", href });
                }
              } catch (error) {
                items.push({ label: "경기", href });
              }
            } else {
              items.push({ label: matchTitle, href });
            }
          }
        } else if (segment === "login") {
          items.push({ label: "로그인", href });
        } else if (segment === "feedback") {
          items.push({ label: "피드백", href });
        }
      }

      setBreadcrumbs(items);
    };

    generateBreadcrumbs();
  }, [pathname, teamName, matchTitle]);

  // 홈페이지에서는 브레드크럼 표시 안 함
  if (pathname === "/" || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav
      className="border-b border-[#2C354B]/50 bg-[#0F1115]/80 backdrop-blur-sm"
      aria-label="Breadcrumb"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <ol className="flex h-10 items-center space-x-2 text-sm">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <li key={item.href} className="flex items-center">
                {index === 0 && (
                  <Home className="mr-1 h-3.5 w-3.5 text-[#A1A1AA]" />
                )}
                {isLast ? (
                  <span className="font-medium text-[#F4F4F5]">{item.label}</span>
                ) : (
                  <>
                    <Link
                      href={item.href}
                      className="text-[#A1A1AA] transition-colors hover:text-[#00C16A]"
                    >
                      {item.label}
                    </Link>
                    <ChevronRight className="mx-2 h-3.5 w-3.5 text-[#2C354B]" />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

