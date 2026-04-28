import { StyleSheet } from 'react-native';
import { colors } from '../../config/colors';

export const createPostDetailStyles = (isDark: boolean) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: isDark ? colors.cardDark : colors.cardLight,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 24,
      maxHeight: '92%',
      borderTopWidth: 1,
      borderColor: isDark ? colors.borderDark : colors.borderLight,
    },
    handle: {
      alignSelf: 'center',
      width: 48,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDark ? colors.borderDark : '#cbd5e1',
      marginBottom: 12,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: isDark ? colors.textPrimaryDark : colors.textPrimaryLight,
    },
    closeBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    closeText: {
      fontSize: 14,
      color: isDark ? colors.textMutedDark : colors.textMutedLight,
    },
    label: {
      marginTop: 10,
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
    twoCol: {
      flexDirection: 'row',
      gap: 10,
    },
    flex1: { flex: 1 },
    accountList: {
      gap: 6,
    },
    accountItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? colors.borderDark : colors.borderLight,
      gap: 8,
    },
    accountItemSelected: {
      borderColor: colors.accentBlue,
      backgroundColor: isDark
        ? 'rgba(30,58,138,0.25)'
        : 'rgba(239,246,255,0.95)',
    },
    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 5,
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
      fontSize: 11,
      fontWeight: '700',
    },
    accountText: {
      flex: 1,
      fontSize: 13,
      color: isDark ? colors.textPrimaryDark : colors.textPrimaryLight,
    },
    fieldError: {
      marginTop: 4,
      fontSize: 12,
      color: isDark ? colors.dangerFgDark : colors.dangerFgLight,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 14,
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
    btnDanger: {
      backgroundColor: isDark ? colors.errorBgDark : colors.errorBgLight,
    },
    btnDangerText: {
      color: isDark ? colors.dangerFgDark : colors.dangerFgLight,
      fontSize: 14,
      fontWeight: '700',
    },
    btnDisabled: {
      opacity: 0.55,
    },
    scrollContent: {
      paddingBottom: 12,
    },
  });
