import Link from "next/link";
import {
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  HelpCircle,
  ArrowRight,
  BellRing,
} from "lucide-react";
import { memo, useMemo } from "react";
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
  voteReminder?: {
    message: string;
  } | null;
}

function MatchCardComponent({
  match,
  showTeam,
  teamName,
  participantStats,
  voteReminder,
}: MatchCardProps) {
  const { matchDate, isPast, formattedDate } = useMemo(() => {
    const date = new Date(`${match.date}T${match.time}`);
    const past = date < new Date();
    const formatted = date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
    return { matchDate: date, isPast: past, formattedDate: formatted };
  }, [match.date, match.time]);

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

  const statusBadgeClass = isPast
    ? `${styles.statusBadge} ${styles.statusPast}`
    : `${styles.statusBadge} ${statusColors[match.status]}`;

  return (
    <Link
      href={`/match/${match.id}`}
      className={`${styles.matchCard} group ${isPast ? styles.pastMatch : ""}`}
    >
      <div className={styles.matchCardShell}>
        {voteReminder && !isPast && match.status !== "cancelled" && (
          <div className={styles.reminderBadge}>
            <BellRing className={styles.reminderIcon} />
            <span>{voteReminder.message}</span>
          </div>
        )}
        <div className={styles.matchMeta}>
          <div className={styles.metaLeft}>
            <span className={styles.metaIcon}>
              <Calendar className={styles.metaIconSvg} />
            </span>
            <div className={styles.metaText}>
              <p className={styles.metaLabel}>일시</p>
              <p className={`${styles.metaValue} ${isPast ? styles.pastText : ""}`}>
                {formattedDate} {match.time.slice(0, 5)}
              </p>
            </div>
          </div>
          <span className={statusBadgeClass}>{isPast ? "종료" : statusLabels[match.status]}</span>
        </div>

        <div className={styles.matchBody}>
          {showTeam && teamName && (
            <span className={styles.teamBadge}>{teamName}</span>
          )}

          <div className={styles.detailRow}>
            <span className={styles.detailIcon}>
              <MapPin className={styles.detailIconSvg} />
            </span>
            <div className={styles.detailText}>
              <p className={styles.detailLabel}>장소</p>
              <p className={`${styles.detailValue} ${isPast ? styles.pastText : ""}`}>
                {match.location}
              </p>
            </div>
          </div>

          {match.note && (
            <div className={styles.noteBlock}>
              <p className={styles.detailLabel}>메모</p>
              <p className={`${styles.noteText} ${isPast ? styles.pastText : ""}`}>
                {match.note}
              </p>
            </div>
          )}
        </div>

        {(participantStats &&
          (participantStats.going > 0 ||
            participantStats.notGoing > 0 ||
            participantStats.maybe > 0)) && (
          <div className={styles.matchFooter}>
            <div className={styles.footerStats}>
              <div className={styles.statItem}>
                <CheckCircle className={styles.statIconGoing} />
                <span>{participantStats.going}</span>
              </div>
              <div className={styles.statItem}>
                <XCircle className={styles.statIconNot} />
                <span>{participantStats.notGoing}</span>
              </div>
              <div className={styles.statItem}>
                <HelpCircle className={styles.statIconMaybe} />
                <span>{participantStats.maybe}</span>
              </div>
            </div>
            <div className={styles.footerAction}>
              <span>상세 보기</span>
              <ArrowRight className={styles.footerIcon} />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

export const MatchCard = memo(MatchCardComponent);
