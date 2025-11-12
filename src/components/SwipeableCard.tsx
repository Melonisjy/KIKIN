"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SwipeAction {
  label: string;
  icon?: React.ReactNode;
  color: string;
  bgColor: string;
  onAction: () => void;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipe?: (direction: "left" | "right") => void;
  className?: string;
  disabled?: boolean;
}

export function SwipeableCard({
  children,
  leftActions = [],
  rightActions = [],
  onSwipe,
  className,
  disabled = false,
}: SwipeableCardProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 100;
  const ACTION_WIDTH = 80;

  useEffect(() => {
    if (!isDragging) {
      // 스와이프 완료 후 위치 조정
      if (translateX > SWIPE_THRESHOLD && rightActions.length > 0) {
        setTranslateX(ACTION_WIDTH * rightActions.length);
        onSwipe?.("right");
      } else if (translateX < -SWIPE_THRESHOLD && leftActions.length > 0) {
        setTranslateX(-ACTION_WIDTH * leftActions.length);
        onSwipe?.("left");
      } else {
        setTranslateX(0);
      }
    }
  }, [isDragging, translateX, leftActions.length, rightActions.length, onSwipe]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled) return;

    const newX = e.touches[0].clientX;
    const diff = newX - startX;
    setCurrentX(newX);

    // 스와이프 범위 제한
    const maxRight = ACTION_WIDTH * rightActions.length;
    const maxLeft = ACTION_WIDTH * leftActions.length;

    if (diff > 0 && rightActions.length > 0) {
      setTranslateX(Math.min(diff, maxRight));
    } else if (diff < 0 && leftActions.length > 0) {
      setTranslateX(Math.max(diff, -maxLeft));
    } else {
      setTranslateX(0);
    }
  };

  const handleTouchEnd = () => {
    if (disabled) return;
    setIsDragging(false);
  };

  const handleActionClick = (action: SwipeAction) => {
    action.onAction();
    setTranslateX(0);
  };

  const handleCardClick = () => {
    if (translateX !== 0) {
      setTranslateX(0);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden touch-pan-y md:overflow-visible"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Left Actions */}
      {leftActions.length > 0 && (
        <div className="absolute left-0 top-0 bottom-0 flex md:hidden">
          {leftActions.map((action, index) => (
            <button
              key={index}
              onClick={(e) => handleActionClick(action, e)}
              className={cn(
                "flex items-center justify-center min-w-[80px] px-4",
                action.bgColor,
                action.color,
                "transition-opacity duration-200",
                translateX < -ACTION_WIDTH * (index + 1) + ACTION_WIDTH / 2
                  ? "opacity-100"
                  : "opacity-0"
              )}
              style={{
                width: `${ACTION_WIDTH}px`,
              }}
            >
              {action.icon}
              <span className="text-xs font-medium ml-1">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Right Actions */}
      {rightActions.length > 0 && (
        <div className="absolute right-0 top-0 bottom-0 flex md:hidden">
          {rightActions.map((action, index) => (
            <button
              key={index}
              onClick={(e) => handleActionClick(action, e)}
              className={cn(
                "flex items-center justify-center min-w-[80px] px-4",
                action.bgColor,
                action.color,
                "transition-opacity duration-200",
                translateX > ACTION_WIDTH * (index + 1) - ACTION_WIDTH / 2
                  ? "opacity-100"
                  : "opacity-0"
              )}
              style={{
                width: `${ACTION_WIDTH}px`,
              }}
            >
              {action.icon}
              <span className="text-xs font-medium ml-1">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Card */}
      <div
        ref={cardRef}
        onClick={handleCardClick}
        className={cn(
          "relative transition-transform duration-200 ease-out md:transition-none",
          isDragging && "transition-none",
          className
        )}
        style={{
          transform: `translateX(${translateX}px)`,
          touchAction: "pan-y",
        }}
      >
        {children}
      </div>
    </div>
  );
}

