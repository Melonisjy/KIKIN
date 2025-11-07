"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import styles from "@/styles/modal.module.scss";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  variant?: "default" | "danger";
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  confirmText = "확인",
  cancelText = "취소",
  onConfirm,
  onCancel,
  variant = "default",
}: ModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // 모달 열기/닫기 애니메이션 처리
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // 다음 프레임에서 애니메이션 시작
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      // 애니메이션 완료 후 DOM에서 제거
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 200);
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

  if (!shouldRender) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isAnimating) {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  return (
    <div
      className={`${styles.modalOverlay} ${isAnimating ? styles.isOpen : ""}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`${styles.modalContent} ${isAnimating ? styles.isOpen : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2 id="modal-title" className={styles.modalTitle}>{title}</h2>
          <button
            onClick={onClose}
            className={styles.modalClose}
            aria-label="모달 닫기"
            type="button"
          >
            <X className={styles.closeIcon} />
          </button>
        </div>

        <div className={styles.modalBody}>{children}</div>

        {(onConfirm || onCancel) && (
          <div className={styles.modalFooter}>
            {onCancel && (
              <Button variant="outline" onClick={handleCancel} type="button">
                {cancelText}
              </Button>
            )}
            {onConfirm && (
              <Button
                variant={variant === "danger" ? "destructive" : "default"}
                onClick={onConfirm}
                type="button"
              >
                {confirmText}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
