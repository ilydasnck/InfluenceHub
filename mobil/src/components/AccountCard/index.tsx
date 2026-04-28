import { useMemo } from 'react';
import {
  Image,
  Pressable,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import type { AccountRow } from '../../service/api/accounts';
import { createAccountCardStyles } from './styles';

interface AccountCardProps {
  account: AccountRow;
  followersLabel: string;
  connectedLabel: string;
  removeLabel: string;
  onRemove: () => void;
}

export default function AccountCard({
  account,
  followersLabel,
  connectedLabel,
  removeLabel,
  onRemove,
}: AccountCardProps) {
  const isDark = useColorScheme() === 'dark';
  const styles = useMemo(() => createAccountCardStyles(isDark), [isDark]);

  const initial =
    account.displayName.trim().charAt(0).toUpperCase() || '?';
  const followersText = formatNumber(account.followerCount);
  const weekly = account.weeklyDelta;

  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        {account.avatarUrl ? (
          <Image
            source={{ uri: account.avatarUrl }}
            style={styles.avatarImg}
          />
        ) : (
          <Text style={styles.avatarLetter}>{initial}</Text>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {account.displayName}
        </Text>
        <Text style={styles.handle} numberOfLines={1}>
          {account.handle}
        </Text>
        <View style={styles.followersRow}>
          <Text style={styles.followersValue}>{followersText}</Text>
          <Text style={styles.followersLabel}>{followersLabel}</Text>
          {weekly !== undefined && weekly !== null && weekly !== 0 && (
            <View
              style={[
                styles.deltaPill,
                weekly > 0 ? styles.deltaUp : styles.deltaDown,
              ]}>
              <Text
                style={
                  weekly > 0 ? styles.deltaUpText : styles.deltaDownText
                }>
                {weekly > 0 ? '▲ +' : '▼ '}
                {formatNumber(Math.abs(weekly))}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{connectedLabel}</Text>
        </View>
        <Pressable
          style={styles.removeBtn}
          onPress={onRemove}
          accessibilityLabel={removeLabel}>
          <Text style={styles.removeText}>🗑️</Text>
        </Pressable>
      </View>
    </View>
  );
}

function formatNumber(n: number): string {
  try {
    return n.toLocaleString('tr-TR');
  } catch {
    return String(n);
  }
}
