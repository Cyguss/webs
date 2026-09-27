"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

export interface ToastContextType {
  success: (title: string, description?: string, duration?: number) => void;
  error: (title: string, description?: string, duration?: number) => void;
  warning: (title: string, description?: string, duration?: number) => void;
  info: (title: string, description?: string, duration?: number) => void;
  custom: (item: Omit<ToastItem, "id">) => void;
  toast: {
    success: (title: string, description?: string, duration?: number) => void;
    error: (title: string, description?: string, duration?: number) => void;
    warning: (title: string, description?: string, duration?: number) => void;
    info: (title: string, description?: string, duration?: number) => void;
    custom: (item: Omit<ToastItem, "id">) => void;
  };
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (item: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { ...item, id };
      setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 active

      const duration = item.duration ?? 4500;
      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  const toast = {
    success: (title: string, description?: string, duration?: number) =>
      addToast({ type: "success", title, description, duration }),
    error: (title: string, description?: string, duration?: number) =>
      addToast({ type: "error", title, description, duration }),
    warning: (title: string, description?: string, duration?: number) =>
      addToast({ type: "warning", title, description, duration }),
    info: (title: string, description?: string, duration?: number) =>
      addToast({ type: "info", title, description, duration }),
    custom: addToast,
  };

  const contextValue: ToastContextType = {
    ...toast,
    toast,
    dismiss,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast Notification Container */}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxWidth: 420,
          width: "100%",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => {
          const isError = t.type === "error";
          const isSuccess = t.type === "success";
          const isWarning = t.type === "warning";

          const accentColor = isError
            ? "#ef4444"
            : isSuccess
            ? "#10b981"
            : isWarning
            ? "#f59e0b"
            : "#ffffff";

          const IconComponent = isError
            ? AlertCircle
            : isSuccess
            ? CheckCircle2
            : isWarning
            ? AlertTriangle
            : Info;

          return (
            <div
              key={t.id}
              style={{
                pointerEvents: "auto",
                background: "var(--toast-bg, var(--color-surface))",
                border: "1px solid var(--color-border)",
                borderLeft: `3px solid ${accentColor}`,
                borderRadius: "10px",
                padding: "14px 16px",
                boxShadow: "var(--card-shadow, 0 12px 36px rgba(0, 0, 0, 0.25))",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                color: "var(--color-foreground)",
                animation: "toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ marginTop: 2, flexShrink: 0, color: accentColor }}>
                <IconComponent size={18} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-foreground)", lineHeight: 1.4 }}>
                  {t.title}
                </div>
                {t.description && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--color-muted-foreground)",
                      marginTop: 3,
                      lineHeight: 1.4,
                      wordBreak: "break-word",
                    }}
                  >
                    {t.description}
                  </div>
                )}
              </div>

              <button
                onClick={() => dismiss(t.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-muted-foreground)",
                  cursor: "pointer",
                  padding: 2,
                  marginTop: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 4,
                  transition: "color 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-foreground)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-muted-foreground)")}
                aria-label="Dismiss notification"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
