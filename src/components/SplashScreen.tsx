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
      className={`${styles.splashContainer} ${isVisible ? styles.visible : styles.hidden}`}
    >
      <div className={styles.content}>
        {/* 풋살 공 애니메이션 - 더 크고 중앙에 */}
        <div className={styles.ballContainer}>
          <div className={styles.ball}>
            {/* 공 SVG */}
            <svg
              width="180"
              height="180"
              viewBox="0 0 180 180"
              className={styles.ballSvg}
            >
              {/* 공 배경 */}
              <circle
                cx="90"
                cy="90"
                r="85"
                fill="#ffffff"
                className={styles.ballCircle}
              />
              {/* 공 패턴 */}
              <path
                d="M 90 15 Q 45 45 15 90 Q 45 135 90 165 Q 135 135 165 90 Q 135 45 90 15"
                fill="none"
                stroke="#1a1a1a"
                strokeWidth="4"
              />
              <path
                d="M 90 15 Q 67.5 30 52.5 52.5 Q 30 67.5 15 90 Q 30 112.5 52.5 127.5 Q 67.5 150 90 165"
                fill="none"
                stroke="#1a1a1a"
                strokeWidth="3"
              />
              <path
                d="M 90 15 Q 112.5 30 127.5 52.5 Q 150 67.5 165 90 Q 150 112.5 127.5 127.5 Q 112.5 150 90 165"
                fill="none"
                stroke="#1a1a1a"
                strokeWidth="3"
              />
              {/* 하이라이트 */}
              <ellipse
                cx="75"
                cy="75"
                rx="22"
                ry="30"
                fill="rgba(255, 255, 255, 0.7)"
              />
              {/* 로고 텍스트를 공 안에 */}
              <text
                x="90"
                y="105"
                textAnchor="middle"
                className={styles.ballText}
                fontSize="32"
                fontWeight="700"
                fill="#1a1a1a"
              >
                FM
              </text>
            </svg>
          </div>
          {/* 그림자 */}
          <div className={styles.shadow} />
        </div>

        {/* 로고 텍스트 - 공 아래 */}
        <div className={styles.logoContainer}>
          <h1 className={styles.logo}>
            <span className={styles.logoLetter}>F</span>
            <span className={styles.logoLetter}>u</span>
            <span className={styles.logoLetter}>t</span>
            <span className={styles.logoLetter}>s</span>
            <span className={styles.logoLetter}>a</span>
            <span className={styles.logoLetter}>l</span>
            <span className={styles.logoSpace}> </span>
            <span className={styles.logoLetter}>M</span>
            <span className={styles.logoLetter}>a</span>
            <span className={styles.logoLetter}>t</span>
            <span className={styles.logoLetter}>e</span>
          </h1>
        </div>

        {/* 점 로딩 애니메이션 */}
        <div className={styles.dots}>
          <div className={styles.dot} />
          <div className={styles.dot} />
          <div className={styles.dot} />
        </div>

        {/* 태그라인 */}
        <p className={styles.tagline}>풋살 팀 경기 일정 관리</p>
      </div>
    </div>
  );
}
