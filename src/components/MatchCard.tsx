import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";
import styles from "@/styles/match.module.scss";

interface MatchCardProps {
  match: {
    id: string;
    date: string;
    time: string;
    location: string;
    note?: string | null;
    status: "upcoming" | "confirmed" | "cancelled";
  };
  showTeam?: boolean;
  teamName?: string;
}

export function MatchCard({ match, showTeam, teamName }: MatchCardProps) {
  const matchDate = new Date(`${match.date}T${match.time}`);
  const isPast = matchDate < new Date();

  const statusColors = {
    upcoming: "bg-blue-500/10 text-blue-400",
    confirmed: "bg-[#00C16A]/10 text-[#00C16A]",
    cancelled: "bg-red-500/10 text-red-400",
  };

  const statusLabels = {
    upcoming: "예정",
    confirmed: "확정",
    cancelled: "취소",
  };

  return (
    <Link
      href={`/match/${match.id}`}
      className={`${styles.matchCard} group`}
    >
      <div className={styles.matchCardContent}>
        <div className={styles.matchCardHeader}>
          {showTeam && teamName && (
            <span className={styles.teamBadge}>{teamName}</span>
          )}
          <span
            className={`${styles.statusBadge} ${
              statusColors[match.status]
            } ${isPast ? "opacity-50" : ""}`}
          >
            {statusLabels[match.status]}
          </span>
        </div>

        <div className={styles.matchCardBody}>
          <div className={styles.matchInfo}>
            <Calendar className={styles.icon} />
            <span className={styles.matchDate}>
              {matchDate.toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "short",
              })}{" "}
              {match.time.slice(0, 5)}
            </span>
          </div>

          <div className={styles.matchInfo}>
            <MapPin className={styles.icon} />
            <span className={styles.matchLocation}>{match.location}</span>
          </div>

          {match.note && (
            <p className={styles.matchNote}>{match.note}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

