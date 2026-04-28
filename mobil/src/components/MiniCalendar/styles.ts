import { StyleSheet } from 'react-native';
import { colors } from '../../config/colors';

export const createMiniCalendarStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      borderWidth: 1,
      borderColor: isDark ? colors.borderDark : colors.borderLight,
      backgroundColor: isDark ? colors.cardDark : colors.cardLight,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    headerTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: isDark ? colors.textPrimaryDark : colors.textPrimaryLight,
    },
    navBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: isDark
        ? 'rgba(30,41,59,0.6)'
        : 'rgba(241,245,249,1)',
    },
    navBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: isDark ? colors.textPrimaryDark : colors.textPrimaryLight,
    },
    weekRow: {
      flexDirection: 'row',
      marginBottom: 6,
    },
    weekDay: {
      flex: 1,
      textAlign: 'center',
      fontSize: 11,
      fontWeight: '600',
      color: isDark ? colors.textMutedDark : colors.textMutedLight,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    cell: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
    },
    cellInner: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cellInnerSelected: {
      backgroundColor: colors.accentBlue,
    },
    cellInnerToday: {
      borderWidth: 1,
      borderColor: colors.accentBlue,
    },
    cellText: {
      fontSize: 13,
      color: isDark ? colors.textPrimaryDark : colors.textPrimaryLight,
    },
    cellTextOff: {
      color: isDark ? '#475569' : '#cbd5e1',
    },
    cellTextSelected: {
      color: '#ffffff',
      fontWeight: '700',
    },
    dotRow: {
      flexDirection: 'row',
      gap: 2,
      marginTop: 1,
      height: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.accentBlue,
    },
    dotSelected: {
      backgroundColor: '#ffffff',
    },
  });
