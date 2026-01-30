"use client";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type ThemeContextType = {
  selectedThemeIds: string[];
  setThemes: (themeIds: string[]) => void;
  toggleTheme: (themeId: string) => void;
  clearThemes: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [selectedThemeIds, setSelectedThemeIds] = useState<string[]>([]);

  const setThemes = useCallback((themeIds: string[]) => {
    const unique = Array.from(new Set((themeIds ?? []).filter(Boolean)));
    setSelectedThemeIds((prev) => {
      if (prev.length !== unique.length) return unique;
      for (let i = 0; i < prev.length; i++) {
        if (prev[i] !== unique[i]) return unique;
      }
      return prev;
    });
  }, []);

  const toggleTheme = useCallback((themeId: string) => {
    if (!themeId) return;
    setSelectedThemeIds((prev) => {
      if (prev.includes(themeId)) return prev.filter((t) => t !== themeId);
      return [...prev, themeId];
    });
  }, []);

  const clearThemes = useCallback(() => setSelectedThemeIds([]), []);

  const value = useMemo(
    () => ({ selectedThemeIds, setThemes, toggleTheme, clearThemes }),
    [selectedThemeIds, setThemes, toggleTheme, clearThemes]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
