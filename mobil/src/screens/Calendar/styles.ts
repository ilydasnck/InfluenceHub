import { StyleSheet } from 'react-native';
import { colors } from '../../config/colors';

export const createCalendarStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      paddingBottom: 8,
    },
    header: {
      marginBottom: 12,
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
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 12,
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
    section: {
      marginTop: 14,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? colors.textPrimaryDark : colors.textPrimaryLight,
      marginBottom: 10,
    },
    selectedDateHeader: {
      fontSize: 13.5,
      fontWeight: '600',
      color: isDark ? colors.textMutedDark : colors.textMutedLight,
      marginBottom: 8,
    },
    item: {
      borderWidth: 1,
      borderColor: isDark ? colors.borderDark : colors.borderLight,
      backgroundColor: isDark ? colors.cardDark : colors.cardLight,
      borderRadius: 14,
      padding: 12,
      marginBottom: 10,
    },
    itemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 4,
    },
    itemTitle: {
      flex: 1,
      fontSize: 14,
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
    itemMeta: {
      fontSize: 11.5,
      color: isDark ? colors.textMutedDark : colors.textMutedLight,
      marginTop: 2,
    },
    itemCaption: {
      marginTop: 6,
      fontSize: 12.5,
      color: isDark ? colors.textPrimaryDark : colors.textPrimaryLight,
    },
    emptyText: {
      fontSize: 13,
      color: isDark ? colors.textMutedDark : colors.textMutedLight,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: isDark ? colors.borderDark : '#cbd5e1',
      borderRadius: 14,
      padding: 14,
      textAlign: 'center',
    },
    loadingText: {
      fontSize: 13,
      color: isDark ? colors.textMutedDark : colors.textMutedLight,
      paddingVertical: 12,
      textAlign: 'center',
    },
    moreBtn: {
      alignSelf: 'flex-end',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: isDark ? colors.borderDark : colors.borderLight,
      backgroundColor: isDark ? colors.cardDark : colors.cardLight,
      marginTop: 4,
    },
    moreBtnText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: isDark ? colors.textPrimaryDark : colors.textPrimaryLight,
    },
  });
