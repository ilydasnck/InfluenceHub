import { StyleSheet } from 'react-native';
import { colors } from '../../config/colors';

export function createStatCardStyles(isDark: boolean) {
  const card = isDark ? colors.cardDark : colors.cardLight;
  const border = isDark ? colors.borderDark : colors.borderLight;
  const textPrimary = isDark ? colors.textPrimaryDark : colors.textPrimaryLight;
  const textMuted = isDark ? colors.textMutedDark : colors.textMutedLight;
  const chipBg = isDark ? colors.iconChipBgDark : colors.iconChipBgLight;
  const chipFg = isDark ? colors.iconChipFgDark : colors.iconChipFgLight;

  return StyleSheet.create({
    card: {
      flex: 1,
      flexBasis: 0,
      minWidth: 0,
      backgroundColor: card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: border,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 10,
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 6,
      elevation: isDark ? 0 : 1,
    },
    info: {
      flex: 1,
      minWidth: 0,
    },
    label: {
      fontSize: 13,
      fontWeight: '500',
      color: textMuted,
    },
    value: {
      marginTop: 6,
      fontSize: 26,
      fontWeight: '700',
      color: textPrimary,
    },
    hint: {
      marginTop: 4,
      fontSize: 11,
      color: textMuted,
    },
    iconChip: {
      backgroundColor: chipBg,
      borderRadius: 10,
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconText: {
      color: chipFg,
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
