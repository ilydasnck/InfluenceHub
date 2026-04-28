import { useMemo } from 'react';
import {
  Modal,
  Pressable,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import type { PlatformId } from '../../service/api/accounts';
import { createConnectModalStyles } from './styles';

export interface ConnectModalItem {
  id: PlatformId;
  label: string;
  sub: string;
  icon: string;
  bg: string;
}

interface ConnectAccountModalProps {
  visible: boolean;
  title: string;
  closeLabel: string;
  hint?: string;
  items: ConnectModalItem[];
  busy?: boolean;
  busyId?: PlatformId | null;
  onClose: () => void;
  onSelect: (id: PlatformId) => void;
}

export default function ConnectAccountModal({
  visible,
  title,
  closeLabel,
  hint,
  items,
  busy,
  busyId,
  onClose,
  onSelect,
}: ConnectAccountModalProps) {
  const isDark = useColorScheme() === 'dark';
  const styles = useMemo(() => createConnectModalStyles(isDark), [isDark]);

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
            <Text style={styles.title}>{title}</Text>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>{closeLabel}</Text>
            </Pressable>
          </View>

          {items.map(item => {
            const isBusy = busy && busyId === item.id;
            return (
              <Pressable
                key={item.id}
                disabled={busy}
                onPress={() => onSelect(item.id)}
                style={[
                  styles.item,
                  { backgroundColor: item.bg },
                  busy ? styles.itemDisabled : null,
                ]}>
                <View style={styles.itemIconBox}>
                  <Text style={styles.itemIcon}>{item.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text style={styles.itemSub}>
                    {isBusy ? '...' : item.sub}
                  </Text>
                </View>
              </Pressable>
            );
          })}

          {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
