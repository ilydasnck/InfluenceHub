"use client";

import { useTheme } from "@/components/ThemeProvider";
import { useI18n } from "@/lib/i18n/context";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      title={isDark ? t("common.switchToLight") : t("common.switchToDark")}
      aria-label={isDark ? t("common.switchToLight") : t("common.switchToDark")}
    >
      {isDark ? (
        <Moon className="h-5 w-5" aria-hidden />
      ) : (
        <Sun className="h-5 w-5" aria-hidden />
      )}
    </button>
  );
}
