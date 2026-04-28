import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  type Asset,
} from 'react-native-image-picker';
import { createMediaPickerStyles } from './styles';

export interface MediaItem {
  uri: string;
  name: string;
  mimeType: string;
  base64: string;
  kind: 'image' | 'video';
  size?: number;
}

interface MediaPickerProps {
  media: MediaItem[];
  onChange: (next: MediaItem[]) => void;
  onError?: (msg: string) => void;
  selectLabel: string;
  cameraLabel: string;
  removeLabel: string;
  hint: string;
  /** Tek dosya modu (Instagram için), default false */
  singleSelect?: boolean;
  /** Maksimum tekil dosya boyutu (MB). Aşılırsa hata. */
  maxFileSizeMB?: number;
  disabled?: boolean;
}

export default function MediaPicker({
  media,
  onChange,
  onError,
  selectLabel,
  cameraLabel,
  removeLabel,
  hint,
  singleSelect = false,
  maxFileSizeMB = 15,
  disabled = false,
}: MediaPickerProps) {
  const isDark = useColorScheme() === 'dark';
  const styles = useMemo(() => createMediaPickerStyles(isDark), [isDark]);
  const [busy, setBusy] = useState(false);

  function reportError(msg: string) {
    if (onError) {
      onError(msg);
    } else {
      Alert.alert('Medya', msg);
    }
  }

  function assetsToItems(assets: Asset[] | undefined): MediaItem[] {
    if (!assets) {
      return [];
    }
    const out: MediaItem[] = [];
    const limitBytes = maxFileSizeMB * 1024 * 1024;
    for (const a of assets) {
      if (!a.base64 || !a.uri) {
        continue;
      }
      if (a.fileSize && a.fileSize > limitBytes) {
        reportError(
          `Dosya çok büyük: ${a.fileName ?? 'medya'} (>${maxFileSizeMB} MB)`,
        );
        continue;
      }
      const mime = a.type ?? guessMimeFromName(a.fileName ?? '');
      const isVideo = mime.startsWith('video/');
      out.push({
        uri: a.uri,
        name: a.fileName ?? `media-${Date.now()}`,
        mimeType: mime,
        base64: a.base64,
        kind: isVideo ? 'video' : 'image',
        size: a.fileSize,
      });
    }
    return out;
  }

  async function handleLibrary() {
    if (disabled || busy) {
      return;
    }
    setBusy(true);
    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed',
        selectionLimit: singleSelect ? 1 : 0,
        includeBase64: true,
        quality: 0.8,
      });
      if (result.didCancel) {
        return;
      }
      if (result.errorCode) {
        reportError(result.errorMessage ?? 'Galeri açılamadı.');
        return;
      }
      const items = assetsToItems(result.assets);
      if (items.length === 0) {
        return;
      }
      const next = singleSelect ? items.slice(0, 1) : [...media, ...items];
      onChange(next);
    } finally {
      setBusy(false);
    }
  }

  async function handleCamera() {
    if (disabled || busy) {
      return;
    }
    setBusy(true);
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        includeBase64: true,
        saveToPhotos: false,
        quality: 0.8,
      });
      if (result.didCancel) {
        return;
      }
      if (result.errorCode) {
        reportError(result.errorMessage ?? 'Kamera açılamadı.');
        return;
      }
      const items = assetsToItems(result.assets);
      if (items.length === 0) {
        return;
      }
      const next = singleSelect ? items.slice(0, 1) : [...media, ...items];
      onChange(next);
    } finally {
      setBusy(false);
    }
  }

  function removeAt(index: number) {
    onChange(media.filter((_, i) => i !== index));
  }

  return (
    <View style={styles.container}>
      <View style={styles.actionsRow}>
        <Pressable
          onPress={handleLibrary}
          disabled={disabled || busy}
          style={[
            styles.btn,
            disabled || busy ? styles.btnDisabled : null,
          ]}>
          <Text style={styles.btnText}>
            {busy ? '...' : `🖼  ${selectLabel}`}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleCamera}
          disabled={disabled || busy}
          style={[
            styles.btn,
            disabled || busy ? styles.btnDisabled : null,
          ]}>
          <Text style={styles.btnText}>
            {busy ? '...' : `📷  ${cameraLabel}`}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.hint}>{hint}</Text>

      {media.length > 0 && (
        <View style={styles.grid}>
          {media.map((m, i) => (
            <View key={`${m.uri}-${i}`} style={styles.tile}>
              <Image source={{ uri: m.uri }} style={styles.tileImg} />
              {m.kind === 'video' && (
                <View style={styles.videoOverlay}>
                  <Text style={styles.videoIcon}>▶</Text>
                </View>
              )}
              {m.size ? (
                <View style={styles.sizeBadge}>
                  <Text style={styles.sizeBadgeText}>
                    {formatSize(m.size)}
                  </Text>
                </View>
              ) : null}
              <Pressable
                style={styles.removeBadge}
                onPress={() => removeAt(i)}
                accessibilityLabel={removeLabel}>
                <Text style={styles.removeBadgeText}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function guessMimeFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.mp4') || lower.endsWith('.mov')) {
    return 'video/mp4';
  }
  if (lower.endsWith('.png')) {
    return 'image/png';
  }
  if (lower.endsWith('.webp')) {
    return 'image/webp';
  }
  return 'image/jpeg';
}

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
