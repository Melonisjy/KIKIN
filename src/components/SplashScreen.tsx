"use client";

import { useEffect, useState } from "react";
import styles from "@/styles/splash.module.scss";

export function SplashScreen() {
  const [showSplash, setShowSplash] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // 로컬 스토리지에서 스플래시를 이미 봤는지 확인
    const hasSeenSplash = localStorage.getItem("hasSeenSplash");

    if (!hasSeenSplash) {
      setShowSplash(true);
      // 2.5초 후 스플래시 숨기기
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          setShowSplash(false);
          localStorage.setItem("hasSeenSplash", "true");
        }, 500); // fade-out 애니메이션 시간
      }, 2500);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      setShowSplash(false);
    }
  }, []);

  if (!showSplash) return null;

  return (
    <div
      className={`${styles.splashContainer} ${
        isVisible ? styles.visible : styles.hidden
      }`}
    >
      <div className={styles.content}>
        {/* 로고 텍스트 */}
        <div className={styles.logoContainer}>
          <h1 className={styles.logo}>
            <span className={styles.logoLetter}>킥</span>
            <span className={styles.logoDash}>-</span>
            <span className={styles.logoLetter}>인</span>
          </h1>
        </div>

        {/* 태그라인 */}
        <p className={styles.tagline}>경기, 클릭으로 시작</p>
      </div>
    </div>
  );
}
