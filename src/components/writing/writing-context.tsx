"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type WritingDraft = {
  id?: string;
  title: string;
  body: string;
  excerpt?: string;
  image?: string;
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
      excerpt: next?.excerpt ?? "",
      image: next?.image ?? "",
    });
    setOpen(true);
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
