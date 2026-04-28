import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Text, useColorScheme, View } from 'react-native';
import { calendarStrings } from '../../assets/Constants/calendarStrings';
import {
  MiniCalendar,
  PostDetailModal,
  type EditableAccount,
  type EditablePost,
} from '../../components';
import { formatIso } from '../../components/MiniCalendar';
import {
  deleteScheduledPost,
  fetchHistory,
  fetchScheduled,
  fetchSimpleAccounts,
  updateScheduledPost,
  type AccountKind,
  type PostHistoryItem,
} from '../../service/api';
import { createCalendarStyles } from './styles';

interface CalendarScreenProps {
  onUnauthenticated?: () => void;
}

export default function CalendarScreen({
  onUnauthenticated,
}: CalendarScreenProps) {
  const isDark = useColorScheme() === 'dark';
  const styles = useMemo(() => createCalendarStyles(isDark), [isDark]);

  const [scheduled, setScheduled] = useState<PostHistoryItem[]>([]);
  const [history, setHistory] = useState<PostHistoryItem[]>([]);
  const [accounts, setAccounts] = useState<EditableAccount[]>([]);
  const [accountKinds, setAccountKinds] = useState<
    Record<string, AccountKind>
  >({});

  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>(
    formatIso(new Date()),
  );
  const [showAllPublished, setShowAllPublished] = useState(false);

  const [editing, setEditing] = useState<EditablePost | null>(null);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    const [sRes, hRes, aRes] = await Promise.all([
      fetchScheduled(),
      fetchHistory(),
      fetchSimpleAccounts(),
    ]);

    if (
      (!sRes.ok && sRes.missingAuth) ||
      (!hRes.ok && hRes.missingAuth) ||
      (!aRes.ok && aRes.missingAuth)
    ) {
      if (onUnauthenticated) {
        onUnauthenticated();
        return;
      }
    }

    if (sRes.ok) {
      setScheduled(sRes.data);
    } else {
      setFeedback({ type: 'error', text: sRes.error || calendarStrings.loadError });
    }
    if (hRes.ok) {
      setHistory(hRes.data);
    }
    if (aRes.ok) {
      const opts: EditableAccount[] = aRes.data.map(a => ({
        id: a.id,
        label: `${a.displayName} (${a.platform})`,
        kind: a.kind,
      }));
      setAccounts(opts);
      const kinds: Record<string, AccountKind> = {};
      for (const a of aRes.data) {
        kinds[a.id] = a.kind;
      }
      setAccountKinds(kinds);
    }
    setLoading(false);
  }, [onUnauthenticated]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const markedCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const item of scheduled) {
      if (!item.scheduledAt) {
        continue;
      }
      const d = new Date(item.scheduledAt);
      if (Number.isNaN(d.getTime())) {
        continue;
      }
      const key = formatIso(d);
      m[key] = (m[key] ?? 0) + 1;
    }
    return m;
  }, [scheduled]);

  const itemsForSelectedDay = useMemo(() => {
    return scheduled
      .filter(item => {
        if (!item.scheduledAt) {
          return false;
        }
        const d = new Date(item.scheduledAt);
        return formatIso(d) === selectedDate;
      })
      .sort((a, b) => {
        const at = new Date(a.scheduledAt as string).getTime();
        const bt = new Date(b.scheduledAt as string).getTime();
        return at - bt;
      });
  }, [scheduled, selectedDate]);

  const publishedItems = useMemo(() => {
    const rows = history
      .filter(item => Boolean(item.scheduledAt) && Boolean(item.publishedAt))
      .sort((a, b) => {
        const at = new Date(a.publishedAt ?? a.createdAt).getTime();
        const bt = new Date(b.publishedAt ?? b.createdAt).getTime();
        return bt - at;
      });
    return showAllPublished ? rows : rows.slice(0, 5);
  }, [history, showAllPublished]);

  const totalPublished = useMemo(
    () =>
      history.filter(
        item => Boolean(item.scheduledAt) && Boolean(item.publishedAt),
      ).length,
    [history],
  );

  function openEdit(item: PostHistoryItem) {
    if (!item.scheduledAt) {
      return;
    }
    const d = new Date(item.scheduledAt);
    const pad = (n: number) => n.toString().padStart(2, '0');
    setEditErrors({});
    setEditing({
      id: item.id,
      title: item.title ?? '',
      caption: item.caption,
      hashtags: item.hashtags ?? '',
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
      selectedTargetIds: item.targets.map(t => t.accountId),
    });
  }

  function validateEdit(value: EditablePost): Record<string, string> {
    const next: Record<string, string> = {};
    if (!value.caption.trim()) {
      next.caption = calendarStrings.errors.captionRequired;
    }
    if (value.selectedTargetIds.length === 0) {
      next.targets = calendarStrings.errors.accountRequired;
    }
    const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(value.date);
    const timeOk = /^\d{2}:\d{2}$/.test(value.time);
    if (!value.date || !value.time) {
      next.schedule = calendarStrings.errors.scheduleRequired;
    } else if (!dateOk || !timeOk) {
      next.schedule = calendarStrings.errors.scheduleFormat;
    } else {
      const when = new Date(`${value.date}T${value.time}:00`);
      if (Number.isNaN(when.getTime())) {
        next.schedule = calendarStrings.errors.scheduleFormat;
      } else if (when.getTime() <= Date.now()) {
        next.schedule = calendarStrings.errors.scheduleFuture;
      }
    }
    return next;
  }

  async function handleSave() {
    if (!editing) {
      return;
    }
    const errs = validateEdit(editing);
    setEditErrors(errs);
    if (Object.keys(errs).length > 0) {
      return;
    }
    setSaving(true);
    setFeedback(null);
    const scheduledAt = new Date(
      `${editing.date}T${editing.time}:00`,
    ).toISOString();
    const res = await updateScheduledPost(editing.id, {
      title: editing.title || undefined,
      caption: editing.caption,
      hashtags: editing.hashtags || undefined,
      scheduledAt,
      targets: editing.selectedTargetIds.map(id => ({
        accountId: id,
        kind: accountKinds[id] ?? 'social',
      })),
    });
    setSaving(false);

    if (!res.ok) {
      if (res.missingAuth && onUnauthenticated) {
        onUnauthenticated();
        return;
      }
      setFeedback({
        type: 'error',
        text: res.error || calendarStrings.updateError,
      });
      return;
    }
    setFeedback({ type: 'success', text: calendarStrings.updated });
    setEditing(null);
    await loadAll();
  }

  function handleDelete() {
    if (!editing) {
      return;
    }
    Alert.alert(
      calendarStrings.removeConfirmTitle,
      calendarStrings.removeConfirmMessage,
      [
        { text: calendarStrings.cancel, style: 'cancel' },
        {
          text: calendarStrings.delete,
          style: 'destructive',
          onPress: async () => {
            if (!editing) {
              return;
            }
            setDeleting(true);
            setFeedback(null);
            const res = await deleteScheduledPost(editing.id);
            setDeleting(false);
            if (!res.ok) {
              if (res.missingAuth && onUnauthenticated) {
                onUnauthenticated();
                return;
              }
              setFeedback({
                type: 'error',
                text: res.error || calendarStrings.deleteError,
              });
              return;
            }
            setFeedback({ type: 'success', text: calendarStrings.deleted });
            setEditing(null);
            await loadAll();
          },
        },
      ],
    );
  }

  const selectedDateLabel = useMemo(() => {
    const d = new Date(selectedDate);
    if (Number.isNaN(d.getTime())) {
      return selectedDate;
    }
    return `${d.getDate()} ${calendarStrings.monthNames[d.getMonth()]} ${d.getFullYear()}`;
  }, [selectedDate]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{calendarStrings.title}</Text>
        <Text style={styles.subtitle}>{calendarStrings.subtitle}</Text>
      </View>

      {feedback && (
        <View
          style={[
            styles.feedbackBox,
            feedback.type === 'success'
              ? styles.feedbackSuccess
              : styles.feedbackError,
          ]}>
          <Text
            style={
              feedback.type === 'success'
                ? styles.feedbackTextSuccess
                : styles.feedbackTextError
            }>
            {feedback.text}
          </Text>
        </View>
      )}

      <MiniCalendar
        selectedDate={selectedDate}
        markedCounts={markedCounts}
        onSelectDate={setSelectedDate}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{calendarStrings.postsOnDay}</Text>
        <Text style={styles.selectedDateHeader}>{selectedDateLabel}</Text>
        {loading ? (
          <Text style={styles.loadingText}>{calendarStrings.loading}</Text>
        ) : itemsForSelectedDay.length === 0 ? (
          <Text style={styles.emptyText}>
            {calendarStrings.noPostsForDay}
          </Text>
        ) : (
          itemsForSelectedDay.map(item => (
            <Pressable
              key={item.id}
              style={styles.item}
              onPress={() => openEdit(item)}>
              <PostRowHeader item={item} styles={styles} />
              <Text style={styles.itemMeta}>
                {calendarStrings.when}:{' '}
                {formatDateTime(item.scheduledAt)}
              </Text>
              {item.targets.length > 0 ? (
                <Text style={styles.itemMeta}>
                  {calendarStrings.accounts}:{' '}
                  {item.targets
                    .map(t => t.accountLabel ?? t.accountId)
                    .join(', ')}
                </Text>
              ) : null}
              {item.caption ? (
                <Text style={styles.itemCaption} numberOfLines={2}>
                  {item.caption}
                </Text>
              ) : null}
            </Pressable>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {calendarStrings.sections.history}
        </Text>
        {publishedItems.length === 0 ? (
          <Text style={styles.emptyText}>{calendarStrings.empty}</Text>
        ) : (
          publishedItems.map(item => (
            <View key={item.id} style={styles.item}>
              <PostRowHeader item={item} styles={styles} />
              <Text style={styles.itemMeta}>
                {calendarStrings.publishedWhen}:{' '}
                {formatDateTime(item.publishedAt ?? item.createdAt)}
              </Text>
              {item.targets.length > 0 ? (
                <Text style={styles.itemMeta}>
                  {calendarStrings.accounts}:{' '}
                  {item.targets
                    .map(t => t.accountLabel ?? t.accountId)
                    .join(', ')}
                </Text>
              ) : null}
              {item.caption ? (
                <Text style={styles.itemCaption} numberOfLines={2}>
                  {item.caption}
                </Text>
              ) : null}
            </View>
          ))
        )}
        {totalPublished > 5 && (
          <Pressable
            style={styles.moreBtn}
            onPress={() => setShowAllPublished(prev => !prev)}>
            <Text style={styles.moreBtnText}>
              {showAllPublished
                ? calendarStrings.showLess
                : calendarStrings.viewAll}
            </Text>
          </Pressable>
        )}
      </View>

      <PostDetailModal
        visible={editing !== null}
        value={editing}
        accounts={accounts}
        saving={saving}
        deleting={deleting}
        errors={editErrors}
        onClose={() => {
          if (!saving && !deleting) {
            setEditing(null);
          }
        }}
        onChange={next => setEditing(next)}
        onSave={() => void handleSave()}
        onDelete={handleDelete}
      />
    </View>
  );
}

interface PostRowHeaderProps {
  item: PostHistoryItem;
  styles: ReturnType<typeof createCalendarStyles>;
}

function PostRowHeader({ item, styles }: PostRowHeaderProps) {
  const isSuccess = item.status === 'SUCCESS';
  const isFailed = item.status === 'FAILED';
  return (
    <View style={styles.itemHeader}>
      <Text style={styles.itemTitle} numberOfLines={1}>
        {item.title?.trim() || item.caption.slice(0, 40) || '—'}
      </Text>
      <View
        style={[
          styles.statusPill,
          isSuccess
            ? styles.statusPillSuccess
            : isFailed
              ? styles.statusPillFailed
              : null,
        ]}>
        <Text
          style={[
            styles.statusText,
            isSuccess
              ? styles.statusTextSuccess
              : isFailed
                ? styles.statusTextFailed
                : null,
          ]}>
          {calendarStrings.status[item.status] ?? item.status}
        </Text>
      </View>
    </View>
  );
}

function formatDateTime(iso: string | null): string {
  if (!iso) {
    return '—';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
