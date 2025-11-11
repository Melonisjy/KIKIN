"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { createPortal } from "react-dom";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // 애니메이션을 위한 지연
    setTimeout(() => setIsVisible(true), 10);

    // 자동 닫기
    if (toast.duration !== 0) {
      // duration이 0이면 자동 닫기 안 함
      const timer = setTimeout(() => {
        handleClose();
      }, toast.duration || 3000);

      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 200); // 애니메이션 시간
  };

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: "bg-[#00C16A]/10 border-[#00C16A]/20 text-[#00C16A]",
    error: "bg-red-500/10 border-red-500/20 text-red-400",
    warning: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
    info: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  };

  const Icon = icons[toast.type];
  const colorClass = colors[toast.type];

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm
        ${colorClass}
        transition-all duration-200
        ${
          isVisible && !isExiting
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2"
        }
        ${isExiting ? "translate-x-full opacity-0" : ""}
        min-w-[300px] max-w-[500px]
      `}
      role="alert"
      aria-live="polite"
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded hover:bg-black/10 transition-colors"
        aria-label="닫기"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleToast = (event: CustomEvent<Omit<Toast, "id">>) => {
      const toast: Toast = {
        ...event.detail,
        id: Math.random().toString(36).substring(7),
      };
      setToasts((prev) => [...prev, toast]);
    };

    window.addEventListener("toast" as any, handleToast as EventListener);
    return () => {
      window.removeEventListener("toast" as any, handleToast as EventListener);
    };
  }, []);

  const handleClose = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed top-4 right-4 z-[300] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="알림"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onClose={handleClose} />
        </div>
      ))}
    </div>,
    document.body
  );
}

/**
 * 토스트 알림 표시 함수
 */
export function showToast(type: ToastType, message: string, duration?: number) {
  const event = new CustomEvent("toast", {
    detail: { type, message, duration },
  });
  window.dispatchEvent(event);
}

// 편의 함수들
export const toast = {
  success: (message: string, duration?: number) =>
    showToast("success", message, duration),
  error: (message: string, duration?: number) =>
    showToast("error", message, duration),
  warning: (message: string, duration?: number) =>
    showToast("warning", message, duration),
  info: (message: string, duration?: number) =>
    showToast("info", message, duration),
};
