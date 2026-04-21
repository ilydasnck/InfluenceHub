"use client";

type AccountOption = {
  id: string;
  label: string;
};

type EditablePost = {
  id: string;
  title: string;
  caption: string;
  hashtags: string;
  scheduledAt: string;
  selectedTargetIds: string[];
};

type Props = {
  open: boolean;
  title: string;
  deleteLabel: string;
  closeLabel: string;
  saveLabel: string;
  labels: {
    title: string;
    caption: string;
    hashtags: string;
    scheduledAt: string;
    targets: string;
  };
  value: EditablePost | null;
  accounts: AccountOption[];
  saving: boolean;
  deleting: boolean;
  onClose: () => void;
  onChange: (next: EditablePost) => void;
  onSave: () => void;
  onDelete: () => void;
};

export function PostDetailModal({
  open,
  title,
  closeLabel,
  deleteLabel,
  saveLabel,
  labels,
  value,
  accounts,
  saving,
  deleting,
  onClose,
  onChange,
  onSave,
  onDelete,
}: Props) {
  if (!open || !value) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 px-3 py-1 text-sm dark:border-slate-700"
          >
            {closeLabel}
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700 dark:text-slate-200">{labels.title}</span>
            <input
              value={value.title}
              onChange={(e) => onChange({ ...value, title: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700 dark:text-slate-200">{labels.caption}</span>
            <textarea
              value={value.caption}
              onChange={(e) => onChange({ ...value, caption: e.target.value })}
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700 dark:text-slate-200">{labels.hashtags}</span>
            <input
              value={value.hashtags}
              onChange={(e) => onChange({ ...value, hashtags: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700 dark:text-slate-200">{labels.scheduledAt}</span>
            <input
              type="datetime-local"
              value={value.scheduledAt}
              onChange={(e) => onChange({ ...value, scheduledAt: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            />
          </label>
          <div>
            <p className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-200">{labels.targets}</p>
            <div className="grid max-h-40 grid-cols-1 gap-2 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-slate-700">
              {accounts.map((account) => {
                const checked = value.selectedTargetIds.includes(account.id);
                return (
                  <label key={account.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const selected = checked
                          ? value.selectedTargetIds.filter((id) => id !== account.id)
                          : [...value.selectedTargetIds, account.id];
                        onChange({ ...value, selectedTargetIds: selected });
                      }}
                    />
                    <span>{account.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {deleteLabel}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export type { EditablePost, AccountOption };
