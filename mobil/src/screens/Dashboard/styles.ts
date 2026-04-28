import { StyleSheet } from 'react-native';
import { colors } from '../../config/colors';

export function createDashboardStyles(isDark: boolean) {
  const shellBg = isDark ? colors.shellBgDark : colors.shellBgLight;
  const card = isDark ? colors.cardDark : colors.cardLight;
  const border = isDark ? colors.borderDark : colors.borderLight;
  const textPrimary = isDark ? colors.textPrimaryDark : colors.textPrimaryLight;
  const textMuted = isDark ? colors.textMutedDark : colors.textMutedLight;
  const chartBg = isDark ? colors.chartBgDark : colors.chartBgLight;
  const chartBar = isDark ? colors.chartBarDark : colors.chartBarLight;
  const aiBg = isDark ? colors.aiCardBgDark : colors.aiCardBgLight;
  const aiBorder = isDark ? colors.aiCardBorderDark : colors.aiCardBorderLight;

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: shellBg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: card,
      borderBottomWidth: 1,
      borderBottomColor: border,
      gap: 12,
    },
    iconButton: {
      width: 38,
      height: 38,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark
        ? 'rgba(30, 41, 59, 0.6)'
        : 'rgba(241, 245, 249, 1)',
    },
    iconButtonText: {
      fontSize: 18,
      color: textPrimary,
      fontWeight: '700',
    },
    welcome: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
      color: textMuted,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },
    titleBlock: {
      marginBottom: 24,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: textPrimary,
    },
    subtitle: {
      marginTop: 4,
      fontSize: 13,
      color: textMuted,
    },
    statsGrid: {
      flexDirection: 'column',
      gap: 12,
      marginBottom: 24,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'stretch',
    },
    section: {
      backgroundColor: card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: border,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 6,
      elevation: isDark ? 0 : 1,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: textPrimary,
      marginBottom: 12,
    },
    chart: {
      height: 168,
      borderRadius: 12,
      backgroundColor: chartBg,
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingBottom: 8,
      paddingTop: 24,
      gap: 8,
    },
    bar: {
      flex: 1,
      backgroundColor: chartBar,
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
    },
    aiList: {
      gap: 10,
    },
    aiItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: aiBorder,
      backgroundColor: aiBg,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 10,
    },
    aiTextBox: {
      flex: 1,
      minWidth: 0,
    },
    aiTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: textPrimary,
    },
    aiDesc: {
      marginTop: 2,
      fontSize: 11,
      color: textMuted,
    },
    aiPct: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.aiCardAccent,
    },
    placeholderBox: {
      backgroundColor: card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: border,
      padding: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholderText: {
      fontSize: 14,
      color: textMuted,
      textAlign: 'center',
    },
  });
}
