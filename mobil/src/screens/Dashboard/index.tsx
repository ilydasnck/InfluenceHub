import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dashboardStrings } from '../../assets/Constants/dashboardStrings';
import {
  AppDrawer,
  StatCard,
  type DrawerItem,
} from '../../components';
import {
  clearSessionToken,
  decodeJwtPayload,
  getSessionToken,
  isLocalAdminToken,
} from '../../service/api/auth';
import AccountsScreen from '../Accounts';
import CalendarScreen from '../Calendar';
import CreatePostScreen from '../CreatePost';
import { createDashboardStyles } from './styles';

interface DashboardScreenProps {
  onLogout: () => void;
}

const NAV_ITEMS: DrawerItem[] = [
  { key: 'dashboard', label: dashboardStrings.nav.dashboard, icon: '🏠' },
  { key: 'accounts', label: dashboardStrings.nav.accounts, icon: '👥' },
  { key: 'createPost', label: dashboardStrings.nav.createPost, icon: '✍️' },
  { key: 'calendar', label: dashboardStrings.nav.calendar, icon: '📅' },
  { key: 'analytics', label: dashboardStrings.nav.analytics, icon: '📊' },
  { key: 'aiAssistant', label: dashboardStrings.nav.aiAssistant, icon: '🤖' },
  { key: 'settings', label: dashboardStrings.nav.settings, icon: '⚙️' },
];

const ENGAGEMENT_BARS = [40, 65, 45, 80, 55, 90, 70];

export default function DashboardScreen({ onLogout }: DashboardScreenProps) {
  const isDark = useColorScheme() === 'dark';
  const styles = useMemo(() => createDashboardStyles(isDark), [isDark]);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeKey, setActiveKey] = useState('dashboard');
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const token = getSessionToken();
    if (!token) {
      setEmail(null);
      return;
    }
    if (isLocalAdminToken(token)) {
      setEmail('admin');
      return;
    }
    const payload = decodeJwtPayload(token);
    setEmail(payload?.email ?? null);
  }, []);

  function handleLogoutPress() {
    Alert.alert(
      dashboardStrings.logoutConfirmTitle,
      dashboardStrings.logoutConfirmMessage,
      [
        { text: dashboardStrings.cancel, style: 'cancel' },
        {
          text: dashboardStrings.logout,
          style: 'destructive',
          onPress: () => {
            clearSessionToken();
            onLogout();
          },
        },
      ],
    );
  }

  function handleNavSelect(key: string) {
    setActiveKey(key);
    setDrawerVisible(false);
  }

  const stats = [
    {
      label: dashboardStrings.stats.connectedAccounts,
      hint: dashboardStrings.stats.connectedAccountsHint,
      value: '3',
      icon: '👥',
    },
    {
      label: dashboardStrings.stats.publishedPosts,
      hint: dashboardStrings.stats.publishedPostsHint,
      value: '15',
      icon: '📈',
    },
    {
      label: dashboardStrings.stats.scheduledPosts,
      hint: dashboardStrings.stats.scheduledPostsHint,
      value: '5',
      icon: '📅',
    },
    {
      label: dashboardStrings.stats.avgEngagement,
      hint: dashboardStrings.stats.avgEngagementHint,
      value: '707',
      icon: '⚡',
    },
  ];

  const showDashboardContent = activeKey === 'dashboard';
  const showAccountsContent = activeKey === 'accounts';
  const showCreatePostContent = activeKey === 'createPost';
  const showCalendarContent = activeKey === 'calendar';
  const isEmbeddedScreen =
    showAccountsContent || showCreatePostContent || showCalendarContent;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <Pressable
          style={styles.iconButton}
          onPress={() => setDrawerVisible(true)}
          accessibilityLabel={dashboardStrings.openMenu}>
          <Text style={styles.iconButtonText}>☰</Text>
        </Pressable>
        <Text style={styles.welcome} numberOfLines={1}>
          {dashboardStrings.welcome}
        </Text>
        <Pressable
          style={styles.iconButton}
          accessibilityLabel={dashboardStrings.notifications}>
          <Text style={styles.iconButtonText}>🔔</Text>
        </Pressable>
        <Pressable
          style={styles.iconButton}
          onPress={handleLogoutPress}
          accessibilityLabel={dashboardStrings.logout}>
          <Text style={styles.iconButtonText}>⎋</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {!isEmbeddedScreen && (
          <View style={styles.titleBlock}>
            <Text style={styles.title}>
              {showDashboardContent
                ? dashboardStrings.title
                : NAV_ITEMS.find(i => i.key === activeKey)?.label ??
                  dashboardStrings.title}
            </Text>
            <Text style={styles.subtitle}>
              {showDashboardContent
                ? dashboardStrings.subtitle
                : dashboardStrings.comingSoon}
            </Text>
          </View>
        )}

        {showAccountsContent ? (
          <AccountsScreen
            onUnauthenticated={() => {
              clearSessionToken();
              onLogout();
            }}
          />
        ) : showCreatePostContent ? (
          <CreatePostScreen
            onUnauthenticated={() => {
              clearSessionToken();
              onLogout();
            }}
            onGoAccounts={() => setActiveKey('accounts')}
          />
        ) : showCalendarContent ? (
          <CalendarScreen
            onUnauthenticated={() => {
              clearSessionToken();
              onLogout();
            }}
          />
        ) : showDashboardContent ? (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                <StatCard
                  label={stats[0].label}
                  value={stats[0].value}
                  hint={stats[0].hint}
                  icon={stats[0].icon}
                />
                <StatCard
                  label={stats[1].label}
                  value={stats[1].value}
                  hint={stats[1].hint}
                  icon={stats[1].icon}
                />
              </View>
              <View style={styles.statsRow}>
                <StatCard
                  label={stats[2].label}
                  value={stats[2].value}
                  hint={stats[2].hint}
                  icon={stats[2].icon}
                />
                <StatCard
                  label={stats[3].label}
                  value={stats[3].value}
                  hint={stats[3].hint}
                  icon={stats[3].icon}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {dashboardStrings.charts.recentEngagement}
              </Text>
              <View style={styles.chart}>
                {ENGAGEMENT_BARS.map((h, i) => (
                  <View
                    key={i}
                    style={[styles.bar, { height: `${h}%` }]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {dashboardStrings.charts.aiTimes}
              </Text>
              <View style={styles.aiList}>
                {[1, 2, 3].map(i => (
                  <View key={i} style={styles.aiItem}>
                    <View style={styles.aiTextBox}>
                      <Text style={styles.aiTitle}>
                        {dashboardStrings.charts.sampleTime}
                      </Text>
                      <Text style={styles.aiDesc}>
                        {dashboardStrings.charts.sampleDesc}
                      </Text>
                    </View>
                    <Text style={styles.aiPct}>
                      {dashboardStrings.charts.samplePct}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : (
          <View style={styles.placeholderBox}>
            <Text style={styles.placeholderText}>
              {dashboardStrings.comingSoon}
            </Text>
          </View>
        )}
      </ScrollView>

      <AppDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        items={NAV_ITEMS}
        activeKey={activeKey}
        onSelect={handleNavSelect}
        email={email}
      />
    </SafeAreaView>
  );
}
