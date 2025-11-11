"use client";

import { useEffect, useRef, useState } from "react";
import { Users, Calendar, CheckCircle, Zap } from "lucide-react";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: <Users className="h-6 w-6 text-[#00C16A]" />,
    title: "라인업 구성",
    description:
      "팀 코드를 공유해 팀원을 합류시키고, 라커룸에서 선수단 정보를 정비하세요.",
  },
  {
    icon: <Calendar className="h-6 w-6 text-[#00C16A]" />,
    title: "매치 스케줄링",
    description:
      "경기 날짜·시간·구장을 라인업처럼 정리하고, 킥오프 정보를 팀원들과 공유하세요.",
  },
  {
    icon: <CheckCircle className="h-6 w-6 text-[#00C16A]" />,
    title: "출석 체크",
    description:
      "참석·불참·미정을 받아 라인업 공석을 확인하고, 확정된 멤버로 작전을 세워보세요.",
  },
  {
    icon: <Zap className="h-6 w-6 text-[#00C16A]" />,
    title: "경기 브리핑",
    description:
      "카카오톡 없이도 경기 정보와 변경 사항을 빠르게 공지하고 확인할 수 있습니다.",
  },
  {
    icon: <Users className="h-6 w-6 text-[#00C16A]" />,
    title: "감독 모드",
    description:
      "팀장은 경기 편성, 공지, 멤버 관리를 한 화면에서 지휘할 수 있습니다.",
  },
  {
    icon: <Calendar className="h-6 w-6 text-[#00C16A]" />,
    title: "빠른 합류",
    description:
      "Google 계정으로 로그인해 라커룸에 합류하고, 매치 브리핑을 바로 확인하세요.",
  },
];

export function FeaturesSection() {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    itemRefs.current.forEach((ref, index) => {
      if (!ref) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisibleItems((prev) => new Set(prev).add(index));
              observer.unobserve(ref);
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: "0px 0px -50px 0px",
        }
      );

      observer.observe(ref);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  return (
    <section className="border-t border-[#2C354B] bg-[#121929] py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#F4F4F5] sm:text-4xl">
            킥-인 라커룸 하이라이트
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const isVisible = visibleItems.has(index);
              return (
                <div
                  key={index}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  className={`group surface-layer rounded-xl p-6 transition-all duration-300 ${
                    isVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8"
                  } hover:scale-[1.02] hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] hover:shadow-[0_8px_24px_rgba(0,193,106,0.15)]`}
                  style={{
                    transitionDelay: isVisible ? `${index * 50}ms` : "0ms",
                  }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#2C354B] bg-[#141824] transition-transform duration-300 group-hover:scale-110">
                    {feature.icon}
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-[#F4F4F5] transition-colors duration-200 group-hover:text-[#FFFFFF]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-[#A1A1AA] transition-colors duration-200 group-hover:text-[#CBD5E1]">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

