import { useMemo, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authStrings } from '../../assets/Constants/authStrings';
import { createAuthCardStyles } from './styles';

export default function AuthCard({ children }: { children: ReactNode }) {
  const isDark = useColorScheme() === 'dark';
  const styles = useMemo(() => createAuthCardStyles(isDark), [isDark]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.logoBox}>
                <Text style={styles.logoEmoji}>✨</Text>
              </View>
              <Text style={styles.brand}>{authStrings.brand}</Text>
              <Text style={styles.tagline}>{authStrings.tagline}</Text>
            </View>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
