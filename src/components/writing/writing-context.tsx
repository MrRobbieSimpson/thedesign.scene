"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type WritingDraft = {
  id?: string;
  title: string;
  body: string;
};

type WritingContextValue = {
  open: boolean;
  visible: boolean;
  draft: WritingDraft;
  openWriter: (draft?: Partial<WritingDraft>) => void;
  closeWriter: () => void;
  setDraft: (draft: WritingDraft) => void;
};

const WritingContext = createContext<WritingContextValue | null>(null);

export function WritingProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState<WritingDraft>({ title: "", body: "" });

  const openWriter = useCallback((next?: Partial<WritingDraft>) => {
    setDraft({
      id: next?.id,
      title: next?.title ?? "",
      body: next?.body ?? "",
    });
    setOpen(true);
    // Allow CSS enter transition after mount
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
  }, []);

  const closeWriter = useCallback(() => {
    setVisible(false);
    window.setTimeout(() => setOpen(false), 420);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeWriter();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeWriter]);

  const value = useMemo(
    () => ({ open, visible, draft, openWriter, closeWriter, setDraft }),
    [open, visible, draft, openWriter, closeWriter]
  );

  return (
    <WritingContext.Provider value={value}>{children}</WritingContext.Provider>
  );
}

export function useWriting() {
  const ctx = useContext(WritingContext);
  if (!ctx) {
    throw new Error("useWriting must be used within WritingProvider");
  }
  return ctx;
}
