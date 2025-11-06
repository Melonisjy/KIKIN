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
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent sm:text-6xl">
            킥-인
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl font-medium">
            풋살 팀 경기 일정을 쉽고 간편하게 관리하세요
          </p>
          <p className="mt-4 text-base text-muted-foreground">
            카카오톡 없이도 팀원들과 경기 일정을 공유하고 참여 여부를 확인할 수
            있습니다
          </p>
          {!user ? (
            <div className="mt-10 flex items-center justify-center">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto">
                  시작하기
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/locker-room">
                <Button size="lg" className="w-full sm:w-auto">
                  라커룸으로 이동
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              주요 기능
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#667eea]/10 to-[#764ba2]/10">
                  <Users className="h-6 w-6 text-[#667eea]" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-card-foreground">
                  팀 관리
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  팀을 생성하고 팀원을 초대하세요. 팀 코드를 통해 간편하게 팀에
                  가입할 수 있습니다.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#667eea]/10 to-[#764ba2]/10">
                  <Calendar className="h-6 w-6 text-[#667eea]" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-card-foreground">
                  경기 일정 관리
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  경기 일정을 만들고 팀원들에게 공유하세요. 날짜, 시간, 장소를
                  한눈에 확인할 수 있습니다.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#667eea]/10 to-[#764ba2]/10">
                  <CheckCircle className="h-6 w-6 text-[#667eea]" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-card-foreground">
                  참여 관리
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  참석, 불참, 미정으로 참여 여부를 표시하고 실시간으로
                  확인하세요.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#667eea]/10 to-[#764ba2]/10">
                  <Zap className="h-6 w-6 text-[#667eea]" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-card-foreground">
                  빠른 공유
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  카카오톡 없이도 팀원들과 경기 정보를 공유하고 확인할 수
                  있습니다.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#667eea]/10 to-[#764ba2]/10">
                  <Users className="h-6 w-6 text-[#667eea]" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-card-foreground">
                  팀장 기능
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  팀장은 경기를 생성하고 관리할 수 있습니다. 무료 플랜은 주당
                  2경기, 프리미엄은 무제한입니다.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#667eea]/10 to-[#764ba2]/10">
                  <Calendar className="h-6 w-6 text-[#667eea]" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-card-foreground">
                  간편한 접근
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Google 계정으로 간편하게 로그인하고 바로 시작하세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-xl border bg-card p-8 text-center shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-white to-[#f7fafc]">
          <h2 className="text-2xl font-bold text-card-foreground sm:text-3xl bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
            지금 시작하세요
          </h2>
          <p className="mt-4 text-muted-foreground">
            킥-인으로 풋살 팀 관리를 더욱 쉽게 만들어보세요
          </p>
          <div className="mt-8">
            {!user ? (
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto">
                  무료로 시작하기
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/locker-room">
                <Button size="lg" className="w-full sm:w-auto">
                  라커룸으로 이동
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
