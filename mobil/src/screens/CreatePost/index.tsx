import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { createStrings } from '../../assets/Constants/createStrings';
import { MediaPicker, type MediaItem } from '../../components';
import {
  fetchHistory,
  fetchSimpleAccounts,
  publishNow,
  schedulePost,
  type AccountKind,
  type PlatformId,
  type PostHistoryItem,
} from '../../service/api';
import { createCreatePostStyles } from './styles';

interface CreatePostScreenProps {
  onUnauthenticated?: () => void;
  /** Drawer açma callback'i (boş hesap durumunda Hesaplar'a yönlendirmek için) */
  onGoAccounts?: () => void;
}

interface FormAccount {
  id: string;
  kind: AccountKind;
  platform: PlatformId | string;
  displayName: string;
  handle: string;
}

export default function CreatePostScreen({
  onUnauthenticated,
  onGoAccounts,
}: CreatePostScreenProps) {
  const isDark = useColorScheme() === 'dark';
  const styles = useMemo(() => createCreatePostStyles(isDark), [isDark]);

  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const [accounts, setAccounts] = useState<FormAccount[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [history, setHistory] = useState<PostHistoryItem[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);

  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingNow, setLoadingNow] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedTargets = useMemo(
    () =>
      accounts
        .filter(a => selectedIds.includes(a.id))
        .map(a => ({ accountId: a.id, kind: a.kind })),
    [accounts, selectedIds],
  );

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    const res = await fetchSimpleAccounts();
    if (!res.ok) {
      if (res.missingAuth && onUnauthenticated) {
        onUnauthenticated();
        return;
      }
      setAccounts([]);
    } else {
      setAccounts(res.data);
    }
    setLoadingAccounts(false);
  }, [onUnauthenticated]);

  const loadHistory = useCallback(async () => {
    const res = await fetchHistory();
    if (res.ok) {
      setHistory(res.data);
    } else if (res.missingAuth && onUnauthenticated) {
      onUnauthenticated();
    }
  }, [onUnauthenticated]);

  useEffect(() => {
    void loadAccounts();
    void loadHistory();
  }, [loadAccounts, loadHistory]);

  function toggleAccount(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  }

  function validate(mode: 'now' | 'schedule'): boolean {
    const next: Record<string, string> = {};
    if (!caption.trim() && !title.trim()) {
      next.content = createStrings.errors.contentRequired;
    }
    if (selectedTargets.length < 1) {
      next.accounts = createStrings.errors.accountRequired;
    }
    const hasInstagram = selectedTargets.some(t => t.kind === 'instagram');
    if (hasInstagram && media.length === 0) {
      next.media = createStrings.errors.mediaRequiredInstagram;
    }
    if (mode === 'schedule') {
      const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(date);
      const timeOk = /^\d{2}:\d{2}$/.test(time);
      if (!date || !time) {
        next.schedule = createStrings.errors.scheduleRequired;
      } else if (!dateOk || !timeOk) {
        next.schedule = createStrings.errors.scheduleFormat;
      } else {
        const when = new Date(`${date}T${time}:00`);
        if (Number.isNaN(when.getTime())) {
          next.schedule = createStrings.errors.scheduleFormat;
        } else if (when.getTime() <= Date.now()) {
          next.schedule = createStrings.errors.scheduleFuture;
        }
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handlePublishNow() {
    if (!validate('now')) {
      return;
    }
    setLoadingNow(true);
    setFeedback(null);
    const mediaPayload = media.map(m => ({
      name: m.name,
      mimeType: m.mimeType,
      base64: m.base64,
    }));
    const mediaType = inferMediaType(media);
    const res = await publishNow({
      title: title || undefined,
      caption,
      hashtags: hashtags || undefined,
      targets: selectedTargets,
      mediaType,
      media: mediaPayload[0] ?? null,
      medias: mediaPayload,
    });
    setLoadingNow(false);

    if (!res.ok) {
      if (res.missingAuth && onUnauthenticated) {
        onUnauthenticated();
        return;
      }
      const text =
        res.status === 413
          ? createStrings.feedback.tooLarge
          : res.error || createStrings.feedback.error;
      setFeedback({ type: 'error', text });
      return;
    }
    setFeedback({
      type: 'success',
      text: res.data.message ?? createStrings.feedback.published,
    });
    setTitle('');
    setCaption('');
    setHashtags('');
    setMedia([]);
    await loadHistory();
  }

  async function handleSchedule() {
    if (!validate('schedule')) {
      return;
    }
    setLoadingSchedule(true);
    setFeedback(null);
    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
    const mediaPayload = media.map(m => ({
      name: m.name,
      mimeType: m.mimeType,
      base64: m.base64,
    }));
    const mediaType = inferMediaType(media);
    const res = await schedulePost({
      title: title || undefined,
      caption,
      hashtags: hashtags || undefined,
      scheduledAt,
      targets: selectedTargets,
      mediaType,
      media: mediaPayload[0] ?? null,
      medias: mediaPayload,
    });
    setLoadingSchedule(false);

    if (!res.ok) {
      if (res.missingAuth && onUnauthenticated) {
        onUnauthenticated();
        return;
      }
      const text =
        res.status === 413
          ? createStrings.feedback.tooLarge
          : res.error || createStrings.feedback.error;
      setFeedback({ type: 'error', text });
      return;
    }
    setFeedback({
      type: 'success',
      text: res.data.message ?? createStrings.feedback.scheduled,
    });
    await loadHistory();
  }

  const isBusy = loadingNow || loadingSchedule;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{createStrings.title}</Text>
        <Text style={styles.subtitle}>{createStrings.subtitle}</Text>
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

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{createStrings.sections.details}</Text>
        <Text style={styles.cardSub}>{createStrings.sections.detailsSub}</Text>

        <Text style={styles.label}>{createStrings.fields.title}</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={createStrings.fields.titlePlaceholder}
          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
          style={styles.input}
          editable={!isBusy}
        />

        <Text style={styles.label}>{createStrings.fields.caption}</Text>
        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder={createStrings.fields.captionPlaceholder}
          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
          style={[styles.input, styles.textarea]}
          multiline
          editable={!isBusy}
        />
        {errors.content ? (
          <Text style={styles.fieldError}>{errors.content}</Text>
        ) : null}

        <Text style={styles.label}>{createStrings.fields.hashtags}</Text>
        <TextInput
          value={hashtags}
          onChangeText={setHashtags}
          placeholder={createStrings.fields.hashtagsPlaceholder}
          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
          style={styles.input}
          autoCapitalize="none"
          editable={!isBusy}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{createStrings.sections.media}</Text>
        <Text style={styles.cardSub}>{createStrings.sections.mediaSub}</Text>
        <MediaPicker
          media={media}
          onChange={next => {
            setMedia(next);
            if (errors.media) {
              setErrors(prev => {
                const { media: _omit, ...rest } = prev;
                return rest;
              });
            }
          }}
          onError={msg =>
            setFeedback({
              type: 'error',
              text: msg,
            })
          }
          selectLabel={createStrings.media.select}
          cameraLabel={createStrings.media.camera}
          removeLabel={createStrings.media.remove}
          hint={createStrings.media.hint}
          disabled={isBusy}
        />
        {errors.media ? (
          <Text style={styles.fieldError}>{errors.media}</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{createStrings.sections.accounts}</Text>
        <Text style={styles.cardSub}>
          {createStrings.sections.accountsSub}
        </Text>

        {loadingAccounts ? (
          <Text style={styles.emptyText}>{createStrings.loadingAccounts}</Text>
        ) : accounts.length === 0 ? (
          <View style={styles.emptyAccountsBox}>
            <Text style={styles.emptyText}>{createStrings.emptyAccounts}</Text>
            <Text style={styles.emptySub}>
              {createStrings.emptyAccountsSub}
            </Text>
            {onGoAccounts && (
              <Pressable onPress={onGoAccounts}>
                <Text style={styles.emptyCta}>
                  {createStrings.goAccounts}
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <>
            {accounts.map(a => {
              const selected = selectedIds.includes(a.id);
              return (
                <Pressable
                  key={a.id}
                  onPress={() => toggleAccount(a.id)}
                  style={[
                    styles.accountItem,
                    selected ? styles.accountItemSelected : null,
                  ]}>
                  <View
                    style={[
                      styles.checkbox,
                      selected ? styles.checkboxOn : null,
                    ]}>
                    {selected ? (
                      <Text style={styles.checkboxMark}>✓</Text>
                    ) : null}
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountLabel} numberOfLines={1}>
                      {a.displayName}
                    </Text>
                    <Text style={styles.accountHandle} numberOfLines={1}>
                      {a.handle}
                    </Text>
                  </View>
                  <Text style={styles.accountKind}>{a.kind}</Text>
                </Pressable>
              );
            })}
          </>
        )}
        {errors.accounts ? (
          <Text style={styles.fieldError}>{errors.accounts}</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{createStrings.sections.schedule}</Text>
        <Text style={styles.cardSub}>
          {createStrings.sections.scheduleSub}
        </Text>
        <View style={styles.twoCol}>
          <View style={styles.flex1}>
            <Text style={styles.label}>{createStrings.fields.date}</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder={createStrings.fields.datePlaceholder}
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              style={[
                styles.input,
                errors.schedule ? styles.inputError : null,
              ]}
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
              editable={!isBusy}
            />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.label}>{createStrings.fields.time}</Text>
            <TextInput
              value={time}
              onChangeText={setTime}
              placeholder={createStrings.fields.timePlaceholder}
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              style={[
                styles.input,
                errors.schedule ? styles.inputError : null,
              ]}
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
              editable={!isBusy}
            />
          </View>
        </View>
        {errors.schedule ? (
          <Text style={styles.fieldError}>{errors.schedule}</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{createStrings.sections.actions}</Text>
        <View style={[styles.actionsRow, { marginTop: 10 }]}>
          <Pressable
            onPress={() => void handlePublishNow()}
            disabled={isBusy}
            style={[
              styles.btn,
              styles.btnPrimary,
              isBusy ? styles.btnDisabled : null,
            ]}>
            <Text style={styles.btnPrimaryText}>
              {loadingNow
                ? createStrings.actions.publishing
                : createStrings.actions.publishNow}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => void handleSchedule()}
            disabled={isBusy}
            style={[
              styles.btn,
              styles.btnSecondary,
              isBusy ? styles.btnDisabled : null,
            ]}>
            <Text style={styles.btnSecondaryText}>
              {loadingSchedule
                ? createStrings.actions.scheduling
                : createStrings.actions.schedule}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{createStrings.sections.history}</Text>
        {history.length === 0 ? (
          <Text style={[styles.cardSub, { marginBottom: 0 }]}>
            {createStrings.history.empty}
          </Text>
        ) : (
          <View style={{ marginTop: 8 }}>
            {history.map(item => (
              <HistoryRow key={item.id} item={item} styles={styles} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

interface HistoryRowProps {
  item: PostHistoryItem;
  styles: ReturnType<typeof createCreatePostStyles>;
}

function HistoryRow({ item, styles }: HistoryRowProps) {
  const statusKey = item.status;
  const isSuccess = statusKey === 'SUCCESS';
  const isFailed = statusKey === 'FAILED';
  const when = formatWhen(item.scheduledAt ?? item.publishedAt ?? item.createdAt);
  const accountsLine = item.targets
    .map(t => t.accountLabel ?? t.accountId)
    .join(', ');

  return (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle} numberOfLines={1}>
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
            {createStrings.status[statusKey] ?? statusKey}
          </Text>
        </View>
      </View>
      <Text style={styles.historyMeta}>
        {createStrings.history.when}: {when}
      </Text>
      {accountsLine ? (
        <Text style={styles.historyMeta}>
          {createStrings.history.accounts}: {accountsLine}
        </Text>
      ) : null}
      {item.caption ? (
        <Text style={styles.historyCaption} numberOfLines={2}>
          {item.caption}
        </Text>
      ) : null}
    </View>
  );
}

function inferMediaType(
  media: MediaItem[],
): 'IMAGE' | 'VIDEO' | null {
  if (media.length === 0) {
    return null;
  }
  return media[0].kind === 'video' ? 'VIDEO' : 'IMAGE';
}

function formatWhen(iso: string | null): string {
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
