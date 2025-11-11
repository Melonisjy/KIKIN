"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  TrendingUp,
  Users,
  Calendar,
  Clock,
  Award,
  BarChart3,
  Sparkles,
} from "lucide-react";

interface TeamStatsData {
  attendanceTrend: {
    byDayOfWeek: { day: string; rate: number; count: number }[];
    byTimeSlot: { slot: string; rate: number; count: number }[];
  };
  memberRanking: {
    userId: string;
    name: string | null;
    attendanceRate: number;
    totalMatches: number;
    goingCount: number;
  }[];
  matchFrequency: {
    monthly: { month: string; count: number }[];
    weekly: { week: string; count: number }[];
  };
  prediction: {
    nextMatchAttendanceRate: number | null;
    confidence: "high" | "medium" | "low";
    message: string;
  };
}

interface TeamStatsProps {
  teamId: string;
}

export function TeamStats({ teamId }: TeamStatsProps) {
  const [stats, setStats] = useState<TeamStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("로그인이 필요합니다.");
          return;
        }

        // 팀의 모든 경기 가져오기
        const { data: matches } = await supabase
          .from("matches")
          .select("id, date, time, status")
          .eq("team_id", teamId)
          .order("date", { ascending: true });

        if (!matches || matches.length === 0) {
          setStats({
            attendanceTrend: {
              byDayOfWeek: [],
              byTimeSlot: [],
            },
            memberRanking: [],
            matchFrequency: {
              monthly: [],
              weekly: [],
            },
            prediction: {
              nextMatchAttendanceRate: null,
              confidence: "low",
              message: "아직 충분한 데이터가 없습니다.",
            },
          });
          setIsLoading(false);
          return;
        }

        // 팀 멤버 가져오기
        const { data: members } = await supabase
          .from("members")
          .select("user_id")
          .eq("team_id", teamId);

        const memberIds = members?.map((m) => m.user_id) || [];

        // 멤버 프로필 가져오기
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("id, name")
          .in("id", memberIds);

        const profileMap = new Map(
          profiles?.map((p) => [p.id, p.name]) || []
        );

        // 모든 경기의 참여자 데이터 가져오기
        const matchIds = matches.map((m) => m.id);
        const { data: participants } = await supabase
          .from("match_participants")
          .select("match_id, user_id, status")
          .in("match_id", matchIds);

        // 출석률 트렌드 계산 (요일별)
        const dayOfWeekStats: Record<
          string,
          { total: number; going: number }
        > = {};
        const timeSlotStats: Record<string, { total: number; going: number }> =
          {};

        matches.forEach((match) => {
          if (match.status === "cancelled") return;

          const matchDate = new Date(`${match.date}T${match.time || "00:00"}`);
          const dayOfWeek = matchDate.toLocaleDateString("ko-KR", {
            weekday: "short",
          });

          // 시간대 분류 (오전/오후/저녁)
          const hour = matchDate.getHours();
          let timeSlot = "저녁";
          if (hour < 12) timeSlot = "오전";
          else if (hour < 18) timeSlot = "오후";

          const matchParticipants =
            participants?.filter((p) => p.match_id === match.id) || [];
          const goingCount = matchParticipants.filter(
            (p) => p.status === "going"
          ).length;

          // 요일별 통계
          if (!dayOfWeekStats[dayOfWeek]) {
            dayOfWeekStats[dayOfWeek] = { total: 0, going: 0 };
          }
          dayOfWeekStats[dayOfWeek].total += memberIds.length;
          dayOfWeekStats[dayOfWeek].going += goingCount;

          // 시간대별 통계
          if (!timeSlotStats[timeSlot]) {
            timeSlotStats[timeSlot] = { total: 0, going: 0 };
          }
          timeSlotStats[timeSlot].total += memberIds.length;
          timeSlotStats[timeSlot].going += goingCount;
        });

        const attendanceTrend = {
          byDayOfWeek: Object.entries(dayOfWeekStats)
            .map(([day, stats]) => ({
              day,
              rate:
                stats.total > 0
                  ? Math.round((stats.going / stats.total) * 100)
                  : 0,
              count: stats.total / memberIds.length,
            }))
            .sort((a, b) => {
              const dayOrder = ["일", "월", "화", "수", "목", "금", "토"];
              return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
            }),
          byTimeSlot: Object.entries(timeSlotStats).map(([slot, stats]) => ({
            slot,
            rate:
              stats.total > 0
                ? Math.round((stats.going / stats.total) * 100)
                : 0,
            count: stats.total / memberIds.length,
          })),
        };

        // 멤버 랭킹 계산
        const memberStats: Record<
          string,
          { totalMatches: number; goingCount: number }
        > = {};

        memberIds.forEach((memberId) => {
          memberStats[memberId] = { totalMatches: 0, goingCount: 0 };
        });

        matches.forEach((match) => {
          if (match.status === "cancelled") return;
          memberIds.forEach((memberId) => {
            memberStats[memberId].totalMatches += 1;
            const participant = participants?.find(
              (p) => p.match_id === match.id && p.user_id === memberId
            );
            if (participant?.status === "going") {
              memberStats[memberId].goingCount += 1;
            }
          });
        });

        const memberRanking = memberIds
          .map((userId) => {
            const stats = memberStats[userId];
            const attendanceRate =
              stats.totalMatches > 0
                ? Math.round((stats.goingCount / stats.totalMatches) * 100)
                : 0;
            return {
              userId,
              name: profileMap.get(userId) || null,
              attendanceRate,
              totalMatches: stats.totalMatches,
              goingCount: stats.goingCount,
            };
          })
          .sort((a, b) => b.attendanceRate - a.attendanceRate);

        // 경기 빈도 분석 (월별)
        const monthlyStats: Record<string, number> = {};
        matches.forEach((match) => {
          if (match.status === "cancelled") return;
          const matchDate = new Date(`${match.date}T${match.time || "00:00"}`);
          const monthKey = matchDate.toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "short",
          });
          monthlyStats[monthKey] = (monthlyStats[monthKey] || 0) + 1;
        });

        const matchFrequency = {
          monthly: Object.entries(monthlyStats)
            .map(([month, count]) => ({ month, count }))
            .sort((a, b) => {
              // 날짜 순으로 정렬
              const dateA = new Date(a.month);
              const dateB = new Date(b.month);
              return dateA.getTime() - dateB.getTime();
            }),
          weekly: [], // 주별 통계는 나중에 추가 가능
        };

        // 예측 인사이트 계산
        const now = new Date();
        const upcomingMatches = matches.filter((match) => {
          if (match.status === "cancelled") return false;
          const matchDate = new Date(`${match.date}T${match.time || "00:00"}`);
          return matchDate > now;
        });

        let nextMatchAttendanceRate: number | null = null;
        let confidence: "high" | "medium" | "low" = "low";
        let message = "아직 충분한 데이터가 없습니다.";

        if (upcomingMatches.length > 0) {
          // 과거 경기들의 평균 출석률 계산
          const pastMatches = matches.filter((match) => {
            if (match.status === "cancelled") return false;
            const matchDate = new Date(
              `${match.date}T${match.time || "00:00"}`
            );
            return matchDate <= now;
          });

          if (pastMatches.length >= 3) {
            // 최근 5경기 평균 출석률
            const recentMatches = pastMatches.slice(-5);
            let totalRate = 0;
            let validMatches = 0;

            recentMatches.forEach((match) => {
              const matchParticipants =
                participants?.filter((p) => p.match_id === match.id) || [];
              const goingCount = matchParticipants.filter(
                (p) => p.status === "going"
              ).length;
              const rate = memberIds.length > 0 
                ? (goingCount / memberIds.length) * 100 
                : 0;
              totalRate += rate;
              validMatches += 1;
            });

            nextMatchAttendanceRate = Math.round(totalRate / validMatches);
            confidence = validMatches >= 5 ? "high" : "medium";
            message = `최근 ${validMatches}경기 평균 출석률을 기반으로 예측했습니다.`;
          } else if (pastMatches.length > 0) {
            // 전체 평균 출석률
            let totalRate = 0;
            pastMatches.forEach((match) => {
              const matchParticipants =
                participants?.filter((p) => p.match_id === match.id) || [];
              const goingCount = matchParticipants.filter(
                (p) => p.status === "going"
              ).length;
              const rate = memberIds.length > 0 
                ? (goingCount / memberIds.length) * 100 
                : 0;
              totalRate += rate;
            });
            nextMatchAttendanceRate = Math.round(
              totalRate / pastMatches.length
            );
            confidence = "medium";
            message = `과거 ${pastMatches.length}경기 평균 출석률을 기반으로 예측했습니다.`;
          }
        }

        setStats({
          attendanceTrend,
          memberRanking,
          matchFrequency,
          prediction: {
            nextMatchAttendanceRate,
            confidence,
            message,
          },
        });
      } catch (err: any) {
        setError(err.message || "통계를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [teamId]);

  if (isLoading) {
    return (
      <div className="rounded-lg p-4 border border-[var(--border-soft)] bg-[var(--surface-1)]">
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-[#A1A1AA]">통계를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg p-4 border border-[var(--border-soft)] bg-[var(--surface-1)]">
        <div className="text-sm text-red-400">{error}</div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* 예측 인사이트 - 컴팩트 */}
      {stats.prediction.nextMatchAttendanceRate !== null && (
        <div className="rounded-lg p-4 border border-[#00C16A]/30 bg-[#00C16A]/5">
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-[#00C16A] shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-[#F4F4F5]">
                  다음 경기 출석률 예상
                </span>
                <span className="text-lg font-bold text-[#00C16A]">
                  {stats.prediction.nextMatchAttendanceRate}%
                </span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    stats.prediction.confidence === "high"
                      ? "bg-green-500/20 text-green-400"
                      : stats.prediction.confidence === "medium"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {stats.prediction.confidence === "high"
                    ? "높음"
                    : stats.prediction.confidence === "medium"
                    ? "보통"
                    : "낮음"}
                </span>
              </div>
              <p className="text-xs text-[#A1A1AA] line-clamp-1">
                {stats.prediction.message}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 출석률 트렌드 - 요일별 */}
        <div className="rounded-lg p-4 border border-[var(--border-soft)] bg-[var(--surface-1)]">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-[#00C16A]" />
            <h3 className="text-sm font-semibold text-[#F4F4F5]">
              요일별 출석률
            </h3>
          </div>
          {stats.attendanceTrend.byDayOfWeek.length > 0 ? (
            <div className="space-y-2">
              {stats.attendanceTrend.byDayOfWeek.map((item) => (
                <div key={item.day}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#A1A1AA]">{item.day}</span>
                    <span className="text-xs font-medium text-[#F4F4F5]">
                      {item.rate}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#1A2333] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#00C16A] transition-all duration-500"
                      style={{ width: `${item.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#71717A]">데이터가 부족합니다.</p>
          )}
        </div>

        {/* 출석률 트렌드 - 시간대별 */}
        <div className="rounded-lg p-4 border border-[var(--border-soft)] bg-[var(--surface-1)]">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-[#2563EB]" />
            <h3 className="text-sm font-semibold text-[#F4F4F5]">
              시간대별 출석률
            </h3>
          </div>
          {stats.attendanceTrend.byTimeSlot.length > 0 ? (
            <div className="space-y-2">
              {stats.attendanceTrend.byTimeSlot.map((item) => (
                <div key={item.slot}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#A1A1AA]">{item.slot}</span>
                    <span className="text-xs font-medium text-[#F4F4F5]">
                      {item.rate}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#1A2333] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2563EB] transition-all duration-500"
                      style={{ width: `${item.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#71717A]">데이터가 부족합니다.</p>
          )}
        </div>

        {/* 활성 멤버 랭킹 */}
        <div className="rounded-lg p-4 border border-[var(--border-soft)] bg-[var(--surface-1)] lg:col-span-2">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-[#F97316]" />
              <h3 className="text-sm font-semibold text-[#F4F4F5]">
                활성 멤버 랭킹
              </h3>
            </div>
          </div>
          {stats.memberRanking.length > 0 ? (
            <MemberRankingList members={stats.memberRanking} />
          ) : (
            <p className="text-xs text-[#71717A]">데이터가 부족합니다.</p>
          )}
        </div>

        {/* 경기 빈도 분석 */}
        <div className="rounded-lg p-4 border border-[var(--border-soft)] bg-[var(--surface-1)] lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-[#7C3AED]" />
            <h3 className="text-sm font-semibold text-[#F4F4F5]">
              월별 경기 빈도
            </h3>
          </div>
          {stats.matchFrequency.monthly.length > 0 ? (
            <div className="space-y-2">
              {stats.matchFrequency.monthly.slice(-6).map((item) => (
                <div key={item.month}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#A1A1AA]">{item.month}</span>
                    <span className="text-xs font-medium text-[#F4F4F5]">
                      {item.count}경기
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#1A2333] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#7C3AED] transition-all duration-500"
                      style={{
                        width: `${
                          (item.count /
                            Math.max(
                              ...stats.matchFrequency.monthly.map((m) => m.count)
                            )) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#71717A]">데이터가 부족합니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MemberRankingList({
  members,
}: {
  members: {
    userId: string;
    name: string | null;
    attendanceRate: number;
    totalMatches: number;
    goingCount: number;
  }[];
}) {
  const [showAll, setShowAll] = useState(false);
  const displayLimit = 5;
  const displayMembers = showAll ? members : members.slice(0, displayLimit);
  const hasMore = members.length > displayLimit;

  return (
    <div className="space-y-2">
      {displayMembers.map((member, index) => (
        <div
          key={member.userId}
          className="flex items-center gap-3 p-2 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-2)] hover:border-[var(--border-strong)] transition-colors"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F97316]/20 text-[#F97316] text-xs font-bold shrink-0">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#F4F4F5] truncate">
                {member.name || "이름 없음"}
              </span>
              {index < 3 && (
                <span className="text-xs">
                  {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                </span>
              )}
            </div>
            <p className="text-xs text-[#71717A]">
              출석 {member.goingCount}회 / {member.totalMatches}경기
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-[#F4F4F5]">
              {member.attendanceRate}%
            </p>
          </div>
        </div>
      ))}
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full text-xs text-[#71717A] hover:text-[#A1A1AA] text-center py-1 transition-colors cursor-pointer"
        >
          +{members.length - displayLimit}명 더
        </button>
      )}
      {showAll && hasMore && (
        <button
          onClick={() => setShowAll(false)}
          className="w-full text-xs text-[#71717A] hover:text-[#A1A1AA] text-center py-1 transition-colors cursor-pointer"
        >
          접기
        </button>
      )}
    </div>
  );
}

