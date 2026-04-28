import { useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { calendarStrings } from '../../assets/Constants/calendarStrings';
import type { AccountKind } from '../../service/api';
import { createPostDetailStyles } from './styles';

export interface EditableAccount {
  id: string;
  label: string;
  kind: AccountKind;
}

export interface EditablePost {
  id: string;
  title: string;
  caption: string;
  hashtags: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM */
  time: string;
  selectedTargetIds: string[];
}

interface PostDetailModalProps {
  visible: boolean;
  value: EditablePost | null;
  accounts: EditableAccount[];
  saving: boolean;
  deleting: boolean;
  errors?: Record<string, string>;
  onClose: () => void;
  onChange: (next: EditablePost) => void;
  onSave: () => void;
  onDelete: () => void;
}

export default function PostDetailModal({
  visible,
  value,
  accounts,
  saving,
  deleting,
  errors,
  onClose,
  onChange,
  onSave,
  onDelete,
}: PostDetailModalProps) {
  const isDark = useColorScheme() === 'dark';
  const styles = useMemo(() => createPostDetailStyles(isDark), [isDark]);

  if (!value) {
    return null;
  }

  const isBusy = saving || deleting;

  function toggleTarget(id: string) {
    if (!value) {
      return;
    }
    const next = value.selectedTargetIds.includes(id)
      ? value.selectedTargetIds.filter(x => x !== id)
      : [...value.selectedTargetIds, id];
    onChange({ ...value, selectedTargetIds: next });
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable onPress={() => {}} style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>{calendarStrings.detailTitle}</Text>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>{calendarStrings.close}</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>{calendarStrings.fields.title}</Text>
            <TextInput
              value={value.title}
              onChangeText={text => onChange({ ...value, title: text })}
              style={styles.input}
              editable={!isBusy}
            />

            <Text style={styles.label}>{calendarStrings.fields.caption}</Text>
            <TextInput
              value={value.caption}
              onChangeText={text => onChange({ ...value, caption: text })}
              style={[
                styles.input,
                styles.textarea,
                errors?.caption ? styles.inputError : null,
              ]}
              multiline
              editable={!isBusy}
            />
            {errors?.caption ? (
              <Text style={styles.fieldError}>{errors.caption}</Text>
            ) : null}

            <Text style={styles.label}>{calendarStrings.fields.hashtags}</Text>
            <TextInput
              value={value.hashtags}
              onChangeText={text => onChange({ ...value, hashtags: text })}
              style={styles.input}
              autoCapitalize="none"
              editable={!isBusy}
            />

            <View style={styles.twoCol}>
              <View style={styles.flex1}>
                <Text style={styles.label}>
                  {calendarStrings.fields.date}
                </Text>
                <TextInput
                  value={value.date}
                  onChangeText={text => onChange({ ...value, date: text })}
                  placeholder="2026-04-30"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  style={[
                    styles.input,
                    errors?.schedule ? styles.inputError : null,
                  ]}
                  autoCapitalize="none"
                  keyboardType="numbers-and-punctuation"
                  editable={!isBusy}
                />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.label}>
                  {calendarStrings.fields.time}
                </Text>
                <TextInput
                  value={value.time}
                  onChangeText={text => onChange({ ...value, time: text })}
                  placeholder="14:30"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  style={[
                    styles.input,
                    errors?.schedule ? styles.inputError : null,
                  ]}
                  autoCapitalize="none"
                  keyboardType="numbers-and-punctuation"
                  editable={!isBusy}
                />
              </View>
            </View>
            {errors?.schedule ? (
              <Text style={styles.fieldError}>{errors.schedule}</Text>
            ) : null}

            <Text style={styles.label}>{calendarStrings.accounts}</Text>
            <View style={styles.accountList}>
              {accounts.map(a => {
                const selected = value.selectedTargetIds.includes(a.id);
                return (
                  <Pressable
                    key={a.id}
                    onPress={() => toggleTarget(a.id)}
                    disabled={isBusy}
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
                    <Text style={styles.accountText} numberOfLines={1}>
                      {a.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors?.targets ? (
              <Text style={styles.fieldError}>{errors.targets}</Text>
            ) : null}

            <View style={styles.actionsRow}>
              <Pressable
                onPress={onSave}
                disabled={isBusy}
                style={[
                  styles.btn,
                  styles.btnPrimary,
                  isBusy ? styles.btnDisabled : null,
                ]}>
                <Text style={styles.btnPrimaryText}>
                  {saving
                    ? calendarStrings.saving
                    : calendarStrings.save}
                </Text>
              </Pressable>
              <Pressable
                onPress={onDelete}
                disabled={isBusy}
                style={[
                  styles.btn,
                  styles.btnDanger,
                  isBusy ? styles.btnDisabled : null,
                ]}>
                <Text style={styles.btnDangerText}>
                  {deleting
                    ? calendarStrings.deleting
                    : calendarStrings.delete}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
