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
  Heart,
  AlertCircle,
  TrendingDown,
} from "lucide-react";

interface TeamHealthScore {
  score: number;
  status: "healthy" | "warning" | "critical";
  attendanceScore: number;
  frequencyScore: number;
  participationScore: number;
  suggestions: string[];
  trend: "up" | "down" | "stable";
}

interface MemberContribution {
  userId: string;
  name: string | null;
  overallScore: number;
  category: "mvp" | "active" | "needs-attention";
  attendanceRate: number;
  voteParticipationRate: number;
  noticeReadRate: number;
  growthTrend: {
    periods: { period: string; attendanceRate: number }[];
    trend: "up" | "down" | "stable";
  };
}

interface TeamStatsData {
  healthScore: TeamHealthScore | null;
  memberContributions: MemberContribution[];
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
            healthScore: null,
            memberContributions: [],
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

        // 공지 및 공지 확인 데이터 가져오기
        const { data: notices } = await supabase
          .from("team_notices")
          .select("id")
          .eq("team_id", teamId);

        const noticeIds = notices?.map((n) => n.id) || [];
        const { data: noticeReceipts } = noticeIds.length > 0
          ? await supabase
              .from("team_notice_receipts")
              .select("notice_id, user_id")
              .in("notice_id", noticeIds)
          : { data: null };

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
        const nowForPrediction = new Date();
        const upcomingMatches = matches.filter((match) => {
          if (match.status === "cancelled") return false;
          const matchDate = new Date(`${match.date}T${match.time || "00:00"}`);
          return matchDate > nowForPrediction;
        });

        let nextMatchAttendanceRate: number | null = null;
        let confidence: "high" | "medium" | "low" = "low";
        let message = "아직 충분한 데이터가 없습니다.";

        if (upcomingMatches.length > 0) {
          // 과거 경기들의 평균 출석률 계산
          const pastMatchesForPrediction = matches.filter((match) => {
            if (match.status === "cancelled") return false;
            const matchDate = new Date(
              `${match.date}T${match.time || "00:00"}`
            );
            return matchDate <= nowForPrediction;
          });

          if (pastMatchesForPrediction.length >= 3) {
            // 최근 5경기 평균 출석률
            const recentMatches = pastMatchesForPrediction.slice(-5);
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
          } else if (pastMatchesForPrediction.length > 0) {
            // 전체 평균 출석률
            let totalRate = 0;
            pastMatchesForPrediction.forEach((match) => {
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
              totalRate / pastMatchesForPrediction.length
            );
            confidence = "medium";
            message = `과거 ${pastMatchesForPrediction.length}경기 평균 출석률을 기반으로 예측했습니다.`;
          }
        }

        // 팀 건강도 스코어 계산
        let healthScore: TeamHealthScore | null = null;
        const now = new Date();
        
        if (matches.length > 0 && memberIds.length > 0) {
          const pastMatches = matches.filter((match) => {
            if (match.status === "cancelled") return false;
            const matchDate = new Date(`${match.date}T${match.time || "00:00"}`);
            return matchDate <= now;
          });

          // 1. 출석률 점수 계산 (40% 가중치)
          let totalAttendanceRate = 0;
          let validMatchesForAttendance = 0;
          
          pastMatches.forEach((match) => {
            const matchParticipants =
              participants?.filter((p) => p.match_id === match.id) || [];
            const goingCount = matchParticipants.filter(
              (p) => p.status === "going"
            ).length;
            const rate = memberIds.length > 0 
              ? (goingCount / memberIds.length) * 100 
              : 0;
            totalAttendanceRate += rate;
            validMatchesForAttendance += 1;
          });
          
          const avgAttendanceRate = validMatchesForAttendance > 0
            ? totalAttendanceRate / validMatchesForAttendance
            : 0;
          const attendanceScore = Math.min(100, Math.max(0, avgAttendanceRate));

          // 2. 경기 빈도 점수 계산 (30% 가중치)
          // 최근 3개월 경기 수 계산
          const threeMonthsAgo = new Date(now);
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          
          const recentMatches = pastMatches.filter((match) => {
            const matchDate = new Date(`${match.date}T${match.time || "00:00"}`);
            return matchDate >= threeMonthsAgo;
          });
          
          const monthsDiff = 3;
          const matchesPerMonth = recentMatches.length / monthsDiff;
          // 월 4회 이상이면 100점, 그 이하면 비례
          const frequencyScore = Math.min(100, (matchesPerMonth / 4) * 100);

          // 3. 멤버 참여도 점수 계산 (30% 가중치)
          // 모든 경기에서 투표한 멤버 비율
          const memberVoteCount: Record<string, number> = {};
          memberIds.forEach((id) => {
            memberVoteCount[id] = 0;
          });
          
          pastMatches.forEach((match) => {
            const matchParticipants =
              participants?.filter((p) => p.match_id === match.id) || [];
            matchParticipants.forEach((p) => {
              if (memberVoteCount[p.user_id] !== undefined) {
                memberVoteCount[p.user_id] += 1;
              }
            });
          });
          
          const totalPossibleVotes = pastMatches.length * memberIds.length;
          const totalActualVotes = Object.values(memberVoteCount).reduce(
            (sum, count) => sum + count,
            0
          );
          const participationRate = totalPossibleVotes > 0
            ? (totalActualVotes / totalPossibleVotes) * 100
            : 0;
          const participationScore = Math.min(100, Math.max(0, participationRate));

          // 종합 점수 계산 (가중 평균)
          const finalScore = Math.round(
            attendanceScore * 0.4 +
            frequencyScore * 0.3 +
            participationScore * 0.3
          );

          // 상태 결정
          let status: "healthy" | "warning" | "critical";
          if (finalScore >= 70) {
            status = "healthy";
          } else if (finalScore >= 40) {
            status = "warning";
          } else {
            status = "critical";
          }

          // 트렌드 계산 (최근 2주 vs 그 이전 2주)
          const twoWeeksAgo = new Date(now);
          twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
          const fourWeeksAgo = new Date(now);
          fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

          const recentTwoWeeksMatches = pastMatches.filter((match) => {
            const matchDate = new Date(`${match.date}T${match.time || "00:00"}`);
            return matchDate >= twoWeeksAgo && matchDate < now;
          });

          const previousTwoWeeksMatches = pastMatches.filter((match) => {
            const matchDate = new Date(`${match.date}T${match.time || "00:00"}`);
            return matchDate >= fourWeeksAgo && matchDate < twoWeeksAgo;
          });

          let recentAttendance = 0;
          let previousAttendance = 0;

          recentTwoWeeksMatches.forEach((match) => {
            const matchParticipants =
              participants?.filter((p) => p.match_id === match.id) || [];
            const goingCount = matchParticipants.filter(
              (p) => p.status === "going"
            ).length;
            recentAttendance += memberIds.length > 0 
              ? (goingCount / memberIds.length) * 100 
              : 0;
          });

          previousTwoWeeksMatches.forEach((match) => {
            const matchParticipants =
              participants?.filter((p) => p.match_id === match.id) || [];
            const goingCount = matchParticipants.filter(
              (p) => p.status === "going"
            ).length;
            previousAttendance += memberIds.length > 0 
              ? (goingCount / memberIds.length) * 100 
              : 0;
          });

          const recentAvg = recentTwoWeeksMatches.length > 0
            ? recentAttendance / recentTwoWeeksMatches.length
            : 0;
          const previousAvg = previousTwoWeeksMatches.length > 0
            ? previousAttendance / previousTwoWeeksMatches.length
            : 0;

          let trend: "up" | "down" | "stable" = "stable";
          if (recentAvg > previousAvg + 5) {
            trend = "up";
          } else if (recentAvg < previousAvg - 5) {
            trend = "down";
          }

          // 개선 액션 제안 생성
          const suggestions: string[] = [];
          
          if (attendanceScore < 60) {
            const diff = previousAvg - recentAvg;
            if (diff > 5) {
              suggestions.push(
                `출석률이 지난 2주 대비 ${Math.round(diff)}% 하락했습니다. 팀원들에게 리마인더를 보내보세요.`
              );
            } else {
              suggestions.push(
                `출석률이 ${Math.round(100 - attendanceScore)}% 낮습니다. 팀원들과 일정을 조율해보세요.`
              );
            }
          }

          if (frequencyScore < 50) {
            suggestions.push(
              `최근 경기 빈도가 낮습니다. 새로운 경기를 계획해보세요.`
            );
          }

          if (participationScore < 70) {
            suggestions.push(
              `일부 팀원들이 투표에 참여하지 않고 있습니다. 투표 참여를 독려해보세요.`
            );
          }

          if (suggestions.length === 0) {
            suggestions.push("팀 건강도가 양호합니다! 계속 이렇게 유지해보세요.");
          }

          healthScore = {
            score: finalScore,
            status,
            attendanceScore: Math.round(attendanceScore),
            frequencyScore: Math.round(frequencyScore),
            participationScore: Math.round(participationScore),
            suggestions,
            trend,
          };
        }

        // 멤버 기여도 매트릭스 계산
        const memberContributions: MemberContribution[] = [];
        const pastMatchesForContribution = matches.filter((match) => {
          if (match.status === "cancelled") return false;
          const matchDate = new Date(`${match.date}T${match.time || "00:00"}`);
          return matchDate <= now;
        });

        memberIds.forEach((userId) => {
          // 1. 출석률 계산
          const userMatches = pastMatchesForContribution.filter((match) => {
            if (match.status === "cancelled") return false;
            return true;
          });
          
          let goingCount = 0;
          userMatches.forEach((match) => {
            const participant = participants?.find(
              (p) => p.match_id === match.id && p.user_id === userId
            );
            if (participant?.status === "going") {
              goingCount += 1;
            }
          });
          
          const attendanceRate =
            userMatches.length > 0
              ? Math.round((goingCount / userMatches.length) * 100)
              : 0;

          // 2. 투표 참여도 계산
          let voteCount = 0;
          userMatches.forEach((match) => {
            const participant = participants?.find(
              (p) => p.match_id === match.id && p.user_id === userId
            );
            if (participant) {
              voteCount += 1;
            }
          });
          
          const voteParticipationRate =
            userMatches.length > 0
              ? Math.round((voteCount / userMatches.length) * 100)
              : 0;

          // 3. 공지 확인률 계산
          const userNoticeReceipts = noticeReceipts?.filter(
            (r) => r.user_id === userId
          ) || [];
          const noticeReadRate =
            noticeIds.length > 0
              ? Math.round((userNoticeReceipts.length / noticeIds.length) * 100)
              : 0;

          // 4. 종합 점수 계산 (가중 평균)
          // 출석률 50%, 투표 참여도 30%, 공지 확인률 20%
          const overallScore = Math.round(
            attendanceRate * 0.5 +
            voteParticipationRate * 0.3 +
            noticeReadRate * 0.2
          );

          // 5. 카테고리 결정
          let category: "mvp" | "active" | "needs-attention";
          if (overallScore >= 80) {
            category = "mvp";
          } else if (overallScore >= 50) {
            category = "active";
          } else {
            category = "needs-attention";
          }

          // 6. 성장 트렌드 계산 (최근 4주를 2주씩 나눠서 비교)
          const fourWeeksAgo = new Date(now);
          fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
          const twoWeeksAgo = new Date(now);
          twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

          const recentMatches = pastMatchesForContribution.filter((match) => {
            const matchDate = new Date(`${match.date}T${match.time || "00:00"}`);
            return matchDate >= twoWeeksAgo && matchDate < now;
          });

          const previousMatches = pastMatchesForContribution.filter((match) => {
            const matchDate = new Date(`${match.date}T${match.time || "00:00"}`);
            return matchDate >= fourWeeksAgo && matchDate < twoWeeksAgo;
          });

          let recentGoing = 0;
          recentMatches.forEach((match) => {
            const participant = participants?.find(
              (p) => p.match_id === match.id && p.user_id === userId
            );
            if (participant?.status === "going") {
              recentGoing += 1;
            }
          });

          let previousGoing = 0;
          previousMatches.forEach((match) => {
            const participant = participants?.find(
              (p) => p.match_id === match.id && p.user_id === userId
            );
            if (participant?.status === "going") {
              previousGoing += 1;
            }
          });

          const recentRate =
            recentMatches.length > 0
              ? Math.round((recentGoing / recentMatches.length) * 100)
              : 0;
          const previousRate =
            previousMatches.length > 0
              ? Math.round((previousGoing / previousMatches.length) * 100)
              : 0;

          let trend: "up" | "down" | "stable" = "stable";
          if (recentRate > previousRate + 5) {
            trend = "up";
          } else if (recentRate < previousRate - 5) {
            trend = "down";
          }

          // 기간별 데이터 생성 (최근 4주를 2주씩)
          const periods = [
            {
              period: "2주 전",
              attendanceRate: previousRate,
            },
            {
              period: "최근 2주",
              attendanceRate: recentRate,
            },
          ];

          memberContributions.push({
            userId,
            name: profileMap.get(userId) || null,
            overallScore,
            category,
            attendanceRate,
            voteParticipationRate,
            noticeReadRate,
            growthTrend: {
              periods,
              trend,
            },
          });
        });

        // 종합 점수 순으로 정렬
        memberContributions.sort((a, b) => b.overallScore - a.overallScore);

        setStats({
          healthScore,
          memberContributions,
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
      {/* 팀 건강도 스코어 */}
      {stats.healthScore && (
        <TeamHealthScoreCard healthScore={stats.healthScore} />
      )}

      {/* 멤버 기여도 매트릭스 */}
      {stats.memberContributions.length > 0 && (
        <div className="rounded-lg p-3 sm:p-4 border border-[var(--border-soft)] bg-[var(--surface-1)]">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#7C3AED]" />
            <h3 className="text-xs sm:text-sm font-semibold text-[#F4F4F5]">
              멤버 기여도 매트릭스
            </h3>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {stats.memberContributions.map((member, index) => (
              <MemberContributionCard key={member.userId} member={member} rank={index + 1} />
            ))}
          </div>
        </div>
      )}

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

function TeamHealthScoreCard({
  healthScore,
}: {
  healthScore: TeamHealthScore;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`rounded-lg p-3 sm:p-4 border-2 cursor-pointer transition-colors ${
        healthScore.status === "healthy"
          ? "border-[#00C16A]/40 bg-[#00C16A]/5 hover:border-[#00C16A]/60"
          : healthScore.status === "warning"
          ? "border-yellow-500/40 bg-yellow-500/5 hover:border-yellow-500/60"
          : "border-red-500/40 bg-red-500/5 hover:border-red-500/60"
      }`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Heart
            className={`h-4 w-4 sm:h-5 sm:w-5 ${
              healthScore.status === "healthy"
                ? "text-[#00C16A]"
                : healthScore.status === "warning"
                ? "text-yellow-500"
                : "text-red-500"
            }`}
          />
          <h3 className="text-xs sm:text-sm font-semibold text-[#F4F4F5]">
            팀 건강도
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {healthScore.trend === "up" && (
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#00C16A]" />
          )}
          {healthScore.trend === "down" && (
            <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-400" />
          )}
          <span
            className={`text-xl sm:text-2xl font-bold ${
              healthScore.status === "healthy"
                ? "text-[#00C16A]"
                : healthScore.status === "warning"
                ? "text-yellow-500"
                : "text-red-500"
            }`}
          >
            {healthScore.score}
          </span>
          <span className="text-[10px] sm:text-xs text-[#71717A]">/100</span>
          <ChevronDown
            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#71717A] transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* 세부 정보 (펼쳐졌을 때만 표시) */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-[var(--border-soft)]">
          {/* 상태 배지 */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`text-[10px] sm:text-xs px-2 py-1 rounded-full font-medium ${
                healthScore.status === "healthy"
                  ? "bg-[#00C16A]/20 text-[#00C16A]"
                  : healthScore.status === "warning"
                  ? "bg-yellow-500/20 text-yellow-500"
                  : "bg-red-500/20 text-red-500"
              }`}
            >
              {healthScore.status === "healthy"
                ? "건강"
                : healthScore.status === "warning"
                ? "주의"
                : "위험"}
            </span>
            {healthScore.trend === "up" && (
              <span className="text-[10px] sm:text-xs text-[#00C16A]">↑ 개선 중</span>
            )}
            {healthScore.trend === "down" && (
              <span className="text-[10px] sm:text-xs text-red-400">↓ 하락 중</span>
            )}
          </div>

          {/* 세부 점수 */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center">
              <p className="text-[10px] sm:text-xs text-[#71717A] mb-1">출석률</p>
              <p className="text-xs sm:text-sm font-semibold text-[#F4F4F5]">
                {healthScore.attendanceScore}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] sm:text-xs text-[#71717A] mb-1">경기 빈도</p>
              <p className="text-xs sm:text-sm font-semibold text-[#F4F4F5]">
                {healthScore.frequencyScore}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] sm:text-xs text-[#71717A] mb-1">참여도</p>
              <p className="text-xs sm:text-sm font-semibold text-[#F4F4F5]">
                {healthScore.participationScore}%
              </p>
            </div>
          </div>

          {/* 개선 액션 제안 */}
          {healthScore.suggestions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--border-soft)]">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#A1A1AA] shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  {healthScore.suggestions.map((suggestion, index) => (
                    <p
                      key={index}
                      className="text-[10px] sm:text-xs text-[#A1A1AA] leading-relaxed"
                    >
                      {suggestion}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MemberContributionCard({
  member,
  rank,
}: {
  member: MemberContribution;
  rank: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const categoryConfig = {
    mvp: {
      label: "MVP 멤버",
      color: "text-[#F97316]",
      bgColor: "bg-[#F97316]/20",
      borderColor: "border-[#F97316]/30",
    },
    active: {
      label: "활발한 멤버",
      color: "text-[#00C16A]",
      bgColor: "bg-[#00C16A]/20",
      borderColor: "border-[#00C16A]/30",
    },
    "needs-attention": {
      label: "관심 필요",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/20",
      borderColor: "border-yellow-500/30",
    },
  };

  const config = categoryConfig[member.category];

  return (
    <div
      className={`rounded-lg p-2 sm:p-3 border ${config.borderColor} ${config.bgColor} hover:border-[var(--border-strong)] transition-colors cursor-pointer`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
          <div className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full ${config.bgColor} ${config.color} text-[10px] sm:text-xs font-bold shrink-0`}>
            {rank}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] sm:text-xs font-semibold text-[#F4F4F5] truncate">
                {member.name || "이름 없음"}
              </span>
              {rank === 1 && member.category === "mvp" && (
                <span className="text-[10px] sm:text-xs">🏆</span>
              )}
            </div>
            <span className={`text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full ${config.bgColor} ${config.color} font-medium`}>
              {config.label}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="text-right">
            <p className={`text-base sm:text-lg font-bold ${config.color}`}>
              {member.overallScore}
            </p>
            <p className="text-[9px] sm:text-[10px] text-[#71717A]">/100</p>
          </div>
          <ChevronDown
            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#71717A] transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* 세부 지표 (펼쳐졌을 때만 표시) */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-[var(--border-soft)]">
          {/* 세부 지표 */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <p className="text-[10px] text-[#71717A] mb-0.5">출석률</p>
              <p className="text-xs font-semibold text-[#F4F4F5]">
                {member.attendanceRate}%
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[#71717A] mb-0.5">투표 참여</p>
              <p className="text-xs font-semibold text-[#F4F4F5]">
                {member.voteParticipationRate}%
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[#71717A] mb-0.5">공지 확인</p>
              <p className="text-xs font-semibold text-[#F4F4F5]">
                {member.noticeReadRate}%
              </p>
            </div>
          </div>

          {/* 성장 그래프 */}
          {member.growthTrend.periods.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--border-soft)]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-[#71717A]">출석률 추이</p>
                {member.growthTrend.trend === "up" && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-[#00C16A]" />
                    <span className="text-[10px] text-[#00C16A]">상승</span>
                  </div>
                )}
                {member.growthTrend.trend === "down" && (
                  <div className="flex items-center gap-1">
                    <TrendingDown className="h-3 w-3 text-red-400" />
                    <span className="text-[10px] text-red-400">하락</span>
                  </div>
                )}
                {member.growthTrend.trend === "stable" && (
                  <span className="text-[10px] text-[#71717A]">유지</span>
                )}
              </div>
              <div className="flex items-end gap-2 h-12">
                {member.growthTrend.periods.map((period, idx) => {
                  const maxRate = Math.max(
                    ...member.growthTrend.periods.map((p) => p.attendanceRate),
                    1
                  );
                  const height = maxRate > 0 ? (period.attendanceRate / maxRate) * 100 : 0;
                  
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-[#1A2333] rounded-t overflow-hidden" style={{ height: "100%" }}>
                        <div
                          className={`w-full transition-all duration-500 ${
                            member.growthTrend.trend === "up"
                              ? "bg-[#00C16A]"
                              : member.growthTrend.trend === "down"
                              ? "bg-red-400"
                              : "bg-[#71717A]"
                          }`}
                          style={{ height: `${height}%`, minHeight: period.attendanceRate > 0 ? "4px" : "0" }}
                        />
                      </div>
                      <p className="text-[9px] text-[#71717A]">{period.period}</p>
                      <p className="text-[10px] font-medium text-[#F4F4F5]">
                        {period.attendanceRate}%
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
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

