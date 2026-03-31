"use client";

import { AuthCard } from "@/components/auth/AuthCard";
import { getApiBase, setStoredToken } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBase()}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = (await res.json()) as { data?: { token: string }; error?: string };
      if (!res.ok) {
        setError(json.error ?? t("auth.error"));
        return;
      }
      if (json.data?.token) {
        setStoredToken(json.data.token);
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError(t("auth.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard>
      <p className="mb-6 text-center text-sm text-slate-600 dark:text-slate-400">
        {t("auth.loginSubtitle")}
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-800 dark:text-slate-200">
            {t("auth.email")}
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("auth.emailPlaceholder")}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none ring-blue-500/30 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-800 dark:text-slate-200">
            {t("auth.password")}
          </label>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-xl bg-slate-900 py-3.5 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          {loading ? t("auth.loggingIn") : t("auth.signIn")}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        {t("auth.noAccount")}{" "}
        <Link href="/register" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
          {t("auth.signUp")}
        </Link>
      </p>
      <p className="mt-4 text-center text-xs italic text-slate-400">{t("auth.demoHint")}</p>
    </AuthCard>
  );
}
