import { StyleSheet } from 'react-native';
import { colors } from '../../config/colors';

export const createMediaPickerStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      gap: 10,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    btn: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? colors.borderDark : colors.borderLight,
      backgroundColor: isDark
        ? 'rgba(15, 23, 42, 0.5)'
        : 'rgba(241, 245, 249, 0.7)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnText: {
      fontSize: 13,
      fontWeight: '700',
      color: isDark ? colors.textPrimaryDark : colors.textPrimaryLight,
    },
    btnDisabled: {
      opacity: 0.55,
    },
    hint: {
      fontSize: 11.5,
      color: isDark ? colors.textMutedDark : colors.textMutedLight,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    tile: {
      width: 96,
      height: 96,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? colors.borderDark : colors.borderLight,
      overflow: 'hidden',
      backgroundColor: isDark ? colors.avatarBgDark : colors.avatarBgLight,
      position: 'relative',
    },
    tileImg: {
      width: '100%',
      height: '100%',
    },
    videoOverlay: {
      position: 'absolute',
      inset: 0,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(15,23,42,0.55)',
    },
    videoIcon: {
      fontSize: 26,
      color: '#ffffff',
    },
    removeBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(15,23,42,0.85)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeBadgeText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 14,
    },
    sizeBadge: {
      position: 'absolute',
      left: 4,
      bottom: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: 'rgba(15,23,42,0.7)',
    },
    sizeBadgeText: {
      color: '#ffffff',
      fontSize: 10,
      fontWeight: '700',
    },
  });
