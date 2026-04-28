import { StyleSheet } from 'react-native';
import { colors } from '../../config/colors';

export function createAppDrawerStyles(isDark: boolean) {
  const card = isDark ? colors.cardDark : colors.cardLight;
  const border = isDark ? colors.borderDark : colors.borderLight;
  const textPrimary = isDark ? colors.textPrimaryDark : colors.textPrimaryLight;
  const textMuted = isDark ? colors.textMutedDark : colors.textMutedLight;
  const navIdle = isDark ? colors.navIdleFgDark : colors.navIdleFgLight;
  const navActiveBg = isDark
    ? colors.navActiveBgDark
    : colors.navActiveBgLight;
  const navActiveFg = isDark
    ? colors.navActiveFgDark
    : colors.navActiveFgLight;

  return StyleSheet.create({
    overlayWrap: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: colors.overlay,
    },
    drawer: {
      width: 288,
      maxWidth: '85%',
      height: '100%',
      backgroundColor: card,
      borderRightWidth: 1,
      borderRightColor: border,
      flexDirection: 'column',
    },
    overlayTouch: {
      flex: 1,
    },
    header: {
      borderBottomWidth: 1,
      borderBottomColor: border,
      paddingHorizontal: 20,
      paddingVertical: 24,
    },
    brand: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.accentBlue,
    },
    tagline: {
      marginTop: 2,
      fontSize: 12,
      color: textMuted,
    },
    nav: {
      flex: 1,
      padding: 12,
    },
    navItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginBottom: 4,
    },
    navItemActive: {
      backgroundColor: navActiveBg,
    },
    navIcon: {
      fontSize: 16,
      width: 22,
      textAlign: 'center',
      color: navIdle,
    },
    navIconActive: {
      color: navActiveFg,
    },
    navLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
      color: navIdle,
    },
    navLabelActive: {
      color: navActiveFg,
      fontWeight: '600',
    },
    footer: {
      borderTopWidth: 1,
      borderTopColor: border,
      padding: 16,
    },
    userBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: isDark
        ? 'rgba(30, 41, 59, 0.7)'
        : 'rgba(241, 245, 249, 1)',
      borderRadius: 10,
      padding: 8,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.accentBlue,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 13,
    },
    userInfo: {
      flex: 1,
      minWidth: 0,
    },
    userName: {
      fontSize: 13,
      fontWeight: '600',
      color: textPrimary,
    },
    userRole: {
      fontSize: 11,
      color: textMuted,
    },
  });
}
