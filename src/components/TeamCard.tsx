import Link from "next/link";
import { Users } from "lucide-react";
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

export function TeamCard({ team, role, joinedAt, memberCount, leaderName }: TeamCardProps) {
  return (
    <Link href={`/team/${team.id}`} className={`${styles.teamCard} group`}>
      <div className={styles.teamCardContent}>
        <div className={styles.teamCardHeader}>
          <div className={styles.teamIcon}>
            <Users className={styles.icon} />
          </div>
          <span
            className={`${styles.roleBadge} ${
              role === "leader"
                ? styles.roleLeader
                : styles.roleMember
            }`}
          >
            {role === "leader" ? "팀장" : "멤버"}
          </span>
        </div>

        <div className="flex items-baseline gap-3 flex-wrap">
          <h3 className={`${styles.teamName} mb-0`}>{team.name}</h3>
          {leaderName && (
            <span className="text-sm text-[#A1A1AA] leading-none">
              팀장: {leaderName}
            </span>
          )}
        </div>

        {team.description && (
          <p className={styles.teamDescription}>{team.description}</p>
        )}

        <div className={styles.teamFooter}>
          {memberCount !== undefined && (
            <span className={styles.teamMemberCount}>
              팀원 {memberCount}명
            </span>
          )}
          <span className={styles.teamDate}>
            가입일: {new Date(joinedAt).toLocaleDateString("ko-KR")}
          </span>
        </div>
      </div>
    </Link>
  );
}

