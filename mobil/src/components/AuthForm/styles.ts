import { StyleSheet } from 'react-native';
import { colors } from '../../config/colors';

export function createAuthFormStyles(isDark: boolean) {
  const textPrimary = isDark ? colors.textPrimaryDark : colors.textPrimaryLight;
  const textMuted = isDark ? colors.textMutedDark : colors.textMutedLight;
  const inputBg = isDark ? colors.inputBgDark : colors.inputBgLight;
  const inputBorder = isDark ? colors.inputBorderDark : colors.inputBorderLight;
  const errorBg = isDark ? colors.errorBgDark : colors.errorBgLight;
  const errorText = isDark ? colors.errorTextDark : colors.errorTextLight;
  const btnBg = isDark ? colors.buttonLightBg : colors.buttonDarkBg;
  const btnFg = isDark ? colors.buttonLightFg : colors.buttonDarkFg;

  return StyleSheet.create({
    subtitle: {
      textAlign: 'center',
      fontSize: 14,
      color: textMuted,
      marginBottom: 24,
      lineHeight: 20,
    },
    field: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: textPrimary,
      marginBottom: 6,
    },
    input: {
      borderWidth: 1,
      borderColor: inputBorder,
      backgroundColor: inputBg,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: textPrimary,
    },
    errorBox: {
      backgroundColor: errorBg,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 8,
    },
    errorText: {
      fontSize: 14,
      color: errorText,
    },
    submitBtn: {
      marginTop: 8,
      backgroundColor: btnBg,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    submitBtnDisabled: {
      opacity: 0.6,
    },
    submitLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: btnFg,
    },
    footer: {
      marginTop: 24,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
    },
    footerMuted: {
      fontSize: 14,
      color: textMuted,
    },
    footerLink: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.linkBlue,
    },
    hint: {
      marginTop: 16,
      textAlign: 'center',
      fontSize: 12,
      fontStyle: 'italic',
      color: textMuted,
    },
  });
}
