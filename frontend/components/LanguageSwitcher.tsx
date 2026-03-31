"use client";

import { useI18n } from "@/lib/i18n/context";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-2 py-1 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
      <Globe className="h-4 w-4 text-slate-500" aria-hidden />
      <span className="sr-only">{t("common.language")}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as "en" | "tr")}
        className="cursor-pointer bg-transparent font-medium text-slate-700 outline-none dark:text-slate-200"
        aria-label={t("common.language")}
      >
        <option value="en">{t("common.english")}</option>
        <option value="tr">{t("common.turkish")}</option>
      </select>
    </div>
  );
}
