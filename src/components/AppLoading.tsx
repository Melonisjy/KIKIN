"use client";

import styles from "@/styles/loading.module.scss";

export function AppLoading() {
  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} />

      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.brand}>킥-인</span>
          <span className={styles.status}>kick-off 준비 중</span>
        </div>

        <div className={styles.pitch}>
          <div className={styles.pitchShading} />
          <div className={styles.pitchBorder} />
          <div className={styles.pitchMidline} />
          <div className={styles.pitchCircle} />
          <div className={styles.pitchArcTop} />
          <div className={styles.pitchArcBottom} />
          <div className={styles.pitchGlow} />

          <div className={styles.orbit}>
            <span className={styles.ball} />
          </div>
        </div>

        <div className={styles.message}>
          <p className={styles.title}>경기장을 세팅하는 중입니다</p>
          <p className={styles.subtitle}>곧 킥오프할게요</p>
        </div>

        <div className={styles.progress}>
          <span className={styles.progressIndicator} />
        </div>
      </div>
    </div>
  );
}


