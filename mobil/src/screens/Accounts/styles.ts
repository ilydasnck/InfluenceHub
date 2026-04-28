import { StyleSheet } from 'react-native';
import { colors } from '../../config/colors';

export const createAccountsStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      paddingBottom: 8,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 16,
    },
    titleBox: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: isDark ? colors.textPrimaryDark : colors.textPrimaryLight,
    },
    subtitle: {
      marginTop: 4,
      fontSize: 13,
      color: isDark ? colors.textMutedDark : colors.textMutedLight,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    refreshBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: isDark ? colors.borderDark : colors.borderLight,
      backgroundColor: isDark ? colors.cardDark : colors.cardLight,
    },
    refreshText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? colors.textPrimaryDark : colors.textPrimaryLight,
    },
    connectBtn: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 999,
      backgroundColor: isDark ? colors.cardLight : colors.textPrimaryLight,
    },
    connectBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: isDark ? colors.textPrimaryLight : colors.cardLight,
    },
    statsGrid: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 20,
    },
    statBox: {
      flex: 1,
      borderWidth: 1,
      borderColor: isDark ? colors.borderDark : colors.borderLight,
      backgroundColor: isDark ? colors.cardDark : colors.cardLight,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 14,
    },
    statValue: {
      fontSize: 22,
      fontWeight: '700',
      color: isDark ? colors.textPrimaryDark : colors.textPrimaryLight,
    },
    statLabel: {
      marginTop: 4,
      fontSize: 11.5,
      color: isDark ? colors.textMutedDark : colors.textMutedLight,
    },
    errorBox: {
      backgroundColor: isDark ? colors.errorBgDark : colors.errorBgLight,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 14,
    },
    errorText: {
      fontSize: 12.5,
      color: isDark ? colors.errorTextDark : colors.errorTextLight,
    },
    sectionHeader: {
      marginBottom: 10,
      marginTop: 6,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? colors.textPrimaryDark : colors.textPrimaryLight,
    },
    sectionSub: {
      marginTop: 2,
      fontSize: 12,
      color: isDark ? colors.textMutedDark : colors.textMutedLight,
    },
    sectionBlock: {
      marginBottom: 18,
    },
    emptyBox: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: isDark ? colors.borderDark : '#cbd5e1',
      borderRadius: 18,
      paddingVertical: 28,
      paddingHorizontal: 18,
      alignItems: 'center',
      backgroundColor: isDark
        ? 'rgba(15, 23, 42, 0.4)'
        : 'rgba(255, 255, 255, 0.6)',
    },
    emptyText: {
      fontSize: 13,
      color: isDark ? colors.textMutedDark : colors.textMutedLight,
      textAlign: 'center',
    },
    emptyCta: {
      marginTop: 12,
      fontSize: 13,
      fontWeight: '700',
      color: colors.linkBlue,
    },
    loadingText: {
      fontSize: 13,
      color: isDark ? colors.textMutedDark : colors.textMutedLight,
      paddingVertical: 12,
      textAlign: 'center',
    },
  });
