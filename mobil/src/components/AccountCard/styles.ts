import { StyleSheet } from 'react-native';
import { colors } from '../../config/colors';

export const createAccountCardStyles = (isDark: boolean) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: isDark ? colors.borderDark : colors.borderLight,
      backgroundColor: isDark ? colors.cardDark : colors.cardLight,
      marginBottom: 12,
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? colors.avatarBgDark : colors.avatarBgLight,
    },
    avatarImg: {
      width: '100%',
      height: '100%',
    },
    avatarLetter: {
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? colors.textPrimaryDark : colors.textPrimaryLight,
    },
    info: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      fontSize: 15,
      fontWeight: '700',
      color: isDark ? colors.textPrimaryDark : colors.textPrimaryLight,
    },
    handle: {
      marginTop: 1,
      fontSize: 12.5,
      color: isDark ? colors.textMutedDark : colors.textMutedLight,
    },
    followersRow: {
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flexWrap: 'wrap',
    },
    followersValue: {
      fontSize: 13.5,
      fontWeight: '700',
      color: isDark ? colors.textPrimaryDark : colors.textPrimaryLight,
    },
    followersLabel: {
      fontSize: 12.5,
      color: isDark ? colors.textMutedDark : colors.textMutedLight,
    },
    deltaPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
    },
    deltaUp: {
      backgroundColor: isDark ? colors.successBgDark : colors.successBgLight,
    },
    deltaDown: {
      backgroundColor: isDark ? colors.dangerBgDark : colors.dangerBgLight,
    },
    deltaUpText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? colors.successFgDark : colors.successFgLight,
    },
    deltaDownText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? colors.dangerFgDark : colors.dangerFgLight,
    },
    actions: {
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 8,
    },
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: isDark ? colors.badgeBgDark : colors.badgeBgLight,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: isDark ? colors.badgeFgDark : colors.badgeFgLight,
    },
    removeBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
    },
    removeText: {
      fontSize: 16,
      color: isDark ? colors.dangerFgDark : colors.dangerFgLight,
    },
  });
