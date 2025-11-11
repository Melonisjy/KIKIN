"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  TrendingUp,
  TrendingDown,
  Award,
  BarChart3,
  Sparkles,
  Calendar,
  Trophy,
  Flame,
  Target,
  HelpCircle,
} from "lucide-react";
import { ChevronDown } from "lucide-react";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  achieved: boolean;
}

interface PersonalGrowthData {
  attendanceTrend: {
    month: string;
    rate: number;
    matches: number;
  }[];
  participationTrend: {
    month: string;
    rate: number;
  }[];
  teamRankings: {
    teamId: string;
    teamName: string;
    rank: number;
    totalMembers: number;
    attendanceRate: number;
  }[];
  monthlyFeedback: {
    message: string;
    trend: "up" | "down" | "stable";
  } | null;
  badges: Badge[];
  currentStreak: number;
  longestStreak: number;
  teamGoals: {
    teamId: string;
    teamName: string;
    goalRate: number;
    currentRate: number;
    progress: number;
  }[];
}

interface PersonalGrowthDashboardProps {
  userId: string;
}

export function PersonalGrowthDashboard({
  userId,
}: PersonalGrowthDashboardProps) {
  const [data, setData] = useState<PersonalGrowthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBadgeTooltip, setShowBadgeTooltip] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();

        // 사용자가 가입한 팀들 가져오기
        const { data: memberships } = await supabase
          .from("members")
          .select("team_id, teams(id, name)")
          .eq("user_id", userId);

        if (!memberships || memberships.length === 0) {
          setData({
            attendanceTrend: [],
            participationTrend: [],
            teamRankings: [],
            monthlyFeedback: null,
            badges: [],
            currentStreak: 0,
            longestStreak: 0,
            teamGoals: [],
          });
          setIsLoading(false);
          return;
        }

        const teamIds = memberships.map((m: any) => m.teams?.id).filter(Boolean);
        const teamNameMap = new Map<string, string>();
        memberships.forEach((m: any) => {
          if (m.teams?.id) {
            teamNameMap.set(m.teams.id, m.teams.name);
          }
        });

        // 모든 팀의 경기 가져오기
        const { data: matches } = await supabase
          .from("matches")
          .select("id, team_id, date, time, status")
          .in("team_id", teamIds)
          .order("date", { ascending: true });

        if (!matches || matches.length === 0) {
          setData({
            attendanceTrend: [],
            participationTrend: [],
            teamRankings: [],
            monthlyFeedback: null,
            badges: [],
            currentStreak: 0,
            longestStreak: 0,
            teamGoals: [],
          });
          setIsLoading(false);
          return;
        }

        // 모든 경기의 참여자 데이터 가져오기
        const matchIds = matches.map((m: any) => m.id);
        const { data: participants } = await supabase
          .from("match_participants")
          .select("match_id, user_id, status")
          .in("match_id", matchIds);

        const now = new Date();
        const pastMatches = matches.filter((match: any) => {
          if (match.status === "cancelled") return false;
          const matchDate = new Date(`${match.date}T${match.time || "00:00"}`);
          return matchDate <= now;
        });

        // 월별 출석률 트렌드 계산
        const monthlyAttendance: Record<
          string,
          { total: number; going: number; date: Date }
        > = {};

        pastMatches.forEach((match: any) => {
          const matchDate = new Date(`${match.date}T${match.time || "00:00"}`);
          const year = matchDate.getFullYear();
          const month = matchDate.getMonth() + 1;
          const monthKey = `${year}. ${month}월`;

          if (!monthlyAttendance[monthKey]) {
            monthlyAttendance[monthKey] = {
              total: 0,
              going: 0,
              date: new Date(year, month - 1, 1),
            };
          }

          monthlyAttendance[monthKey].total += 1;

          const userParticipant = participants?.find(
            (p) => p.match_id === match.id && p.user_id === userId
          );

          if (userParticipant?.status === "going") {
            monthlyAttendance[monthKey].going += 1;
          }
        });

        // 월별 키를 날짜로 변환하여 정렬
        const attendanceEntries = Object.entries(monthlyAttendance).map(
          ([month, stats]) => ({
            month,
            date: stats.date,
            rate: stats.total > 0 ? Math.round((stats.going / stats.total) * 100) : 0,
            matches: stats.total,
          })
        );

        const attendanceTrend = attendanceEntries
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .slice(-6) // 최근 6개월
          .map(({ month, rate, matches }) => ({ month, rate, matches }));

        // 월별 참여도 트렌드 계산
        const monthlyParticipation: Record<
          string,
          { total: number; voted: number; date: Date }
        > = {};

        pastMatches.forEach((match: any) => {
          const matchDate = new Date(`${match.date}T${match.time || "00:00"}`);
          const year = matchDate.getFullYear();
          const month = matchDate.getMonth() + 1;
          const monthKey = `${year}. ${month}월`;

          if (!monthlyParticipation[monthKey]) {
            monthlyParticipation[monthKey] = {
              total: 0,
              voted: 0,
              date: new Date(year, month - 1, 1),
            };
          }

          monthlyParticipation[monthKey].total += 1;

          const userParticipant = participants?.find(
            (p) => p.match_id === match.id && p.user_id === userId
          );

          if (userParticipant) {
            monthlyParticipation[monthKey].voted += 1;
          }
        });

        // 월별 키를 날짜로 변환하여 정렬
        const participationEntries = Object.entries(monthlyParticipation).map(
          ([month, stats]) => ({
            month,
            date: stats.date,
            rate: stats.total > 0 ? Math.round((stats.voted / stats.total) * 100) : 0,
          })
        );

        const participationTrend = participationEntries
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .slice(-6) // 최근 6개월
          .map(({ month, rate }) => ({ month, rate }));

        // 팀별 순위 계산
        const teamRankings: {
          teamId: string;
          teamName: string;
          rank: number;
          totalMembers: number;
          attendanceRate: number;
        }[] = [];

        for (const teamId of teamIds) {
          // 팀 멤버 가져오기
          const { data: teamMembers } = await supabase
            .from("members")
            .select("user_id")
            .eq("team_id", teamId);

          const memberIds = teamMembers?.map((m) => m.user_id) || [];

          // 팀의 경기들
          const teamMatches = pastMatches.filter(
            (m: any) => m.team_id === teamId
          );

          // 각 멤버의 출석률 계산
          const memberStats: Record<string, { total: number; going: number }> =
            {};

          memberIds.forEach((memberId) => {
            memberStats[memberId] = { total: 0, going: 0 };
          });

          teamMatches.forEach((match: any) => {
            memberIds.forEach((memberId) => {
              memberStats[memberId].total += 1;
              const participant = participants?.find(
                (p) => p.match_id === match.id && p.user_id === memberId
              );
              if (participant?.status === "going") {
                memberStats[memberId].going += 1;
              }
            });
          });

          // 출석률 계산 및 정렬
          const rankings = memberIds
            .map((memberId) => {
              const stats = memberStats[memberId];
              const rate =
                stats.total > 0
                  ? Math.round((stats.going / stats.total) * 100)
                  : 0;
              return { memberId, rate };
            })
            .sort((a, b) => b.rate - a.rate);

          const userRank = rankings.findIndex((r) => r.memberId === userId) + 1;
          const userStats = memberStats[userId];
          const userRate =
            userStats.total > 0
              ? Math.round((userStats.going / userStats.total) * 100)
              : 0;

          teamRankings.push({
            teamId,
            teamName: teamNameMap.get(teamId) || "알 수 없는 팀",
            rank: userRank,
            totalMembers: memberIds.length,
            attendanceRate: userRate,
          });
        }

        // 월별 비교 피드백 생성
        let monthlyFeedback: {
          message: string;
          trend: "up" | "down" | "stable";
        } | null = null;

        if (attendanceTrend.length >= 2) {
          const currentMonth = attendanceTrend[attendanceTrend.length - 1];
          const previousMonth = attendanceTrend[attendanceTrend.length - 2];

          const diff = currentMonth.rate - previousMonth.rate;

          if (diff > 5) {
            monthlyFeedback = {
              message: `이번 달 출석률이 지난달보다 ${Math.abs(diff)}% 올랐어요! 🎉`,
              trend: "up",
            };
          } else if (diff < -5) {
            monthlyFeedback = {
              message: `이번 달 출석률이 지난달보다 ${Math.abs(diff)}% 떨어졌어요.`,
              trend: "down",
            };
          } else {
            monthlyFeedback = {
              message: "출석률이 안정적으로 유지되고 있어요!",
              trend: "stable",
            };
          }
        }

        // 전체 출석률 계산 (배지용)
        const totalMatches = pastMatches.length;
        const totalGoing = pastMatches.filter((match: any) => {
          const userParticipant = participants?.find(
            (p) => p.match_id === match.id && p.user_id === userId
          );
          return userParticipant?.status === "going";
        }).length;
        const overallAttendanceRate =
          totalMatches > 0 ? Math.round((totalGoing / totalMatches) * 100) : 0;

        // 출석률 달성 배지 계산 (최소 경기 수 조건 포함)
        const badgeThresholds = [
          { id: "bronze", name: "브론즈", rate: 50, minMatches: 3, icon: "🥉", color: "#CD7F32" },
          { id: "silver", name: "실버", rate: 70, minMatches: 5, icon: "🥈", color: "#C0C0C0" },
          { id: "gold", name: "골드", rate: 80, minMatches: 10, icon: "🥇", color: "#FFD700" },
          { id: "platinum", name: "플래티넘", rate: 90, minMatches: 15, icon: "💎", color: "#E5E4E2" },
          { id: "perfect", name: "퍼펙트", rate: 100, minMatches: 20, icon: "⭐", color: "#FF6B6B" },
        ];

        const badges: Badge[] = badgeThresholds
          .map((threshold) => ({
            id: threshold.id,
            name: threshold.name,
            description: `최소 ${threshold.minMatches}경기 이상, 출석률 ${threshold.rate}% 달성`,
            icon: threshold.icon,
            color: threshold.color,
            achieved:
              totalMatches >= threshold.minMatches &&
              overallAttendanceRate >= threshold.rate,
          }))
          .filter((badge) => badge.achieved); // 달성한 배지만 표시

        // 연속 출석 스트릭 계산
        const sortedPastMatches = [...pastMatches].sort((a: any, b: any) => {
          const dateA = new Date(`${a.date}T${a.time || "00:00"}`);
          const dateB = new Date(`${b.date}T${b.time || "00:00"}`);
          return dateB.getTime() - dateA.getTime(); // 최신순
        });

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        for (let i = 0; i < sortedPastMatches.length; i++) {
          const match = sortedPastMatches[i];
          const userParticipant = participants?.find(
            (p) => p.match_id === match.id && p.user_id === userId
          );

          if (userParticipant?.status === "going") {
            if (i === 0) {
              // 첫 번째 경기 (가장 최근)
              currentStreak = 1;
              tempStreak = 1;
            } else {
              // 이전 경기와의 날짜 차이 확인
              const prevMatch = sortedPastMatches[i - 1];
              const matchDate = new Date(`${match.date}T${match.time || "00:00"}`);
              const prevMatchDate = new Date(
                `${prevMatch.date}T${prevMatch.time || "00:00"}`
              );
              const daysDiff =
                (prevMatchDate.getTime() - matchDate.getTime()) /
                (1000 * 60 * 60 * 24);

              // 30일 이내면 연속으로 간주
              if (daysDiff <= 30) {
                if (currentStreak > 0) {
                  currentStreak++;
                } else {
                  currentStreak = 1;
                }
                tempStreak++;
              } else {
                // 연속이 끊김
                longestStreak = Math.max(longestStreak, currentStreak, tempStreak);
                currentStreak = 0;
                tempStreak = 1;
              }
            }
          } else {
            // 출석하지 않음
            if (currentStreak > 0) {
              longestStreak = Math.max(longestStreak, currentStreak);
              currentStreak = 0;
            }
            tempStreak = 0;
          }
        }

        longestStreak = Math.max(longestStreak, currentStreak, tempStreak);

        // 팀 목표 달성률 계산 (기본 목표: 80%)
        const TEAM_GOAL_RATE = 80;
        const teamGoals = teamRankings.map((team) => {
          const progress = Math.min((team.attendanceRate / TEAM_GOAL_RATE) * 100, 100);
          return {
            teamId: team.teamId,
            teamName: team.teamName,
            goalRate: TEAM_GOAL_RATE,
            currentRate: team.attendanceRate,
            progress: Math.round(progress),
          };
        });

        setData({
          attendanceTrend,
          participationTrend,
          teamRankings,
          monthlyFeedback,
          badges,
          currentStreak,
          longestStreak,
          teamGoals,
        });
      } catch (err: any) {
        console.error("개인 성장 데이터 로딩 오류:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="rounded-lg p-4 border border-[var(--border-soft)] bg-[var(--surface-1)]">
        <div className="flex items-center justify-center py-4">
          <div className="text-xs sm:text-sm text-[#A1A1AA]">통계를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (
    !data ||
    (data.attendanceTrend.length === 0 &&
      data.teamRankings.length === 0 &&
      data.badges.length === 0 &&
      data.currentStreak === 0)
  ) {
    return null;
  }

  return (
    <div className="rounded-lg p-3 sm:p-4 border border-[var(--border-soft)] bg-[var(--surface-1)]">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[#7C3AED]" />
          <h3 className="text-xs sm:text-sm font-semibold text-[#F4F4F5]">
            나의 활동 통계
          </h3>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#71717A] transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* 게이미피케이션 요소 (항상 표시) */}
      <div className="mt-3 pt-3 border-t border-[var(--border-soft)] space-y-3">
        {/* 출석률 달성 배지 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#FFD700]" />
            <h4 className="text-[10px] sm:text-xs font-semibold text-[#F4F4F5]">
              출석률 달성 배지
            </h4>
            <div className="relative">
              <button
                type="button"
                className="flex items-center justify-center"
                onMouseEnter={() => setShowBadgeTooltip(true)}
                onMouseLeave={() => setShowBadgeTooltip(false)}
              >
                <HelpCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#71717A] hover:text-[#A1A1AA] transition-colors" />
              </button>
              {showBadgeTooltip && (
                <div className="absolute left-0 top-full mt-2 z-10 w-56 p-3 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-2)] shadow-lg">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span>🥉</span>
                      <div className="flex-1">
                        <span className="text-[9px] sm:text-[10px] text-[#F4F4F5] font-medium">
                          브론즈
                        </span>
                        <p className="text-[8px] sm:text-[9px] text-[#71717A] mt-0.5">
                          최소 3경기 이상, 출석률 50%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span>🥈</span>
                      <div className="flex-1">
                        <span className="text-[9px] sm:text-[10px] text-[#F4F4F5] font-medium">
                          실버
                        </span>
                        <p className="text-[8px] sm:text-[9px] text-[#71717A] mt-0.5">
                          최소 5경기 이상, 출석률 70%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span>🥇</span>
                      <div className="flex-1">
                        <span className="text-[9px] sm:text-[10px] text-[#F4F4F5] font-medium">
                          골드
                        </span>
                        <p className="text-[8px] sm:text-[9px] text-[#71717A] mt-0.5">
                          최소 10경기 이상, 출석률 80%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span>💎</span>
                      <div className="flex-1">
                        <span className="text-[9px] sm:text-[10px] text-[#F4F4F5] font-medium">
                          플래티넘
                        </span>
                        <p className="text-[8px] sm:text-[9px] text-[#71717A] mt-0.5">
                          최소 15경기 이상, 출석률 90%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span>⭐</span>
                      <div className="flex-1">
                        <span className="text-[9px] sm:text-[10px] text-[#F4F4F5] font-medium">
                          퍼펙트
                        </span>
                        <p className="text-[8px] sm:text-[9px] text-[#71717A] mt-0.5">
                          최소 20경기 이상, 출석률 100%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {data.badges.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {data.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-2)] text-[9px] sm:text-[10px] font-medium transition-all"
                  style={{
                    borderColor: badge.color + "40",
                    backgroundColor: badge.color + "15",
                    color: badge.color,
                  }}
                >
                  <span>{badge.icon}</span>
                  <span>{badge.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[9px] sm:text-[10px] text-[#71717A]">
              아직 획득한 배지가 없어요. 출석률을 높여보세요!
            </p>
          )}
        </div>

        {/* 연속 출석 스트릭 */}
        {data.currentStreak > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#F97316]" />
              <h4 className="text-[10px] sm:text-xs font-semibold text-[#F4F4F5]">
                연속 출석 스트릭
              </h4>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F97316]/20 text-[#F97316] text-xs sm:text-sm font-bold">
                  🔥
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold text-[#F4F4F5]">
                    {data.currentStreak}경기 연속 출석
                  </p>
                  <p className="text-[9px] text-[#71717A]">
                    최고 기록: {data.longestStreak}경기
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 팀 목표 달성률 */}
        {data.teamGoals.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#7C3AED]" />
              <h4 className="text-[10px] sm:text-xs font-semibold text-[#F4F4F5]">
                팀 목표 달성률
              </h4>
            </div>
            <div className="space-y-2">
              {data.teamGoals.map((goal) => (
                <div key={goal.teamId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] sm:text-[10px] text-[#F4F4F5] font-medium truncate flex-1">
                      {goal.teamName}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-[#A1A1AA] ml-2 shrink-0">
                      {goal.currentRate}% / {goal.goalRate}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#1A2333] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        goal.progress >= 100
                          ? "bg-[#00C16A]"
                          : goal.progress >= 75
                          ? "bg-[#7C3AED]"
                          : goal.progress >= 50
                          ? "bg-[#F97316]"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 월별 피드백 */}
        {data.monthlyFeedback && (
          <div
            className={`${
              data.monthlyFeedback.trend === "up"
                ? "text-[#00C16A]"
                : data.monthlyFeedback.trend === "down"
                ? "text-red-400"
                : "text-[#A1A1AA]"
            }`}
          >
            <div className="flex items-center gap-2">
              {data.monthlyFeedback.trend === "up" && (
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
              {data.monthlyFeedback.trend === "down" && (
                <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
              {data.monthlyFeedback.trend === "stable" && (
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
              <p className="text-[10px] sm:text-xs font-medium">
                {data.monthlyFeedback.message}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 세부 통계 (펼쳐졌을 때만 표시) */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-[var(--border-soft)] space-y-4">
          {/* 출석률 트렌드 */}
          {data.attendanceTrend.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#00C16A]" />
                <h4 className="text-[10px] sm:text-xs font-semibold text-[#F4F4F5]">
                  출석률 트렌드
                </h4>
              </div>
              <div className="space-y-1.5">
                {data.attendanceTrend.map((item) => (
                  <div key={item.month}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[9px] sm:text-[10px] text-[#A1A1AA]">
                        {item.month}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-medium text-[#F4F4F5]">
                        {item.rate}% ({item.matches}경기)
                      </span>
                    </div>
                    <div className="h-1 bg-[#1A2333] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00C16A] transition-all duration-500"
                        style={{ width: `${item.rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 참여도 변화 */}
          {data.participationTrend.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#F97316]" />
                <h4 className="text-[10px] sm:text-xs font-semibold text-[#F4F4F5]">
                  투표 참여도
                </h4>
              </div>
              <div className="space-y-1.5">
                {data.participationTrend.map((item) => (
                  <div key={item.month}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[9px] sm:text-[10px] text-[#A1A1AA]">
                        {item.month}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-medium text-[#F4F4F5]">
                        {item.rate}%
                      </span>
                    </div>
                    <div className="h-1 bg-[#1A2333] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#F97316] transition-all duration-500"
                        style={{ width: `${item.rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 팀 내 순위 */}
          {data.teamRankings.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#7C3AED]" />
                <h4 className="text-[10px] sm:text-xs font-semibold text-[#F4F4F5]">
                  팀 내 순위
                </h4>
              </div>
              <div className="space-y-1.5">
                {data.teamRankings.map((team) => (
                  <div
                    key={team.teamId}
                    className="flex items-center justify-between p-2 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-2)]"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7C3AED]/20 text-[#7C3AED] text-[9px] sm:text-[10px] font-bold shrink-0">
                        {team.rank}
                      </div>
                      <span className="text-[10px] sm:text-xs text-[#F4F4F5] truncate">
                        {team.teamName}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] sm:text-xs font-semibold text-[#F4F4F5]">
                        {team.attendanceRate}%
                      </p>
                      <p className="text-[9px] text-[#71717A]">
                        {team.totalMembers}명 중
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

