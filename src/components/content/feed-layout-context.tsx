"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  FEED_LAYOUT_STORAGE_KEY,
  isFeedLayout,
  type FeedLayout,
} from "@/components/content/feed-layout";

type FeedLayoutContextValue = {
  layout: FeedLayout;
  setLayout: (next: FeedLayout) => void;
};

const FeedLayoutContext = createContext<FeedLayoutContextValue | null>(null);

export function FeedLayoutProvider({ children }: { children: ReactNode }) {
  const [layout, setLayoutState] = useState<FeedLayout>("big");

  useEffect(() => {
    const stored = window.localStorage.getItem(FEED_LAYOUT_STORAGE_KEY);
    if (stored && isFeedLayout(stored)) setLayoutState(stored);
  }, []);

  const setLayout = useCallback((next: FeedLayout) => {
    setLayoutState(next);
    window.localStorage.setItem(FEED_LAYOUT_STORAGE_KEY, next);
  }, []);

  const value = useMemo(
    () => ({ layout, setLayout }),
    [layout, setLayout]
  );

  return (
    <FeedLayoutContext.Provider value={value}>
      {children}
    </FeedLayoutContext.Provider>
  );
}

export function useFeedLayout() {
  const ctx = useContext(FeedLayoutContext);
  if (!ctx) {
    throw new Error("useFeedLayout must be used within FeedLayoutProvider");
  }
  return ctx;
}

/** Safe hook when provider might be absent (e.g. isolated stories). */
export function useFeedLayoutOptional() {
  return useContext(FeedLayoutContext);
}
