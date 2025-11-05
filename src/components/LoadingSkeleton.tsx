import styles from "@/styles/skeleton.module.scss";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={`${styles.skeleton} ${className || ""}`} />;
}

export function MatchCardSkeleton() {
  return (
    <div className={styles.matchCardSkeleton}>
      <div className={styles.skeletonHeader}>
        <Skeleton className={styles.badgeSkeleton} />
        <Skeleton className={styles.badgeSkeleton} />
      </div>
      <div className={styles.skeletonContent}>
        <Skeleton className={styles.lineSkeleton} />
        <Skeleton className={styles.lineSkeleton} />
        <Skeleton className={styles.shortLineSkeleton} />
      </div>
    </div>
  );
}

export function TeamCardSkeleton() {
  return (
    <div className={styles.teamCardSkeleton}>
      <div className={styles.skeletonHeader}>
        <Skeleton className={styles.iconSkeleton} />
        <Skeleton className={styles.badgeSkeleton} />
      </div>
      <Skeleton className={styles.titleSkeleton} />
      <Skeleton className={styles.descriptionSkeleton} />
      <Skeleton className={styles.footerSkeleton} />
    </div>
  );
}

export function MatchListSkeleton() {
  return (
    <div className={styles.matchListSkeleton}>
      {[1, 2, 3].map((i) => (
        <MatchCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TeamListSkeleton() {
  return (
    <div className={styles.teamListSkeleton}>
      {[1, 2, 3].map((i) => (
        <TeamCardSkeleton key={i} />
      ))}
    </div>
  );
}

