import Link from "next/link";
import { Users } from "lucide-react";
import { memo } from "react";
import styles from "@/styles/team.module.scss";

interface TeamCardProps {
  team: {
    id: string;
    name: string;
    description?: string | null;
    created_at: string;
  };
  role: "leader" | "member";
  joinedAt: string;
  memberCount?: number;
  leaderName?: string | null;
}

function TeamCardComponent({ team, role, joinedAt, memberCount, leaderName }: TeamCardProps) {
  const roleLabel = role === "leader" ? "감독" : "선수";
  const roleAriaLabel = role === "leader" ? "팀 감독" : "팀 선수";
  
  return (
    <Link 
      href={`/team/${team.id}`} 
      className={`${styles.teamCard} group`}
      aria-label={`${team.name} 팀, ${roleAriaLabel}${leaderName ? `, 감독: ${leaderName}` : ""}${memberCount !== undefined ? `, 라인업 ${memberCount}명` : ""}`}
    >
      <article className={styles.teamCardContent}>
        <div className={styles.teamCardHeader}>
          <div className={styles.teamIcon} aria-hidden="true">
            <Users className={styles.icon} />
          </div>
          <span
            className={`${styles.roleBadge} ${
              role === "leader" ? styles.roleLeader : styles.roleMember
            }`}
            aria-label={roleAriaLabel}
            role="status"
          >
            {roleLabel}
          </span>
        </div>

        <div className="flex items-baseline gap-3 flex-wrap">
          <h3 className={`${styles.teamName} mb-0`}>{team.name}</h3>
          {leaderName && (
            <span className="text-sm text-[#A1A1AA] leading-none" aria-label={`감독: ${leaderName}`}>
              감독: {leaderName}
            </span>
          )}
        </div>

        {team.description && (
          <p className={styles.teamDescription}>{team.description}</p>
        )}

        <div className={styles.teamFooter}>
          {memberCount !== undefined && (
            <span className={styles.teamMemberCount} aria-label={`라인업 ${memberCount}명`}>
              라인업 {memberCount}명
            </span>
          )}
          <time 
            dateTime={joinedAt}
            className={styles.teamDate}
            aria-label={`합류일: ${new Date(joinedAt).toLocaleDateString("ko-KR")}`}
          >
            합류일: {new Date(joinedAt).toLocaleDateString("ko-KR")}
          </time>
        </div>
      </article>
    </Link>
  );
}

export const TeamCard = memo(TeamCardComponent);
