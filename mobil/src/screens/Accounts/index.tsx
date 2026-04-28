import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { useColorScheme } from 'react-native';
import { accountsStrings } from '../../assets/Constants/accountsStrings';
import {
  AccountCard,
  ConnectAccountModal,
  type ConnectModalItem,
} from '../../components';
import {
  fetchAccounts,
  removeAccount,
  startConnect,
  type AccountGroup,
  type AccountRow,
  type AccountsStats,
  type PlatformId,
} from '../../service/api/accounts';
import { createAccountsStyles } from './styles';

interface AccountsScreenProps {
  /** Oturum yoksa login'e dön */
  onUnauthenticated?: () => void;
}

export default function AccountsScreen({
  onUnauthenticated,
}: AccountsScreenProps) {
  const isDark = useColorScheme() === 'dark';
  const styles = useMemo(() => createAccountsStyles(isDark), [isDark]);

  const [groups, setGroups] = useState<AccountGroup[]>([]);
  const [stats, setStats] = useState<AccountsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [busyId, setBusyId] = useState<PlatformId | null>(null);

  const load = useCallback(
    async (opts?: { refresh?: boolean; silent?: boolean }) => {
      const isRefresh = opts?.refresh === true;
      const silent = opts?.silent === true;
      if (isRefresh) {
        setRefreshing(true);
      } else if (!silent) {
        setLoading(true);
      }
      setError(null);

      const res = await fetchAccounts({ refresh: isRefresh });
      if (!res.ok) {
        if (res.missingAuth && onUnauthenticated) {
          onUnauthenticated();
          return;
        }
        setError(res.error || accountsStrings.loadError);
      } else {
        setGroups(res.data.groups ?? []);
        setStats(res.data.stats ?? null);
      }
      setLoading(false);
      setRefreshing(false);
    },
    [onUnauthenticated],
  );

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSelectPlatform(platform: PlatformId) {
    setBusyId(platform);
    setError(null);
    const res = await startConnect(platform);
    setBusyId(null);

    if (!res.ok) {
      setError(res.error || accountsStrings.connectError);
      return;
    }

    if (res.oauthUrl) {
      try {
        await Linking.openURL(res.oauthUrl);
      } catch {
        setError(accountsStrings.connectError);
      }
      setModalOpen(false);
      return;
    }

    setModalOpen(false);
    await load({ silent: true });
  }

  function handleRemove(account: AccountRow) {
    Alert.alert(
      accountsStrings.removeConfirmTitle,
      accountsStrings.removeConfirmMessage,
      [
        { text: accountsStrings.cancel, style: 'cancel' },
        {
          text: accountsStrings.remove,
          style: 'destructive',
          onPress: async () => {
            const res = await removeAccount(account);
            if (!res.ok) {
              setError(res.error || accountsStrings.deleteError);
              return;
            }
            await load({ silent: true });
          },
        },
      ],
    );
  }

  const platformItems: ConnectModalItem[] = [
    {
      id: 'instagram',
      label: accountsStrings.platform.instagram,
      sub: accountsStrings.platform.instagramSub,
      icon: '📷',
      bg: '#db2777',
    },
    {
      id: 'facebook',
      label: accountsStrings.platform.facebook,
      sub: accountsStrings.platform.facebookSub,
      icon: 'f',
      bg: '#1d4ed8',
    },
    {
      id: 'youtube',
      label: accountsStrings.platform.youtube,
      sub: accountsStrings.platform.youtubeSub,
      icon: '▶',
      bg: '#b91c1c',
    },
    {
      id: 'tiktok',
      label: accountsStrings.platform.tiktok,
      sub: accountsStrings.platform.tiktokSub,
      icon: '♪',
      bg: '#0f172a',
    },
  ];

  function groupTitle(platform: AccountGroup['platform']): string {
    return accountsStrings.group[platform] ?? accountsStrings.group.social;
  }

  const totalAccounts = stats?.totalAccounts ?? 0;
  const totalFollowers = stats?.totalFollowers ?? 0;
  const platformCount = stats?.platformCount ?? 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleBox}>
          <Text style={styles.title}>{accountsStrings.title}</Text>
          <Text style={styles.subtitle}>{accountsStrings.subtitle}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.refreshBtn}
          disabled={loading || refreshing}
          onPress={() => void load({ refresh: true })}>
          <Text style={styles.refreshText}>
            {refreshing
              ? accountsStrings.refreshing
              : `↻ ${accountsStrings.refresh}`}
          </Text>
        </Pressable>
        <Pressable
          style={styles.connectBtn}
          onPress={() => setModalOpen(true)}>
          <Text style={styles.connectBtnText}>
            + {accountsStrings.connect}
          </Text>
        </Pressable>
      </View>

      <View style={{ height: 16 }} />

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{formatNumber(totalAccounts)}</Text>
          <Text style={styles.statLabel}>
            {accountsStrings.stats.totalAccounts}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{formatNumber(totalFollowers)}</Text>
          <Text style={styles.statLabel}>
            {accountsStrings.stats.totalFollowers}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{formatNumber(platformCount)}</Text>
          <Text style={styles.statLabel}>
            {accountsStrings.stats.platforms}
          </Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <Text style={styles.loadingText}>{accountsStrings.loading}</Text>
      ) : null}

      {!loading && groups.length === 0 && !error ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>{accountsStrings.empty}</Text>
          <Pressable onPress={() => setModalOpen(true)}>
            <Text style={styles.emptyCta}>+ {accountsStrings.connect}</Text>
          </Pressable>
        </View>
      ) : null}

      {!loading &&
        groups.map(group => (
          <View key={group.platform} style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {groupTitle(group.platform)}
              </Text>
              <Text style={styles.sectionSub}>
                {accountsStrings.accountCount.replace(
                  '{count}',
                  String(group.accounts.length),
                )}
              </Text>
            </View>
            {group.accounts.map(account => (
              <AccountCard
                key={`${account.kind}-${account.id}`}
                account={account}
                followersLabel={accountsStrings.followers}
                connectedLabel={accountsStrings.connected}
                removeLabel={accountsStrings.remove}
                onRemove={() => handleRemove(account)}
              />
            ))}
          </View>
        ))}

      <ConnectAccountModal
        visible={modalOpen}
        title={accountsStrings.modalTitle}
        closeLabel={accountsStrings.modalClose}
        hint={accountsStrings.oauthHint}
        items={platformItems}
        busy={busyId !== null}
        busyId={busyId}
        onClose={() => {
          if (busyId === null) {
            setModalOpen(false);
          }
        }}
        onSelect={p => void handleSelectPlatform(p)}
      />
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
