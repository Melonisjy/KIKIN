"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  className,
}: BottomSheetProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // 포커스 트랩 (모달 내부에 포커스 유지)
  useEffect(() => {
    if (!isOpen || !shouldRender) return;

    const modalElement = document.querySelector('[role="dialog"]') as HTMLElement;
    if (!modalElement) return;

    const focusableElements = modalElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modalElement.addEventListener("keydown", handleTabKey);
    firstElement?.focus();

    return () => {
      modalElement.removeEventListener("keydown", handleTabKey);
    };
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop - 모바일에서만 표시 */}
      <div
        className={cn(
          "fixed inset-0 z-[100] bg-[#0F1115]/80 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isAnimating ? "opacity-100" : "opacity-0"
        )}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Bottom Sheet - 모바일 */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[101] md:hidden",
          "bg-[#181A1F] border-t border-[#2C354B] rounded-t-2xl",
          "shadow-[0_-4px_24px_rgba(0,0,0,0.5)]",
          "transform transition-transform duration-300 ease-out",
          "max-h-[90vh] flex flex-col",
          isAnimating ? "translate-y-0" : "translate-y-full",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "bottom-sheet-title" : undefined}
      >
        {/* Handle Bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 rounded-full bg-[#2C354B]" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 pb-3 border-b border-[#2C354B]">
            <h2
              id="bottom-sheet-title"
              className="text-lg font-semibold text-[#F4F4F5]"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#1A2333] transition-colors touch-manipulation"
              aria-label="닫기"
            >
              <X className="h-5 w-5 text-[#A1A1AA]" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>

      {/* Modal - 데스크톱 */}
      <div
        className={cn(
          "hidden md:flex fixed inset-0 z-[100] items-center justify-center p-4",
          "bg-[#0F1115]/80 backdrop-blur-sm transition-opacity duration-200",
          isAnimating ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "bottom-sheet-title-desktop" : undefined}
      >
        <div
          className={cn(
            "bg-[#181A1F] border border-[#2C354B] rounded-xl",
            "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]",
            "max-w-lg w-full max-h-[90vh] flex flex-col",
            "transform transition-all duration-200",
            isAnimating
              ? "scale-100 translate-y-0 opacity-100"
              : "scale-95 translate-y-4 opacity-0",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2C354B]">
              <h2
                id="bottom-sheet-title-desktop"
                className="text-xl font-semibold text-[#F4F4F5]"
              >
                {title}
              </h2>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#1A2333] transition-colors"
                aria-label="닫기"
              >
                <X className="h-5 w-5 text-[#A1A1AA]" />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </div>
      </div>
    </>
  );
}

