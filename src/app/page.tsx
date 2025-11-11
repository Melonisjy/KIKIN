import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users, Calendar, CheckCircle, Zap, ArrowRight } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-[#00C16A] sm:text-6xl">
            킥-인과 함께 라인업을 준비하세요
          </h1>
          <p className="mt-6 text-lg leading-8 text-[#A1A1AA] sm:text-xl font-medium">
            팀 스케줄과 출석을 라커룸에서 한 번에 정리하고, 킥오프에만
            집중하세요.
          </p>
          <p className="mt-4 text-base text-[#A1A1AA]">
            단톡방 대신 킥-인에 모여 경기 정보를 공유하고, 출석 현황을
            라인업처럼 확인해요.
          </p>
          {!user ? (
            <div className="mt-10 flex items-center justify-center">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto">
                  지금 킥오프
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/locker-room">
                <Button size="lg" className="w-full sm:w-auto">
                  라커룸 입장
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-[#2C354B] bg-[#121929] py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-bold tracking-tight text-[#F4F4F5] sm:text-4xl">
              킥-인 라커룸 하이라이트
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="surface-layer rounded-xl p-6 transition-all duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#2C354B] bg-[#141824]">
                  <Users className="h-6 w-6 text-[#00C16A]" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-[#F4F4F5]">
                  라인업 구성
                </h3>
                <p className="mt-2 text-sm text-[#A1A1AA]">
                  팀 코드를 공유해 팀원을 합류시키고, 라커룸에서 선수단 정보를
                  정비하세요.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="surface-layer rounded-xl p-6 transition-all duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#2C354B] bg-[#141824]">
                  <Calendar className="h-6 w-6 text-[#00C16A]" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-[#F4F4F5]">
                  매치 스케줄링
                </h3>
                <p className="mt-2 text-sm text-[#A1A1AA]">
                  경기 날짜·시간·구장을 라인업처럼 정리하고, 킥오프 정보를
                  팀원들과 공유하세요.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="surface-layer rounded-xl p-6 transition-all duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#2C354B] bg-[#141824]">
                  <CheckCircle className="h-6 w-6 text-[#00C16A]" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-[#F4F4F5]">
                  출석 체크
                </h3>
                <p className="mt-2 text-sm text-[#A1A1AA]">
                  참석·불참·미정을 받아 라인업 공석을 확인하고, 확정된 멤버로
                  작전을 세워보세요.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="surface-layer rounded-xl p-6 transition-all duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#2C354B] bg-[#141824]">
                  <Zap className="h-6 w-6 text-[#00C16A]" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-[#F4F4F5]">
                  경기 브리핑
                </h3>
                <p className="mt-2 text-sm text-[#A1A1AA]">
                  카카오톡 없이도 경기 정보와 변경 사항을 빠르게 공지하고 확인할
                  수 있습니다.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="surface-layer rounded-xl p-6 transition-all duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#2C354B] bg-[#141824]">
                  <Users className="h-6 w-6 text-[#00C16A]" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-[#F4F4F5]">
                  감독 모드
                </h3>
                <p className="mt-2 text-sm text-[#A1A1AA]">
                  팀장은 경기 편성, 공지, 멤버 관리를 한 화면에서 지휘할 수
                  있습니다.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="surface-layer rounded-xl p-6 transition-all duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#2C354B] bg-[#141824]">
                  <Calendar className="h-6 w-6 text-[#00C16A]" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-[#F4F4F5]">
                  빠른 합류
                </h3>
                <p className="mt-2 text-sm text-[#A1A1AA]">
                  Google 계정으로 로그인해 라커룸에 합류하고, 매치 브리핑을 바로
                  확인하세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="surface-layer mx-auto max-w-2xl rounded-xl p-8 text-center transition-all duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)]">
          <h2 className="text-2xl font-bold text-[#00C16A] sm:text-3xl">
            지금 바로 킥오프하세요
          </h2>
          <p className="mt-4 text-[#A1A1AA]">
            킥-인 라커룸에서 팀 스케줄과 출석을 한 번에 정리해 보세요.
          </p>
          <div className="mt-8">
            {!user ? (
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto">
                  무료로 킥오프
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/locker-room">
                <Button size="lg" className="w-full sm:w-auto">
                  라커룸 입장
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
