"use client";

import { useI18n } from "@/lib/i18n/context";

export default function CreatePostPage() {
  const { t } = useI18n();
  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t("dashboard.nav.createPost")}</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">Coming soon / Yakında</p>
    </div>
  );
}
