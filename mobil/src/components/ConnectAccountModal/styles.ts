import { StyleSheet } from 'react-native';
import { colors } from '../../config/colors';

export const createConnectModalStyles = (isDark: boolean) =>
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
      paddingBottom: 28,
      borderTopWidth: 1,
      borderColor: isDark ? colors.borderDark : colors.borderLight,
    },
    handle: {
      alignSelf: 'center',
      width: 48,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDark ? colors.borderDark : '#cbd5e1',
      marginBottom: 14,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
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
    item: {
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    itemDisabled: {
      opacity: 0.6,
    },
    itemIconBox: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.18)',
    },
    itemIcon: {
      fontSize: 20,
    },
    itemLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: '#ffffff',
    },
    itemSub: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.85)',
      marginTop: 2,
    },
    hint: {
      marginTop: 8,
      fontSize: 12,
      color: isDark ? colors.textMutedDark : colors.textMutedLight,
      textAlign: 'center',
    },
  });
