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

  const statusText = isPast ? "종료" : statusLabels[match.status];
  const statusAriaLabel = isPast 
    ? "종료된 경기" 
    : match.status === "confirmed" 
    ? "확정된 경기" 
    : match.status === "cancelled"
    ? "취소된 경기"
    : "예정된 경기";

  return (
    <Link
      href={`/match/${match.id}`}
      className={`${styles.matchCard} group ${isPast ? styles.pastMatch : ""}`}
      aria-label={`${statusAriaLabel}, ${formattedDate} ${match.time.slice(0, 5)}, ${match.location}${showTeam && teamName ? `, ${teamName}` : ""}`}
    >
      <article className={styles.matchCardShell}>
        {voteReminder && !isPast && match.status !== "cancelled" && (
          <div className={styles.reminderBadge} role="alert" aria-live="polite">
            <BellRing className={styles.reminderIcon} aria-hidden="true" />
            <span>{voteReminder.message}</span>
          </div>
        )}
        <div className={styles.matchMeta}>
          <div className={styles.metaLeft}>
            <span className={styles.metaIcon} aria-hidden="true">
              <Calendar className={styles.metaIconSvg} />
            </span>
            <div className={styles.metaText}>
              <p className={styles.metaLabel}>일시</p>
              <time 
                dateTime={`${match.date}T${match.time}`}
                className={`${styles.metaValue} ${isPast ? styles.pastText : ""}`}
              >
                {formattedDate} {match.time.slice(0, 5)}
              </time>
            </div>
          </div>
          <span 
            className={statusBadgeClass}
            aria-label={statusAriaLabel}
            role="status"
          >
            {statusText}
          </span>
        </div>

        <div className={styles.matchBody}>
          {showTeam && teamName && (
            <span className={styles.teamBadge} aria-label={`팀: ${teamName}`}>
              {teamName}
            </span>
          )}

          <div className={styles.detailRow}>
            <span className={styles.detailIcon} aria-hidden="true">
              <MapPin className={styles.detailIconSvg} />
            </span>
            <div className={styles.detailText}>
              <p className={styles.detailLabel}>장소</p>
              <address className={`${styles.detailValue} ${isPast ? styles.pastText : ""}`}>
                {match.location}
              </address>
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
            <div className={styles.footerStats} role="group" aria-label="출석 통계">
              <div className={styles.statItem} aria-label={`참석 ${participantStats.going}명`}>
                <CheckCircle className={styles.statIconGoing} aria-hidden="true" />
                <span>{participantStats.going}</span>
              </div>
              <div className={styles.statItem} aria-label={`불참 ${participantStats.notGoing}명`}>
                <XCircle className={styles.statIconNot} aria-hidden="true" />
                <span>{participantStats.notGoing}</span>
              </div>
              <div className={styles.statItem} aria-label={`미정 ${participantStats.maybe}명`}>
                <HelpCircle className={styles.statIconMaybe} aria-hidden="true" />
                <span>{participantStats.maybe}</span>
              </div>
            </div>
            <div className={styles.footerAction} aria-hidden="true">
              <span>상세 보기</span>
              <ArrowRight className={styles.footerIcon} />
            </div>
          </div>
        )}
      </article>
    </Link>
  );
}

export const MatchCard = memo(MatchCardComponent);
