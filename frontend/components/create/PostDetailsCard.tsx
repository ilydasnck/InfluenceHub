import { FormEvent } from "react";

type Props = {
  title: string;
  subtitle: string;
  valueTitle: string;
  valueCaption: string;
  valueHashtags: string;
  onTitleChange: (v: string) => void;
  onCaptionChange: (v: string) => void;
  onHashtagsChange: (v: string) => void;
  errors: { title?: string; caption?: string; hashtags?: string; content?: string };
  labels: {
    postTitle: string;
    caption: string;
    hashtags: string;
    titlePlaceholder: string;
    captionPlaceholder: string;
    hashtagsPlaceholder: string;
  };
};

export function PostDetailsCard({
  title,
  subtitle,
  valueTitle,
  valueCaption,
  valueHashtags,
  onTitleChange,
  onCaptionChange,
  onHashtagsChange,
  errors,
  labels,
}: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
            {labels.postTitle}
          </label>
          <input
            type="text"
            value={valueTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={labels.titlePlaceholder}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
            {labels.caption}
          </label>
          <textarea
            value={valueCaption}
            onChange={(e) => onCaptionChange(e.target.value)}
            placeholder={labels.captionPlaceholder}
            rows={4}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          {errors.caption && <p className="mt-1 text-xs text-red-600">{errors.caption}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
            {labels.hashtags}
          </label>
          <input
            type="text"
            value={valueHashtags}
            onChange={(e) => onHashtagsChange(e.target.value)}
            placeholder={labels.hashtagsPlaceholder}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          {errors.hashtags && <p className="mt-1 text-xs text-red-600">{errors.hashtags}</p>}
        </div>

        {errors.content && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.content}</p>}
      </div>
    </section>
  );
}
