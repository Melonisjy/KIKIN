import Link from "next/link";
import { Calendar, MapPin, CheckCircle, XCircle, HelpCircle } from "lucide-react";
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
  participantStats?: {
    going: number;
    notGoing: number;
    maybe: number;
  };
}

export function MatchCard({ match, showTeam, teamName, participantStats }: MatchCardProps) {
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
      className={`${styles.matchCard} group ${isPast ? styles.pastMatch : ""}`}
    >
      <div className={styles.matchCardContent}>
        <div className={styles.matchCardHeader}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {showTeam && teamName && (
              <span className={styles.teamBadge}>{teamName}</span>
            )}
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className={styles.icon} />
              <span className={`${styles.matchDate} ${isPast ? styles.pastText : ""}`}>
                {matchDate.toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "short",
                })}{" "}
                {match.time.slice(0, 5)}
              </span>
            </div>
          </div>
          {isPast ? (
            <span className={`${styles.statusBadge} bg-[#27272A] text-[#A1A1AA] flex-shrink-0`}>
              종료
            </span>
          ) : (
            <span
              className={`${styles.statusBadge} ${
                statusColors[match.status]
              } flex-shrink-0`}
            >
              {statusLabels[match.status]}
            </span>
          )}
        </div>

        <div className={styles.matchCardBody}>
          <div className={styles.matchInfo}>
            <MapPin className={styles.icon} />
            <span className={`${styles.matchLocation} ${isPast ? styles.pastText : ""}`}>
              {match.location}
            </span>
          </div>

          {match.note && (
            <p className={`${styles.matchNote} ${isPast ? styles.pastText : ""}`}>
              {match.note}
            </p>
          )}

          {participantStats && (participantStats.going > 0 || participantStats.notGoing > 0 || participantStats.maybe > 0) && (
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#27272A]">
              <div className="flex items-center gap-1.5 text-xs">
                <CheckCircle className="h-3.5 w-3.5 text-[#00C16A]" />
                <span className="text-[#A1A1AA]">{participantStats.going}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <XCircle className="h-3.5 w-3.5 text-red-400" />
                <span className="text-[#A1A1AA]">{participantStats.notGoing}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <HelpCircle className="h-3.5 w-3.5 text-yellow-400" />
                <span className="text-[#A1A1AA]">{participantStats.maybe}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

