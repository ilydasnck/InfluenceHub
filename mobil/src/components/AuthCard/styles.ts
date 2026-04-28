import { StyleSheet } from 'react-native';
import { colors } from '../../config/colors';

export function createAuthCardStyles(isDark: boolean) {
  const bg = isDark ? colors.bgDark : colors.bgLight;
  const card = isDark ? colors.cardDark : colors.cardLight;
  const border = isDark ? colors.borderDark : colors.borderLight;
  const textPrimary = isDark ? colors.textPrimaryDark : colors.textPrimaryLight;
  const textMuted = isDark ? colors.textMutedDark : colors.textMutedLight;

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: bg,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 48,
    },
    card: {
      backgroundColor: card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: border,
      padding: 32,
      maxWidth: 440,
      width: '100%',
      alignSelf: 'center',
      shadowColor: '#64748b',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0 : 0.12,
      shadowRadius: 24,
      elevation: isDark ? 0 : 6,
    },
    header: {
      alignItems: 'center',
      marginBottom: 32,
    },
    logoBox: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.accentBlue,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      shadowColor: colors.accentBlue,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 4,
    },
    logoEmoji: {
      fontSize: 26,
    },
    brand: {
      fontSize: 22,
      fontWeight: '700',
      letterSpacing: -0.5,
      color: textPrimary,
    },
    tagline: {
      marginTop: 4,
      fontSize: 14,
      color: textMuted,
    },
  });
}
