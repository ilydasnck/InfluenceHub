import { StyleSheet } from 'react-native';
import { colors } from '../../config/colors';

export const createCreatePostStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      paddingBottom: 8,
    },
    header: {
      marginBottom: 14,
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
    feedbackBox: {
      marginTop: 8,
      marginBottom: 4,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    feedbackSuccess: {
      backgroundColor: isDark ? colors.successBgDark : colors.successBgLight,
    },
    feedbackError: {
      backgroundColor: isDark ? colors.errorBgDark : colors.errorBgLight,
    },
    feedbackTextSuccess: {
      fontSize: 13,
      color: isDark ? colors.successFgDark : colors.successFgLight,
    },
    feedbackTextError: {
      fontSize: 13,
      color: isDark ? colors.errorTextDark : colors.errorTextLight,
    },
    card: {
      marginTop: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? colors.borderDark : colors.borderLight,
      backgroundColor: isDark ? colors.cardDark : colors.cardLight,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: isDark ? colors.textPrimaryDark : colors.textPrimaryLight,
    },
    cardSub: {
      marginTop: 2,
      fontSize: 12,
      color: isDark ? colors.textMutedDark : colors.textMutedLight,
      marginBottom: 10,
    },
    label: {
      marginTop: 8,
      marginBottom: 6,
      fontSize: 12.5,
      fontWeight: '600',
      color: isDark ? colors.textPrimaryDark : colors.textPrimaryLight,
    },
    input: {
      borderWidth: 1,
      borderColor: isDark ? colors.inputBorderDark : colors.inputBorderLight,
      backgroundColor: isDark ? colors.inputBgDark : colors.inputBgLight,
      color: isDark ? colors.textPrimaryDark : colors.textPrimaryLight,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      fontSize: 14,
    },
    inputError: {
      borderColor: isDark ? colors.dangerFgDark : colors.dangerFgLight,
    },
    textarea: {
      minHeight: 90,
      textAlignVertical: 'top',
    },
    fieldError: {
      marginTop: 4,
      fontSize: 12,
      color: isDark ? colors.dangerFgDark : colors.dangerFgLight,
    },
    twoCol: {
      flexDirection: 'row',
      gap: 10,
    },
    flex1: { flex: 1 },
    accountItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? colors.borderDark : colors.borderLight,
      backgroundColor: isDark
        ? 'rgba(15,23,42,0.5)'
        : 'rgba(248,250,252,0.5)',
      marginBottom: 8,
      gap: 10,
    },
    accountItemSelected: {
      borderColor: colors.accentBlue,
      backgroundColor: isDark
        ? 'rgba(30, 58, 138, 0.25)'
        : 'rgba(239, 246, 255, 0.95)',
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: isDark ? colors.borderDark : '#cbd5e1',
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxOn: {
      backgroundColor: colors.accentBlue,
      borderColor: colors.accentBlue,
    },
    checkboxMark: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '700',
    },
    accountInfo: {
      flex: 1,
      minWidth: 0,
    },
    accountLabel: {
      fontSize: 13.5,
      fontWeight: '600',
      color: isDark ? colors.textPrimaryDark : colors.textPrimaryLight,
    },
    accountHandle: {
      marginTop: 1,
      fontSize: 12,
      color: isDark ? colors.textMutedDark : colors.textMutedLight,
    },
    accountKind: {
      fontSize: 10.5,
      fontWeight: '700',
      color: isDark ? colors.textMutedDark : colors.textMutedLight,
      textTransform: 'uppercase',
    },
    emptyAccountsBox: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: isDark ? colors.borderDark : '#cbd5e1',
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 13,
      color: isDark ? colors.textMutedDark : colors.textMutedLight,
      textAlign: 'center',
    },
    emptySub: {
      marginTop: 4,
      fontSize: 11.5,
      color: isDark ? colors.textMutedDark : colors.textMutedLight,
      textAlign: 'center',
    },
    emptyCta: {
      marginTop: 10,
      fontSize: 13,
      fontWeight: '700',
      color: colors.linkBlue,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    btn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnPrimary: {
      backgroundColor: isDark ? colors.cardLight : colors.textPrimaryLight,
    },
    btnPrimaryText: {
      color: isDark ? colors.textPrimaryLight : colors.cardLight,
      fontSize: 14,
      fontWeight: '700',
    },
    btnSecondary: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: isDark ? colors.borderDark : colors.borderLight,
    },
    btnSecondaryText: {
      color: isDark ? colors.textPrimaryDark : colors.textPrimaryLight,
      fontSize: 14,
      fontWeight: '700',
    },
    btnDisabled: {
      opacity: 0.55,
    },
    mediaNotice: {
      borderWidth: 1,
      borderColor: isDark ? colors.borderDark : colors.borderLight,
      backgroundColor: isDark
        ? 'rgba(30, 41, 59, 0.5)'
        : 'rgba(241, 245, 249, 0.7)',
      borderRadius: 12,
      padding: 12,
    },
    mediaNoticeText: {
      fontSize: 12.5,
      color: isDark ? colors.textMutedDark : colors.textMutedLight,
      lineHeight: 18,
    },
    historyItem: {
      borderWidth: 1,
      borderColor: isDark ? colors.borderDark : colors.borderLight,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
      backgroundColor: isDark
        ? 'rgba(15,23,42,0.5)'
        : 'rgba(248,250,252,0.5)',
    },
    historyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
      gap: 8,
    },
    historyTitle: {
      flex: 1,
      fontSize: 13.5,
      fontWeight: '700',
      color: isDark ? colors.textPrimaryDark : colors.textPrimaryLight,
    },
    statusPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: isDark ? colors.borderDark : '#e2e8f0',
    },
    statusPillSuccess: {
      backgroundColor: isDark ? colors.successBgDark : colors.successBgLight,
    },
    statusPillFailed: {
      backgroundColor: isDark ? colors.errorBgDark : colors.errorBgLight,
    },
    statusText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: isDark ? colors.textPrimaryDark : colors.textPrimaryLight,
    },
    statusTextSuccess: {
      color: isDark ? colors.successFgDark : colors.successFgLight,
    },
    statusTextFailed: {
      color: isDark ? colors.dangerFgDark : colors.dangerFgLight,
    },
    historyMeta: {
      fontSize: 11.5,
      color: isDark ? colors.textMutedDark : colors.textMutedLight,
      marginTop: 2,
    },
    historyCaption: {
      marginTop: 6,
      fontSize: 12.5,
      color: isDark ? colors.textPrimaryDark : colors.textPrimaryLight,
    },
  });
