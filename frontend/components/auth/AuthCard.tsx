"use client";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/context";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function AuthCard({ children }: { children: ReactNode }) {
  const { t } = useI18n();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#eef2ff] px-4 py-12 dark:bg-slate-950">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
            <Sparkles className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t("auth.brand")}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("auth.tagline")}
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
