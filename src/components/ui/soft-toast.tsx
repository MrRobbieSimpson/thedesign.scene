"use client";

import {
  useCallback,
  useEffect,
  useState,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type Toast = {
  id: number;
  message: string;
};

type SoftToastApi = {
  toast: (message: string) => void;
};

const SoftToastContext = createContext<SoftToastApi | null>(null);

let toastId = 0;

/**
 * Quiet bottom toast — paper/ink, no shouty snackbars.
 */
export function SoftToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toast = useCallback((message: string) => {
    const id = ++toastId;
    setToasts((current) => [...current.slice(-2), { id, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 2800);
  }, []);

  return (
    <SoftToastContext.Provider value={{ toast }}>
      {children}
      {mounted
        ? createPortal(
            <div
              className="pointer-events-none fixed inset-x-0 bottom-6 z-[120] flex flex-col items-center gap-2 px-4"
              aria-live="polite"
            >
              {toasts.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "pointer-events-none rounded-full border border-border/60 bg-card/95 px-4 py-2",
                    "text-sm text-foreground/90 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.5)]",
                    "backdrop-blur-md soft-toast-enter"
                  )}
                >
                  {item.message}
                </div>
              ))}
            </div>,
            document.body
          )
        : null}
    </SoftToastContext.Provider>
  );
}

export function useSoftToast() {
  const ctx = useContext(SoftToastContext);
  return ctx;
}
