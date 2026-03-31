"use client";

import { X } from "lucide-react";

export type PlatformId = "instagram" | "facebook" | "youtube" | "tiktok";

type ConnectAccountModalProps = {
  open: boolean;
  title: string;
  closeLabel: string;
  platforms: {
    id: PlatformId;
    label: string;
    sub: string;
    className: string;
  }[];
  onClose: () => void;
  onSelect: (platform: PlatformId) => void;
  busy?: boolean;
};

export function ConnectAccountModal({
  open,
  title,
  closeLabel,
  platforms,
  onClose,
  onSelect,
  busy,
}: ConnectAccountModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="connect-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm dark:bg-black/60"
        aria-label={closeLabel}
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 id="connect-modal-title" className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label={closeLabel}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {platforms.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={busy}
              onClick={() => onSelect(p.id)}
              className={`flex flex-col items-start gap-1 rounded-xl border border-slate-200 p-4 text-left transition hover:border-slate-300 hover:shadow-md disabled:opacity-50 dark:border-slate-700 dark:hover:border-slate-600 ${p.className}`}
            >
              <span className="text-sm font-semibold text-white drop-shadow">{p.label}</span>
              <span className="text-xs text-white/90">{p.sub}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
