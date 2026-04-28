import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { authStrings } from '../../assets/Constants/authStrings';
import { AuthCard } from '../../components';
import { createAuthFormStyles } from '../../components/AuthForm/styles';
import { loginWithCredentials } from '../../service/api/auth';

interface LoginScreenProps {
  onSuccess: (token: string) => void;
  onGoToRegister: () => void;
}

export default function LoginScreen({
  onSuccess,
  onGoToRegister,
}: LoginScreenProps) {
  const isDark = useColorScheme() === 'dark';
  const styles = useMemo(() => createAuthFormStyles(isDark), [isDark]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const trimmed = email.trim();
    if (!trimmed || !password) {
      setError('E-posta ve şifre gerekli');
      return;
    }
    setLoading(true);
    setError(null);
    const result = await loginWithCredentials(trimmed, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSuccess(result.token);
  }

  return (
    <AuthCard>
      <Text style={styles.subtitle}>{authStrings.loginSubtitle}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>{authStrings.email}</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder={authStrings.emailPlaceholder}
          placeholderTextColor={isDark ? 'rgba(148, 163, 184, 0.9)' : '#94a3b8'}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="username"
          editable={!loading}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{authStrings.password}</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          editable={!loading}
        />
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color={isDark ? '#0f172a' : '#ffffff'} />
        ) : (
          <Text style={styles.submitLabel}>{authStrings.signIn}</Text>
        )}
      </Pressable>

      <View style={styles.footer}>
        <Text style={styles.footerMuted}>{authStrings.noAccount} </Text>
        <Pressable onPress={onGoToRegister} hitSlop={8} disabled={loading}>
          <Text style={styles.footerLink}>{authStrings.signUp}</Text>
        </Pressable>
      </View>

      <Text style={styles.hint}>{authStrings.demoHint}</Text>
    </AuthCard>
  );
}
