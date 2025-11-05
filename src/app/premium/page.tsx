import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles, CheckCircle, XCircle } from "lucide-react";
import { UpgradeButton } from "./upgrade-button";

interface PageProps {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}

export default async function PremiumPage({
  searchParams,
}: PageProps) {
  const { success, canceled } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user premium status
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("is_premium, premium_since")
    .eq("id", user.id)
    .single();

  const isPremium = profile?.is_premium || false;

  const plans = [
    {
      name: "Free",
      price: "₩0",
      period: "무료",
      features: [
        "주당 2경기까지 생성 가능",
        "팀 생성 및 관리",
        "경기 일정 확인",
        "참여자 관리",
      ],
      current: !isPremium,
    },
    {
      name: "Premium",
      price: "₩9,900",
      period: "월",
      features: [
        "무제한 경기 생성",
        "팀 생성 및 관리",
        "경기 일정 확인",
        "참여자 관리",
        "우선 고객 지원",
        "프리미엄 뱃지",
      ],
      current: isPremium,
      popular: true,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {success && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <p className="font-medium">결제가 완료되었습니다!</p>
          </div>
          <p className="mt-2 text-sm">
            프리미엄 멤버십이 활성화되었습니다. 페이지를 새로고침하면 변경사항이 반영됩니다.
          </p>
        </div>
      )}

      {canceled && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            <p className="font-medium">결제가 취소되었습니다.</p>
          </div>
          <p className="mt-2 text-sm">
            언제든지 다시 업그레이드할 수 있습니다.
          </p>
        </div>
      )}

      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Crown className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-4">
          프리미엄 플랜
        </h1>
        <p className="text-lg text-muted-foreground">
          무제한 경기 생성을 통해 팀을 더 효율적으로 관리하세요
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-lg border p-8 ${
              plan.popular
                ? "border-primary bg-card shadow-lg"
                : "border-border bg-card"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  <Sparkles className="h-3 w-3" />
                  인기
                </span>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-card-foreground mb-2">
                {plan.name}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-card-foreground">
                  {plan.price}
                </span>
                {plan.price !== "₩0" && (
                  <span className="text-muted-foreground">/{plan.period}</span>
                )}
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto">
              {plan.current ? (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled
                >
                  현재 플랜
                </Button>
              ) : (
                <UpgradeButton />
              )}
            </div>
          </div>
        ))}
      </div>

      {isPremium && profile?.premium_since && (
        <div className="mt-8 rounded-lg border bg-card p-6 text-center">
          <p className="text-muted-foreground">
            프리미엄 멤버십 시작일:{" "}
            {new Date(profile.premium_since).toLocaleDateString("ko-KR")}
          </p>
        </div>
      )}
    </div>
  );
}

