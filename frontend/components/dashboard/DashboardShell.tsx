"use client";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getStoredToken, isLocalAdminToken, setStoredToken } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";
import {
  BarChart3,
  Bell,
  Bot,
  Calendar,
  LayoutDashboard,
  LogOut,
  PenSquare,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

const navKeys = [
  { href: "/dashboard", key: "dashboard.nav.dashboard", icon: LayoutDashboard },
  { href: "/dashboard/accounts", key: "dashboard.nav.accounts", icon: Users },
  { href: "/dashboard/create", key: "dashboard.nav.createPost", icon: PenSquare },
  { href: "/dashboard/calendar", key: "dashboard.nav.calendar", icon: Calendar },
  { href: "/dashboard/analytics", key: "dashboard.nav.analytics", icon: BarChart3 },
  { href: "/dashboard/ai", key: "dashboard.nav.aiAssistant", icon: Bot },
  { href: "/dashboard/settings", key: "dashboard.nav.settings", icon: Settings },
] as const;

export function DashboardShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    if (isLocalAdminToken(token)) {
      setEmail("admin");
      return;
    }
    try {
      const payload = JSON.parse(atob((getStoredToken() ?? "").split(".")[1] ?? "{}")) as {
        email?: string;
      };
      setEmail(payload.email ?? null);
    } catch {
      setEmail(null);
    }
  }, [router]);

  function logout() {
    setStoredToken(null);
    router.push("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <aside className="flex h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-5 py-6 dark:border-slate-800">
          <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{t("auth.brand")}</p>
          <p className="text-xs text-slate-500">{t("auth.tagline")}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navKeys.map(({ href, key, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {t(key)}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-2 dark:bg-slate-800/80">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              {(email ?? "?")[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                {email?.split("@")[0] ?? "user"}
              </p>
              <p className="text-xs text-slate-500">{t("dashboard.role")}</p>
            </div>
          </div>
        </div>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {t("dashboard.welcome")}
          </p>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <button
              type="button"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              title={t("dashboard.notifications")}
              aria-label={t("dashboard.notifications")}
            >
              <Bell className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              title={t("dashboard.logout")}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
