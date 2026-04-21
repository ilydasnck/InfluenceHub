"use client";

import { useEffect, useMemo } from "react";
import type { CreateMediaItem } from "./types";

type Props = {
  title: string;
  subtitle: string;
  selectLabel: string;
  removeLabel: string;
  hint: string;
  media: CreateMediaItem[];
  error?: string;
  onPick: (files: FileList | null) => void;
  onRemoveAt: (index: number) => void;
};

export function MediaPickerCard({
  title,
  subtitle,
  selectLabel,
  removeLabel,
  hint,
  media,
  error,
  onPick,
  onRemoveAt,
}: Props) {
  const previewUrls = useMemo(() => {
    return media.map((m) => URL.createObjectURL(m.file));
  }, [media]);

  useEffect(() => {
    return () => {
      for (const url of previewUrls) URL.revokeObjectURL(url);
    };
  }, [previewUrls]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>

      <div className="mt-4 flex items-center gap-3">
        <label className="inline-flex cursor-pointer rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500">
          {selectLabel}
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => onPick(e.target.files)}
          />
        </label>
        {media.length > 0 && (
          <button
            type="button"
            onClick={() => onPick(null)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {removeLabel}
          </button>
        )}
      </div>

      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{hint}</p>

      {media.length > 0 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {media.map((item, index) => (
            <div key={`${item.file.name}-${index}`} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {item.file.name} ({item.kind})
                </p>
                <button
                  type="button"
                  onClick={() => onRemoveAt(index)}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {removeLabel}
                </button>
              </div>
              {item.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrls[index]} alt="" className="max-h-64 w-full rounded-lg object-cover" />
              ) : (
                <video src={previewUrls[index]} controls className="max-h-64 w-full rounded-lg" />
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
    </section>
  );
}
